/**
 * Story controller: maps native page scroll to "story time" T (0–5).
 *
 * Chapters are ordinary <section> elements carrying data-t0 / data-t1. As a
 * chapter scrolls through the viewport its local progress (0–1) maps linearly
 * onto [t0, t1]. Native scrolling is never hijacked; the camera follows T with
 * critically damped smoothing.
 *
 * Beats ([data-beat]) inside a chapter declare the local-progress window in
 * which they are shown: data-beat="0.0,0.4". Inactive beats are made inert so
 * keyboard focus never lands on invisible content.
 */

export interface StoryFrame {
  T: number;          // smoothed story time (camera)
  target: number;     // raw story time from scroll
  flow: number;       // signed, smoothed scroll velocity in T/s (clamped -1..1)
  mouse: [number, number];
  world: number;      // 0..4
}

interface Chapter {
  el: HTMLElement;
  t0: number;
  t1: number;
  top: number;
  height: number;
  beats: { el: HTMLElement; a: number; b: number; active: boolean }[];
}

type Listener = (f: StoryFrame) => void;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export class StoryController {
  private chapters: Chapter[] = [];
  private listeners = new Set<Listener>();
  private raf = 0;
  private last = 0;
  private T = 0;
  private target = 0;
  private flow = 0;
  private mouse: [number, number] = [0, 0];
  private mouseTarget: [number, number] = [0, 0];
  private vh = 1;
  private reduced: boolean;
  private ro: ResizeObserver | null = null;
  private lastWorld = -1;
  private lastFlow = false;
  private lastStory = "";
  private rail: HTMLElement | null = null;
  /** a 100svh box: chapters are sized in svh, so the URL bar sliding away must not change the span */
  private vhProbe: HTMLElement | null = null;

  constructor(private root: HTMLElement, opts: { reducedMotion: boolean }) {
    this.reduced = opts.reducedMotion;
  }

  start() {
    if (typeof CSS !== "undefined" && CSS.supports("height", "100svh")) {
      const probe = document.createElement("div");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      this.vhProbe = probe;
    }
    this.collect();
    this.measure();
    this.target = this.computeTarget();
    this.T = this.target;
    window.addEventListener("resize", this.measure, { passive: true });
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(document.body);
    this.applyBeats();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.measure);
    window.removeEventListener("pointermove", this.onPointer);
    this.ro?.disconnect();
    this.vhProbe?.remove();
    this.vhProbe = null;
    this.listeners.clear();
    document.documentElement.removeAttribute("data-flow");
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setReducedMotion(r: boolean) {
    this.reduced = r;
  }

  /** Jump the camera to the scroll position immediately (no glide). */
  snap() {
    this.target = this.computeTarget();
    this.T = this.target;
  }

  /** Scroll so that the given story time is reached. */
  scrollToT(t: number) {
    const ch = this.chapters.find((c) => t >= c.t0 && t <= c.t1) ?? this.chapters[this.chapters.length - 1];
    if (!ch) return;
    const local = (t - ch.t0) / Math.max(1e-6, ch.t1 - ch.t0);
    const y = ch.top + local * Math.max(0, ch.height - this.vh);
    window.scrollTo({ top: y, behavior: this.reduced ? "auto" : "smooth" });
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    this.mouseTarget = [(e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1)];
  };

  private collect() {
    const els = Array.from(this.root.querySelectorAll<HTMLElement>("[data-t0]"));
    this.chapters = els.map((el) => ({
      el,
      t0: parseFloat(el.dataset.t0 || "0"),
      t1: parseFloat(el.dataset.t1 || "0"),
      top: 0,
      height: 0,
      beats: Array.from(el.querySelectorAll<HTMLElement>("[data-beat]")).map((b) => {
        const [a, bb] = (b.dataset.beat || "0,1").split(",").map(parseFloat);
        return { el: b, a, b: bb, active: b.classList.contains("is-active") };
      }),
    }));
    this.root.classList.add("js-story");
  }

  private measure = () => {
    this.vh = this.vhProbe?.offsetHeight || window.innerHeight;
    const sy = window.scrollY;
    for (const c of this.chapters) {
      const r = c.el.getBoundingClientRect();
      c.top = r.top + sy;
      c.height = r.height;
    }
  };

  private local(c: Chapter, y: number) {
    const span = c.height - this.vh;
    if (span <= 1) return y >= c.top ? 1 : 0;
    return clamp01((y - c.top) / span);
  }

  private computeTarget() {
    const y = window.scrollY;
    let t = this.chapters.length ? this.chapters[0].t0 : 0;
    for (const c of this.chapters) {
      if (y >= c.top - 1) t = Math.max(t, c.t0 + this.local(c, y) * (c.t1 - c.t0));
    }
    return t;
  }

  private applyBeats() {
    const y = window.scrollY;
    for (const c of this.chapters) {
      if (!c.beats.length) continue;
      const p = this.local(c, y);
      for (const b of c.beats) {
        const on = p >= b.a && (p < b.b || (b.b >= 1 && p >= 1));
        if (on !== b.active || !b.el.hasAttribute("aria-hidden")) {
          b.active = on;
          b.el.classList.toggle("is-active", on);
          if (on) b.el.removeAttribute("inert");
          else b.el.setAttribute("inert", "");
          b.el.setAttribute("aria-hidden", on ? "false" : "true");
        }
      }
    }
  }

  private tick = (now: number) => {
    // the first rAF timestamp can predate start(); never let dt go negative
    const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000));
    this.last = now;
    const prev = this.target;
    this.target = this.computeTarget();

    if (this.reduced) {
      this.T = this.target;
      this.flow = 0;
    } else {
      // critically damped follow — glides but never overshoots
      const k = 1 - Math.exp(-dt * 3.2);
      this.T += (this.target - this.T) * k;
      const v = dt > 0 ? (this.target - prev) / dt : 0;
      this.flow += (Math.max(-1, Math.min(1, v * 0.6)) - this.flow) * (1 - Math.exp(-dt * 4));
    }
    const mk = 1 - Math.exp(-dt * 2.5);
    this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * mk;
    this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * mk;

    this.applyBeats();
    const world = Math.min(4, Math.max(0, Math.floor(this.target + 0.0001)));
    if (world !== this.lastWorld) {
      this.lastWorld = world;
      document.documentElement.dataset.world = String(world);
    }
    // only the rail reads --story: write it there, and only when it moves, so the page keeps its styles
    const story = this.T.toFixed(4);
    if (story !== this.lastStory) {
      this.lastStory = story;
      if (!this.rail?.isConnected) this.rail = document.querySelector<HTMLElement>(".rail__fill");
      (this.rail ?? document.documentElement).style.setProperty("--story", story);
    }
    // the rail steps aside while the visitor works in the terminal, the plans or the footer
    const flow = (this.target >= 3.45 && this.target <= 4.001) || this.target >= 4.999;
    if (flow !== this.lastFlow) {
      this.lastFlow = flow;
      document.documentElement.toggleAttribute("data-flow", flow);
    }

    const frame: StoryFrame = { T: this.T, target: this.target, flow: this.flow, mouse: [...this.mouse] as [number, number], world };
    this.listeners.forEach((fn) => fn(frame));
    this.raf = requestAnimationFrame(this.tick);
  };
}
