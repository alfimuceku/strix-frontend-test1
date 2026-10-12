import { NOT_HERE } from "@/lib/data";

/** World 3 — the iris machine assembles, separates, reconnects and opens. */
export function EngineChapter() {
  return (
    <section className="chapter chapter--engine" data-t0="2" data-t1="3" id="risk" aria-labelledby="risk-title">
      <div className="chapter__sticky">
        <div className="beat" data-beat="0,0.36">
          <h2 id="risk-title" className="display display--lg">
            One risk engine. One trailing drawdown.
          </h2>
          <p className="lede">
            The floor trails your equity peak and is measured at the close on Strix plans. No daily loss cap, no
            consistency rule and live greeks on every position. That is the whole risk model.
          </p>
        </div>

        <div className="beat beat--wide" data-beat="0.36,0.74">
          <h2 className="display display--sm">What goes wrong at most prop firms, and what happens here</h2>
          <table className="contrast">
            <thead>
              <tr>
                <th scope="col">The usual trap</th>
                <th scope="col">Elsewhere</th>
                <th scope="col">At Strix</th>
              </tr>
            </thead>
            <tbody>
              {NOT_HERE.map((r) => (
                <tr key={r.trap}>
                  <th scope="row">{r.trap}</th>
                  <td>{r.other}</td>
                  <td>{r.strix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="beat" data-beat="0.74,1">
          <h2 className="display display--md">Level 5 from day one.</h2>
          <p className="lede">
            Spreads, condors, straddles, naked calls and puts, held overnight. Four legs in one ticket with netted margin,
            just like the four legs on this machine.
          </p>
        </div>
      </div>
    </section>
  );
}
