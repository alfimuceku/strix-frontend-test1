import { Terminal } from "@/components/terminal/Terminal";
import { PlanMatrix } from "@/components/plans/PlanMatrix";

/** World 4 — the working terminal, then the plans. */
export function TerminalChapter() {
  return (
    <>
      <section className="chapter chapter--terminal" data-t0="3.5" data-t1="4" id="platform" aria-labelledby="platform-title">
        <div className="container">
          <div className="section-head">
            <h2 id="platform-title" className="display display--md">
              Try the desk
            </h2>
            <p>
              Change the strategy, drag the price, switch account sizes. The rules behind every number are the real Strix
              rules; the market data is illustrative.
            </p>
          </div>
          <Terminal />
        </div>
      </section>
      <section className="chapter chapter--plans" id="pricing" aria-labelledby="pricing-title">
        <div className="container">
          <div className="section-head">
            <h2 id="pricing-title" className="display display--md">
              Pick your account. Start today.
            </h2>
            <p>
              One evaluation, one fee. Pass it and you trade our capital. Strix plans allow every options strategy;
              Express plans are cheaper and trade long calls and puts only.
            </p>
          </div>
          <PlanMatrix />
        </div>
      </section>
    </>
  );
}
