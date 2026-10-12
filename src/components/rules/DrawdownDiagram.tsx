"use client";

import { useRef, useState } from "react";
import { usd, type ProgramId } from "@/lib/data";
import { Seg } from "@/components/motion/Seg";
import { useInView } from "@/components/motion/useInView";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DAYS, TICKS, buildModel, type Phase } from "./drawdownModel";

const H = 320;
const PROGRAMS = [{ id: "strix", label: "Strix" }, { id: "express", label: "Express" }] as const;
const PHASES = [{ id: "evaluation", label: "Evaluation" }, { id: "funded", label: "Funded" }] as const;

/**
 * The trailing drawdown, drawn: equity rising, the floor following it —
 * at the close for Strix, in real time for Express — and, once funded,
 * locking at the starting balance. Draws itself when scrolled into view.
 */
export function DrawdownDiagram() {
  const [program, setProgram] = useState<ProgramId>("strix");
  const [phase, setPhase] = useState<Phase>("evaluation");
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref);
  // phones get a narrower drawing so labels stay legible
  const compact = useMediaQuery("(max-width: 760px)");
  const W = compact ? 460 : 720;
  const PAD = compact ? { l: 62, r: 96, t: 26, b: 40 } : { l: 70, r: 104, t: 26, b: 40 };
  const m = buildModel(program, phase);

  const n = m.equity.length;
  const lo = Math.min(...m.floor) - m.drawdown * 0.35;
  const hi = Math.max(m.line, ...m.equity) + m.drawdown * 0.3;
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);

  const equityPath = m.equity.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  // EOD floors hold flat through the day and step at the close
  const floorPath = m.floor
    .map((v, i) => {
      const p = `${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
      if (!i) return `M${p}`;
      return m.intraday ? `L${p}` : `L${x(i).toFixed(1)} ${y(m.floor[i - 1]).toFixed(1)}L${p}`;
    })
    .join("");
  const breachArea = `${floorPath}L${x(n - 1).toFixed(1)} ${H - PAD.b}L${PAD.l} ${H - PAD.b}Z`;
  const last = n - 1;
  const key = `${program}-${phase}`;
  const name = `${program === "strix" ? "Strix" : "Express"} ${phase === "evaluation" ? "Evaluation" : "Funded"}`;

  return (
    <figure className={`dd${seen ? " is-in" : ""}`} ref={ref}>
      <div className="dd__controls">
        <Seg label="Program" options={PROGRAMS} value={program} onChange={setProgram} size="sm" />
        <Seg label="Phase" options={PHASES} value={phase} onChange={setPhase} size="sm" />
      </div>
      <svg className="dd__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Trailing drawdown, ${name}, $50K account: floor ${usd(m.drawdown)} below the peak, ${m.intraday ? "updated intraday" : "updated at the end of day"}${phase === "funded" ? `, locking at ${usd(m.line)}` : ""}.`}>
        {Array.from({ length: DAYS + 1 }).map((_, d) => (
          <line key={d} className="dd__grid" x1={x(d * TICKS)} x2={x(d * TICKS)} y1={PAD.t} y2={H - PAD.b} />
        ))}
        {Array.from({ length: DAYS }).map((_, d) => (
          <text key={d} className="dd__tick" x={x(d * TICKS + TICKS / 2)} y={H - 14} textAnchor="middle">
            Day {d + 1}
          </text>
        ))}
        <line className="dd__base" x1={PAD.l} x2={W - PAD.r} y1={y(m.balance)} y2={y(m.balance)} />
        <text className="dd__axis" x={PAD.l - 10} y={y(m.balance) + 4} textAnchor="end">{usd(m.balance)}</text>

        <g key={key}>
          <line className="dd__target" x1={PAD.l} x2={W - PAD.r} y1={y(m.line)} y2={y(m.line)} />
          {phase === "evaluation" && (
            <text className="dd__label dd__label--ice" x={PAD.l + 8} y={y(m.line) - 8}>Target {usd(m.line)}</text>
          )}
          <path className="dd__breach" d={breachArea} />
          <path className="dd__floor dd__draw" d={floorPath} pathLength={1} />
          <path className="dd__equity dd__draw" d={equityPath} pathLength={1} />
          <circle className="dd__dot dd__late" cx={x(last)} cy={y(m.equity[last])} r={4} />
          <text className="dd__label dd__late" x={x(last) + 10} y={y(m.equity[last]) + 4}>Equity</text>
          <text className="dd__label dd__label--loss dd__late" x={x(last) + 10} y={y(m.floor[last]) + (phase === "funded" ? 18 : 4)}>Floor</text>
          {m.lockAt >= 0 && (
            <g className="dd__late">
              <circle className="dd__lock" cx={x(m.lockAt)} cy={y(m.line)} r={5} />
              <text className="dd__label dd__label--ice" x={x(m.lockAt)} y={y(m.line) - 12} textAnchor="middle">Locks at {usd(m.line)}</text>
            </g>
          )}
        </g>
      </svg>
      <figcaption className="dd__legend">
        <span><i className="dd__key dd__key--equity" /> Equity</span>
        <span><i className="dd__key dd__key--floor" /> Floor, {usd(m.drawdown)} below the peak · {m.intraday ? "Intraday" : "End of day"}</span>
        <span className="dd__note">$50K account · illustrative path</span>
      </figcaption>
    </figure>
  );
}
