/**
 * Site configuration.
 *
 * This is a public STRIX frontend mockup hosted on GitHub Pages.
 * Payment and authentication are disabled.
 * No connections to the real STRIX system.
 */
export const SITE_URL = "https://alfimuceku.github.io/strix-frontend-test1";

/** Payment disabled for public mockup. */
export const PAYMENT_HANDOFF_URL = "#";

/** Authentication disabled for public mockup. */
export const AUTH_HANDOFF_URL = "#";

/** Affiliates disabled for public mockup. */
export const AFFILIATES_URL = "#";

/** Internal routes */
export const START_PATH = "/start";
export const SIGN_IN_PATH = "/sign-in";

/** Running promotion. Set active: false to show list prices only. */
export const PROMO = { active: true, code: "SEPTEMBER", percent: 50 };

export const NAV = [
  { href: "/plans", label: "Plans" },
  { href: "/rules", label: "Rules" },
  { href: "/payouts", label: "Payouts" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];
