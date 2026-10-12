import { AUDIENCES, INSTRUMENTS, KEY_NUMBERS } from "@/lib/data";

/** World 2 — flying down the at-the-money valley of an implied-volatility surface. */
export function MarketChapter() {
  return (
    <section className="chapter chapter--market" data-t0="1" data-t1="2" id="markets" aria-labelledby="markets-title">
      <div className="chapter__sticky">
        <div className="beat" data-beat="0,0.3">
          <h2 id="markets-title" className="display display--lg">
            You are flying through a volatility surface.
          </h2>
          <p className="lede">
            Strikes run left to right, expiries run into the distance, and every column stands as tall as its implied
            volatility. The valley is at the money; the walls are the skew. This is the market Strix traders work in.
          </p>
          <figure className="legend-key" aria-label="How to read the landscape">
            <span><i className="k k--col" /> Column height: implied volatility</span>
            <span><i className="k k--row" /> Lit rows: weekly expiries</span>
            <span><i className="k k--flash" /> Flashes: prints crossing the tape</span>
          </figure>
        </div>

        <div className="beat" data-beat="0.3,0.62">
          <h2 className="display display--md">Strix by the numbers</h2>
          <dl className="numbers">
            {KEY_NUMBERS.map((n) => (
              <div key={n.label}>
                <dt>{n.label}</dt>
                <dd>{n.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="beat beat--wide" data-beat="0.62,1">
          <div className="two-lists">
            <div>
              <h2 className="display display--sm">What you can trade</h2>
              <ul className="spec-list">
                {INSTRUMENTS.map((i) => (
                  <li key={i.name}>
                    <strong>{i.name}</strong>
                    <span>{i.body}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="display display--sm">Who it is for</h2>
              <ul className="spec-list">
                {AUDIENCES.map((i) => (
                  <li key={i.name}>
                    <strong>{i.name}</strong>
                    <span>{i.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
