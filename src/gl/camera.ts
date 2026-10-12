/**
 * Scroll-driven camera choreography.
 *
 * Story time T runs from 0 to 5 — one unit per world:
 *   0–1 Monument · 1–2 Market Universe · 2–3 Precision Engine
 *   3–4 Passage + Trading Terminal · 4–5 Horizon
 *
 * All keyframes are stored in INTERIOR space. Monument keyframes are authored in
 * monument coordinates and shifted by the portal offset, so the path is one
 * continuous spline that happens to pass through the X.
 */
import { evaluateStream, type StreamState } from "./stream";

export type Vec3 = [number, number, number];

export interface CameraKey {
  t: number;
  pos: Vec3;
  tgt: Vec3;
  fov: number;
}

export interface SceneState {
  camPos: Vec3;
  camTgt: Vec3;
  fov: number;
  space: 0 | 1;
  market: number;
  engine: [number, number, number, number];
  dim: number;
  horizon: number;
  stream: StreamState;
}

export const PORTAL_C: Vec3 = [7.9, 3.0, 0.0];
export const INTERIOR_O: Vec3 = [0.0, 3.0, 8.0];
const OFFSET: Vec3 = [INTERIOR_O[0] - PORTAL_C[0], INTERIOR_O[1] - PORTAL_C[1], INTERIOR_O[2] - PORTAL_C[2]];
const E: Vec3 = [0, 7.5, -80];

const M = (x: number, y: number, z: number): Vec3 => [x + OFFSET[0], y + OFFSET[1], z + OFFSET[2]];
const I = (x: number, y: number, z: number): Vec3 => [x, y, z];

// Desktop copy sits on the left, so every shot keeps its subject in the right-hand side of the frame.
const DESKTOP: CameraKey[] = [
  { t: 0.0, pos: M(-31, 1.5, 23), tgt: M(-15.5, 3.4, 0.0), fov: 38 },
  { t: 0.3, pos: M(-27, 1.7, 21), tgt: M(-13, 3.4, 0.0), fov: 38 },
  { t: 0.6, pos: M(2.0, 2.6, 13.0), tgt: M(4.2, 3.1, 0.0), fov: 40 },
  { t: 0.85, pos: M(7.9, 3.0, 2.6), tgt: M(7.9, 3.0, -4.0), fov: 46 },
  { t: 1.0, pos: I(0, 3.0, 6.0), tgt: I(0, 2.9, -6), fov: 52 },
  { t: 1.3, pos: I(0.6, 3.4, -8), tgt: I(2.5, 3.1, -22), fov: 54 },
  { t: 1.62, pos: I(-3.0, 6.5, -24), tgt: I(1.5, 3.6, -40), fov: 50 },
  { t: 2.0, pos: I(-1.5, 11.0, -40), tgt: I(-7.5, 5.0, -72), fov: 48 },
  { t: 2.35, pos: I(6.0, 10.0, -52), tgt: I(-9.0, 7.8, -80), fov: 44 },
  { t: 2.62, pos: I(-3.0, 8.6, -55), tgt: I(-8.5, 7.6, -80), fov: 44 },
  { t: 2.88, pos: I(1.5, 7.8, -54), tgt: I(-8.5, 7.5, -80), fov: 47 },
  { t: 3.08, pos: I(0, 7.5, -67), tgt: E, fov: 48 },
  { t: 3.25, pos: I(0, 7.4, -78.6), tgt: I(0, 7.0, -96), fov: 56 },
  { t: 3.55, pos: I(0, 6.0, -90), tgt: I(0, 5.0, -110), fov: 50 },
  { t: 4.0, pos: I(0, 5.6, -94), tgt: I(0, 5.0, -114), fov: 50 },
  { t: 4.4, pos: I(0, 4.6, -108), tgt: I(0, 9.0, -200), fov: 52 },
  // calm and wide: the horizon sits low, under the closing line
  { t: 5.0, pos: I(0, 2.8, -150), tgt: I(0, 48, -400), fov: 54 },
];

// Portrait screens: the wordmark is seen in three-quarter view so it fits the frame,
// later shots pull back and widen.
const MOBILE: CameraKey[] = [
  // copy is bottom-anchored on phones: the wordmark lives in the top band, clear of the headline
  { t: 0.0, pos: M(-28, 2.5, 20), tgt: M(-3, -6, 0.0), fov: 58 },
  { t: 0.3, pos: M(-20, 2.4, 16), tgt: M(1, -5.5, 0.0), fov: 58 },
  { t: 0.6, pos: M(5.2, 3.2, 7.4), tgt: M(7.9, 3.0, 0.0), fov: 58 },
  { t: 0.85, pos: M(7.9, 3.0, 2.6), tgt: M(7.9, 3.0, -4.0), fov: 62 },
  { t: 1.0, pos: I(0, 3.0, 6.0), tgt: I(0, 2.9, -6), fov: 66 },
  { t: 1.3, pos: I(0.4, 3.6, -8), tgt: I(1.5, 3.2, -22), fov: 68 },
  { t: 1.62, pos: I(-2.0, 7.5, -22), tgt: I(1.0, 3.6, -40), fov: 66 },
  { t: 2.0, pos: I(0, 13.0, -36), tgt: I(0, 7.0, -80), fov: 62 },
  { t: 2.35, pos: I(5.0, 10.0, -52), tgt: I(0, 4.6, -80), fov: 62 },
  { t: 2.7, pos: I(-4.5, 8.4, -58), tgt: I(0, 4.4, -80), fov: 62 },
  { t: 3.0, pos: I(0, 7.5, -62), tgt: I(0, 5.2, -80), fov: 64 },
  { t: 3.25, pos: I(0, 7.4, -78.6), tgt: I(0, 7.0, -96), fov: 70 },
  { t: 3.55, pos: I(0, 6.0, -90), tgt: I(0, 5.0, -110), fov: 64 },
  { t: 4.0, pos: I(0, 5.6, -94), tgt: I(0, 5.0, -114), fov: 64 },
  { t: 4.4, pos: I(0, 4.6, -108), tgt: I(0, 12, -200), fov: 64 },
  { t: 5.0, pos: I(0, 3.0, -150), tgt: I(0, 70, -400), fov: 62 },
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function catmull(p0: number, p1: number, p2: number, p3: number, u: number) {
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

function sample(keys: CameraKey[], T: number) {
  const n = keys.length;
  if (T <= keys[0].t) return { pos: [...keys[0].pos] as Vec3, tgt: [...keys[0].tgt] as Vec3, fov: keys[0].fov };
  if (T >= keys[n - 1].t) return { pos: [...keys[n - 1].pos] as Vec3, tgt: [...keys[n - 1].tgt] as Vec3, fov: keys[n - 1].fov };
  let i = 0;
  while (i < n - 2 && T > keys[i + 1].t) i++;
  const k0 = keys[Math.max(i - 1, 0)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(i + 2, n - 1)];
  let u = (T - k1.t) / (k2.t - k1.t);
  u = u * u * (3 - 2 * u) * 0.35 + u * 0.65; // ease within each shot, keeps velocity continuous enough
  const pos = [0, 1, 2].map((j) => catmull(k0.pos[j], k1.pos[j], k2.pos[j], k3.pos[j], u)) as Vec3;
  const tgt = [0, 1, 2].map((j) => catmull(k0.tgt[j], k1.tgt[j], k2.tgt[j], k3.tgt[j], u)) as Vec3;
  const fov = k1.fov + (k2.fov - k1.fov) * (u * u * (3 - 2 * u));
  return { pos, tgt, fov };
}

/**
 * Evaluate the whole scene for story time T.
 * @param mouse normalised pointer (-1..1) used for a restrained parallax drift
 */
export function evaluateScene(T: number, mobile: boolean, mouse: [number, number], time: number, flow = 0): SceneState {
  const keys = mobile ? MOBILE : DESKTOP;
  const s = sample(keys, T);

  // Keep the path dead-centre through the X aperture while crossing it.
  const z = s.pos[2];
  const guide = 1 - smoothstep(1.2, 4.5, Math.abs(z - INTERIOR_O[2]));
  s.pos[0] += (INTERIOR_O[0] - s.pos[0]) * guide;
  s.pos[1] += (INTERIOR_O[1] - s.pos[1]) * guide;
  // Same while threading the iris.
  const irisGuide = 1 - smoothstep(1.0, 5.0, Math.abs(z - E[2]));
  s.pos[0] += (E[0] - s.pos[0]) * irisGuide;
  s.pos[1] += (E[1] - s.pos[1]) * irisGuide;

  // Parallax: fades out near the thresholds so nobody clips a wall.
  const par = (mobile ? 0 : 0.35) * (1 - guide) * (1 - irisGuide);
  s.pos[0] += mouse[0] * par;
  s.pos[1] += mouse[1] * par * 0.5;

  const space: 0 | 1 = s.pos[2] > INTERIOR_O[2] ? 0 : 1;
  if (space === 0) {
    for (let j = 0; j < 3; j++) {
      s.pos[j] -= OFFSET[j];
      s.tgt[j] -= OFFSET[j];
    }
  }

  return { camPos: s.pos, camTgt: s.tgt, fov: s.fov, space, ...worldState(T, time, flow) };
}

/** Everything except the camera: what each world is doing at story time T. */
function worldState(T: number, time: number, flow: number) {
  // the ring is built by the streaming columns (stream.ts), the rest flies in around it
  const assemble = smoothstep(1.7, 2.4, T);
  const explodeU = clamp01((T - 2.3) / 0.5);
  const explode = Math.sin(explodeU * Math.PI) * 0.9;
  const iris = smoothstep(2.78, 3.12, T);
  const spin = time * 0.05 + T * 1.3;
  const market = 1 - smoothstep(2.0, 2.6, T);
  return {
    market,
    engine: [assemble, explode, iris, spin] as [number, number, number, number],
    dim: smoothstep(3.38, 3.62, T) * (1 - smoothstep(3.98, 4.3, T)),
    horizon: smoothstep(3.95, 4.75, T),
    stream: evaluateStream(T, { assemble, explode, spin, centre: E }, time, flow, market),
  };
}

/** A fixed composition for interior-page heroes: world state at T, camera set by hand. */
export interface HeroCamera {
  T: number;
  space: 0 | 1;
  pos: Vec3; // in the coordinates of `space`
  tgt: Vec3;
  fov: number;
}

/**
 * @param time   seconds; the camera breathes a few % around its pose on a ~20 s loop
 * @param mouse  -1..1 pointer for a gentle parallax
 * @param motion false for reduced motion: the exact authored pose, no drift or parallax
 */
export function evaluateHero(cam: HeroCamera, time: number, mouse: [number, number], motion: boolean): SceneState {
  const pos: Vec3 = [...cam.pos];
  const tgt: Vec3 = [...cam.tgt];
  if (motion) {
    const d = Math.hypot(tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]);
    const w = (2 * Math.PI) / 20;
    // ~3% of the viewing distance, on a slow loop (20 s, with a 2:3 Lissajous so it never feels mechanical)
    pos[0] += (Math.sin(time * w) * 0.03 + mouse[0] * 0.025) * d;
    pos[1] += (Math.sin(time * w * 1.5 + 1.3) * 0.012 + mouse[1] * 0.012) * d;
    pos[2] += Math.cos(time * w) * 0.015 * d;
  }
  return { camPos: pos, camTgt: tgt, fov: cam.fov, space: cam.space, ...worldState(cam.T, time, 0) };
}

/** Representative T for each world, used by reduced-motion mode (still frames). */
export const WORLD_STILLS = [0.12, 1.45, 2.92, 3.8, 4.9];
