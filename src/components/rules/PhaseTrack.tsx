"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Vertical phase timeline: a glowing line joins the phase squares and fills
 * as the reader scrolls. Marks light up once the fill reaches them.
 * Reduced motion shows the line full and every mark lit.
 */
export function PhaseTrack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const marks = Array.from(root.querySelectorAll<HTMLElement>(".phase__mark"));
    if (marks.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let top = 0, len = 1;
    let stops: number[] = [];

    const measure = () => {
      const base = root.getBoundingClientRect().top;
      const centers = marks.map((m) => {
        const r = m.getBoundingClientRect();
        return r.top - base + r.height / 2;
      });
      top = centers[0];
      len = Math.max(1, centers[centers.length - 1] - top);
      stops = centers.map((c) => (c - top) / len);
      root.style.setProperty("--track-top", `${top}px`);
      root.style.setProperty("--track-len", `${len}px`);
    };
    const update = () => {
      raf = 0;
      const base = root.getBoundingClientRect().top;
      const fill = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.55 - base - top) / len));
      root.style.setProperty("--track-fill", fill.toFixed(4));
      marks.forEach((m, i) => m.classList.toggle("is-lit", fill >= stops[i] - 0.001));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update();
    root.classList.add("is-live");
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    if (!reduced) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="phase-track" ref={ref}>
      <div className="phase-track__line" aria-hidden="true">
        <span className="phase-track__fill" />
      </div>
      {children}
    </div>
  );
}
