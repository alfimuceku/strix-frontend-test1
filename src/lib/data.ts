/**
 * Product data, transcribed from the current Strix Options site
 * (Rules, Payouts, FAQ, Contact pages). Keep this file as the single source
 * of truth: every table and calculator on the site reads from it.
 */
import { PAYMENT_HANDOFF_URL, PROMO, START_PATH } from "./config";

export type ProgramId = "strix" | "express";
export type SizeId = "10k" | "25k" | "50k" | "100k";

export const SIZES: { id: SizeId; label: string; balance: number }[] = [
  { id: "10k", label: "$10K", balance: 10_000 },
  { id: "25k", label: "$25K", balance: 25_000 },
  { id: "50k", label: "$50K", balance: 50_000 },
  { id: "100k", label: "$100K", balance: 100_000 },
];

export interface PlanSpec {
  program: ProgramId;
  size: SizeId;
  balance: number;
  price: number; // one-time evaluation fee, USD
  profitTarget: number;
  trailingDrawdown: number;
  drawdownMode: "End of day" | "Intraday";
  strategies: string;
  overnight: string;
  consistency: string;
  activationFee: number;
  redemption: string;
  popular?: boolean;
  checkoutKey: string;
}

const ACTIVATION: Record<SizeId, number> = { "10k": 69, "25k": 89, "50k": 119, "100k": 149 };

const STRIX_PRICE: Record<SizeId, number> = { "10k": 179, "25k": 299, "50k": 419, "100k": 569 };
const EXPRESS_PRICE: Record<SizeId, number> = { "10k": 119, "25k": 179, "50k": 229, "100k": 339 };

export const PROGRAMS: Record<ProgramId, { name: string; summary: string; detail: string }> = {
  strix: {
    name: "Strix",
    summary: "Every strategy. Overnight holds allowed.",
    detail:
      "Level 5 permissions: undefined risk allowed, every spread and multi-leg structure. End-of-day trailing drawdown and a $39 redemption if you breach.",
  },
  express: {
    name: "Express",
    summary: "Lower price. Long premium only.",
    detail:
      "Single-leg calls and puts, bought to open. Intraday trailing drawdown. Cheaper to start; no redemption.",
  },
};

export const PLANS: PlanSpec[] = SIZES.flatMap(({ id, balance }) => [
  {
    program: "strix" as const,
    size: id,
    balance,
    price: STRIX_PRICE[id],
    profitTarget: balance * 0.12,
    trailingDrawdown: balance * 0.06,
    drawdownMode: "End of day" as const,
    strategies: "All, Level 5",
    overnight: "Allowed",
    consistency: "None",
    activationFee: ACTIVATION[id],
    redemption: "Yes, $39",
    popular: id === "50k",
    checkoutKey: `strix_${id}`,
  },
  {
    program: "express" as const,
    size: id,
    balance,
    price: EXPRESS_PRICE[id],
    profitTarget: balance * 0.08,
    trailingDrawdown: balance * 0.03,
    drawdownMode: "Intraday" as const,
    strategies: "Long calls & puts",
    overnight: "Allowed",
    consistency: "None",
    activationFee: ACTIVATION[id],
    redemption: "No",
    popular: id === "50k",
    checkoutKey: `express_${id}`,
  },
]);

export const planFor = (program: ProgramId, size: SizeId) =>
  PLANS.find((p) => p.program === program && p.size === size)!;

/** Link to the Start-an-evaluation page with this plan preselected. */
export const checkoutHref = (p: PlanSpec) => `${START_PATH}?plan=${p.checkoutKey}`;
/** The existing payment step this site hands over to. */
export const paymentHandoff = (p: PlanSpec) => `${PAYMENT_HANDOFF_URL}${p.checkoutKey}`;
export const planByKey = (key: string | null | undefined) => PLANS.find((p) => p.checkoutKey === key);

/** Price after the running promotion (unchanged when no promotion is active). */
export const salePrice = (p: PlanSpec) => (PROMO.active ? Math.round(p.price * (100 - PROMO.percent)) / 100 : p.price);
/** Drawdown as the site writes it: "$600 EOD" / "$300 intraday". */
export const drawdownLabel = (p: PlanSpec) =>
  `${usd(p.trailingDrawdown)} ${p.drawdownMode === "End of day" ? "EOD" : "intraday"}`;
/** Money with cents only when needed: $89.50, $179. */
export const price = (n: number) => usd(n, Number.isInteger(n) ? 0 : 2);

/* Funded phase */
export interface FundedSpec {
  size: SizeId;
  split: string;
  activationFee: number;
  payoutMinimum: number;
  winningDays: number;
  qualifyingDay: number;
  caps: [number, number, number, number]; // payout #1..#4 (#4 applies to Strix plans)
  drawdownLocksAt: number;
}

export const FUNDED: FundedSpec[] = [
  { size: "10k", split: "80 / 20", activationFee: 69, payoutMinimum: 250, winningDays: 8, qualifyingDay: 100, caps: [1000, 1500, 2000, 2500], drawdownLocksAt: 10_000 },
  { size: "25k", split: "80 / 20", activationFee: 89, payoutMinimum: 500, winningDays: 8, qualifyingDay: 100, caps: [1000, 1500, 2000, 3000], drawdownLocksAt: 25_000 },
  { size: "50k", split: "80 / 20", activationFee: 119, payoutMinimum: 1000, winningDays: 8, qualifyingDay: 150, caps: [1000, 1500, 2000, 3000], drawdownLocksAt: 50_000 },
  { size: "100k", split: "80 / 20", activationFee: 149, payoutMinimum: 2000, winningDays: 8, qualifyingDay: 200, caps: [2000, 3000, 4000, 6000], drawdownLocksAt: 100_000 },
];

/* Live phase */
export const LIVE: { size: SizeId; capital: number; drawdown: number; locksAt: number }[] = [
  { size: "25k", capital: 12_500, drawdown: 2_000, locksAt: 12_600 },
  { size: "50k", capital: 25_000, drawdown: 2_500, locksAt: 25_100 },
  { size: "100k", capital: 50_000, drawdown: 5_000, locksAt: 50_100 },
];

export const PHASES = [
  {
    id: "evaluation",
    name: "Evaluation",
    line: "One target. Zero deadlines.",
    body:
      "Hit the profit target and the account moves up to Funded. There is no clock and no required day count. The drawdown floor trails upward behind your equity peak; touch it and the account closes. Strix floors move once a day at the close; Express floors follow your peak in real time.",
  },
  {
    id: "funded",
    name: "Funded",
    line: "Follow the rules. Bank payouts.",
    body:
      "Activation resets the trailing drawdown. The floor trails your peak until it reaches your starting balance, then locks for good. You keep 80% of profits. Each payout cycle needs 8 qualifying winning days (a day closing with realized profit at or above the floor for your plan), in any order, and a single payout can draw up to 50% of profits, limited by the cap for that payout number.",
  },
  {
    id: "live",
    name: "Live",
    line: "Firm capital. Withdraw it all.",
    body:
      "Real firm buying power sits behind your trades. The 80/20 split continues, withdrawals have no caps and a $100 minimum, and there is no winning-day requirement. Live is not offered on $10K accounts.",
  },
] as const;

export const RULES_EVERY_PLAN = [
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
    body: "Options can only be traded on approved symbols. Orders on any other ticker are blocked automatically. Email support to request a symbol.",
  },
  {
    title: "Payout balance rule",
    body: "After your first payout, your balance at request time must sit at least $1 above the balance you last requested at, less anything the cap held back. The same profit never funds two payouts.",
  },
  {
    title: "Evaluation redemption (Strix only)",
    body: "Breach the drawdown during Evaluation and you can buy one Redemption for $39 within 24 hours. The same account keeps trading: your balance is set back to the drawdown level with +1.5% of fresh room on top. Not offered on Express.",
  },
];

export const LEGACY_NOTE =
  "Accounts bought before 11 September 2026, 5:35 PM ET keep the rules they were sold (Max Daily Gain instead of winning days). Your Payouts page shows which applies to you.";

/* Product facts */
export const KEY_NUMBERS = [
  { value: "$1M", label: "max funded capital" },
  { value: "<10ms", label: "order execution" },
  { value: "14 days", label: "payout cycle" },
  { value: "80%", label: "profit split, funded" },
];

export const INSTRUMENTS = [
  { name: "Equity options", body: "Single-name calls and puts on liquid U.S. stocks." },
  { name: "Index options", body: "SPX, NDX and RUT. Cash-settled, European-style, no assignment risk." },
  { name: "ETF options", body: "SPY, QQQ, IWM and the major sector ETFs." },
  { name: "Weeklies and 0-DTE", body: "Every listed expiry, down to same-day." },
  { name: "Multi-leg spreads", body: "Up to four legs in one ticket with netted margin." },
  { name: "Naked calls and puts", body: "Undefined-risk positions, allowed under Level 5 permissions." },
];

export const AUDIENCES = [
  { name: "Spread traders", body: "Verticals, iron condors and calendars. Defined risk, held to expiry if you want." },
  { name: "Premium sellers", body: "Short puts, strangles and credit spreads. Theta pays every day, including overnight." },
  { name: "Swing traders", body: "Multi-day positions through the close. There is no flat-by-4pm rule." },
  { name: "0-DTE scalpers", body: "Same-day SPX and SPY expiries with fills under 10ms on RixTrade." },
];

export const NOT_HERE = [
  { trap: "Consistency rules", other: "One big day disqualifies the cycle.", strix: "None. One good day counts." },
  { trap: "Daily loss caps", other: "Locked out until tomorrow.", strix: "None. One trailing drawdown, measured at the close." },
  { trap: "Overnight bans", other: "Force-closed at 4pm.", strix: "Hold overnight in every phase." },
  { trap: "Monthly rebills", other: "Charged again in month three.", strix: "One evaluation fee, paid once. Evaluations never expire." },
  { trap: "Flat payout caps", other: "Request $8,000, receive $2,000.", strix: "Caps rise with every payout and disappear once you go live." },
];

export const HOW_PAYOUTS_WORK = [
  { title: "80% is yours", body: "The firm keeps 20%. The activation fee is paid once upfront, so nothing is ever taken from a payout." },
  { title: "8 winning days", body: "A cycle needs 8 days that close with realized profit at or above your plan's floor. Any order; losing or flat days never reset it." },
  { title: "Caps that grow", body: "Each payout can draw up to 50% of profits, limited by a cap that rises with every payout. Live accounts have no caps." },
];

export const FAQ = [
  {
    q: "What is Strix Options?",
    a: "A prop firm built for options trading. You pass a simulated evaluation, then trade our capital and keep 80% of the profits. We are not a brokerage and do not hold customer funds.",
  },
  {
    q: "How much does it cost?",
    a: "A single one-time evaluation fee: Strix $179 to $569, Express $119 to $339. When you pass, one activation fee ($69 to $149) opens the funded account. No monthly billing. Any running promotion is applied at checkout.",
  },
  {
    q: "Strix or Express?",
    a: "Strix allows every options strategy (Level 5), uses an end-of-day trailing drawdown and includes a $39 redemption if you breach. Express is cheaper, trades long calls and puts only, and uses an intraday drawdown.",
  },
  {
    q: "Is there a time limit or minimum days?",
    a: "No. Evaluations never expire and there is no minimum day count. Hit the profit target before touching the drawdown and you are funded.",
  },
  {
    q: "Can I hold overnight?",
    a: "Yes, in every phase. Positions expiring that day are closed automatically at 4pm ET.",
  },
  {
    q: "How do payouts work?",
    a: "You keep 80%. Each payout cycle needs 8 qualifying winning days, and each payout can draw up to 50% of profits, limited by a cap that rises with every payout. Full tables are on the Rules and Payouts pages.",
  },
  {
    q: "Which tickers can I trade?",
    a: "Only approved symbols. Orders on any other ticker are blocked. Email support to request a symbol.",
  },
  {
    q: "How do I reach support?",
    a: "Email support@strixoptionsfunding.com or join the Discord. Replies usually land within 8 hours.",
  },
];

export const CONTACT = {
  email: "support@strixoptionsfunding.com",
  responseTime: "Answers usually land within 8 hours.",
  discord: "https://discord.gg/JSbAA278W8",
  x: "https://x.com/StrixOptions",
  instagram: "https://www.instagram.com/strixfunding/",
  tiktok: "https://www.tiktok.com/@strixoptions",
  trustpilot: "https://www.trustpilot.com/review/strixoptionsfunding.com",
  office: ["Strix Options LLC", "1945 Brickell Ave, Suite 800", "Miami, FL 33129"],
};

export const DISCLAIMER = [
  {
    title: "What Strix is, and what it is not.",
    body: "Strix Options LLC runs skill evaluation programs on simulated markets. We are not a brokerage, we do not hold customer funds, and we are not registered with any regulator as a broker-dealer or investment adviser. Nothing on this site amounts to investment advice, and nothing here invites or recommends trading any security or derivative. Decisions about real capital belong with you and your own licensed financial, legal, and tax professionals.",
  },
  {
    title: "Options carry serious risk.",
    body: "A contract can go to zero by expiration, sellers of uncovered contracts are exposed to losses far beyond the premium collected, and multi-leg structures can stack risks in ways that exceed the amount originally committed. What a market did yesterday, whether real or simulated, promises nothing about what it does next.",
  },
  {
    title: "About simulated results.",
    body: "Every Strix account trades a simulated market. Simulated fills never face real liquidity, real slippage, or the pressure of real money at stake. A simulated track record is an incomplete picture, and we make no claim that any trader will see outcomes resembling anything displayed on this site. Anyone considering live options trading should first read the OCC publication Characteristics and Risks of Standardized Options.",
  },
];

export const usd = (n: number, dp = 0) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
