"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryController } from "@/lib/story";
import { StrixRenderer } from "@/gl/StrixRenderer";
import { evaluateScene, WORLD_STILLS } from "@/gl/camera";
import { hasWebGL2, isCompactDevice } from "@/gl/detect";
import { createTerminalHandover } from "./terminalHandover";

interface Props {
  story: StoryController | null;
  reducedMotion: boolean;
}

/**
 * The fixed WebGL stage behind the homepage. Falls back to art-directed CSS
 * "posters" (one per world) when WebGL2 is unavailable or fails.
 */
export function Stage({ story, reducedMotion }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "gl" | "fallback">("pending");

  useEffect(() => {
    const slot = slotRef.current;
    if (!story || !slot) return;
    if (!hasWebGL2()) {
      setMode("fallback");
      return;
    }
    // a fresh canvas per run: a disposed renderer loses its context, which can't be reused
    const canvas = document.createElement("canvas");
    canvas.className = "stage__canvas";
    slot.appendChild(canvas);
    const mobile = isCompactDevice();
    let renderer: StrixRenderer;
    try {
      renderer = new StrixRenderer(canvas, { mobile });
    } catch (err) {
      console.warn("[strix] WebGL unavailable, using poster fallback.", err);
      canvas.remove();
      setMode("fallback");
      return;
    }
    setMode("gl");
    let drawnKey = ""; // reduced motion: the still frame currently on the canvas
    // posters cover a lost context; the renderer rebuilds itself if the browser restores it
    renderer.onContextLost = () => setMode("fallback");
    renderer.onContextRestored = () => {
      drawnKey = "";
      setMode("gl");
    };

    // touch browsers resize on every URL-bar show/hide; those height-only nudges aren't worth new buffers
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let lastW = 0, lastH = 0;
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      if (coarse && w === lastW && Math.abs(h - lastH) < 120) return;
      lastW = w;
      lastH = h;
      renderer.resize(w, h, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const t0 = performance.now();
    let stillWorld = -1;
    let visible = !document.hidden;
    const onVis = () => (visible = !document.hidden);
    document.addEventListener("visibilitychange", onVis);

    let first = true;
    const handover = createTerminalHandover(!reducedMotion);
    const unsub = story.subscribe((f) => {
      if (!visible || renderer.lost) return;
      const now = performance.now();
      const secs = (now - t0) / 1000;
      let T = f.T;
      let time = secs;
      // the lit still (public/stills) is already on screen, so the monument only brightens the last stretch
      let intro = Math.min(1, secs / 1.6);
      intro = 0.7 + 0.3 * (1 - Math.pow(1 - intro, 3));
      if (reducedMotion) {
        // still frames: one composed view per world, no camera travel, no ambient motion
        const w = f.world;
        T = WORLD_STILLS[w];
        time = 3;
        intro = 1;
        if (w !== stillWorld) {
          stillWorld = w;
          canvas.style.opacity = "0";
          requestAnimationFrame(() => (canvas.style.opacity = "1"));
        }
        // every frame of a still is identical: draw it once per world and canvas size
        const key = `${w}:${canvas.width}x${canvas.height}`;
        if (key === drawnKey && !first) return;
        drawnKey = key;
      }
      const flow = reducedMotion ? 0 : f.flow;
      const scene = evaluateScene(T, mobile, reducedMotion ? [0, 0] : f.mouse, time, flow);
      const panels = handover.update(T, scene);
      renderer.render({ ...scene, time, intro, flow, mouse: reducedMotion ? [0, 0] : f.mouse, panels }, now);
      if (first) {
        // fade the canvas in over the poster once there is a real frame to show
        first = false;
        requestAnimationFrame(() => canvas.classList.add("is-live"));
      }
    });

    return () => {
      unsub();
      handover.dispose();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      renderer.dispose();
      canvas.remove();
    };
  }, [story, reducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.stage = mode;
  }, [mode]);

  return (
    <div className="stage" aria-hidden="true">
      {/* instant still of the monument, so the first paint is never an empty dark screen */}
      <div className="stage__still" />
      <div ref={slotRef} className="stage__slot" />
      <div className="stage__poster">
        <div className="poster poster--0" />
        <div className="poster poster--1" />
        <div className="poster poster--2" />
        <div className="poster poster--3" />
        <div className="poster poster--4" />
      </div>
      <div className="stage__scrim" />
    </div>
  );
}
