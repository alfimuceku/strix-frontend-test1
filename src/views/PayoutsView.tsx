import { WorldHero } from "@/components/ui/WorldHero";
import { Button } from "@/components/ui/Button";
import { FUNDED, SIZES, usd } from "@/lib/data";
import { PAYOUTS_COPY as P } from "@/lib/copy";
import { RevealScope } from "@/components/motion/RevealScope";
import { CapLadder } from "@/components/payouts/CapLadder";

export function PayoutsView() {
  return (
    <>
      <RevealScope />
      <WorldHero world="horizon" kicker={P.kicker} title={P.title}>
        <p>{P.lede}</p>
      </WorldHero>

      <section className="page-section page-section--flush" aria-labelledby="wall-title">
        <div className="container">
          <div className="wall" data-reveal>
            <div className="wall__slots" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
            <div className="wall__msg">
              <span className="wall__aperture" aria-hidden="true" />
              <h2 id="wall-title" className="display display--sm">{P.emptyTitle}</h2>
              <p>{P.emptyBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-payouts" className="page-section" aria-labelledby="how-title">
        <div className="container">
          <h2 id="how-title" className="display display--md" data-reveal>{P.howTitle}</h2>
          <div className="pillars">
            {P.how.map((h, i) => (
              <article key={h.title} data-reveal={i + 1}>
                <p className="pillars__label">{h.label}</p>
                <h3>{h.title}</h3>
                <p>{h.body}</p>
              </article>
            ))}
          </div>
          <div className="payouts__ladder" data-reveal>
            <CapLadder />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Payout minimums and caps by plan</caption>
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  {SIZES.map((s) => <th key={s.id} scope="col">{s.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">Payout minimum</th>{FUNDED.map((f) => <td key={f.size}>{usd(f.payoutMinimum)}</td>)}</tr>
                <tr><th scope="row">Qualifying day (realized)</th>{FUNDED.map((f) => <td key={f.size}>{usd(f.qualifyingDay)}+</td>)}</tr>
                {[0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <th scope="row">Payout #{i + 1} cap{i === 3 ? " (Strix)" : ""}</th>
                    {FUNDED.map((f) => <td key={f.size}>{usd(f.caps[i])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">{P.fine}</p>
          <div className="cta-row">
            <Button href="/start" size="lg">{P.ctaPrimary}</Button>
            <Button href="/rules" variant="ghost" size="lg">{P.ctaSecondary}</Button>
          </div>
        </div>
      </section>
    </>
  );
}
