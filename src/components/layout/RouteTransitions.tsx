"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type ViewTransitionDoc = Document & {
  startViewTransition?: (
    update: () => Promise<void> | void
  ) => { finished: Promise<void> };
};

/** Maximum time to wait for a route transition. */
const MAX_WAIT = 1200;

/**
 * STRIX route transitions.
 *
 * On GitHub Pages:
 * - Use normal browser navigation.
 * - Prevent duplicated repository base paths.
 * - Keep all page animations and styling.
 *
 * On other environments:
 * - Preserve the original animated route transitions.
 * - Respect reduced-motion preferences.
 * - Allow normal external links and modified clicks.
 */
export function RouteTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const arrived = useRef<(() => void) | null>(null);

  // Resolve a pending transition when the new route renders.
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;

    const root = document.documentElement;

    if (root.dataset.route === "out") {
      root.dataset.route = "in";

      const timer = window.setTimeout(() => {
        delete root.dataset.route;
      }, 700);

      return () => window.clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const onClick = (e: MouseEvent) => {
      /**
       * FIX FOR GITHUB PAGES
       *
       * GitHub Pages hosts this mockup under:
       * /strix-frontend-test1/
       *
       * Next.js router.push() can automatically apply the
       * configured basePath.
       *
       * Passing an already-prefixed URL may therefore
       * duplicate the repository path.
       *
       * Let the browser handle links normally on GitHub Pages.
       */
      if (window.location.hostname.endsWith(".github.io")) {
        return;
      }

      // Respect reduced-motion settings and modified clicks.
      if (
        reduced.matches ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target;

      if (!(target instanceof Element)) {
        return;
      }

      const a = target.closest("a");

      if (
        !a ||
        !a.href ||
        (a.target && a.target !== "_self") ||
        a.hasAttribute("download")
      ) {
        return;
      }

      const url = new URL(a.href, window.location.href);

      // Ignore external links and same-page navigation.
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      ) {
        return;
      }

      e.preventDefault();

      const href = url.pathname + url.search + url.hash;

      const doc = document as ViewTransitionDoc;

      if (doc.startViewTransition) {
        doc.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              const done = () => {
                window.clearTimeout(timer);
                resolve();
              };

              const timer = window.setTimeout(
                done,
                MAX_WAIT
              );

              arrived.current = done;

              router.push(href);
            })
        );
      } else {
        const root = document.documentElement;

        root.dataset.route = "out";

        // Remove the overlay if navigation does not complete.
        window.setTimeout(() => {
          if (root.dataset.route === "out") {
            delete root.dataset.route;
          }
        }, MAX_WAIT);

        router.push(href);
      }
    };

    // Capture clicks before Next.js Link handlers.
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [router]);

  return (
    <div className="route-veil" aria-hidden="true">
      <span className="route-veil__aperture" />
    </div>
  );
}
