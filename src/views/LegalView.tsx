import { WorldHero } from "@/components/ui/WorldHero";
import { LegalToc } from "@/components/motion/LegalToc";
import { RevealScope } from "@/components/motion/RevealScope";
import { LEGAL_COPY as L } from "@/lib/copy";
import { DISCLAIMER } from "@/lib/data";

export function LegalView() {
  return (
    <>
      <RevealScope />
      <WorldHero world="hall" kicker={L.kicker} title={L.title} size="short">
        <p>{L.lede}</p>
      </WorldHero>
      <section className="page-section page-section--flush">
        <div className="container legal-layout">
          <LegalToc sections={L.sections} />
          <div className="legal-body">
            {L.sections.map((s, i) => (
              <article key={s.id} id={s.id} className="legal-doc" data-reveal>
                <p className="legal-doc__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="display display--sm">{s.title}</h2>
                <p>{s.body}</p>
              </article>
            ))}
            <article className="legal-doc legal-doc--risk" data-reveal>
              {DISCLAIMER.map((d) => (
                <p key={d.title}>
                  <strong>{d.title}</strong> {d.body}
                </p>
              ))}
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
