"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type ViewTransitionDoc = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void> };
};

/** Never hold a navigation hostage: the transition gives up waiting after this long. */
const MAX_WAIT = 1200;

/**
 * Aperture route transition: the next page opens out of a square in the
 * middle of the screen, echoing the X's portal.
 *
 * - Browsers with the View Transitions API animate real snapshots of both pages.
 * - Others get a light CSS overlay (html[data-route]); navigation is never delayed.
 * - Reduced motion, modified clicks, new tabs, downloads, external links, same-page
 *   and hash links are left alone, and back/forward is never intercepted.
 */
export function RouteTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const arrived = useRef<(() => void) | null>(null);

  // resolve the pending transition once the new route has rendered
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
    const root = document.documentElement;
    if (root.dataset.route === "out") {
      root.dataset.route = "in";
      const t = window.setTimeout(() => delete root.dataset.route, 700);
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onClick = (e: MouseEvent) => {
      if (reduced.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;

      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      const doc = document as ViewTransitionDoc;
      if (doc.startViewTransition) {
        doc.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              // (no rAF here: rendering is paused while a view transition updates the DOM)
              const done = () => {
                window.clearTimeout(timer);
                resolve();
              };
              const timer = window.setTimeout(done, MAX_WAIT);
              arrived.current = done;
              router.push(href);
            }),
        );
      } else {
        const root = document.documentElement;
        root.dataset.route = "out";
        // if the route never changes (redirect back, aborted push), don't leave the veil up
        window.setTimeout(() => root.dataset.route === "out" && delete root.dataset.route, MAX_WAIT);
        router.push(href);
      }
    };
    // capture phase: runs before next/link, which then sees defaultPrevented and stands down
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <div className="route-veil" aria-hidden="true">
      <span className="route-veil__aperture" />
    </div>
  );
}
