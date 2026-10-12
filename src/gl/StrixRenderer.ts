import { SCENE_FRAG } from "./shaders/scene";
import { FULLSCREEN_VERT, BRIGHT_FRAG, BLUR_FRAG, COMPOSITE_FRAG } from "./shaders/post";
import type { SceneState } from "./camera";
import { NO_PANELS, type PanelUniforms } from "./panels";

type Uniforms = Record<string, WebGLUniformLocation | null>;
interface Program { prog: WebGLProgram; u: Uniforms }
interface Target { fbo: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number }

export interface RendererOptions {
  mobile: boolean;
  /** Initial internal resolution scale (fraction of CSS px × DPR). */
  scale?: number;
}

export interface FrameInput extends SceneState {
  time: number;
  intro: number;
  flow: number;
  mouse: [number, number];
  /** Terminal-hall glass frames (homepage only). */
  panels?: PanelUniforms;
}

export class WebGLUnavailableError extends Error {}

/**
 * Dependency-free WebGL2 pipeline:
 *   raymarched scene → bright pass → separable blur → filmic composite.
 * Internal resolution adapts to frame time to hold the frame rate on
 * integrated GPUs and phones.
 */
export class StrixRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  private buf: WebGLBuffer | null = null;
  private scene!: Program;
  private bright!: Program;
  private blur!: Program;
  private composite!: Program;
  private tScene: Target | null = null;
  private tBloomA: Target | null = null;
  private tBloomB: Target | null = null;
  private floatTargets = false;
  private mobile: boolean;
  private scale: number;
  private maxScale: number;
  private minScale: number;
  private cssW = 1;
  private cssH = 1;
  private dpr = 1;
  private frameTimes: number[] = [];
  private lastFrameAt = 0;
  private quality: number;
  private steps: number;
  private baseQuality: number;
  private baseSteps: number;
  /** consecutive fast measurement windows, for restoring quality after a dip */
  private fastRuns = 0;
  /** scale before a probe step taken at a steady ~30 fps cadence */
  private capProbe: number | null = null;
  /** rAF is capped near 30 fps (Low Power Mode, battery saver): frame time says nothing about the GPU */
  private capped = false;
  private disposed = false;
  private isLost = false;
  onContextLost: (() => void) | null = null;
  onContextRestored: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, opts: RendererOptions) {
    this.canvas = canvas;
    this.mobile = opts.mobile;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new WebGLUnavailableError("WebGL2 not available");
    this.gl = gl;

    this.maxScale = opts.mobile ? 0.55 : 0.85;
    this.minScale = opts.mobile ? 0.3 : 0.38;
    this.scale = opts.scale ?? (opts.mobile ? 0.45 : 0.62);
    this.quality = this.baseQuality = opts.mobile ? 0 : 1;
    this.steps = this.baseSteps = opts.mobile ? 72 : 110;

    try {
      this.init();
    } catch (err) {
      // don't leave a half-built context behind: browsers cap how many can be alive
      this.release();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      throw err;
    }

    canvas.addEventListener("webglcontextlost", this.handleLost, false);
    canvas.addEventListener("webglcontextrestored", this.handleRestored, false);
  }

  /** True between a context loss and its restore; nothing renders meanwhile. */
  get lost() {
    return this.isLost;
  }

  /** Builds every GL resource. Runs at construction and again after a context restore. */
  private init() {
    const gl = this.gl;
    this.floatTargets = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    if (!vao || !buf) throw new WebGLUnavailableError("Could not allocate buffers");
    this.vao = vao;
    this.buf = buf;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.scene = this.program(SCENE_FRAG, [
      "uRes", "uTime", "uCamPos", "uCamTgt", "uFov", "uSpace", "uIntro", "uMarket", "uEngine",
      "uDim", "uHorizon", "uFlow", "uMouse", "uQuality", "uSteps", "uEncode",
      "uStreamOn", "uSP", "uSH", "uLift", "uSBox0", "uSBox1", "uRingFill", "uPC", "uPU", "uPV",
    ]);
    this.bright = this.program(BRIGHT_FRAG, ["uTex", "uTexel", "uDecode"]);
    this.blur = this.program(BLUR_FRAG, ["uTex", "uDir"]);
    this.composite = this.program(COMPOSITE_FRAG, [
      "uScene", "uBloom", "uTime", "uExposure", "uRes", "uBloomAmt", "uDecode",
    ]);
  }

  private handleLost = (e: Event) => {
    e.preventDefault(); // ask the browser to restore the context
    this.isLost = true;
    // every GL object died with the context; forget them rather than delete them later
    this.tScene = this.tBloomA = this.tBloomB = null;
    this.vao = this.buf = null;
    this.onContextLost?.();
  };

  private handleRestored = () => {
    if (this.disposed) return;
    try {
      this.init();
    } catch (err) {
      console.warn("[strix] WebGL restore failed.", err);
      return;
    }
    this.isLost = false;
    this.frameTimes.length = 0;
    this.lastFrameAt = 0;
    this.allocTargets();
    this.onContextRestored?.();
  };

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    if (!sh) throw new WebGLUnavailableError("createShader failed");
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new WebGLUnavailableError("Shader compile failed: " + log);
    }
    return sh;
  }

  private program(frag: string, uniforms: string[]): Program {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const fs = this.compile(gl.FRAGMENT_SHADER, frag);
    const prog = gl.createProgram();
    if (!prog) throw new WebGLUnavailableError("createProgram failed");
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new WebGLUnavailableError("Program link failed: " + gl.getProgramInfoLog(prog));
    }
    const u: Uniforms = {};
    for (const name of uniforms) u[name] = gl.getUniformLocation(prog, name);
    return { prog, u };
  }

  private makeTarget(w: number, h: number, prev: Target | null): Target {
    const gl = this.gl;
    if (prev && prev.w === w && prev.h === h) return prev;
    if (prev) {
      gl.deleteFramebuffer(prev.fbo);
      gl.deleteTexture(prev.tex);
    }
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.floatTargets) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (this.floatTargets && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      // half-float not renderable after all — fall back to 8-bit with HDR encoding
      this.floatTargets = false;
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(tex);
      return this.makeTarget(w, h, null);
    }
    return { fbo, tex, w, h };
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    this.dpr = Math.min(dpr, this.mobile ? 2 : 1.75);
    const w = Math.round(this.cssW * this.dpr);
    const h = Math.round(this.cssH * this.dpr);
    // assigning width/height reallocates the drawing buffer even when unchanged
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.allocTargets();
  }

  private allocTargets() {
    if (this.isLost) return;
    const w = Math.max(16, Math.round(this.canvas.width * this.scale));
    const h = Math.max(16, Math.round(this.canvas.height * this.scale));
    this.tScene = this.makeTarget(w, h, this.tScene);
    const bw = Math.max(8, Math.round(w / 2)), bh = Math.max(8, Math.round(h / 2));
    this.tBloomA = this.makeTarget(bw, bh, this.tBloomA);
    this.tBloomB = this.makeTarget(bw, bh, this.tBloomB);
  }

  /** Adaptive resolution: nudges the internal scale toward ~60fps. */
  private adapt(now: number) {
    if (this.lastFrameAt) {
      const dt = now - this.lastFrameAt;
      if (dt < 250) this.frameTimes.push(dt);
    }
    this.lastFrameAt = now;
    if (this.frameTimes.length < 40) return;
    const sorted = this.frameTimes.sort((a, b) => a - b);
    const n = sorted.length;
    const med = sorted[Math.floor(n / 2)];
    // a tight cluster around 33 ms is either a 30 fps cap or a GPU that just misses vsync
    const atCap = med > 29 && med < 38 && sorted[Math.floor(n * 0.1)] > 27 && sorted[Math.floor(n * 0.9)] < 40;
    this.frameTimes.length = 0;
    let next = this.scale;
    if (atCap) {
      if (this.capped) return; // capped cadence: hold the current scale
      if (this.capProbe === null) {
        // probe: one step down. A GPU-bound frame will speed up; a capped one won't
        this.capProbe = this.scale;
        next = this.scale * 0.85;
      } else {
        this.capped = true;
        next = this.capProbe;
        this.capProbe = null;
      }
    } else {
      this.capProbe = null;
      this.capped = false;
      if (med > 24) next = this.scale * 0.85;
      else if (med < 15) next = this.scale * 1.08;
    }
    next = Math.min(this.maxScale, Math.max(this.minScale, next));
    if (!atCap && med > 40 && this.scale <= this.minScale + 0.01) {
      this.quality = 0;
      this.steps = Math.max(56, this.steps - 16);
      this.fastRuns = 0;
    }
    // hysteresis: after a sustained run of fast windows, win back what a dip took away
    this.fastRuns = med < 15 ? this.fastRuns + 1 : 0;
    if (this.fastRuns >= 3 && (this.steps < this.baseSteps || this.quality < this.baseQuality)) {
      this.fastRuns = 0;
      this.steps = Math.min(this.baseSteps, this.steps + 16);
      if (this.steps === this.baseSteps) this.quality = this.baseQuality;
    }
    if (Math.abs(next - this.scale) > 0.02) {
      this.scale = next;
      this.allocTargets();
    }
  }

  render(f: FrameInput, now: number) {
    if (this.disposed || this.isLost || !this.tScene || !this.tBloomA || !this.tBloomB) return;
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.adapt(now);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const enc = this.floatTargets ? 1 : 0.25;

    // 1 · scene
    const s = this.scene;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.tScene.fbo);
    gl.viewport(0, 0, this.tScene.w, this.tScene.h);
    gl.useProgram(s.prog);
    gl.uniform2f(s.u.uRes, this.tScene.w, this.tScene.h);
    gl.uniform1f(s.u.uTime, f.time);
    gl.uniform3fv(s.u.uCamPos, f.camPos);
    gl.uniform3fv(s.u.uCamTgt, f.camTgt);
    gl.uniform1f(s.u.uFov, f.fov);
    gl.uniform1f(s.u.uSpace, f.space);
    gl.uniform1f(s.u.uIntro, f.intro);
    gl.uniform1f(s.u.uMarket, f.market);
    gl.uniform4fv(s.u.uEngine, f.engine);
    gl.uniform1f(s.u.uDim, f.dim);
    gl.uniform1f(s.u.uHorizon, f.horizon);
    gl.uniform1f(s.u.uFlow, f.flow);
    gl.uniform2fv(s.u.uMouse, f.mouse);
    gl.uniform1f(s.u.uQuality, this.quality);
    gl.uniform1i(s.u.uSteps, this.steps);
    gl.uniform1f(s.u.uEncode, enc);
    const st = f.stream;
    gl.uniform1f(s.u.uStreamOn, st.on ? 1 : 0);
    gl.uniform1f(s.u.uRingFill, st.ringFill);
    // lifted columns stay out of the market after the stream ends, so always upload them
    gl.uniform4fv(s.u.uLift, st.lift);
    if (st.on) {
      gl.uniform4fv(s.u.uSP, st.sp);
      gl.uniform4fv(s.u.uSH, st.sh);
      gl.uniform4fv(s.u.uSBox0, st.box0);
      gl.uniform4fv(s.u.uSBox1, st.box1);
    }
    const pn = f.panels ?? NO_PANELS;
    gl.uniform4fv(s.u.uPC, pn.pc);
    gl.uniform4fv(s.u.uPU, pn.pu);
    gl.uniform4fv(s.u.uPV, pn.pv);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2 · bright pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.tBloomA.fbo);
    gl.viewport(0, 0, this.tBloomA.w, this.tBloomA.h);
    gl.useProgram(this.bright.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tScene.tex);
    gl.uniform1i(this.bright.u.uTex, 0);
    gl.uniform2f(this.bright.u.uTexel, 1 / this.tScene.w, 1 / this.tScene.h);
    gl.uniform1f(this.bright.u.uDecode, 1 / enc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 3 · blur ×2 iterations
    gl.useProgram(this.blur.prog);
    gl.uniform1i(this.blur.u.uTex, 0);
    for (let i = 0; i < 2; i++) {
      const spread = 1 + i;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.tBloomB.fbo);
      gl.bindTexture(gl.TEXTURE_2D, this.tBloomA.tex);
      gl.uniform2f(this.blur.u.uDir, spread / this.tBloomA.w, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.tBloomA.fbo);
      gl.bindTexture(gl.TEXTURE_2D, this.tBloomB.tex);
      gl.uniform2f(this.blur.u.uDir, 0, spread / this.tBloomA.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // 4 · composite to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const c = this.composite;
    gl.useProgram(c.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tScene.tex);
    gl.uniform1i(c.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tBloomA.tex);
    gl.uniform1i(c.u.uBloom, 1);
    gl.uniform1f(c.u.uTime, f.time);
    gl.uniform1f(c.u.uExposure, 1.15);
    gl.uniform2f(c.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(c.u.uBloomAmt, 0.85);
    gl.uniform1f(c.u.uDecode, 1 / enc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  }

  /** Frees every GL object that exists (safe on a partly built renderer). */
  private release() {
    const gl = this.gl;
    for (const t of [this.tScene, this.tBloomA, this.tBloomB]) {
      if (t) {
        gl.deleteFramebuffer(t.fbo);
        gl.deleteTexture(t.tex);
      }
    }
    this.tScene = this.tBloomA = this.tBloomB = null;
    for (const p of [this.scene, this.bright, this.blur, this.composite]) if (p) gl.deleteProgram(p.prog);
    if (this.buf) gl.deleteBuffer(this.buf);
    if (this.vao) gl.deleteVertexArray(this.vao);
    this.buf = this.vao = null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    this.canvas.removeEventListener("webglcontextlost", this.handleLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleRestored);
    if (!this.isLost) this.release();
    // release the context right away so page-to-page navigation never piles them up
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
