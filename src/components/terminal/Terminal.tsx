import { PayoffLab } from "./PayoffLab";
import { DrawdownMonitor } from "./DrawdownMonitor";
import { PayoutPanel } from "./PayoutPanel";
import { ChainPanel } from "./ChainPanel";

/** The Strix desk: four working panels. Plan rules are real; market data is illustrative. */
export function Terminal() {
  return (
    <div className="terminal" role="group" aria-label="Strix dashboard preview">
      <div className="terminal__bar">
        <span className="terminal__dot" aria-hidden="true" />
        <span className="terminal__title">Strix dashboard</span>
        <span className="terminal__cell">$50K Strix · Evaluation</span>
        <span className="terminal__cell">Level 5 permissions</span>
        <span className="terminal__flag">Illustrative data. Not real results.</span>
      </div>
      <div className="terminal__grid">
        <PayoffLab />
        <DrawdownMonitor />
        <ChainPanel />
        <PayoutPanel />
      </div>
    </div>
  );
}
