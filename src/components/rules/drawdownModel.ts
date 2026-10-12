import { FUNDED, planFor, type ProgramId } from "@/lib/data";

export type Phase = "evaluation" | "funded";

export const DAYS = 6;
export const TICKS = 6; // samples per trading day

/** Illustrative equity path in units of the profit target (eval) — rises with intraday spikes and dips. */
const PATH = [
  0, 0.06, 0.12, 0.08, 0.15, 0.1, 0.13,
  0.2, 0.28, 0.18, 0.22, 0.19, 0.24,
  0.3, 0.38, 0.45, 0.34, 0.36, 0.33,
  0.4, 0.5, 0.46, 0.55, 0.62, 0.52,
  0.58, 0.66, 0.6, 0.72, 0.78, 0.74,
  0.82, 0.88, 0.85, 0.94, 0.98, 1.02,
];

export interface DrawdownModel {
  balance: number;
  drawdown: number;
  intraday: boolean;
  /** Profit target (evaluation) or the lock level (funded). */
  line: number;
  equity: number[];
  floor: number[];
  /** Sample index at which the funded floor locks, or -1. */
  lockAt: number;
}

export function buildModel(program: ProgramId, phase: Phase): DrawdownModel {
  const plan = planFor(program, "50k");
  const funded = FUNDED.find((f) => f.size === "50k")!;
  const { balance, trailingDrawdown: dd } = plan;
  const intraday = plan.drawdownMode === "Intraday";
  // funded: same shape, scaled so the peak clears the lock level comfortably
  const scale = phase === "evaluation" ? plan.profitTarget : dd * 2.4;
  const equity = PATH.map((g) => Math.round(balance + g * scale));
  const lockLevel = funded.drawdownLocksAt;

  const floor: number[] = [];
  let peak = balance;
  let closePeak = balance;
  let lockAt = -1;
  equity.forEach((e, i) => {
    peak = Math.max(peak, e);
    // end of day: the Strix floor catches up with the best close
    if (i > 0 && i % TICKS === 0) closePeak = Math.max(closePeak, e);
    let f = (intraday ? peak : closePeak) - dd;
    if (phase === "funded" && f >= lockLevel) {
      f = lockLevel;
      if (lockAt < 0) lockAt = i;
    }
    floor.push(f);
  });

  return { balance, drawdown: dd, intraday, line: phase === "evaluation" ? balance + plan.profitTarget : lockLevel, equity, floor, lockAt };
}
