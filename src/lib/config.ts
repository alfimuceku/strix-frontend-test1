/**
 * Site configuration.
 *
 * The new site owns the Sign in and Start-an-evaluation pages. Payment and
 * authentication still run on the existing platform, so those two forms hand
 * the visitor over to it. Point the handoff URLs at production when ready.
 */
export const SITE_URL = "https://strixoptionsfunding.com";

/** Existing checkout; the plan key (e.g. "strix_50k") is appended. */
export const PAYMENT_HANDOFF_URL = "https://lambent-marigold-422b20.netlify.app/#/checkout#";
/** Existing dashboard login. */
export const AUTH_HANDOFF_URL = "https://lambent-marigold-422b20.netlify.app/#/login";
export const AFFILIATES_URL = "https://lambent-marigold-422b20.netlify.app/#/affiliates";

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
