/**
 * Options payoff math for the terminal's strategy lab.
 * All prices are ILLUSTRATIVE — they echo the sample chain on the current Strix
 * site (SPY ≈ 687.83) and are not market data.
 */
export type Leg = { side: "buy" | "sell"; type: "call" | "put"; strike: number; premium: number; qty?: number };

export interface Strategy {
  id: string;
  name: string;
  thesis: string;
  legs: Leg[];
  requires: "Strix" | "Strix or Express";
}

export const SPOT = 687.83;

export const STRATEGIES: Strategy[] = [
  {
    id: "condor",
    name: "Iron condor",
    thesis: "Collect premium while SPY stays between the short strikes.",
    legs: [
      { side: "buy", type: "put", strike: 685, premium: 2.87 },
      { side: "sell", type: "put", strike: 688, premium: 4.22 },
      { side: "sell", type: "call", strike: 692, premium: 0.62 },
      { side: "buy", type: "call", strike: 695, premium: 0.17 },
    ],
    requires: "Strix",
  },
  {
    id: "bullcall",
    name: "Bull call spread",
    thesis: "Defined-risk upside: long the 686 call, short the 690.",
    legs: [
      { side: "buy", type: "call", strike: 686, premium: 2.4 },
      { side: "sell", type: "call", strike: 690, premium: 0.6 },
    ],
    requires: "Strix",
  },
  {
    id: "shortput",
    name: "Short put",
    thesis: "Get paid to wait: theta works every day, overnight included.",
    legs: [{ side: "sell", type: "put", strike: 684, premium: 1.05 }],
    requires: "Strix",
  },
  {
    id: "straddle",
    name: "Long straddle",
    thesis: "Own the move in either direction around 688.",
    legs: [
      { side: "buy", type: "call", strike: 688, premium: 2.1 },
      { side: "buy", type: "put", strike: 688, premium: 1.9 },
    ],
    requires: "Strix",
  },
  {
    id: "longcall",
    name: "Long call",
    thesis: "Single-leg long premium, the Express playbook.",
    legs: [{ side: "buy", type: "call", strike: 690, premium: 0.95 }],
    requires: "Strix or Express",
  },
];

const MULT = 100;

function legValue(l: Leg, S: number) {
  const intrinsic = l.type === "call" ? Math.max(0, S - l.strike) : Math.max(0, l.strike - S);
  const sign = l.side === "buy" ? 1 : -1;
  return sign * (intrinsic - l.premium) * MULT * (l.qty ?? 1);
}

export const payoff = (s: Strategy, S: number) => s.legs.reduce((a, l) => a + legValue(l, S), 0);

export function netPremium(s: Strategy) {
  // positive = credit received
  return s.legs.reduce((a, l) => a + (l.side === "sell" ? 1 : -1) * l.premium * MULT * (l.qty ?? 1), 0);
}

export function analyse(s: Strategy, lo: number, hi: number) {
  const N = 1200;
  let max = -Infinity, min = Infinity;
  const be: number[] = [];
  let prev = payoff(s, lo);
  for (let i = 0; i <= N; i++) {
    const S = lo + ((hi - lo) * i) / N;
    const v = payoff(s, S);
    if (v > max) max = v;
    if (v < min) min = v;
    if (i > 0 && Math.sign(v) !== Math.sign(prev) && v !== 0) {
      const S0 = lo + ((hi - lo) * (i - 1)) / N;
      be.push(S0 + ((S - S0) * -prev) / (v - prev));
    }
    prev = v;
  }
  // upside is unbounded if the payoff still slopes past the window; downside stops at S = 0,
  // where a put's payoff is linear down to, so that end is evaluated exactly
  const slopeHi = payoff(s, hi + 1) - payoff(s, hi);
  const atZero = payoff(s, 0);
  return {
    maxProfit: slopeHi > 0.5 ? Infinity : Math.max(max, atZero),
    maxLoss: slopeHi < -0.5 ? -Infinity : Math.min(min, atZero),
    breakevens: be,
  };
}

/** Illustrative SPY chain rows (from the current Strix site sample). */
export const CHAIN = [
  { strike: 691, mid: 0.02, delta: 0.03, theta: -0.37, iv: 11.9, vol: "39.0K" },
  { strike: 690, mid: 0.08, delta: 0.1, theta: -0.96, iv: 11.9, vol: "82.7K" },
  { strike: 689, mid: 0.24, delta: 0.24, theta: -1.76, iv: 11.9, vol: "30.3K" },
  { strike: 688, mid: 0.58, delta: 0.46, theta: -2.21, iv: 11.7, vol: "65.5K" },
  { strike: 687, mid: 1.16, delta: 0.7, theta: -1.97, iv: 11.7, vol: "119.5K" },
  { strike: 686, mid: 1.95, delta: 0.87, theta: -1.26, iv: 11.8, vol: "86.5K" },
  { strike: 685, mid: 2.87, delta: 0.96, theta: -0.59, iv: 11.8, vol: "21.5K" },
];

/**
 * Deterministic illustrative equity path for the drawdown monitor, expressed
 * in units of the plan's drawdown allowance so every account size looks alike.
 */
export function illustrativePath(days = 34, seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: number[] = [0];
  let x = 0;
  for (let i = 1; i < days; i++) {
    const drift = 0.075;
    const shock = (rnd() - 0.5) * 0.62 + (rnd() - 0.5) * 0.3;
    x += drift + shock;
    if (i === 9) x -= 0.5; // a bad day, to show the floor doing its job
    if (i === 21) x -= 0.35;
    out.push(x);
  }
  return out;
}
