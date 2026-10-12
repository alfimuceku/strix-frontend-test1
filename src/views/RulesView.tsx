import { WorldHero } from "@/components/ui/WorldHero";
import { Button } from "@/components/ui/Button";
import { FUNDED, LIVE, PLANS, SIZES, usd } from "@/lib/data";
import { RULES_COPY as R } from "@/lib/copy";
import { RevealScope } from "@/components/motion/RevealScope";
import { PhaseTrack } from "@/components/rules/PhaseTrack";
import { DrawdownDiagram } from "@/components/rules/DrawdownDiagram";

const strix = PLANS.filter((p) => p.program === "strix");
const express = PLANS.filter((p) => p.program === "express");

function PhaseHead({ n, name, line, id }: { n: number; name: string; line: string; id: string }) {
  return (
    <div className="phase__head" data-reveal>
      <span className="phase__mark" aria-hidden="true">
        {n}
      </span>
      <div>
        <h2 id={id} className="display display--md">
          {name}
        </h2>
        <p className="phase__line">{line}</p>
      </div>
    </div>
  );
}

function SizeHead({ sizes = SIZES }: { sizes?: typeof SIZES }) {
  return (
    <thead>
      <tr>
        <th scope="col">Plan</th>
        {sizes.map((s) => (
          <th key={s.id} scope="col">
            {s.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function RulesView() {
  return (
    <div className="rules-page">
      <RevealScope />
      <WorldHero world="engine" kicker={R.kicker} title={R.title}>
        <p>{R.lede}</p>
        <ul className="chips" aria-label="At a glance">
          {R.chips.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </WorldHero>

      <nav className="phase-nav" aria-label="Phases">
        <div className="container">
          <ol>
            <li><a href="#evaluation"><span>1</span> {R.evaluation.name}</a></li>
            <li><a href="#funded"><span>2</span> {R.funded.name}</a></li>
            <li><a href="#live"><span>3</span> {R.live.name}</a></li>
            <li><a href="#every-plan">{R.everyPlanTitle}</a></li>
          </ol>
        </div>
      </nav>

      <PhaseTrack>
      <section id="evaluation" className="page-section phase" aria-labelledby="ph-eval">
        <div className="container">
          <PhaseHead n={1} id="ph-eval" name={R.evaluation.name} line={R.evaluation.line} />
          <p className="prose prose--lg">{R.evaluation.body}</p>
          <div className="phase__visual" data-reveal="1">
            <DrawdownDiagram />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Evaluation targets and drawdowns</caption>
              <SizeHead />
              <tbody>
                <tr><th scope="row">Strix profit target (12%)</th>{strix.map((p) => <td key={p.size}>{usd(p.profitTarget)}</td>)}</tr>
                <tr><th scope="row">Strix trailing drawdown (6%)</th>{strix.map((p) => <td key={p.size}>{usd(p.trailingDrawdown)}</td>)}</tr>
                <tr><th scope="row">Express profit target (8%)</th>{express.map((p) => <td key={p.size}>{usd(p.profitTarget)}</td>)}</tr>
                <tr><th scope="row">Express trailing drawdown (3%)</th>{express.map((p) => <td key={p.size}>{usd(p.trailingDrawdown)}</td>)}</tr>
                <tr><th scope="row">Floor update</th><td colSpan={4}>{R.evaluation.floorUpdate}</td></tr>
                <tr><th scope="row">Consistency rule</th>{SIZES.map((s) => <td key={s.id}>None</td>)}</tr>
              </tbody>
            </table>
          </div>
          <aside className="callout">
            <h3>{R.evaluation.redemptionTitle}</h3>
            <p>{R.evaluation.redemption}</p>
          </aside>
        </div>
      </section>

      <section id="funded" className="page-section phase" aria-labelledby="ph-funded">
        <div className="container">
          <PhaseHead n={2} id="ph-funded" name={R.funded.name} line={R.funded.line} />
          <p className="prose prose--lg">{R.funded.body}</p>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Funded account rules</caption>
              <SizeHead />
              <tbody>
                <tr><th scope="row">Profit share</th>{FUNDED.map((f) => <td key={f.size}>{f.split}</td>)}</tr>
                <tr><th scope="row">Funded activation fee</th>{FUNDED.map((f) => <td key={f.size}>{usd(f.activationFee)}</td>)}</tr>
                <tr><th scope="row">Payout minimum</th>{FUNDED.map((f) => <td key={f.size}>{usd(f.payoutMinimum)}</td>)}</tr>
                <tr><th scope="row">Winning days per payout</th>{FUNDED.map((f) => <td key={f.size}>{f.winningDays}</td>)}</tr>
                <tr><th scope="row">Qualifying day (realized)</th>{FUNDED.map((f) => <td key={f.size}>{usd(f.qualifyingDay)}+</td>)}</tr>
                {[0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <th scope="row">Payout #{i + 1} cap{i === 3 ? " (Strix)" : ""}</th>
                    {FUNDED.map((f) => <td key={f.size}>{usd(f.caps[i])}</td>)}
                  </tr>
                ))}
                <tr><th scope="row">Drawdown locks at</th>{FUNDED.map((f) => <td key={f.size}>{usd(f.drawdownLocksAt)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="note">{R.funded.legacy}</p>
        </div>
      </section>

      <section id="live" className="page-section phase" aria-labelledby="ph-live">
        <div className="container">
          <PhaseHead n={3} id="ph-live" name={R.live.name} line={R.live.line} />
          <p className="prose prose--lg">{R.live.body}</p>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Live program</caption>
              <SizeHead sizes={SIZES.filter((s) => s.id !== "10k")} />
              <tbody>
                <tr><th scope="row">Live capital</th>{LIVE.map((l) => <td key={l.size}>{usd(l.capital)}</td>)}</tr>
                <tr><th scope="row">Trailing drawdown</th>{LIVE.map((l) => <td key={l.size}>{usd(l.drawdown)}</td>)}</tr>
                <tr><th scope="row">Floor locks at</th>{LIVE.map((l) => <td key={l.size}>{usd(l.locksAt)}</td>)}</tr>
                <tr><th scope="row">Withdrawal scope</th>{LIVE.map((l) => <td key={l.size}>100% of profits</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="note">{R.live.note}</p>
        </div>
      </section>
      </PhaseTrack>

      <section id="every-plan" className="page-section" aria-labelledby="every-title">
        <div className="container">
          <h2 id="every-title" className="display display--md" data-reveal>{R.everyPlanTitle}</h2>
          <div className="rule-grid">
            {R.everyPlan.map((r, i) => (
              <article key={r.title} data-reveal={(i % 3) + 1}>
                <h3>{r.title}</h3>
                <p>
                  {r.body}
                  {"linkText" in r && r.linkText && (
                    <>
                      {" "}
                      <a href="#every-plan">{r.linkText}</a>
                      {r.tail}
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>
          <div className="cta-row">
            <Button href="/start" size="lg">{R.ctaPrimary}</Button>
            <Button href="/faq" variant="ghost" size="lg">{R.ctaSecondary}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
