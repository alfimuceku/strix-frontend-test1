"use client";

import { useId, useMemo, useState } from "react";
import { SIZES, planFor, usd, type ProgramId, type SizeId } from "@/lib/data";
import { illustrativePath } from "@/lib/options";
import { radioKeys } from "@/components/motion/Seg";

const W = 560, H = 250;
const PAD = { l: 64, r: 18, t: 16, b: 30 };

type Phase = "evaluation" | "funded";

/**
 * Plots an illustrative equity path against the plan's real trailing-drawdown
 * rule and profit target, so the rule is understood by watching it work.
 */
export function DrawdownMonitor() {
  const [program, setProgram] = useState<ProgramId>("strix");
  const [size, setSize] = useState<SizeId>("50k");
  const [phase, setPhase] = useState<Phase>("evaluation");
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const plan = planFor(program, size);

  const model = useMemo(() => {
    const raw = illustrativePath(34, program === "strix" ? 7 : 11);
    const dd = plan.trailingDrawdown;
    const start = plan.balance;
    const eq = raw.map((u) => start + u * dd);
    let peak = start;
    const floor: number[] = [];
    for (let i = 0; i < eq.length; i++) {
      // Strix floors move at the close (use yesterday's close peak); Express follows the peak intraday
      const ref = program === "strix" ? peak : Math.max(peak, eq[i]);
      let f = ref - dd;
      if (phase === "funded") f = Math.min(f, start); // locks at the starting balance
      floor.push(f);
      peak = Math.max(peak, eq[i]);
    }
    const target = phase === "evaluation" ? start + plan.profitTarget : null;
    const lo = Math.min(...floor, ...eq) - dd * 0.15;
    const hi = Math.max(...eq, target ?? 0, start + dd * 0.4) + dd * 0.15;
    return { eq, floor, target, lo, hi, start };
  }, [plan, program, phase]);

  const n = model.eq.length;
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - model.lo) / (model.hi - model.lo)) * (H - PAD.t - PAD.b);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const stepPath = (arr: number[]) =>
    arr.map((v, i) => (i ? `H${x(i).toFixed(1)}V${y(v).toFixed(1)}` : `M${x(0)},${y(v).toFixed(1)}`)).join("");

  const last = n - 1;
  const idx = hover ?? last;
  const buffer = model.eq[idx] - model.floor[idx];
  const bufferPct = Math.max(0, Math.min(1, buffer / plan.trailingDrawdown));
  const toTarget = model.target ? Math.max(0, model.target - model.eq[idx]) : null;
  const yTicks = [model.start - plan.trailingDrawdown, model.start, model.start + plan.trailingDrawdown, ...(model.target ? [model.target] : [])];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <section className="panel panel--risk" aria-labelledby={`${id}-h`}>
      <header className="panel__head">
        <h3 id={`${id}-h`}>Risk and drawdown</h3>
        <p className="panel__note">Real plan rules. Simulated equity path.</p>
      </header>

      <div className="risk__controls">
        <div className="seg seg--sm" role="radiogroup" aria-label="Program" onKeyDown={radioKeys}>
          {(["strix", "express"] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={program === p} tabIndex={program === p ? 0 : -1} className={program === p ? "is-on" : ""} onClick={() => setProgram(p)}>
              {p === "strix" ? "Strix" : "Express"}
            </button>
          ))}
        </div>
        <div className="seg seg--sm" role="radiogroup" aria-label="Account size" onKeyDown={radioKeys}>
          {SIZES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={size === s.id} tabIndex={size === s.id ? 0 : -1} className={size === s.id ? "is-on" : ""} onClick={() => setSize(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="seg seg--sm" role="radiogroup" aria-label="Phase" onKeyDown={radioKeys}>
          {(["evaluation", "funded"] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={phase === p} tabIndex={phase === p ? 0 : -1} className={phase === p ? "is-on" : ""} onClick={() => setPhase(p)}>
              {p === "evaluation" ? "Evaluation" : "Funded"}
            </button>
          ))}
        </div>
      </div>

      <div className="risk__chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Illustrative ${phase} equity for a ${size.toUpperCase()} ${program === "strix" ? "Strix" : "Express"} account against a ${usd(plan.trailingDrawdown)} trailing drawdown.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="ax-grid" />
              <text x={PAD.l - 8} y={y(v) + 4} className="ax-label" textAnchor="end">
                {usd(v / 1000, v % 1000 ? 1 : 0)}K
              </text>
            </g>
          ))}
          {model.target && (
            <>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(model.target)} y2={y(model.target)} className="risk-target" />
              <text x={W - PAD.r} y={y(model.target) - 6} className="ax-label ax-label--strong" textAnchor="end">
                Profit target {usd(plan.profitTarget)}
              </text>
            </>
          )}
          <path d={program === "strix" ? stepPath(model.floor) : path(model.floor)} className="risk-floor" />
          <text x={W - PAD.r} y={y(model.floor[last]) + 16} className="ax-label ax-label--strong" textAnchor="end">
            {phase === "funded" && model.floor[last] >= model.start ? "Floor locked" : "Drawdown floor"}
          </text>
          <path d={path(model.eq)} className="risk-equity" />
          <text x={x(last) - 4} y={y(model.eq[last]) - 10} className="ax-label ax-label--strong" textAnchor="end">
            Equity
          </text>
          {hover !== null && (
            <g className="risk-cursor">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} />
              <circle cx={x(hover)} cy={y(model.eq[hover])} r="5" />
              <circle cx={x(hover)} cy={y(model.floor[hover])} r="4" className="risk-cursor__floor" />
            </g>
          )}
          <text x={PAD.l} y={H - 8} className="ax-label">Day 1</text>
          <text x={W - PAD.r} y={H - 8} className="ax-label" textAnchor="end">Day {n}</text>
        </svg>
      </div>

      <dl className="kv kv--4">
        <div>
          <dt>{hover !== null ? `Equity, day ${idx + 1}` : "Equity"}</dt>
          <dd>{usd(model.eq[idx])}</dd>
        </div>
        <div>
          <dt>Trailing drawdown</dt>
          <dd>
            {usd(plan.trailingDrawdown)} <small>{plan.drawdownMode === "End of day" ? "EOD" : "intraday"}</small>
          </dd>
        </div>
        <div>
          <dt>Buffer left</dt>
          <dd>
            {usd(Math.max(0, buffer))}
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${bufferPct * 100}%` }} />
            </span>
          </dd>
        </div>
        <div>
          <dt>{toTarget !== null ? "To target" : "Floor locks at"}</dt>
          <dd>{toTarget !== null ? usd(toTarget) : usd(model.start)}</dd>
        </div>
      </dl>
    </section>
  );
}
