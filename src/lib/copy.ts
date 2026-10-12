/**
 * Page copy, word for word from the current Strix Options site
 * (https://lambent-marigold-422b20.netlify.app). Edit wording here only.
 */
import { PROMO } from "./config";

export const PRICING_COPY = {
  title: "Pick your account. Start today.",
  lede:
    "One evaluation, one fee. Pass it and you trade our capital. Strix plans allow every options strategy; Express plans are cheaper and trade long calls and puts only.",
  saveLine: `Save ${PROMO.percent}% at checkout`,
  copy: "Copy",
  strixSub: "Every strategy. Overnight holds allowed.",
  expressSub: "Lower price. Long premium only.",
  popular: "Most popular",
  oneTime: "one-time",
  promoLine: `${PROMO.percent}% off with code ${PROMO.code}`,
  footer: "All prices are one-time. Full rules for every phase are on the",
  footerLink: "Rules page",
};

export const PROMO_BANNER = {
  headline: `${PROMO.percent}% off every evaluation`,
  detail: `Use code ${PROMO.code} at checkout. Ends soon.`,
  link: "See plans →",
};

export const NO_SURPRISES = {
  title: "No surprises on price",
  months: [
    { label: "Month 3", value: "Nothing due" },
    { label: "Month 2", value: "Nothing due" },
  ],
  body: "paid once. The activation fee is published before you buy. No subscriptions, no rebills.",
  bodyStrong: "One evaluation fee",
};

export const RULES_COPY = {
  kicker: "Rules",
  title: "Trading rules, phase by phase",
  lede: "Every rule and exactly what it takes to get paid. Same numbers as your dashboard.",
  chips: ["No deadlines", "No consistency rule", "Overnight holds allowed", "80 / 20 split", "One-time fee"],
  evaluation: {
    name: "Evaluation",
    line: "One target. Zero deadlines.",
    body:
      "Hit the profit target and the account moves up to Funded. There is no clock and no required day count. The drawdown floor trails upward behind your equity peak; touch it and the account closes. Strix floors move once a day at the close; Express floors follow your peak in real time.",
    floorUpdate: "Strix: end of day · Express: intraday",
    redemptionTitle: "Evaluation redemption (Strix only)",
    redemption:
      "Breach the drawdown during Evaluation and you can buy one Redemption for $39 within 24 hours. The same account keeps trading: your balance is set back to the drawdown level with +1.5% of fresh room on top. Not offered on Express.",
  },
  funded: {
    name: "Funded",
    line: "Follow the rules. Bank payouts.",
    body:
      "Activation resets the trailing drawdown. The floor trails your peak until it reaches your starting balance, then locks for good. You keep 80% of profits. Each payout cycle needs 8 qualifying winning days (a day closing with realized profit at or above the floor below), in any order, and a single payout can draw up to 50% of profits, limited by the cap for that payout number.",
    legacy:
      "Accounts bought before 11 September 2026, 5:35 PM ET keep the rules they were sold (Max Daily Gain instead of winning days). Your Payouts page shows which applies to you.",
  },
  live: {
    name: "Live",
    line: "Firm capital. Withdraw it all.",
    body:
      "Real firm buying power sits behind your trades. The 80/20 split continues, withdrawals have no caps and a $100 minimum, and there is no winning-day requirement.",
    note: "Live is not offered on $10K accounts.",
  },
  everyPlanTitle: "Rules for every plan",
  everyPlan: [
    {
      title: "Overnight holding",
      body: "Every account in every phase can hold positions overnight. The only forced flatten is a position expiring that day, closed automatically at 4pm ET.",
    },
    {
      title: "One-time evaluation fee",
      body: "Strix: $179 / $299 / $419 / $569. Express: $119 / $179 / $229 / $339. One payment, no renewals, and evaluations never expire.",
    },
    {
      title: "Funded activation fee",
      body: "$69 (10K), $89 (25K), $119 (50K), $149 (100K), charged once when you activate the funded account. It is never deducted from payouts.",
    },
    {
      title: "Strategies",
      body: "Strix plans carry Level 5 approval: undefined risk allowed, every spread and multi-leg structure. Express plans trade long premium only: single-leg calls and puts, bought to open.",
    },
    {
      title: "Approved tickers",
      body: "Options can only be traded on approved symbols. Orders on any other ticker are blocked automatically.",
      linkText: "See the whitelist",
      tail: " or email support to request a symbol.",
    },
    {
      title: "Payout balance rule",
      body: "After your first payout, your balance at request time must sit at least $1 above the balance you last requested at, less anything the cap held back. The same profit never funds two payouts.",
    },
  ],
  ctaPrimary: "Start an evaluation",
  ctaSecondary: "Open the FAQ",
};

export const PAYOUTS_COPY = {
  kicker: "Payout wall",
  title: "Real payouts. Receipts included.",
  lede:
    "Every payout that is approved and paid is posted here with the trader certificate. Surnames are covered for privacy, nothing else. This wall shows the last 7 days.",
  emptyTitle: "The first payouts land here",
  emptyBody: "Every payout we approve is posted automatically with the certificate attached. Nothing to show just yet, check back shortly.",
  howTitle: "How payouts work",
  how: [
    { label: "Split", title: "80% is yours", body: "The firm keeps 20%. The activation fee is paid once upfront, so nothing is ever taken from a payout." },
    { label: "Cycle", title: "8 winning days", body: "A cycle needs 8 days that close with realized profit at or above your plan's floor. Any order; losing or flat days never reset it." },
    { label: "Caps", title: "Caps that grow", body: "Each payout can draw up to 50% of profits, limited by a cap that rises with every payout. Live accounts have no caps." },
  ],
  fine: "Figures show what is paid to the trader after the 80/20 split. Past payouts are not a prediction of future results.",
  ctaPrimary: "Start an evaluation",
  ctaSecondary: "Read the rules",
};

export const FAQ_COPY = {
  kicker: "FAQ",
  title: "Questions, answered plainly",
  lede: "The short version of everything traders ask before they start.",
  items: [
    {
      q: "What is Strix Options?",
      a: "A prop firm built for options trading. You pass a simulated evaluation, then trade our capital and keep 80% of the profits. We are not a brokerage and do not hold customer funds.",
    },
    {
      q: "How much does it cost?",
      a: `A single one-time evaluation fee: Strix $179 to $569, Express $119 to $339, currently ${PROMO.percent}% off with code ${PROMO.code}. When you pass, one activation fee ($69 to $149) opens the funded account. No monthly billing.`,
    },
    {
      q: "Strix or Express?",
      a: "Strix allows every options strategy (Level 5), uses an end-of-day trailing drawdown and includes a $39 redemption if you breach. Express is cheaper, trades long calls and puts only, and uses an intraday drawdown.",
    },
    {
      q: "Is there a time limit or minimum days?",
      a: "No. Evaluations never expire and there is no minimum day count. Hit the profit target before touching the drawdown and you are funded.",
    },
    { q: "Can I hold overnight?", a: "Yes, in every phase. Positions expiring that day are closed automatically at 4pm ET." },
    {
      q: "How do payouts work?",
      a: "You keep 80%. Each payout cycle needs 8 qualifying winning days, and each payout can draw up to 50% of profits, limited by a cap that rises with every payout. Full tables are on the Rules and Payouts pages.",
    },
    {
      q: "Which tickers can I trade?",
      a: "Only approved symbols. Orders on any other ticker are blocked. The whitelist is linked in the footer.",
    },
    {
      q: "How do I reach support?",
      a: "Email support@strixoptionsfunding.com or join the Discord. Replies usually land within 8 hours.",
    },
  ],
  ctaPrimary: "Start an evaluation",
  ctaSecondary: "Still have a question?",
};

export const CONTACT_COPY = {
  kicker: "Contact",
  title: "Talk to Strix",
  lede: "Wondering about a plan, a rule, or your account? Ask away. A real person typically answers inside 8 hours.",
  emailTitle: "Email the team",
  emailSub: "Answers usually land within 8 hours.",
  copy: "Copy",
  copied: "Copied",
  yourEmail: "Your email",
  message: "Message",
  send: "Send message",
  discordTitle: "Trader Hub on Discord",
  discordBody: "Live chat, fellow traders, and announcements the second they drop.",
  discordCta: "Join Discord",
  followTitle: "Follow Strix",
  officeTitle: "Office",
};

export const CHECKOUT_COPY = {
  kicker: "Checkout",
  title: "Start your evaluation",
  lede: "One fee, paid once. Your dashboard login is created as soon as payment clears.",
  rows: { target: "Profit target", drawdown: "Trailing drawdown", strategies: "Strategies", activation: "Funded activation" },
  changePlan: "Change plan",
  email: "Email address",
  first: "First name",
  last: "Last name",
  promo: "Promo code",
  agreePre: "I have read the",
  agreeRules: "rules",
  agreeMid: "and the",
  agreeTerms: "terms",
  submit: "Continue to payment",
  fine: "Payment is processed on the next step. You can switch between Strix and Express plans until then.",
};

export const SIGNIN_COPY = {
  title: "Welcome back",
  lede: "Sign in to your Strix dashboard to trade, track your evaluation and request payouts.",
  email: "Email address",
  password: "Password",
  keep: "Keep me signed in",
  reset: "Reset password",
  submit: "Sign In",
  or: "Or continue with",
  google: "Continue with Google",
  newTo: "New to Strix?",
  start: "Start an evaluation",
  panelKicker: "Strix Options® dashboard",
  panelTitle: "Trade options with firm capital. Keep 80% of what you earn.",
  points: [
    { value: "80 / 20", label: "profit split once funded" },
    { value: "<10ms", label: "multi-leg fills" },
    { value: "14 days", label: "between payout requests" },
  ],
  quotes: [
    { initial: "J", name: "Jordan", plan: "$50K Strix · Funded", text: "Passed the eval in three weeks holding spreads overnight. First payout landed on time." },
    { initial: "A", name: "Ana", plan: "$25K Express · Funded", text: "No consistency rule means one good day actually counts. Support answered within the hour." },
    { initial: "M", name: "Marcus", plan: "$100K Strix · Live", text: "Fills on multi-leg orders are consistent, which is the whole point for an options trader." },
  ],
};

export const LEGAL_COPY = {
  kicker: "Legal",
  title: "Terms and policies",
  lede: "The documents that govern every Strix account. Each section is summarised here; the full text is provided at checkout and in your dashboard.",
  sections: [
    {
      id: "terms",
      title: "Terms of Service",
      body: "Strix Options LLC provides simulated trading evaluations. Passing an evaluation grants access to a funded simulated account under the rules published on the Rules page. No brokerage services are provided and no customer funds are held. Fees are one-time and non-refundable once an evaluation has begun.",
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      body: "We collect the information needed to run your account: name, email, payout details and trading activity on the platform. We do not sell personal data. Analytics is limited to first-party usage data. You can request deletion of your account data at any time by contacting support.",
    },
    {
      id: "sms",
      title: "SMS Terms",
      body: "By opting in you agree to receive account, sale and payout notifications by text message. Message frequency varies. Reply STOP to cancel at any time and HELP for help. Message and data rates may apply.",
    },
    {
      id: "rewards",
      title: "Rewards Terms",
      body: "Affiliate commissions and giveaways are paid on completed, non-refunded evaluations only. Self-referrals and coupon-stacking are not permitted. Rewards are paid on the regular payout cycle and may be withheld where fraud is suspected.",
    },
  ],
};
