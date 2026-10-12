export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/** Bright-pass + 2x downsample */
export const BRIGHT_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform sampler2D uTex; uniform vec2 uTexel; uniform float uDecode;
void main(){
  vec3 c = vec3(0.0);
  c += texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2( 1.0, -1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(-1.0,  1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  c *= 0.25 * uDecode;
  float l = max(c.r, max(c.g, c.b));
  float k = smoothstep(0.55, 1.4, l);
  fragColor = vec4(c * k, 1.0);
}
`;

/** Separable 9-tap gaussian using linear sampling */
export const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 c = texture(uTex, vUv).rgb * 0.2270270270;
  c += texture(uTex, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture(uTex, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  fragColor = vec4(c, 1.0);
}
`;

/** Composite: scene + bloom, filmic tone map, lens and grain */
export const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform sampler2D uScene; uniform sampler2D uBloom;
uniform float uTime; uniform float uExposure; uniform vec2 uRes; uniform float uBloomAmt; uniform float uDecode;
vec3 aces(vec3 x){ const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec2 d = vUv - 0.5;
  float r2 = dot(d, d);
  // gentle lateral chromatic split toward the frame edges
  vec2 off = d * r2 * 0.012;
  vec3 c;
  c.r = texture(uScene, vUv + off).r;
  c.g = texture(uScene, vUv).g;
  c.b = texture(uScene, vUv - off).b;
  c *= uDecode;
  c += texture(uBloom, vUv).rgb * uBloomAmt;
  c *= uExposure;
  c = aces(c);
  c = pow(c, vec3(1.0 / 2.2));
  c *= 1.0 - r2 * 0.9;
  c += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.028;
  fragColor = vec4(c, 1.0);
}
`;
