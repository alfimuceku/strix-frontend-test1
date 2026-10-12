/**
 * Market → engine transition (story time ≈ 1.8–2.4).
 *
 * Twenty columns of the volatility surface nearest the camera lift off, stream
 * toward the engine and resolve into the outer ring, which is built sector by
 * sector as they land. Everything is a pure function of story time, so the
 * sequence plays identically in both scroll directions.
 *
 * The shader reads the poses through uniform arrays (uSP / uSH / uLift) and
 * hides each source column in the surface once its copy has taken off.
 */
import type { Vec3 } from "./camera";

export const STREAM_N = 20;
const XS = [-3.6, -1.2, 1.2, 3.6]; // column centres (cell grid of 0.8)
const ZS = [-46.8, -50.0, -53.2, -56.4, -59.6];
const T_START = 1.8;
const T_SPREAD = 0.25; // first to last launch
const T_FLIGHT = 0.35;
const RING_R = 5.45;
const RING_A0 = 1.2; // must match scene.ts
const COL_HALF = 0.16;

export interface StreamState {
  on: boolean;
  sp: Float32Array; // xyz centre, w spin about z      (4 × N)
  sh: Float32Array; // xyz half extents, w tilt about x (4 × N)
  lift: Float32Array; // 1 once source column k has left the surface (N)
  box0: [number, number, number, number];
  box1: [number, number, number, number];
  ringFill: number;
}

export interface EngineFrame {
  assemble: number;
  explode: number;
  spin: number;
  centre: Vec3; // engine origin
}

const f32 = Math.fround;
const fract = (x: number) => x - Math.floor(x);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** GLSL hash12, emulated in float32 so lifted columns match the surface. */
function hash12(x: number, y: number) {
  let px = f32(fract(f32(x * 0.1031)));
  let py = f32(fract(f32(y * 0.1031)));
  let pz = px;
  const d = f32(f32(px * f32(py + 33.33)) + f32(py * f32(pz + 33.33)) + f32(pz * f32(px + 33.33)));
  px = f32(px + d);
  py = f32(py + d);
  pz = f32(pz + d);
  return fract(f32(f32(px + py) * pz));
}

/** Column height — mirrors colH() in scene.ts. */
function colH(cx: number, cz: number, time: number, flow: number, market: number) {
  const m = cx / 11;
  const tau = clamp01((12 - cz) / 85);
  const iv = 0.16 + (0.32 * m * m) / (0.35 + tau) - 0.1 * m * (1 - 0.5 * tau) + 0.05 * tau;
  let h = 0.6 + iv * 9;
  const wave = Math.sin(cx * 0.31 + time * 0.6 + cz * 0.13) * Math.sin(cz * 0.21 - time * 0.4);
  h += (0.32 + Math.abs(flow) * 0.9) * wave;
  h += (hash12(cx, cz) - 0.5) * 0.4;
  h = Math.min(h, 15.5);
  h *= market * smooth(-76, -52, cz) * smooth(13, 6, cz);
  return Math.max(h, 0.02);
}

// Launch order: nearest rows first, inner columns before outer ones.
const RANK: number[] = [];
for (let i = 0; i < ZS.length; i++) for (const j of [1, 2, 0, 3]) RANK.push(i * 4 + j);

const wrapPi = (a: number) => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const state: StreamState = {
  on: false,
  sp: new Float32Array(4 * STREAM_N),
  sh: new Float32Array(4 * STREAM_N),
  lift: new Float32Array(STREAM_N),
  box0: [0, 0, 0, 0],
  box1: [0, 0, 0, 0],
  ringFill: 0,
};

export function evaluateStream(T: number, eng: EngineFrame, time: number, flow: number, market: number): StreamState {
  const s = state;
  s.sp.fill(0);
  s.sh.fill(0);
  s.lift.fill(0);
  const end = T_START + T_SPREAD + T_FLIGHT;
  s.on = T > T_START && T < end;
  if (T <= T_START) {
    s.ringFill = 0;
    return s;
  }
  if (T >= end) {
    s.ringFill = 1;
    s.lift.fill(1); // every streamed column is now part of the ring; keep them out of the fading market
    return s;
  }

  const fly = 1 - eng.assemble;
  const rot = eng.spin * 0.5 + fly * 1.6;
  const cx = eng.centre[0];
  const cy = eng.centre[1] - fly * 5;
  const cz = eng.centre[2] + eng.explode * 2.6 + fly * 16;
  let fill = 0;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];

  for (let r = 0; r < STREAM_N; r++) {
    const k = RANK[r];
    const u = clamp01((T - (T_START + (T_SPREAD * r) / (STREAM_N - 1))) / T_FLIGHT);
    fill += smooth(0.88, 1, u);
    if (u <= 0) continue;
    s.lift[k] = 1;
    if (u >= 1) continue;

    const x0 = XS[k % 4];
    const z0 = ZS[Math.floor(k / 4)];
    const h0 = colH(x0, z0, time, flow, market);
    // target: this particle's sector of the ring, in world space
    const phi = RING_A0 + ((r + 0.5) / STREAM_N) * Math.PI * 2;
    const th = phi - rot;
    const tx = cx + RING_R * Math.cos(th);
    const ty = cy + RING_R * Math.sin(th);
    const tz = cz;

    const a = smooth(0, 0.3, u); // lift out of the surface
    const b = smooth(0.2, 0.92, u); // travel
    const m = smooth(0.35, 0.95, u); // become a ring segment
    const sx = x0, sy = h0 * 0.5 + a * 3, sz = z0;
    const mx = (sx + tx) * 0.5, my = Math.max(sy, ty) + 5, mz = (sz + tz) * 0.5;
    const ib = 1 - b;
    const px = ib * ib * sx + 2 * ib * b * mx + b * b * tx;
    const py = ib * ib * sy + 2 * ib * b * my + b * b * ty;
    const pz = ib * ib * sz + 2 * ib * b * mz + b * b * tz;

    const hx = lerp(COL_HALF, 0.3, m);
    const hy = lerp(h0 * 0.5, 0.85, m);
    const hz = lerp(COL_HALF, 0.3, m);
    const o = 4 * k;
    s.sp[o] = px;
    s.sp[o + 1] = py;
    s.sp[o + 2] = pz;
    s.sp[o + 3] = wrapPi(th) * m;
    s.sh[o] = hx;
    s.sh[o + 1] = hy;
    s.sh[o + 2] = hz;
    s.sh[o + 3] = Math.sin(Math.PI * b) * 0.5;

    const ext = Math.hypot(hx, hy, hz);
    const p = [px, py, pz];
    for (let j = 0; j < 3; j++) {
      lo[j] = Math.min(lo[j], p[j] - ext);
      hi[j] = Math.max(hi[j], p[j] + ext);
    }
  }
  s.ringFill = fill / STREAM_N;
  if (lo[0] === Infinity) {
    s.box0 = [0, -100, 0, 0];
    s.box1 = [0, 0, 0, 0];
  } else {
    s.box0 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2, 0];
    s.box1 = [(hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2, (hi[2] - lo[2]) / 2, 0];
  }
  return s;
}
