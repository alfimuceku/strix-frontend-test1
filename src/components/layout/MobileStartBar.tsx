"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SIGN_IN_PATH, START_PATH } from "@/lib/config";

const HIDDEN_ON = [START_PATH, SIGN_IN_PATH];

/**
 * Phones only: a slim sticky "Start an evaluation" bar. It is left out on the
 * start and sign-in pages, and steps aside while the mobile menu is open (CSS,
 * via html.nav-open). html[data-startbar] lets other layouts make room for it.
 */
export function MobileStartBar() {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.includes(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-startbar", !hidden);
    return () => root.removeAttribute("data-startbar");
  }, [hidden]);

  if (hidden) return null;
  return (
    <div className="start-bar">
      <Link href={START_PATH} className="btn btn--primary btn--md btn--block">
        <span className="btn__aperture" aria-hidden="true" />
        <span className="btn__label">Start an evaluation</span>
      </Link>
    </div>
  );
}
