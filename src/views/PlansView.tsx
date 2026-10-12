import Link from "next/link";
import { WorldHero } from "@/components/ui/WorldHero";
import { PlanMatrix } from "@/components/plans/PlanMatrix";
import { Button } from "@/components/ui/Button";
import { KEY_NUMBERS, planFor, price, salePrice, usd } from "@/lib/data";
import { NO_SURPRISES, PRICING_COPY } from "@/lib/copy";
import { PROMO } from "@/lib/config";
import { RevealScope } from "@/components/motion/RevealScope";

export function PlansView() {
  const p = planFor("strix", "50k");
  const total = salePrice(p) + p.activationFee;
  return (
    <>
      <RevealScope />
      <WorldHero world="iris" title={PRICING_COPY.title}>
        <p>{PRICING_COPY.lede}</p>
      </WorldHero>

      <section className="page-section page-section--flush" aria-label="Plans">
        <div className="container">
          <PlanMatrix compare />
        </div>
      </section>

      <section className="page-section" aria-labelledby="price-title">
        <div className="container split-layout">
          <div className="stack">
            <h2 id="price-title" className="display display--md" data-reveal>
              {NO_SURPRISES.title}
            </h2>
            <p className="prose prose--lg">
              <strong>{NO_SURPRISES.bodyStrong}</strong>, {NO_SURPRISES.body}
            </p>
            <div className="cta-row">
              <Button href="/start?plan=strix_50k" size="lg">Start an evaluation</Button>
              <Button href="/rules" variant="ghost" size="lg">View the rules</Button>
            </div>
          </div>

          <div className="receipt" data-reveal="2" aria-label="What it costs to get funded on a $50K Strix plan">
            <ol className="receipt__months">
              {NO_SURPRISES.months.map((m) => (
                <li key={m.label}>
                  <span>{m.label}</span>
                  <strong>{m.value}</strong>
                </li>
              ))}
            </ol>
            <dl className="receipt__lines">
              <div>
                <dt>$50K Strix evaluation</dt>
                <dd>
                  {PROMO.active && <s>{usd(p.price)}</s>} {price(salePrice(p))}
                </dd>
              </div>
              <div>
                <dt>Monthly subscription</dt>
                <dd>$0</dd>
              </div>
              <div>
                <dt>Data / platform fees</dt>
                <dd>$0</dd>
              </div>
              <div>
                <dt>Funded activation (when live)</dt>
                <dd>{usd(p.activationFee)}</dd>
              </div>
              <div className="receipt__total">
                <dt>Total to get funded</dt>
                <dd>{price(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="page-section" aria-labelledby="numbers-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 id="numbers-title" className="display display--md">Strix by the numbers</h2>
            <p>One evaluation, one fee. The rest is capital, execution and payouts.</p>
          </div>
          <dl className="numbers numbers--4" data-reveal="1">
            {KEY_NUMBERS.map((n) => (
              <div key={n.label}>
                <dt>{n.label}</dt>
                <dd>{n.value}</dd>
              </div>
            ))}
          </dl>
          <p className="fine">
            Full rules for every phase are on the <Link href="/rules">Rules page</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
