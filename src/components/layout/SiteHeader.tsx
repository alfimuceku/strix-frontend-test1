"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SIGN_IN_PATH, START_PATH } from "@/lib/config";
import { Wordmark } from "@/components/ui/Wordmark";
import { Button } from "@/components/ui/Button";

// GitHub Pages repository path
const BASE_PATH = "/strix-frontend-test1";

// Generate correct URLs for GitHub Pages
function mockupHref(path: string) {
  return `${BASE_PATH}${path === "/" ? "/" : `${path}/`}`;
}

export function SiteHeader() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("nav-open", open);

    if (!open) return;

    // Keep keyboard focus inside the mobile menu
    const behind = document.querySelectorAll<HTMLElement>(
      "#main, .site-footer, .start-bar"
    );

    behind.forEach((el) => {
      el.inert = true;
    });

    navRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      setOpen(false);
      toggleRef.current?.focus();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      behind.forEach((el) => {
        el.inert = false;
      });

      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${
        open ? " is-open" : ""
      }`}
    >
      {/* Skip navigation */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="site-header__bar">
        {/* Logo */}
        <a
          href={mockupHref("/")}
          className="site-header__brand"
          aria-label="Strix Options, home"
        >
          <Wordmark />

          <span className="site-header__brand-sub">
            Options
          </span>
        </a>

        {/* Desktop navigation */}
        <nav className="site-nav" aria-label="Primary">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={mockupHref(n.href)}
                  aria-current={
                    pathname === n.href ? "page" : undefined
                  }
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Header actions */}
        <div className="site-header__actions">
          <a
            className="site-header__signin"
            href={mockupHref(SIGN_IN_PATH)}
            aria-current={
              pathname === SIGN_IN_PATH ? "page" : undefined
            }
          >
            Sign in
          </a>

          <Button href={START_PATH} size="md">
            Start an evaluation
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            ref={toggleRef}
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span
              className="menu-toggle__box"
              aria-hidden="true"
            >
              <span />
              <span />
            </span>

            <span className="sr-only">
              {open ? "Close menu" : "Open menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-nav"
        ref={navRef}
        className="mobile-nav"
        hidden={!open}
      >
        <nav aria-label="Mobile">
          <ol>
            {[{ href: "/", label: "Home" }, ...NAV].map(
              (n) => (
                <li key={n.href}>
                  <a
                    href={mockupHref(n.href)}
                    aria-current={
                      pathname === n.href
                        ? "page"
                        : undefined
                    }
                  >
                    {n.label}
                  </a>
                </li>
              )
            )}
          </ol>
        </nav>

        {/* Mobile actions */}
        <div className="mobile-nav__actions">
          <Button href={START_PATH} size="lg">
            Start an evaluation
          </Button>

          <Button
            href={SIGN_IN_PATH}
            variant="ghost"
            size="lg"
          >
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
