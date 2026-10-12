"use client";

import { useEffect } from "react";

/**
 * Scroll-in entrances for interior pages. Elements opt in with
 * `data-reveal` (optionally `data-reveal="2"` for a stagger step).
 *
 * Content is visible by default: the hidden state only applies once this
 * script has added `js-reveal` to <html>, and never with reduced motion.
 * Anything already on screen at mount is shown straight away (no entrance).
 */
export function RevealScope() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    const vh = window.innerHeight;
    const pending: HTMLElement[] = [];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("is-in", "is-static");
      else {
        const step = parseInt(el.dataset.reveal || "0", 10);
        if (step) el.style.setProperty("--reveal-i", String(step));
        pending.push(el);
      }
    }
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    pending.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      // reveal anything left so nothing stays hidden after navigation
      pending.forEach((el) => el.classList.add("is-in"));
    };
  }, []);
  return null;
}
