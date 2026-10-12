import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/lib/data";

/** World 5 — the colonnade rises and the horizon lights. */
export function HorizonChapter() {
  return (
    <section className="chapter chapter--horizon" data-t0="4" data-t1="5" id="start" aria-labelledby="final-title">
      <div className="chapter__sticky">
        <ol className="beat beat--steps" data-beat="0,0.5" aria-label="How to get funded">
          <li>
            <strong>Pick a plan</strong>
            <span>Strix or Express, $10K to $100K. One fee, paid once.</span>
          </li>
          <li>
            <strong>Pass the evaluation</strong>
            <span>Hit the profit target before the trailing drawdown. No deadline, no minimum days.</span>
          </li>
          <li>
            <strong>Trade funded</strong>
            <span>Activate once and keep 80% of profits, paid every 14 days.</span>
          </li>
          <li>
            <strong>Go live</strong>
            <span>Real firm buying power. The 80/20 split continues with no payout caps.</span>
          </li>
        </ol>
        <div className="beat beat--finale" data-beat="0.5,1">
          <h2 id="final-title" className="display display--finale">
            The market is yours to master.
          </h2>
          <div className="cta-row cta-row--center">
            <Button href="/plans" size="lg">
              Start an evaluation
            </Button>
            <Button href={CONTACT.discord} variant="ghost" size="lg">
              Join the Discord
            </Button>
          </div>
          <p className="finale__fine">Simulated evaluation. Rules for every phase are published before you buy.</p>
        </div>
      </div>
    </section>
  );
}
