import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "quiet";
  size?: "md" | "lg";
  className?: string;
}

/**
 * Button with an "aperture" hover: an inner square frame — the X's portal —
 * opens out to the button edge.
 */
export function Button({ href, children, variant = "primary", size = "md", className = "" }: Props) {
  const cls = `btn btn--${variant} btn--${size} ${className}`.trim();
  const inner = (
    <>
      <span className="btn__aperture" aria-hidden="true" />
      <span className="btn__label">{children}</span>
    </>
  );
  const external = /^https?:|^mailto:/.test(href);
  if (external) {
    return (
      <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
