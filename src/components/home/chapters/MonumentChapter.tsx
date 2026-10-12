import { Button } from "@/components/ui/Button";
import { SkipToPlans } from "../SkipToPlans";

/** World 1 — the wordmark. Hero copy, then the options-first statement, then the dive into the X. */
export function MonumentChapter() {
  return (
    <section className="chapter chapter--monument" data-t0="0" data-t1="1" id="strix" aria-labelledby="hero-title">
      <div className="chapter__sticky">
        <div className="beat beat--hero is-active" data-beat="0,0.34">
          <p className="hero__kicker">The prop firm built for options traders</p>
          <h1 id="hero-title" className="display display--xl">
            Trade options.
            <br />
            Get paid.
          </h1>
          <p className="lede">
            Pass one evaluation, trade our capital and keep 80% of what you make. One fee, paid once. Up to $1M in funded capital.
          </p>
          <div className="cta-row">
            <Button href="/plans" size="lg">
              Start an evaluation
            </Button>
            <Button href="/rules" variant="ghost" size="lg">
              Read the rules
            </Button>
          </div>
          <div className="hero__foot">
            <p className="scroll-cue" aria-hidden="true">
              <span className="scroll-cue__line" />
              Scroll to enter the X
            </p>
            <SkipToPlans label="Skip to plans" />
          </div>
        </div>

        <div className="beat beat--split" data-beat="0.34,0.7">
          <h2 className="display display--lg">Written for options. Not adapted from futures.</h2>
          <p className="lede">
            Every rule, from permissions to drawdown to payouts, was written for options positions: spreads, premium,
            overnight greeks. The evaluation and the funded account run on the same engine, so what passes the eval is
            exactly what gets paid.
          </p>
        </div>

        <div className="beat beat--threshold" data-beat="0.7,1">
          <p className="threshold">Inside every price is a surface of possibilities.</p>
        </div>
      </div>
    </section>
  );
}
