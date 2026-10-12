import { WorldHero } from "@/components/ui/WorldHero";
import { FaqList } from "@/components/faq/FaqList";
import { Button } from "@/components/ui/Button";
import { FAQ_COPY as F } from "@/lib/copy";
import { RevealScope } from "@/components/motion/RevealScope";

export function FaqView() {
  return (
    <>
      <RevealScope />
      <WorldHero world="market" kicker={F.kicker} title={F.title} size="short">
        <p>{F.lede}</p>
      </WorldHero>
      <section className="page-section page-section--flush">
        <div className="container faq-layout">
          <FaqList items={F.items} />
          <aside className="faq-aside" data-reveal="2">
            <div className="cta-row cta-row--stack">
              <Button href="/start" size="lg">{F.ctaPrimary}</Button>
              <Button href="/contact" variant="ghost" size="lg">{F.ctaSecondary}</Button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
