"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WorldHero } from "@/components/ui/WorldHero";
import { PromoStrip } from "@/components/plans/PlanMatrix";
import { SIZES, drawdownLabel, paymentHandoff, planByKey, planFor, price, salePrice, usd, type ProgramId, type SizeId } from "@/lib/data";
import { CHECKOUT_COPY as C, PRICING_COPY } from "@/lib/copy";
import { PROMO } from "@/lib/config";
import { radioKeys } from "@/components/motion/Seg";

type Errors = Partial<Record<"email" | "first" | "last" | "agree", string>>;

/**
 * Start an evaluation. Collects the details, lets the trader switch plan,
 * then hands over to the existing payment step with the plan selected.
 */
export function StartView() {
  const [program, setProgram] = useState<ProgramId>("strix");
  const [size, setSize] = useState<SizeId>("50k");
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [promo, setPromo] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  // preselect from ?plan=strix_50k
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("plan") ?? new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("plan");
    const p = planByKey(key);
    if (p) {
      setProgram(p.program);
      setSize(p.size);
    }
  }, []);

  // coming Back from the payment page restores this page from the bfcache with the button still disabled
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && setSending(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const plan = planFor(program, size);
  const promoApplied = PROMO.active && promo.trim().toUpperCase() === PROMO.code;
  const due = promoApplied ? salePrice(plan) : plan.price;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter the email address for your dashboard login.";
    if (!first.trim()) next.first = "Enter your first name.";
    if (!last.trim()) next.last = "Enter your last name.";
    if (!agree) next.agree = "Confirm you have read the rules and the terms.";
    setErrors(next);
    if (Object.keys(next).length) {
      const firstKey = Object.keys(next)[0];
      document.getElementById(`start-${firstKey}`)?.focus();
      return;
    }
    setSending(true);
    window.location.href = paymentHandoff(plan);
  };

  const field = (key: keyof Errors) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `start-${key}-err` : undefined,
  });

  return (
    <>
      <WorldHero world="iris" kicker={C.kicker} title={C.title} size="short">
        <p>{C.lede}</p>
      </WorldHero>

      <section className="page-section page-section--flush">
        <div className="container checkout">
          <form className="checkout__form form" onSubmit={submit} noValidate aria-label="Your details">
            <div className="checkout__plan-pick">
              <div className="seg seg--lg" role="radiogroup" aria-label="Program" onKeyDown={radioKeys}>
                {(["strix", "express"] as const).map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={program === p} tabIndex={program === p ? 0 : -1} className={program === p ? "is-on" : ""} onClick={() => setProgram(p)}>
                    {p === "strix" ? "Strix" : "Express"}
                  </button>
                ))}
              </div>
              <div className="seg" role="radiogroup" aria-label="Account size" onKeyDown={radioKeys}>
                {SIZES.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={size === s.id} tabIndex={size === s.id ? 0 : -1} className={size === s.id ? "is-on" : ""} onClick={() => setSize(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="start-email">{C.email}</label>
              <input id="start-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...field("email")} />
              {errors.email && <p id="start-email-err" className="field__err">{errors.email}</p>}
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="start-first">{C.first}</label>
                <input id="start-first" autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} {...field("first")} />
                {errors.first && <p id="start-first-err" className="field__err">{errors.first}</p>}
              </div>
              <div className="field">
                <label htmlFor="start-last">{C.last}</label>
                <input id="start-last" autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} {...field("last")} />
                {errors.last && <p id="start-last-err" className="field__err">{errors.last}</p>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="start-promo">{C.promo}</label>
              <input id="start-promo" autoComplete="off" value={promo} onChange={(e) => setPromo(e.target.value)} className="input--code" />
              {promoApplied && <p className="field__ok">{PRICING_COPY.promoLine}</p>}
            </div>
            <div className="check">
              <input id="start-agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} {...field("agree")} />
              <label htmlFor="start-agree">
                {C.agreePre} <Link href="/rules">{C.agreeRules}</Link> {C.agreeMid} <Link href="/legal#terms">{C.agreeTerms}</Link>.
              </label>
            </div>
            {errors.agree && <p id="start-agree-err" className="field__err">{errors.agree}</p>}
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={sending}>
              <span className="btn__aperture" aria-hidden="true" />
              <span className="btn__label">{C.submit}</span>
            </button>
            <p className="form__hint">{C.fine}</p>
          </form>

          <aside className="summary" aria-label="Selected plan">
            <div className="summary__top">
              <p className="summary__name">
                {SIZES.find((s) => s.id === size)!.label} {program === "strix" ? "Strix" : "Express"}
              </p>
              <p className="summary__sub">{program === "strix" ? PRICING_COPY.strixSub : PRICING_COPY.expressSub}</p>
              <p className="summary__price">
                {promoApplied && <s>{usd(plan.price)}</s>}
                <strong>{price(due)}</strong>
                <span>{PRICING_COPY.oneTime}</span>
              </p>
            </div>
            <dl className="summary__rows">
              <div><dt>{C.rows.target}</dt><dd>{usd(plan.profitTarget)}</dd></div>
              <div><dt>{C.rows.drawdown}</dt><dd>{drawdownLabel(plan)}</dd></div>
              <div><dt>{C.rows.strategies}</dt><dd>{plan.strategies}</dd></div>
              <div><dt>{C.rows.activation}</dt><dd>{usd(plan.activationFee)}</dd></div>
            </dl>
            <Link className="summary__change" href="/plans">{C.changePlan}</Link>
            {!promoApplied && <PromoStrip />}
          </aside>
        </div>
      </section>
    </>
  );
}
