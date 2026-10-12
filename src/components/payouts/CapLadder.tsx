"use client";

import { useRef, useState } from "react";
import { FUNDED, SIZES, usd, type SizeId } from "@/lib/data";
import { Seg } from "@/components/motion/Seg";
import { useInView } from "@/components/motion/useInView";

const SIZE_OPTS = SIZES.map((s) => ({ id: s.id, label: s.label }));

/**
 * The payout caps as a staircase: each payout number lifts the cap, and Live
 * removes it. Bars grow when scrolled into view and re-step on a size change.
 */
export function CapLadder() {
  const [size, setSize] = useState<SizeId>("50k");
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref);
  const f = FUNDED.find((x) => x.size === size)!;
  const top = Math.max(...FUNDED.map((x) => x.caps[3]));

  return (
    <div className={`ladder-viz${seen ? " is-in" : ""}`} ref={ref}>
      <div className="ladder-viz__head">
        <h3 className="ladder-viz__title">Payout caps</h3>
        <Seg label="Account size" options={SIZE_OPTS} value={size} onChange={setSize} size="sm" />
      </div>
      <ol className="ladder-viz__steps">
        {f.caps.map((cap, i) => (
          <li key={i} style={{ "--h": (cap / top).toFixed(3), "--i": i } as React.CSSProperties}>
            <span className="ladder-viz__value">{usd(cap)}</span>
            <span className="ladder-viz__bar" aria-hidden="true" />
            <span className="ladder-viz__label">
              Payout #{i + 1}
              {i === 3 && <small> (Strix)</small>}
            </span>
          </li>
        ))}
        <li className="ladder-viz__live" style={{ "--h": 1, "--i": 4 } as React.CSSProperties}>
          <span className="ladder-viz__value">No cap</span>
          <span className="ladder-viz__bar" aria-hidden="true" />
          <span className="ladder-viz__label">Live</span>
        </li>
      </ol>
      <div className="split-viz" aria-label="Profit split: 80% to you, 20% to Strix">
        <div className="split-viz__bar" aria-hidden="true">
          <span className="split-viz__you" />
          <span className="split-viz__firm" />
        </div>
        <div className="split-viz__labels">
          <span><strong>80%</strong> to you</span>
          <span><strong>20%</strong> to Strix</span>
        </div>
      </div>
    </div>
  );
}
