/**
 * Terminal hall (story time ≈ 3.34–3.6): four glass panel frames fly out of
 * the iris and settle exactly where the HTML dashboard panels sit on screen,
 * then hand over to the real dashboard with a crossfade.
 *
 * The frames are camera-facing planes drawn analytically in the scene shader.
 * Their final pose is the unprojection of each panel's DOM rect at depth D,
 * so the 3D frame and the HTML panel cover the same pixels.
 */
import type { Vec3 } from "./camera";

export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanelUniforms {
  pc: Float32Array; // xyz centre, w alpha
  pu: Float32Array; // xyz right axis, w half width
  pv: Float32Array; // xyz up axis, w half height
}

const D = 7; // depth of the settled frames in front of the camera
const ENGINE: Vec3 = [0, 7.5, -80];

const out: PanelUniforms = { pc: new Float32Array(16), pu: new Float32Array(16), pv: new Float32Array(16) };
export const NO_PANELS: PanelUniforms = { pc: new Float32Array(16), pu: new Float32Array(16), pv: new Float32Array(16) };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a: Vec3, b: Vec3, s = 1): Vec3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

/**
 * @param rects the HTML panels' rects (CSS px), already shifted to where the frames should sit
 * @param handover 0..1 crossfade to the HTML dashboard (frames fade out as it fades in)
 */
export function evaluatePanels(
  T: number,
  camPos: Vec3,
  camTgt: Vec3,
  fov: number,
  view: { w: number; h: number },
  rects: ScreenRect[],
  handover: number,
): PanelUniforms {
  out.pc.fill(0);
  if (T < 3.32 || handover >= 1 || !rects.length) return out;
  const fw = norm([camTgt[0] - camPos[0], camTgt[1] - camPos[1], camTgt[2] - camPos[2]]);
  const rt = norm(cross(fw, [0, 1, 0]));
  const up = cross(rt, fw);
  const fl = 1 / Math.tan((fov * Math.PI) / 360);

  for (let k = 0; k < Math.min(4, rects.length); k++) {
    const p = smooth(3.34 + k * 0.025, 3.5 + k * 0.025, T);
    if (p <= 0) continue;
    const r = rects[k];
    const ux = (2 * (r.x + r.w / 2) - view.w) / view.h;
    const uy = (view.h - 2 * (r.y + r.h / 2)) / view.h;
    const end: Vec3 = [0, 1, 2].map((j) => camPos[j] + D * (fw[j] + (ux * rt[j] + uy * up[j]) / fl)) as Vec3;
    const hw = ((r.w / view.h) * D) / fl;
    const hh = ((r.h / view.h) * D) / fl;

    // start: just beyond the iris, out at the edge of the aperture
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const start: Vec3 = [ENGINE[0] + Math.cos(a) * 4.2, ENGINE[1] + Math.sin(a) * 3.2, ENGINE[2] - 3];
    const e = p * p * (3 - 2 * p);
    const c: Vec3 = [start[0] + (end[0] - start[0]) * e, start[1] + (end[1] - start[1]) * e, start[2] + (end[2] - start[2]) * e];
    // tilted while flying, square to the camera when settled
    const yaw = (1 - e) * (k % 2 ? -0.9 : 0.9);
    const pitch = (1 - e) * (k < 2 ? 0.4 : -0.4);
    const U = norm(add(add([0, 0, 0], rt, Math.cos(yaw)), fw, Math.sin(yaw)));
    let V = norm(add(add([0, 0, 0], up, Math.cos(pitch)), fw, Math.sin(pitch)));
    const dUV = U[0] * V[0] + U[1] * V[1] + U[2] * V[2];
    V = norm(add(V, U, -dUV));
    const s = 0.35 + 0.65 * e;

    const o = 4 * k;
    out.pc.set([c[0], c[1], c[2], p * (1 - handover)], o);
    out.pu.set([U[0], U[1], U[2], hw * s], o);
    out.pv.set([V[0], V[1], V[2], hh * s], o);
  }
  return out;
}
