"use client";

import { useId, useMemo, useState } from "react";
import { STRATEGIES, SPOT, analyse, netPremium, payoff } from "@/lib/options";
import { usd } from "@/lib/data";
import { radioKeys } from "@/components/motion/Seg";

const W = 640, H = 280;
const PAD = { l: 52, r: 16, t: 18, b: 34 };
const LO = SPOT - 12, HI = SPOT + 12;

const money = (v: number) => (v === Infinity ? "Unlimited" : v === -Infinity ? "Unlimited" : (v < 0 ? "−" : "") + usd(Math.abs(v)));

export function PayoffLab() {
  const [sid, setSid] = useState(STRATEGIES[0].id);
  const [price, setPrice] = useState(SPOT);
  const [hovering, setHovering] = useState(false);
  const s = STRATEGIES.find((x) => x.id === sid)!;
  // React 18 ids contain colons, which break url(#…) references
  const id = "pl" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const { pts, yMin, yMax, stats } = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 240; i++) {
      const S = LO + ((HI - LO) * i) / 240;
      pts.push([S, payoff(s, S)]);
    }
    const ys = pts.map((p) => p[1]);
    let yMin = Math.min(0, ...ys), yMax = Math.max(0, ...ys);
    const pad = (yMax - yMin) * 0.12 || 50;
    yMin -= pad;
    yMax += pad;
    return { pts, yMin, yMax, stats: analyse(s, LO - 40, HI + 40) };
  }, [s]);

  const x = (S: number) => PAD.l + ((S - LO) / (HI - LO)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  const area = `${line}L${x(HI)},${y(0)}L${x(LO)},${y(0)}Z`;

  const ticks = useMemo(() => {
    const span = yMax - yMin;
    const step = [25, 50, 100, 200, 250, 500, 1000].find((st) => span / st <= 6) ?? 1000;
    const out: number[] = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) out.push(v);
    return out;
  }, [yMin, yMax]);

  const pnl = payoff(s, price);
  const credit = netPremium(s);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const S = LO + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (HI - LO);
    setPrice(Math.max(LO, Math.min(HI, Math.round(S * 4) / 4)));
    setHovering(true);
  };

  return (
    <section className="panel panel--payoff" aria-labelledby={`${id}-h`}>
      <header className="panel__head">
        <h3 id={`${id}-h`}>Strategy lab</h3>
        <p className="panel__note">P&amp;L at expiry, one contract. Illustrative prices.</p>
      </header>

      <div className="seg" role="radiogroup" aria-label="Strategy" onKeyDown={radioKeys}>
        {STRATEGIES.map((st) => (
          <button
            key={st.id}
            type="button"
            role="radio"
            aria-checked={st.id === sid}
            tabIndex={st.id === sid ? 0 : -1}
            className={st.id === sid ? "is-on" : ""}
            onClick={() => setSid(st.id)}
          >
            {st.name}
          </button>
        ))}
      </div>

      <p className="payoff__thesis">{s.thesis}</p>

      <div className="payoff__chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${s.name} payoff at expiry. Max profit ${money(stats.maxProfit)}, max loss ${money(stats.maxLoss)}.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHovering(false)}
        >
          <defs>
            <clipPath id={`${id}-up`}>
              <rect x="0" y="0" width={W} height={y(0)} />
            </clipPath>
            <clipPath id={`${id}-dn`}>
              <rect x="0" y={y(0)} width={W} height={H - y(0)} />
            </clipPath>
          </defs>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className={v === 0 ? "ax-zero" : "ax-grid"} />
              <text x={PAD.l - 8} y={y(v) + 4} className="ax-label" textAnchor="end">
                {v === 0 ? "0" : (v > 0 ? "+" : "−") + Math.abs(v)}
              </text>
            </g>
          ))}
          {[LO + 2, SPOT, HI - 2].map((S) => (
            <text key={S} x={x(S)} y={H - 10} className="ax-label" textAnchor="middle">
              {S.toFixed(S === SPOT ? 2 : 0)}
            </text>
          ))}
          <path d={area} className="pay-area pay-area--up" clipPath={`url(#${id}-up)`} />
          <path d={area} className="pay-area pay-area--dn" clipPath={`url(#${id}-dn)`} />
          <path d={line} className="pay-line pay-line--up" clipPath={`url(#${id}-up)`} />
          <path d={line} className="pay-line pay-line--dn" clipPath={`url(#${id}-dn)`} />
          {s.legs.map((l, i) => (
            <line key={i} x1={x(l.strike)} x2={x(l.strike)} y1={PAD.t} y2={H - PAD.b} className="pay-strike" />
          ))}
          <line x1={x(SPOT)} x2={x(SPOT)} y1={PAD.t} y2={H - PAD.b} className="pay-spot" />
          <g className={`pay-cursor${hovering ? " is-live" : ""}`}>
            <line x1={x(price)} x2={x(price)} y1={PAD.t} y2={H - PAD.b} />
            <circle cx={x(price)} cy={y(pnl)} r="5" />
          </g>
        </svg>
        <div
          className={`pay-tip${hovering ? " is-live" : ""}`}
          style={{ left: `${(x(price) / W) * 100}%`, top: `${(y(pnl) / H) * 100}%` }}
          aria-hidden="true"
        >
          <span>SPY {price.toFixed(2)}</span>
          <strong className={pnl >= 0 ? "pos" : "neg"}>{money(pnl)}</strong>
        </div>
      </div>

      <label className="payoff__slider">
        <span>Underlying at expiry</span>
        <input
          type="range"
          min={LO}
          max={HI}
          step={0.25}
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          aria-valuetext={`SPY ${price.toFixed(2)}, P&L ${money(pnl)}`}
        />
        <output>
          {price.toFixed(2)} <b className={pnl >= 0 ? "pos" : "neg"}>{money(pnl)}</b>
        </output>
      </label>

      <dl className="kv kv--4">
        <div>
          <dt>{credit >= 0 ? "Net credit" : "Net debit"}</dt>
          <dd>{usd(Math.abs(credit))}</dd>
        </div>
        <div>
          <dt>Max profit</dt>
          <dd>{money(stats.maxProfit)}</dd>
        </div>
        <div>
          <dt>Max loss</dt>
          <dd>{money(stats.maxLoss)}</dd>
        </div>
        <div>
          <dt>Breakeven</dt>
          <dd>{stats.breakevens.map((b) => b.toFixed(2)).join(" / ") || "—"}</dd>
        </div>
      </dl>

      <ol className="legs" aria-label="Order legs">
        {s.legs.map((l, i) => (
          <li key={i}>
            <span className={l.side === "buy" ? "leg-buy" : "leg-sell"}>{l.side === "buy" ? "Buy" : "Sell"}</span>
            <span>
              {l.strike} {l.type === "call" ? "C" : "P"}
            </span>
            <span>{l.premium.toFixed(2)}</span>
          </li>
        ))}
        <li className="legs__perm">Allowed on {s.requires}</li>
      </ol>
    </section>
  );
}
