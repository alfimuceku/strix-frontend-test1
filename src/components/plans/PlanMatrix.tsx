"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { PLANS, SIZES, checkoutHref, drawdownLabel, price, salePrice, usd, type PlanSpec, type ProgramId, type SizeId } from "@/lib/data";
import { PRICING_COPY as C } from "@/lib/copy";
import { PROMO } from "@/lib/config";
import { ProgramCompare } from "./ProgramCompare";
import { radioKeys } from "@/components/motion/Seg";

const ROWS: { label: string; get: (p: PlanSpec) => string }[] = [
  { label: "Profit target", get: (p) => usd(p.profitTarget) },
  { label: "Trailing drawdown", get: (p) => drawdownLabel(p) },
  { label: "Consistency rule", get: (p) => p.consistency },
  { label: "Overnight holding", get: (p) => p.overnight },
  { label: "Strategies", get: (p) => p.strategies },
  { label: "Funded activation", get: (p) => usd(p.activationFee) },
  { label: "Eval redemption", get: (p) => p.redemption },
];

const sizeLabel = (s: SizeId) => SIZES.find((x) => x.id === s)!.label;
const progName = (p: ProgramId) => (p === "strix" ? "Strix" : "Express");

/** Price that rolls in when the plan changes (keyed remount; static with reduced motion). */
function PriceBlock({ p }: { p: PlanSpec }) {
  return (
    <span className="plans__price" key={p.checkoutKey}>
      {PROMO.active && <s className="plans__was price-roll">{usd(p.price)}</s>}
      <strong className="price-roll">{price(salePrice(p))}</strong>
      <small>{C.oneTime}</small>
    </span>
  );
}

export function PromoStrip() {
  const [copied, setCopied] = useState(false);
  if (!PROMO.active) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard refused: the code stays visible to copy by hand */
    }
  };
  return (
    <div className="promo-strip">
      <span>{C.saveLine}</span>
      <code className="promo-strip__code">{PROMO.code}</code>
      <button type="button" className="promo-strip__copy" onClick={copy} aria-live="polite">
        {copied ? "Copied" : C.copy}
      </button>
    </div>
  );
}

/**
 * The eight evaluation plans. Desktop: one spec sheet, four columns.
 * Phones: a size selector and a single plan card.
 */
export function PlanMatrix({ compare = false }: { compare?: boolean }) {
  const [program, setProgram] = useState<ProgramId>("strix");
  const [size, setSize] = useState<SizeId>("50k");
  const id = useId();
  const plans = PLANS.filter((p) => p.program === program);
  const sub = program === "strix" ? C.strixSub : C.expressSub;
  const current = plans.find((x) => x.size === size)!;

  return (
    <div className="plans" data-size={size}>
      <div className="plans__switch">
        <div className="seg seg--lg" role="radiogroup" aria-label="Program" onKeyDown={radioKeys}>
          {(["strix", "express"] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={program === p} tabIndex={program === p ? 0 : -1} className={program === p ? "is-on" : ""} onClick={() => setProgram(p)}>
              {progName(p)}
            </button>
          ))}
        </div>
        <PromoStrip />
      </div>

      {compare && <ProgramCompare active={program} />}

      <div className="seg seg--sm plans__sizes" role="radiogroup" aria-label="Account size" onKeyDown={radioKeys}>
        {SIZES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={size === s.id} tabIndex={size === s.id ? 0 : -1} className={size === s.id ? "is-on" : ""} onClick={() => setSize(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="plans__sheet">
        <table className="plans__table" aria-describedby={`${id}-note`}>
          <caption className="sr-only">{progName(program)} evaluation plans compared by account size</caption>
          <thead>
            <tr>
              <td className="plans__corner">
                <span className="plans__corner-name">{progName(program)}</span>
                <span className="plans__corner-sub">{sub}</span>
              </td>
              {plans.map((p) => (
                <th key={p.size} scope="col" className={p.popular ? "is-popular" : ""}>
                  {p.popular && <span className="plans__flag">{C.popular}</span>}
                  <span className="plans__size">
                    {sizeLabel(p.size)} <span className="plans__name">{progName(program)}</span>
                  </span>
                  <PriceBlock p={p} />
                  {PROMO.active && <span className="plans__promo">{C.promoLine}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {plans.map((p) => (
                  <td key={p.size} className={p.popular ? "is-popular" : ""}>
                    {r.get(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="plans__cta-row">
              <th scope="row">
                <span className="sr-only">Start</span>
              </th>
              {plans.map((p) => (
                <td key={p.size} className={p.popular ? "is-popular" : ""}>
                  <Link className={`btn btn--${p.popular ? "primary" : "ghost"} btn--md btn--block`} href={checkoutHref(p)}>
                    <span className="btn__aperture" aria-hidden="true" />
                    <span className="btn__label" key={p.checkoutKey}><span className="price-roll">Start for {price(salePrice(p))}</span></span>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <article className={`plans__card${current.popular ? " is-popular" : ""}`} aria-label={`${sizeLabel(size)} ${progName(program)}`}>
        {current.popular && <span className="plans__flag">{C.popular}</span>}
        <h3 className="plans__size">
          {sizeLabel(size)} {progName(program)}
        </h3>
        <p className="plans__card-sub">{sub}</p>
        <PriceBlock p={current} />
        {PROMO.active && <span className="plans__promo">{C.promoLine}</span>}
        <dl>
          {ROWS.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.get(current)}</dd>
            </div>
          ))}
        </dl>
        <Link className="btn btn--primary btn--lg btn--block" href={checkoutHref(current)}>
          <span className="btn__aperture" aria-hidden="true" />
          <span className="btn__label">Start for {price(salePrice(current))}</span>
        </Link>
      </article>

      <p id={`${id}-note`} className="plans__note">
        {C.footer} <Link href="/rules">{C.footerLink}</Link>.
      </p>
    </div>
  );
}
