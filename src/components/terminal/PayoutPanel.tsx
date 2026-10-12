"use client";

import { useId, useState } from "react";
import { FUNDED, SIZES, usd, type SizeId } from "@/lib/data";
import { Seg, radioKeys } from "@/components/motion/Seg";

export function PayoutPanel() {
  const [size, setSize] = useState<SizeId>("50k");
  const [request, setRequest] = useState(2500);
  const [nth, setNth] = useState<"0" | "1" | "2" | "3">("0");
  const id = useId();
  const f = FUNDED.find((x) => x.size === size)!;
  const maxCap = Math.max(...f.caps);
  // what actually pays out: the request, limited by this payout's cap
  const req = Math.min(request, maxCap * 2);
  const cap = f.caps[Number(nth)];
  const paid = Math.min(req, cap);
  const held = req - paid;
  const steps = [
    ...f.caps.map((c, i) => ({ label: `Payout ${i + 1}`, value: c, note: i === 3 ? "Strix plans" : undefined })),
  ];

  return (
    <section className="panel panel--payout" aria-labelledby={`${id}-h`}>
      <header className="panel__head">
        <h3 id={`${id}-h`}>Payouts</h3>
        <p className="panel__note">Split, caps and cadence from the published rules.</p>
      </header>

      <div className="split">
        <label className="split__input">
          <span>Payout request</span>
          <input
            type="range"
            min={250}
            max={maxCap * 2}
            step={50}
            value={req}
            onChange={(e) => setRequest(parseInt(e.target.value, 10))}
            aria-valuetext={usd(req)}
          />
          <output>{usd(req)}</output>
        </label>
        <Seg
          label="Which payout"
          size="sm"
          value={nth}
          onChange={setNth}
          options={f.caps.map((_, i) => ({ id: String(i) as typeof nth, label: `#${i + 1}${i === 3 ? " Strix" : ""}` }))}
        />
        <div className="split__bar" aria-hidden="true">
          <span className="split__you" style={{ flexBasis: "80%" }} />
          <span className="split__firm" style={{ flexBasis: "20%" }} />
        </div>
        <dl className="kv kv--2">
          <div>
            <dt>To you, 80%</dt>
            <dd className="pos">{usd(paid * 0.8)}</dd>
          </div>
          <div>
            <dt>To Strix, 20%</dt>
            <dd>{usd(paid * 0.2)}</dd>
          </div>
        </dl>
        <p className="panel__fine" aria-live="polite">
          {held > 0
            ? `Payout #${Number(nth) + 1} is capped at ${usd(cap)}; the other ${usd(held)} stays in the account for your next payout.`
            : `Within the ${usd(cap)} cap for payout #${Number(nth) + 1}.`}
        </p>
      </div>

      <div className="ladder">
        <div className="ladder__head">
          <h4>Cap ladder</h4>
          <div className="seg seg--sm" role="radiogroup" aria-label="Account size" onKeyDown={radioKeys}>
            {SIZES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={size === s.id} tabIndex={size === s.id ? 0 : -1} className={size === s.id ? "is-on" : ""} onClick={() => setSize(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <ol className="ladder__steps">
          {steps.map((s) => (
            <li key={s.label}>
              <span className="ladder__label">
                {s.label}
                {s.note && <small> {s.note}</small>}
              </span>
              <span className="ladder__track" aria-hidden="true">
                <span style={{ width: `${(s.value / maxCap) * 100}%` }} />
              </span>
              <span className="ladder__value">{usd(s.value)}</span>
            </li>
          ))}
          <li className="ladder__live">
            <span className="ladder__label">Live program</span>
            <span className="ladder__track ladder__track--open" aria-hidden="true">
              <span />
            </span>
            <span className="ladder__value">No cap</span>
          </li>
        </ol>
        <p className="panel__fine">
          Minimum {usd(f.payoutMinimum)} · {f.winningDays} winning days of {usd(f.qualifyingDay)}+ realized per cycle · request every 14 days. Each payout draws up to 50% of profits, limited by its cap.
        </p>
      </div>
    </section>
  );
}
