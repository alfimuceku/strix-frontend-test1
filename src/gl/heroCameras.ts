/**
 * Interior-page hero compositions. Each page borrows one moment of the
 * homepage journey (the world state at story time T) but frames it with its
 * own camera, so the subject sits on the right and the title has clean space
 * on the left. Phones put the subject in the top band, above the copy.
 *
 * Monument poses (space 0) are in monument coordinates; everything else is in
 * interior coordinates (see camera.ts).
 */
import type { HeroCamera } from "./camera";

export type HeroWorld = "monument" | "portal" | "market" | "engine" | "iris" | "hall" | "horizon";

export interface HeroSpec {
  poster: number; // CSS fallback poster (0–4)
  desktop: HeroCamera;
  mobile: HeroCamera;
}

export const HERO_CAMERAS: Record<HeroWorld, HeroSpec> = {
  // Contact: the X and its portal from the right, the rest of the wordmark receding behind it
  monument: {
    poster: 0,
    desktop: { T: 0.12, space: 0, pos: [15, 2.2, 10], tgt: [-6, 3.6, -3.5], fov: 40 },
    mobile: { T: 0.12, space: 0, pos: [-1.5, 2.6, 17], tgt: [5.6, -1.4, 0], fov: 56 },
  },
  // Sign in panel (portrait half-screen, copy over most of it): the aperture glows from above the headline
  portal: {
    poster: 0,
    desktop: { T: 0.5, space: 0, pos: [5.2, 2.2, 11.5], tgt: [6.6, 4.6, 0], fov: 50 },
    mobile: { T: 0.5, space: 0, pos: [4.6, 1.6, 10.5], tgt: [7.4, -1.8, 0], fov: 54 },
  },
  // FAQ: looking back up the volatility surface, so the skew wall rises on the right
  market: {
    poster: 1,
    desktop: { T: 1.42, space: 1, pos: [6, 8.5, -82], tgt: [-13, 3, -48], fov: 48 },
    mobile: { T: 1.42, space: 1, pos: [2, 10, -82], tgt: [-3, 0, -44], fov: 62 },
  },
  // Rules: the assembled engine, separated, on the right
  engine: {
    poster: 2,
    desktop: { T: 2.52, space: 1, pos: [4, 9, -55], tgt: [-10.5, 7.5, -80], fov: 44 },
    mobile: { T: 2.52, space: 1, pos: [3, 9.5, -51], tgt: [0, 3.0, -80], fov: 60 },
  },
  // Plans, Start: the open iris
  iris: {
    poster: 2,
    desktop: { T: 3.02, space: 1, pos: [2.5, 7.8, -55], tgt: [-12.5, 7.4, -80], fov: 44 },
    mobile: { T: 3.02, space: 1, pos: [1.5, 8.2, -51], tgt: [0, 1.6, -80], fov: 60 },
  },
  // Legal: the survey hall, the colonnade receding on the right
  hall: {
    poster: 3,
    desktop: { T: 4.5, space: 1, pos: [3, 5, -104], tgt: [14, -2, -150], fov: 50 },
    mobile: { T: 4.5, space: 1, pos: [4, 5, -104], tgt: [12, 15, -150], fov: 62 },
  },
  // Payouts: the lit horizon high above the title, the colonnade marching off to the right
  horizon: {
    poster: 4,
    desktop: { T: 4.86, space: 1, pos: [5, 3.5, -140], tgt: [24, -22, -320], fov: 50 },
    mobile: { T: 4.86, space: 1, pos: [4, 3.5, -140], tgt: [10, -30, -320], fov: 60 },
  },
};
