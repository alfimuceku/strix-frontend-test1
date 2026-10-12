"use client";

import { useRef } from "react";

const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * Native <details> (works without JS and with every assistive tech), with the
 * answer's height animated on open and close. Reduced motion stays instant.
 */
export function FaqItem({ q, a, open }: { q: string; a: string; open?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);

  const onClick = (e: React.MouseEvent) => {
    const d = ref.current, b = body.current;
    if (!d || !b || typeof b.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    const closing = d.open && !d.classList.contains("is-closing");
    const from = b.getBoundingClientRect().height;
    anim.current?.cancel();
    if (closing) {
      d.classList.add("is-closing");
      anim.current = b.animate([{ height: `${from}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 320, easing: EASE });
      anim.current.onfinish = () => {
        d.open = false;
        d.classList.remove("is-closing");
        anim.current = null;
      };
    } else {
      d.classList.remove("is-closing");
      d.open = true;
      const to = b.scrollHeight;
      anim.current = b.animate([{ height: `${d.open && from ? from : 0}px`, opacity: 0.2 }, { height: `${to}px`, opacity: 1 }], { duration: 380, easing: EASE });
      anim.current.onfinish = () => (anim.current = null);
    }
  };

  return (
    <details ref={ref} className="faq__item" open={open}>
      <summary onClick={onClick}>
        <span className="faq__q">{q}</span>
        <span className="faq__icon" aria-hidden="true" />
      </summary>
      <div className="faq__a" ref={body}>
        <p>{a}</p>
      </div>
    </details>
  );
}
