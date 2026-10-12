"use client";

/**
 * "Skip to plans": jumps straight to the pricing table. The camera is told to
 * snap to the new scroll position, so it doesn't race through every world.
 */
export function SkipToPlans({ label }: { label: string }) {
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("pricing");
    if (!target) return; // let the plain anchor do its job
    e.preventDefault();
    target.scrollIntoView({ block: "start" });
    window.dispatchEvent(new Event("strix:snap"));
    const heading = document.getElementById("pricing-title");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    history.replaceState(null, "", "#pricing");
  };
  return (
    <a className="hero__skip" href="#pricing" onClick={go}>
      {label}
      <span className="hero__skip-arrow" aria-hidden="true" />
    </a>
  );
}
