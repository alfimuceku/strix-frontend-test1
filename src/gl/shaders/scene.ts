/**
 * Scene fragment shader: a single raymarched signed-distance field.
 *
 * Two coordinate spaces:
 *   space 0  "Monument"  — the STRIX wordmark standing on a wet stone plane.
 *   space 1  "Interior"  — everything found inside the X: the volatility-surface
 *                          canyon (Market Universe), the iris machine (Precision
 *                          Engine), the terminal hall and the colonnade (Horizon).
 *
 * The X's square aperture is a true portal: rays that cross its plane inside the
 * aperture continue marching in the interior space, so the second world is visible
 * through the letter before the camera ever reaches it, and passing through is seamless.
 */
export const SCENE_FRAG = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform vec3  uCamTgt;
uniform float uFov;
uniform float uSpace;      // 0 monument, 1 interior (camera space)
uniform float uIntro;      // 0..1 monument emergence
uniform float uMarket;     // 0..1 market column presence
uniform vec4  uEngine;     // x assemble, y explode, z iris open, w spin
uniform float uDim;        // terminal dimming
uniform float uHorizon;    // 0..1 colonnade rise / horizon light
uniform float uFlow;       // scroll velocity, -1..1
uniform vec2  uMouse;      // -1..1
uniform float uQuality;    // 0 low .. 1 high
uniform int   uSteps;
uniform float uEncode;     // 1.0 for float targets, 0.25 for RGBA8
// market → engine stream: columns that lift off the surface and become the outer ring
uniform float uStreamOn;
uniform vec4  uSP[20];     // xyz centre, w spin about z
uniform vec4  uSH[20];     // xyz half extents (x <= 0: inactive), w tilt about x
uniform vec4  uLift[5];    // 1 when source column k has left the surface (k = 4i + j)
uniform vec4  uSBox0;      // stream bounds: centre
uniform vec4  uSBox1;      // stream bounds: half size
uniform float uRingFill;   // 0..1 how much of the outer ring has been built
// terminal hall: glass panel frames (analytic, camera-facing planes)
uniform vec4  uPC[4];      // xyz centre, w alpha
uniform vec4  uPU[4];      // xyz right axis, w half width
uniform vec4  uPV[4];      // xyz up axis, w half height

#define PI 3.14159265
#define MAT_FLOOR  1.0
#define MAT_LETTER 2.0
#define MAT_FRAME  3.0
#define MAT_COLUMN 4.0
#define MAT_ENGINE 5.0
#define MAT_BLADE  6.0
#define MAT_ACCENT 7.0
#define MAT_PYLON  8.0
#define MAT_STREAM 9.0

const vec3 C_MIDNIGHT = vec3(0.0006, 0.0024, 0.0086); // #020817
const vec3 C_NAVY = vec3(0.0018, 0.0070, 0.0242); // #06142B
const vec3 C_ROYAL = vec3(0.0086, 0.1070, 1.0000); // #175CFF
const vec3 C_ELECTRIC = vec3(0.0307, 0.2346, 1.0000); // #3185FF
const vec3 C_ICE = vec3(0.3372, 0.7157, 1.0000); // #9DDCFF
const vec3 C_WHITE = vec3(0.9131, 0.9387, 1.0000); // #F5F8FF

// Portal: centre of the X aperture (monument space) and where it lands (interior space)
const vec3 PORTAL_C = vec3(7.9, 3.0, 0.0);
const vec3 INTERIOR_O = vec3(0.0, 3.0, 8.0);
const float PORTAL_HALF = 0.8;
const vec3 ENGINE_O = vec3(0.0, 7.5, -80.0);

const float RING_A0 = 1.2;

float gSpace = 0.0;
float gT = 1.0;          // distance of the hit being shaded (line anti-aliasing)
vec3  gSL = vec3(0.0);   // stream particle: local position of the nearest hit
vec3  gSH = vec3(1.0);   // stream particle: its half extents

// Primitives
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
float sdBox2(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }
float sdBox(vec3 p, vec3 b){ vec3 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, max(d.y, d.z)), 0.); }
float sdOriented2(vec2 p, vec2 a, vec2 b, float th){
  float l = length(b - a); vec2 d = (b - a) / l; vec2 q = p - (a + b) * 0.5;
  q = vec2(d.x*q.x + d.y*q.y, -d.y*q.x + d.x*q.y);
  q = abs(q) - vec2(l, th) * 0.5;
  return length(max(q, 0.)) + min(max(q.x, q.y), 0.);
}
float extrude(float d2, float z, float h){ vec2 w = vec2(d2, abs(z) - h); return min(max(w.x, w.y), 0.) + length(max(w, 0.)); }
// extrusion with a 45° chamfer of size c on the front and back edges
float extrudeChamfer(float d2, float z, float h, float c){
  return max(extrude(d2, z, h), (d2 + abs(z) - h + c) * 0.70710678);
}
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float k = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * k); }
// anti-aliased line: d = world distance to the line centre, w = half width
float lineAA(float d, float w){ return 1.0 - smoothstep(w * 0.5, w, abs(d)); }

// World 1: monument
// Letterforms are drawn as architectural slabs on a 0.9-unit stroke, 6 units tall.
// Turns are chamfered so the S reads as a letter (never a 5) and the R's bowl is cut, not boxed.
const float SW = 0.45; // half stroke
float glyphS(vec2 p){
  float d = sdSeg(p, vec2(3.15, 5.2), vec2(2.8, 5.55));
  d = min(d, sdSeg(p, vec2(2.8, 5.55), vec2(1.05, 5.55)));
  d = min(d, sdSeg(p, vec2(1.05, 5.55), vec2(0.45, 4.95)));
  d = min(d, sdSeg(p, vec2(0.45, 4.95), vec2(0.45, 3.55)));
  d = min(d, sdSeg(p, vec2(0.45, 3.55), vec2(1.0, 3.0)));
  d = min(d, sdSeg(p, vec2(1.0, 3.0), vec2(2.6, 3.0)));
  d = min(d, sdSeg(p, vec2(2.6, 3.0), vec2(3.15, 2.45)));
  d = min(d, sdSeg(p, vec2(3.15, 2.45), vec2(3.15, 1.05)));
  d = min(d, sdSeg(p, vec2(3.15, 1.05), vec2(2.55, 0.45)));
  d = min(d, sdSeg(p, vec2(2.55, 0.45), vec2(0.8, 0.45)));
  d = min(d, sdSeg(p, vec2(0.8, 0.45), vec2(0.45, 0.8)));
  d -= SW;
  // flat-cut terminals: a short down-turn top right, an up-turn bottom left
  float tTop = max(sdSeg(p, vec2(3.15, 5.2), vec2(3.15, 4.3)) - SW, 4.55 - p.y);
  float tBot = max(sdSeg(p, vec2(0.45, 0.8), vec2(0.45, 1.7)) - SW, p.y - 1.45);
  d = min(d, min(tTop, tBot));
  return max(d, max(-p.y, p.y - 6.0));
}
float glyphT(vec2 p){
  float d = sdBox2(p - vec2(1.8, 5.55), vec2(1.8, SW));
  return min(d, sdBox2(p - vec2(1.8, 2.55), vec2(SW, 2.55)));
}
float glyphR(vec2 p){
  float d = sdBox2(p - vec2(SW, 3.0), vec2(SW, 3.0));
  float bowl = sdSeg(p, vec2(0.45, 5.55), vec2(2.4, 5.55));
  bowl = min(bowl, sdSeg(p, vec2(2.4, 5.55), vec2(2.95, 5.0)));
  bowl = min(bowl, sdSeg(p, vec2(2.95, 5.0), vec2(2.95, 3.55)));
  bowl = min(bowl, sdSeg(p, vec2(2.95, 3.55), vec2(2.4, 3.0)));
  bowl = min(bowl, sdSeg(p, vec2(2.4, 3.0), vec2(0.45, 3.0)));
  d = min(d, max(bowl - SW, p.y - 6.0));
  float leg = sdOriented2(p, vec2(1.75, 3.1), vec2(3.2, 0.0), 0.9);
  leg = max(leg, -p.y);
  return min(d, leg);
}
float glyphI(vec2 p){ return sdBox2(p - vec2(SW, 3.0), vec2(SW, 3.0)); }
float glyphX(vec2 p){
  float d = min(sdOriented2(p, vec2(.3, 0.), vec2(3.3, 6.), 1.0),
                sdOriented2(p, vec2(.3, 6.), vec2(3.3, 0.), 1.0));
  d = max(d, max(-p.y, p.y - 6.0));
  d = max(d, -sdBox2(p - vec2(1.8, 3.0), vec2(PORTAL_HALF)));
  return d;
}

vec2 mapMonument(vec3 p){
  vec2 res = vec2(p.y, MAT_FLOOR);
  float bb = sdBox(p - vec3(-0.4, 3.0, 0.0), vec3(10.4, 3.2, 1.2));
  if (bb < res.x) {
    vec2 q = p.xy;
    float d = glyphS(q - vec2(-10.5, 0.));
    d = min(d, glyphT(q - vec2(-5.7, 0.)));
    d = min(d, glyphR(q - vec2(-0.9, 0.)));
    d = min(d, glyphI(q - vec2(3.95, 0.)));
    vec2 xq = q - vec2(6.1, 0.);
    d = min(d, glyphX(xq));
    float dl = extrudeChamfer(d, p.z, .8, .07);
    if (dl < res.x) res = vec2(dl, MAT_LETTER);
    // the aperture seam: a thin, sharp frame sitting just proud of the X
    // (two shallow rims on the faces, so the tunnel walls stay dark stone)
    float fr = abs(sdBox2(xq - vec2(1.8, 3.0), vec2(PORTAL_HALF + .02))) - .022;
    float df = extrude(fr, abs(p.z) - .8, .035);
    if (df < res.x) res = vec2(df, MAT_FRAME);
  }
  return res;
}

// World 2: market universe
// An implied-volatility surface built as a city: x = moneyness, z = time to expiry,
// height = implied volatility. The camera flies down the at-the-money valley.
const float CELL = 0.8;
const float COL_HALF = 0.16;
// index of a stream source column (see camera.ts STREAM_*), or -1
int streamIndex(vec2 c){
  float j = floor((c.x + 3.6) / 2.4 + 0.5);
  float i = floor((-46.8 - c.y) / 3.2 + 0.5);
  if (j < 0.0 || j > 3.0 || i < 0.0 || i > 4.0) return -1;
  if (abs(c.x - (-3.6 + j * 2.4)) > 0.05 || abs(c.y - (-46.8 - i * 3.2)) > 0.05) return -1;
  return int(i * 4.0 + j);
}
float colH(vec2 c){
  float m = c.x / 11.0;
  float tau = clamp((12.0 - c.y) / 85.0, 0.0, 1.0);
  float iv = 0.16 + 0.32 * m*m / (0.35 + tau) - 0.10 * m * (1.0 - 0.5*tau) + 0.05 * tau;
  float h = 0.6 + iv * 9.0;
  float wave = sin(c.x*0.31 + uTime*0.6 + c.y*0.13) * sin(c.y*0.21 - uTime*0.4);
  h += (0.32 + abs(uFlow) * 0.9) * wave;
  h += (hash12(c) - 0.5) * 0.4;
  h = min(h, 15.5);
  h *= uMarket * smoothstep(-76.0, -52.0, c.y) * smoothstep(13.0, 6.0, c.y);
  if (uRingFill > 0.0) { // stays set after the stream ends, so landed columns never pop back
    int k = streamIndex(c);
    if (k >= 0 && uLift[k / 4][k - (k / 4) * 4] > 0.5) h = 0.0; // this column is in flight
  }
  return max(h, 0.02);
}
float mapMarket(vec3 p){
  if (uMarket < 0.002) return 1e9;
  float top = 16.0 * uMarket + 0.2;
  if (p.y > top + 0.5) return p.y - top;
  if (abs(p.x) > 34.0 || p.z < -78.0 || p.z > 14.0) {
    vec3 bp = p - vec3(0., 8., -32.);
    return max(sdBox(bp, vec3(34., 8.2, 46.)), 0.05);
  }
  // conservative local envelope: lets rays skip over low or sinking columns
  float mx = (abs(p.x) + CELL) / 11.0;
  float env = 0.6 + 9.0 * (0.21 + 0.32 * mx * mx / 0.35 + 0.1 * mx) + 0.32 + abs(uFlow) * 0.9 + 0.25;
  env = min(env, 15.5) * uMarket * smoothstep(-76.0, -52.0, p.z + CELL) + 0.05;
  if (p.y > env + 0.25) return p.y - env;
  vec2 id = floor(p.xz / CELL);
  vec2 c = (id + 0.5) * CELL;
  vec2 lp = p.xz - c;
  float h = colH(c);
  float d = sdBox(vec3(lp.x, p.y - h * 0.5, lp.y), vec3(COL_HALF, h * 0.5, COL_HALF));
  // never step past the current cell (neighbouring columns may be taller)
  float edge = CELL * 0.5 - max(abs(lp.x), abs(lp.y));
  return min(d, edge + (CELL * 0.5 - COL_HALF) - 0.02);
}

// World 3: precision engine
// A machined iris: geared outer ring, counter-rotating graduated bezel, nine
// layered blades and four telescoping legs (the four legs of an iron condor).
vec2 mapEngine(vec3 p){
  float bound = length(p) - 10.5;
  if (bound > 0.8) return vec2(bound, MAT_ENGINE);
  float a = uEngine.x, e = uEngine.y, o = uEngine.z, spin = uEngine.w;
  float fly = 1.0 - a;
  vec2 res;

  // outer geared ring
  vec3 q = p; q.z -= e * 2.6 + fly * 16.0; q.y += fly * 5.0;
  q.xy = rot2(q.xy, spin * 0.5 + fly * 1.6);
  float r = length(q.xy);
  float ring = extrude(abs(r - 5.45) - 0.42, q.z, 0.42);
  float ang = atan(q.y, q.x);
  float sec = 2.0 * PI / 54.0;
  float ai = (floor(ang / sec) + 0.5) * sec;
  vec2 tq = rot2(q.xy, -ai);
  float tooth = sdBox(vec3(tq.x - 6.02, tq.y, q.z), vec3(0.2, 0.1, 0.3));
  float ringD = min(ring, tooth);
  // the ring is built sector by sector as the streaming columns arrive
  if (uRingFill < 0.001) ringD = max(ringD, 1.0);
  else if (uRingFill < 0.999) {
    float aa = mod(ang - RING_A0, 2.0 * PI);
    float lim = uRingFill * 2.0 * PI;
    float s = aa > lim ? min(min(aa - lim, 2.0 * PI - aa), 1.5708) : -min(min(aa, lim - aa), 1.5708);
    ringD = max(ringD, r * sin(s));
  }
  res = vec2(ringD, MAT_ENGINE);

  // bezel (counter-rotating, sits behind the blades)
  vec3 b = p; b.z -= -e * 1.4 - fly * 9.0 - 0.55; b.x += fly * 9.0;
  b.xy = rot2(b.xy, -spin * 0.8);
  float bez = extrude(abs(length(b.xy) - 4.72) - 0.3, b.z, 0.2);
  if (bez < res.x) res = vec2(bez, MAT_ACCENT);

  // iris blades
  vec3 iq = p; iq.z -= -e * 0.4 - fly * 12.0; iq.y -= fly * 4.0;
  float rho = length(iq.xy);
  float th = atan(iq.y, iq.x) + o * 1.25 + spin * 0.15 + fly * 2.0;
  float N = 9.0; float s = 2.0 * PI / N;
  float u = th / s;
  float f = fract(u), idx = floor(u);
  float k = mix(2.7, 0.6, o);
  float rOpen = mix(0.0, 4.15, o);
  float rEdge = rOpen + (1.0 - f) * k;
  float slope = k / s;
  float bl = (rEdge - rho) / sqrt(1.0 + (slope / max(rho, 0.4)) * (slope / max(rho, 0.4)));
  bl = max(bl, rho - 4.95);
  float zoff = (mod(idx, 2.0) - 0.5) * 0.08;
  float blade = extrude(bl, iq.z - zoff, 0.07);
  if (blade < res.x) res = vec2(blade, MAT_BLADE);

  // four telescoping legs, locked to the outer ring
  vec3 pq = p; pq.z -= e * 2.6 + fly * 16.0; pq.y += fly * 5.0;
  pq.xy = rot2(pq.xy, spin * 0.5 + fly * 1.6);
  vec2 fq = abs(pq.xy);
  float along = (fq.x + fq.y) * 0.70710678;
  float perp = abs(fq.x - fq.y) * 0.70710678;
  float L = 0.8 + e * 2.4 + a * 0.4;
  float cyl = max(length(vec2(perp, pq.z)) - 0.3, abs(along - (5.9 + L * 0.5)) - L * 0.5);
  float sleeve = max(length(vec2(perp, pq.z)) - 0.42, abs(along - 6.3) - 0.45);
  float head = sdBox(vec3(along - (6.0 + L + 0.3), perp, pq.z), vec3(0.3, 0.6, 0.6));
  float leg = min(min(cyl, sleeve), head);
  if (leg < res.x) res = vec2(leg, MAT_ENGINE);
  return res;
}

// World 5: horizon
// A calm colonnade: one row each side, evenly spaced, tall and slim, no lintels.
const float PYL_X = 15.0;
const float PYL_SP = 24.0;
float mapHorizon(vec3 p){
  if (uHorizon < 0.002 || p.z > -96.0) return max(-96.0 - p.z, 0.0) + 1.0;
  float zi = floor(p.z / PYL_SP);
  float lz = p.z - (zi + 0.5) * PYL_SP;
  float ax = abs(p.x);
  float far = clamp((-(zi + 0.5) * PYL_SP - 100.0) / 420.0, 0.0, 1.0);
  float rise = clamp(uHorizon * 1.7 - far * 0.7, 0.0, 1.0);
  rise = rise * rise * (3.0 - 2.0 * rise);
  float H = 34.0 * rise;
  float d = sdBox(vec3(ax - PYL_X, p.y - H * 0.5, lz), vec3(0.42, H * 0.5 + 0.01, 0.42));
  d = min(d, PYL_SP * 0.5 - abs(lz) + 0.4);
  if (ax > PYL_X + 4.0) d = min(d, ax - PYL_X - 0.5);
  return d;
}

// Columns in flight from the surface to the outer ring (poses are computed on the CPU).
// They are traced analytically (ray vs oriented box) once per pixel instead of being
// part of the distance field, which keeps the transition as cheap as the market itself.
float traceStream(vec3 ro, vec3 rd, float tmax, out vec3 nW){
  float best = tmax;
  nW = vec3(0.0, 1.0, 0.0);
  if (uStreamOn < 0.5) return best;
  // whole-stream bounds first
  {
    vec3 m = 1.0 / rd, n = m * (ro - uSBox0.xyz), k = abs(m) * uSBox1.xyz;
    vec3 t1 = -n - k, t2 = -n + k;
    float tN = max(max(t1.x, t1.y), t1.z), tF = min(min(t2.x, t2.y), t2.z);
    if (tN > tF || tF < 0.0 || tN > tmax) return best;
  }
  for (int i = 0; i < 20; i++) {
    vec4 b = uSH[i];
    if (b.x <= 0.0) continue;
    vec4 a = uSP[i];
    vec3 o = ro - a.xyz, d = rd;
    o.xy = rot2(o.xy, -a.w); d.xy = rot2(d.xy, -a.w);
    o.yz = rot2(o.yz, -b.w); d.yz = rot2(d.yz, -b.w);
    vec3 m = 1.0 / d, n = m * o, k = abs(m) * b.xyz;
    vec3 t1 = -n - k, t2 = -n + k;
    float tN = max(max(t1.x, t1.y), t1.z), tF = min(min(t2.x, t2.y), t2.z);
    if (tN > tF || tF < 0.0 || tN >= best || tN < 0.0) continue;
    best = tN;
    vec3 nl = -sign(d) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
    gSL = o + d * tN;
    gSH = b.xyz;
    nl.yz = rot2(nl.yz, b.w);
    nl.xy = rot2(nl.xy, a.w);
    nW = nl;
  }
  return best;
}

vec2 mapInterior(vec3 p){
  vec2 res = vec2(p.y, MAT_FLOOR);
  float m = mapMarket(p);
  if (m < res.x) res = vec2(m, MAT_COLUMN);
  vec2 e = mapEngine(p - ENGINE_O);
  if (e.x < res.x) res = e;
  float h = mapHorizon(p);
  if (h < res.x) res = vec2(h, MAT_PYLON);
  return res;
}

vec2 map(vec3 p){ return gSpace < 0.5 ? mapMonument(p) : mapInterior(p); }

vec3 calcNormal(vec3 p, float t){
  float e = 0.0012 * max(1.0, t * 0.6);
  const vec2 k = vec2(1, -1);
  return normalize(k.xyy * map(p + k.xyy*e).x + k.yyx * map(p + k.yyx*e).x +
                   k.yxy * map(p + k.yxy*e).x + k.xxx * map(p + k.xxx*e).x);
}

vec2 march(vec3 ro, vec3 rd, float tmin, float tmax, int steps){
  float t = tmin; float m = -1.0;
  for (int i = 0; i < 160; i++) {
    if (i >= steps) break;
    vec2 h = map(ro + rd * t);
    if (abs(h.x) < 0.0007 * t) { m = h.y; break; }
    t += h.x * 0.92;
    if (t > tmax) break;
  }
  return vec2(t, m);
}

float softShadow(vec3 ro, vec3 rd, float k){
  float res = 1.0; float t = 0.04;
  for (int i = 0; i < 28; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, k * h / t);
    t += clamp(h, 0.05, 0.8);
    if (res < 0.01 || t > 18.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 p, vec3 n){
  float occ = 0.0; float sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.03 + 0.14 * float(i);
    occ += (h - map(p + n * h).x) * sca;
    sca *= 0.72;
  }
  return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}

// Sky and atmosphere
vec3 skyMonument(vec3 rd){
  float y = rd.y;
  vec3 c = mix(C_NAVY * 1.1, C_MIDNIGHT * 0.5, smoothstep(-0.05, 0.45, y));
  // a cold dawn line behind the monument — the same horizon the journey ends on
  c += C_ROYAL * 0.16 * exp(-abs(y) * 10.0) * uIntro;
  c += C_ICE * 0.22 * exp(-abs(y) * 80.0) * uIntro;
  return c;
}
vec3 skyInterior(vec3 rd){
  float y = rd.y;
  vec3 c = mix(C_NAVY * 0.7, C_MIDNIGHT * 0.5, smoothstep(0.0, 0.6, y));
  // distant haze of the market
  c += C_ROYAL * 0.05 * exp(-abs(y) * 6.0) * (1.0 - uHorizon);
  // the horizon: a single luminous line widening into a cold dawn
  float fwd = smoothstep(-0.2, 0.9, -rd.z);
  float hz = uHorizon * fwd;
  c += C_ROYAL * 0.42 * exp(-abs(y) * 6.0) * hz;
  c += C_ICE * 0.3 * exp(-abs(y) * 130.0) * hz;
  c += C_WHITE * 1.5 * exp(-abs(y) * 1100.0) * hz;
  return c;
}
vec3 sky(vec3 rd){ return gSpace < 0.5 ? skyMonument(rd) : skyInterior(rd); }

// GGX-ish specular
float specGGX(vec3 n, vec3 v, vec3 l, float rough){
  vec3 h = normalize(v + l);
  float a = rough * rough; float a2 = a * a;
  float nh = max(dot(n, h), 0.0);
  float nl = max(dot(n, l), 0.0);
  float d = nh * nh * (a2 - 1.0) + 1.0;
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(v, h), 0.0), 5.0);
  return min(a2 / (PI * d * d + 1e-4), 60.0) * F * nl;
}

struct Mat { vec3 albedo; float rough; vec3 emit; float refl; };

Mat material(float id, vec3 p, vec3 n){
  Mat m; m.albedo = vec3(0.02, 0.04, 0.09); m.rough = 0.5; m.emit = vec3(0.0); m.refl = 0.0;
  if (id == MAT_FLOOR) {
    m.albedo = vec3(0.010, 0.020, 0.045); m.rough = 0.18; m.refl = 0.55;
    if (gSpace > 0.5) {
      // engraved survey grid: brightens in the terminal hall and the horizon
      vec2 g = abs(fract(p.xz / 2.0) - 0.5);
      float line = smoothstep(0.485, 0.5, max(g.x, g.y));
      vec2 g2 = abs(fract(p.xz / 10.0) - 0.5);
      float major = smoothstep(0.494, 0.5, max(g2.x, g2.y));
      float zone = smoothstep(-70.0, -86.0, p.z);
      m.emit = C_ELECTRIC * (line * 0.10 + major * 0.35) * zone * (0.35 + 0.65 * uDim + 0.4 * uHorizon) * exp(-abs(p.x) * 0.012);
    } else {
      // slate seams
      vec2 g = abs(fract(p.xz / vec2(3.0, 3.0)) - 0.5);
      float seam = smoothstep(0.49, 0.5, max(g.x, g.y));
      m.albedo *= 1.0 - 0.6 * seam;
    }
  } else if (id == MAT_LETTER) {
    m.albedo = vec3(0.07, 0.10, 0.165); m.rough = 0.32;
    m.albedo *= 0.72 + 0.28 * smoothstep(0.0, 6.0, p.y);
    // two fine light grooves across each front face, nothing brick-like
    float front = step(0.7, abs(n.z));
    float w = 0.012 + gT * 0.0012;
    float groove = (lineAA(p.y - 2.0, w) + lineAA(p.y - 4.0, w)) * front;
    m.albedo *= 1.0 - 0.5 * groove;
    m.emit = C_ELECTRIC * groove * 0.28 * min(1.0, 0.03 / w) * uIntro;
  } else if (id == MAT_FRAME) {
    m.albedo = vec3(0.5, 0.7, 1.0); m.rough = 0.1;
    m.emit = C_ICE * (0.85 + 0.08 * sin(uTime * 1.4)) * (0.25 + 0.75 * uIntro);
  } else if (id == MAT_COLUMN) {
    // a data sculpture: dark glass bodies, iso-IV contour lines and a thin lit top edge
    vec2 cid = floor(p.xz / CELL);
    vec2 cc = (cid + 0.5) * CELL;
    vec2 lp = p.xz - cc;
    float h = colH(cc);
    float hsh = hash12(cid * 0.37 + 3.1);
    m.albedo = vec3(0.008, 0.02, 0.05) * (0.8 + 0.4 * hsh) * (1.0 - 0.5 * step(0.6, n.y));
    m.rough = mix(0.38, 0.75, step(0.6, n.y)); // matte caps: no plate-like glints
    float live = 0.7 + 0.3 * sin(uTime * (0.6 + hsh) + hsh * 40.0);
    float side = 1.0 - smoothstep(0.4, 0.7, abs(n.y));
    float w = 0.014 + gT * 0.0016;
    float fade = min(1.0, 0.03 / w);
    float contour = lineAA((0.5 - abs(fract(p.y / 1.25) - 0.5)) * 1.25, w) * side;
    float rimSide = lineAA(h - p.y - w * 0.5, w) * side;
    float rimCap = lineAA(COL_HALF - max(abs(lp.x), abs(lp.y)) - w * 0.25, w * 0.75) * step(0.6, n.y);
    float expiry = 1.0 - step(0.5, mod(cid.y, 7.0));
    float ph = uTime * 1.1 + hsh * 9.0;
    float trade = step(0.94, hash11(dot(cid, vec2(131.0, 1.0)) * 0.71 + floor(ph)));
    float flash = trade * pow(1.0 - fract(ph), 3.0);
    m.emit = C_ELECTRIC * contour * 0.75 * live * fade;
    m.emit += mix(C_ELECTRIC, C_ICE, 0.35 + 0.65 * expiry) * (rimSide + rimCap * 0.12) * (0.5 + 0.55 * expiry + 1.1 * flash) * fade;
    m.emit *= uMarket;
  } else if (id == MAT_STREAM) {
    // columns in flight: glass wireframe brightening as they near the ring
    vec3 e = gSH - abs(gSL);
    float w = 0.02 + gT * 0.0015;
    float ex = lineAA(e.x, w), ey = lineAA(e.y, w), ez = lineAA(e.z, w);
    float edge = clamp(ex * ey + ey * ez + ez * ex, 0.0, 1.0);
    m.albedo = vec3(0.01, 0.025, 0.06); m.rough = 0.25;
    m.emit = mix(C_ELECTRIC, C_ICE, 0.6) * edge * 1.3 + C_ROYAL * 0.04;
  } else if (id == MAT_ENGINE) {
    m.albedo = vec3(0.06, 0.09, 0.17); m.rough = 0.2;
    vec3 bp = p - ENGINE_O;
    float r = length(bp.xy);
    // machined light grooves on the ring face
    float groove = smoothstep(0.05, 0.0, abs(r - 5.25)) + smoothstep(0.035, 0.0, abs(r - 5.68));
    m.emit = C_ELECTRIC * groove * 1.6 * step(0.3, n.z) * (0.3 + 0.7 * uEngine.x);
    // leg heads glow like status lamps
    m.emit += C_ICE * smoothstep(7.2, 7.6, r) * step(0.5, n.z) * 0.8 * uEngine.x;
  } else if (id == MAT_ACCENT) {
    m.albedo = vec3(0.04, 0.07, 0.14); m.rough = 0.3;
    vec3 bp = p - ENGINE_O;
    float a = atan(bp.y, bp.x) + uEngine.w * 0.8;
    float tick = smoothstep(0.86, 1.0, abs(sin(a * 30.0)));
    m.emit = C_ELECTRIC * tick * 0.8 * uEngine.x;
  } else if (id == MAT_BLADE) {
    m.albedo = vec3(0.035, 0.06, 0.12); m.rough = 0.16;
    float seamLines = 0.0;
    vec3 bp = p - ENGINE_O;
    float rho = length(bp.xy);
    float rim = smoothstep(4.15 * uEngine.z + 0.35, 4.15 * uEngine.z, rho);
    m.emit = C_ICE * rim * 1.4 * uEngine.z;
    // lit leading edge of every blade traces the spiral
    float o = uEngine.z; float fly = 1.0 - uEngine.x;
    vec3 iq = bp; iq.y -= fly * 4.0;
    float th = atan(iq.y, iq.x) + o * 1.25 + uEngine.w * 0.15 + fly * 2.0;
    float sct = 2.0 * PI / 9.0;
    float f = fract(th / sct);
    float rEdge = mix(0.0, 4.15, o) + (1.0 - f) * mix(2.7, 0.6, o);
    seamLines = smoothstep(0.09, 0.0, abs(length(iq.xy) - rEdge)) * step(0.02, f);
    m.emit += C_ELECTRIC * seamLines * 1.1 * uEngine.x;
  } else if (id == MAT_PYLON) {
    m.albedo = vec3(0.035, 0.065, 0.14); m.rough = 0.3;
    // a single hairline seam up the inner face of each pylon
    float inner = step(0.7, abs(n.x));
    float lz = p.z - (floor(p.z / PYL_SP) + 0.5) * PYL_SP;
    float seam = lineAA(lz, 0.03 + gT * 0.0012) * inner;
    m.emit = C_ICE * seam * 0.5 * uHorizon * smoothstep(0.0, 6.0, p.y);
  }
  return m;
}

vec3 lightScene(vec3 p, vec3 n, vec3 v, Mat m, bool primary){
  vec3 col = vec3(0.0);
  if (gSpace < 0.5) {
    // rim light from behind the monument + the visitor's searchlight (mouse)
    vec3 Lk = normalize(vec3(-0.45, 0.42, -0.8));
    vec3 Ls = normalize(vec3(-0.7 + uMouse.x * 1.6, 0.75 + uMouse.y * 0.4, 0.55));
    float sh = 1.0;
    if (primary && uQuality > 0.5) sh = softShadow(p + n * 0.02, Ls, 10.0);
    float dk = max(dot(n, Lk), 0.0);
    float ds = max(dot(n, Ls), 0.0);
    vec3 kc = C_ICE * 1.6 * uIntro;
    vec3 sc = C_WHITE * 1.5 * uIntro;
    col += m.albedo * (dk * kc + ds * sc * sh);
    col += kc * specGGX(n, v, Lk, m.rough);
    col += sc * specGGX(n, v, Ls, m.rough) * sh * (m.refl > 0.0 ? 0.0 : 1.0);
    // light pouring out of the portal
    vec3 toP = PORTAL_C + vec3(0., 0., 0.4) - p;
    float dp = length(toP);
    float pl = max(dot(n, toP / dp), 0.0) / (1.0 + dp * dp * 0.12);
    col += (m.albedo * 3.0 + 0.01) * C_ELECTRIC * pl * 1.3 * (0.25 + 0.75 * uIntro);
    // sky ambient
    col += m.albedo * C_ROYAL * (0.10 + 0.08 * n.y) * (0.3 + 0.7 * uIntro);
  } else {
    vec3 Lk = normalize(vec3(0.25, 0.65, -0.7));
    vec3 Lh = normalize(vec3(0.0, 0.12, -1.0));
    float dk = max(dot(n, Lk), 0.0);
    float dh = max(dot(n, Lh), 0.0);
    vec3 kc = C_ICE * 0.55;
    vec3 hc = mix(C_ROYAL, C_ICE, 0.6) * (0.15 + 1.6 * uHorizon);
    float sh = 1.0;
    // (no soft shadows over the market: the surface reads by its own light, and the forest is costly to trace)
    if (primary && uQuality > 0.5 && uHorizon < 0.01 && uMarket < 0.5) sh = softShadow(p + n * 0.02, Lk, 12.0);
    col += m.albedo * (dk * kc * sh + dh * hc);
    col += kc * specGGX(n, v, Lk, m.rough) * sh;
    col += hc * specGGX(n, v, Lh, m.rough);
    // the open iris is a light source
    vec3 toE = ENGINE_O - p; float de = length(toE);
    col += (m.albedo * 2.0 + 0.01) * C_ICE * max(dot(n, toE / de), 0.0) * uEngine.z * 18.0 / (1.0 + de * de * 0.08);
    col += m.albedo * C_ROYAL * (0.12 + 0.1 * n.y);
    // work light washing the machine from the approach side
    float wz = smoothstep(-50.0, -66.0, p.z) * smoothstep(-92.0, -82.0, p.z);
    vec3 Lw = normalize(vec3(-0.35, 0.45, 1.0));
    col += (m.albedo * max(dot(n, Lw), 0.0) + C_ICE * specGGX(n, v, Lw, m.rough) * 0.5) * C_WHITE * 0.55 * wz;
  }
  col += m.emit;
  return col;
}

vec3 fogIt(vec3 col, vec3 rd, float t){
  float dens = gSpace < 0.5 ? mix(0.06, 0.02, uIntro) : mix(0.022, 0.006, uHorizon);
  float f = 1.0 - exp(-t * dens);
  vec3 fc = sky(rd);
  if (gSpace > 0.5) {
    // depth haze toward royal blue over the volatility surface
    float hz = (1.0 - exp(-t * 0.03)) * uMarket * (1.0 - uHorizon);
    fc = mix(fc, C_ROYAL * 0.07, hz * 0.7);
    f = max(f, hz * 0.55);
  }
  return mix(col, fc, f);
}

// shade a hit (with optional single floor reflection)
vec3 shadeHit(vec3 ro, vec3 rd, vec2 hit){
  vec3 p = ro + rd * hit.x;
  vec3 n = calcNormal(p, hit.x);
  vec3 v = -rd;
  gT = hit.x;
  Mat m = material(hit.y, p, n);
  float ao = calcAO(p, n);
  vec3 col = lightScene(p, n, v, m, true) * mix(0.55, 1.0, ao);
  if (m.refl > 0.0) {
    vec3 rr = reflect(rd, n);
    float fres = m.refl * (0.25 + 0.75 * pow(1.0 - max(dot(n, v), 0.0), 3.0));
    vec3 rc;
    if (uQuality > 0.25) {
      // over the market the floor barely shows between columns: fewer reflection steps
          vec2 rh = march(p + n * 0.02, rr, 0.02, 70.0, int(mix(56.0, 28.0, uMarket * gSpace)));
      if (rh.y > 0.0) {
        vec3 rp = p + n * 0.02 + rr * rh.x;
        vec3 rn = calcNormal(rp, rh.x);
        gT = hit.x + rh.x;
        Mat rm = material(rh.y, rp, rn);
        rc = lightScene(rp, rn, -rr, rm, false);
        rc = fogIt(rc, rr, rh.x);
      } else rc = sky(rr);
          // blur reflection with distance for a wet-stone feel
      rc = mix(rc, sky(rr), clamp(rh.x / 60.0, 0.0, 0.6));
    } else rc = sky(rr);
    col = mix(col, rc, fres);
  }
  return fogIt(col, rd, hit.x);
}

// analytic glow around a point (no extra marching)
float pointGlow(vec3 ro, vec3 rd, vec3 c, float tmax, float k){
  float t = clamp(dot(c - ro, rd), 0.0, tmax);
  float d = length(ro + rd * t - c);
  return 1.0 / (1.0 + d * d * k);
}

// Glass panel frames in the terminal hall: four camera-facing planes, no marching.
// Returns rgb emission; a = glass coverage (darkens what is behind).
vec4 panels(vec3 ro, vec3 rd, float tScene, float fl){
  vec3 em = vec3(0.0); float cover = 0.0;
  for (int k = 0; k < 4; k++) {
    float al = uPC[k].w;
    if (al <= 0.002) continue;
    vec3 U = uPU[k].xyz, V = uPV[k].xyz;
    vec3 n = cross(U, V);
    float dn = dot(rd, n);
    if (abs(dn) < 1e-4) continue;
    float t = dot(uPC[k].xyz - ro, n) / dn;
    if (t <= 0.05 || t > tScene) continue;
    vec3 h = ro + rd * t - uPC[k].xyz;
    vec2 l = vec2(dot(h, U), dot(h, V));
    vec2 hw = vec2(uPU[k].w, uPV[k].w);
    vec2 e = hw - abs(l);
    float edge = min(e.x, e.y);
    float px = 2.0 * t / (uRes.y * fl);
    if (edge < -px * 12.0) continue;
    float inside = smoothstep(-px, px, edge);
    float frame = 1.0 - smoothstep(px * 0.6, px * 1.8, abs(edge));
    // brighter corner brackets
    vec2 ce = hw - abs(l);
    float bracket = frame * step(max(ce.x, ce.y), min(hw.x, hw.y) * 0.16);
    // a header rule, like the panel heads of the dashboard
    float head = inside * (1.0 - smoothstep(px * 0.5, px * 1.5, abs(l.y - (hw.y - min(hw.y * 0.12, 0.35)))));
    float halo = exp(-max(-edge, 0.0) / (px * 5.0)) * (1.0 - inside) * 0.25;
    float sweep = inside * exp(-pow((l.x + l.y * 0.6) / hw.x - (fract(uTime * 0.12 + float(k) * 0.23) * 3.0 - 1.5), 2.0) * 30.0) * 0.06;
    em += (C_ICE * (frame * 0.8 + bracket * 0.9 + head * 0.25) + C_ELECTRIC * (halo + sweep) + C_ROYAL * inside * 0.025) * al;
    cover = max(cover, inside * al);
  }
  return vec4(em, cover);
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 ro = uCamPos;
  vec3 fw = normalize(uCamTgt - uCamPos);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  float fl = 1.0 / tan(radians(uFov) * 0.5);
  vec3 rd = normalize(uv.x * rt + uv.y * up + fl * fw);

  gSpace = uSpace;
  vec3 col;
  float tmax = gSpace < 0.5 ? 90.0 : 260.0;
  vec2 hit = march(ro, rd, 0.0, tmax, uSteps);

  bool throughPortal = false;
  if (gSpace < 0.5 && rd.z < 0.0 && ro.z > 0.0) {
    float tp = -ro.z / rd.z;
    vec3 pp = ro + rd * tp;
    vec2 a = abs(pp.xy - PORTAL_C.xy);
    if (a.x < PORTAL_HALF && a.y < PORTAL_HALF && (hit.y < 0.0 || tp < hit.x)) {
      throughPortal = true;
      // continue the very same ray inside the X
      vec3 ro2 = ro - PORTAL_C + INTERIOR_O;
      gSpace = 1.0;
      vec2 h2 = march(ro2, rd, tp, tp + 220.0, uSteps);
      col = h2.y > 0.0 ? shadeHit(ro2, rd, h2) : sky(rd);
      // a soft inner glow hugging the seam, clear in the middle
      float inset = PORTAL_HALF - max(a.x, a.y);
      col += C_ICE * 0.22 * exp(-inset * 9.0) * (0.3 + 0.7 * uIntro);
    }
  }
  if (!throughPortal) {
    col = hit.y > 0.0 ? shadeHit(ro, rd, hit) : sky(rd);
    if (gSpace > 0.5 && uStreamOn > 0.5) {
      vec3 sn;
      float ts = traceStream(ro, rd, hit.y > 0.0 ? hit.x : tmax, sn);
      if (ts < (hit.y > 0.0 ? hit.x : tmax)) {
        vec3 sp = ro + rd * ts;
        gT = ts;
        Mat sm = material(MAT_STREAM, sp, sn);
        col = fogIt(lightScene(sp, sn, -rd, sm, false), rd, ts);
        hit = vec2(ts, MAT_STREAM);
      }
    }
  }

  // volumetric halos
  gSpace = uSpace;
  if (uSpace < 0.5) {
    float g = pointGlow(ro, rd, PORTAL_C, hit.y > 0.0 ? hit.x + 2.0 : 90.0, 3.5);
    float near = smoothstep(0.8, 5.0, length(ro - PORTAL_C));
    col += C_ELECTRIC * g * 0.1 * (0.3 + 0.7 * uIntro) * near;
  } else {
    float g = pointGlow(ro, rd, ENGINE_O, hit.y > 0.0 ? hit.x + 1.0 : 200.0, 0.06);
    float near = smoothstep(1.0, 9.0, length(ro - ENGINE_O));
    col += C_ICE * g * uEngine.z * 0.35 * (1.0 - uDim * 0.7) * near;
  }

  col *= mix(1.0, 0.42, uDim);
  if (uSpace > 0.5) {
    vec4 pn = panels(ro, rd, hit.y > 0.0 ? hit.x : 1e4, fl);
    col = mix(col, col * 0.5 + C_NAVY * 0.5, pn.a * 0.6) + pn.rgb;
  }
  fragColor = vec4(max(col, 0.0) * uEncode, 1.0);
}
`;
