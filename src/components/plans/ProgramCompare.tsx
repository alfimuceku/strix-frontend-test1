import { PLANS, PROGRAMS, usd, type ProgramId } from "@/lib/data";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function facts(program: ProgramId) {
  const plans = PLANS.filter((p) => p.program === program);
  const prices = plans.map((p) => p.price);
  const p = plans[0];
  return [
    { label: "One-time fee", value: `${usd(Math.min(...prices))} to ${usd(Math.max(...prices))}` },
    { label: "Profit target", value: pct(p.profitTarget / p.balance) },
    { label: "Trailing drawdown", value: `${pct(p.trailingDrawdown / p.balance)} · ${p.drawdownMode}` },
    { label: "Strategies", value: p.strategies },
    { label: "Eval redemption", value: p.redemption },
  ];
}

/** Strix and Express side by side, from the plan data. The program on show is highlighted. */
export function ProgramCompare({ active }: { active: ProgramId }) {
  return (
    <div className="compare" role="group" aria-label="Strix and Express compared">
      {(["strix", "express"] as const).map((id) => (
        <section key={id} className={`compare__col${active === id ? " is-on" : ""}`} aria-labelledby={`compare-${id}`}>
          <header className="compare__head">
            <h3 id={`compare-${id}`} className="compare__name">{PROGRAMS[id].name}</h3>
            <p className="compare__sum">{PROGRAMS[id].summary}</p>
          </header>
          <dl className="compare__facts">
            {facts(id).map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
