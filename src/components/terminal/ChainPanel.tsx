"use client";

import { useId, useState } from "react";
import { CHAIN, SPOT } from "@/lib/options";

export function ChainPanel() {
  const [sel, setSel] = useState(688);
  const id = useId();
  return (
    <section className="panel panel--chain" aria-labelledby={`${id}-h`}>
      <header className="panel__head">
        <h3 id={`${id}-h`}>Options chain</h3>
        <p className="panel__note">SPY calls, 0 DTE. Illustrative quotes.</p>
      </header>
      <div className="chain__quote">
        <span className="chain__sym">SPY</span>
        <span className="chain__px">{SPOT.toFixed(2)}</span>
        <span className="pos">+0.06%</span>
        <span className="chain__iv">IV 11.8%</span>
      </div>
      <div className="chain__scroll">
        <table className="chain">
          <thead>
            <tr>
              <th scope="col">Strike</th>
              <th scope="col">Mid</th>
              <th scope="col">Δ</th>
              <th scope="col">Θ</th>
              <th scope="col">IV</th>
              <th scope="col">Vol</th>
            </tr>
          </thead>
          <tbody>
            {CHAIN.map((r) => (
              <tr
                key={r.strike}
                className={`${r.strike === sel ? "is-sel" : ""}${r.strike < SPOT ? " itm" : ""}`}
                onClick={() => setSel(r.strike)}
              >
                <th scope="row">
                  <button type="button" aria-pressed={r.strike === sel} onClick={() => setSel(r.strike)}>
                    {r.strike}
                  </button>
                </th>
                <td>{r.mid.toFixed(2)}</td>
                <td>
                  <span className="delta" style={{ "--d": r.delta } as React.CSSProperties} />
                  {r.delta.toFixed(2)}
                </td>
                <td>{r.theta.toFixed(2)}</td>
                <td>{r.iv.toFixed(1)}%</td>
                <td>{r.vol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="panel__fine">Shaded rows are in the money. Every listed expiry is tradable, down to same-day.</p>
    </section>
  );
}
