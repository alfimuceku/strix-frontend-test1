"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { StrixRenderer } from "@/gl/StrixRenderer";
import { evaluateHero } from "@/gl/camera";
import { HERO_CAMERAS, type HeroWorld } from "@/gl/heroCameras";
import { hasWebGL2, isCompactDevice } from "@/gl/detect";

export type { HeroWorld };

interface Props {
  world: HeroWorld;
  kicker?: string;
  title: string;
  id?: string;
  children?: ReactNode;
  size?: "tall" | "short";
}

export function WorldHero({ world, kicker, title, id, children, size = "tall" }: Props) {
  return (
    <header className={`world-hero world-hero--${size}`}>
      <WorldBackdrop world={world} />
      <div className="container world-hero__content">
        {kicker && <p className="world-hero__kicker">{kicker}</p>}
        <h1 id={id} className="display display--lg">
          {title}
        </h1>
        {children && <div className="world-hero__lede">{children}</div>}
      </div>
    </header>
  );
}

/**
 * Interior-page header: a live window onto one world of the homepage journey,
 * framed by its own hero camera (heroCameras.ts). It renders only while on
 * screen, drifts slowly with a touch of pointer parallax, holds a single frame
 * for reduced motion and falls back to a CSS poster.
 */
export function WorldBackdrop({ world, className = "" }: { world: HeroWorld; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "gl" | "fallback">("pending");
  const [live, setLive] = useState(false);
  const spec = HERO_CAMERAS[world];

  useEffect(() => {
    const host = ref.current;
    const slot = slotRef.current;
    if (!host || !slot) return;
    if (!hasWebGL2()) return setMode("fallback");
    // a fresh canvas per run: a disposed renderer loses its context, which can't be reused
    const canvas = document.createElement("canvas");
    canvas.className = "world-backdrop__canvas";
    slot.appendChild(canvas);
    const mobile = isCompactDevice();
    let r: StrixRenderer;
    try {
      r = new StrixRenderer(canvas, { mobile, scale: mobile ? 0.42 : 0.55 });
    } catch {
      canvas.remove();
      return setMode("fallback");
    }
    setMode("gl");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cam = mobile ? spec.mobile : spec.desktop;

    const resize = () => {
      const b = host.getBoundingClientRect();
      r.resize(b.width, b.height, window.devicePixelRatio || 1);
      drawn = false; // a held frame must be redrawn at the new size
      wake();
    };
    let drawn = false;
    let raf = 0;
    let onScreen = true;
    // the loop parks itself while there is nothing to draw; wake() restarts it
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    r.onContextLost = () => setMode("fallback");
    r.onContextRestored = () => {
      drawn = false;
      setMode("gl");
      wake();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) wake();
    }, { threshold: 0 });
    io.observe(host);
    const onVis = () => {
      if (!document.hidden) wake();
    };
    document.addEventListener("visibilitychange", onVis);

    let mouse: [number, number] = [0, 0];
    let target: [number, number] = [0, 0];
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target = [(e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1)];
    };
    if (!mobile && !reduced) window.addEventListener("pointermove", onMove, { passive: true });

    const t0 = performance.now();
    function frame(now: number) {
      raf = 0;
      if (!onScreen || document.hidden || r.lost) return;
      if (reduced && drawn) return;
      raf = requestAnimationFrame(frame);
      mouse = [mouse[0] + (target[0] - mouse[0]) * 0.04, mouse[1] + (target[1] - mouse[1]) * 0.04];
      const time = reduced ? 3 : 3 + (now - t0) / 1000;
      const scene = evaluateHero(cam, time, mouse, !reduced);
      r.render({ ...scene, time, intro: 1, flow: 0, mouse: reduced ? [0, 0] : mouse }, now);
      if (!drawn) setLive(true);
      drawn = true;
    }
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      r.dispose();
      canvas.remove();
      setLive(false);
    };
  }, [spec]);

  return (
    <div className={`world-backdrop ${className}`} ref={ref} data-mode={mode} data-live={live || undefined} aria-hidden="true">
      <div className={`world-backdrop__poster poster poster--${spec.poster}`} />
      <div ref={slotRef} className="world-backdrop__slot" />
      <div className="world-backdrop__scrim" />
    </div>
  );
}
