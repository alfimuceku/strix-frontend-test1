import { WorldHero } from "@/components/ui/WorldHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/lib/data";
import { CONTACT_COPY as C } from "@/lib/copy";
import { RevealScope } from "@/components/motion/RevealScope";

export function ContactView() {
  return (
    <>
      <RevealScope />
      <WorldHero world="monument" kicker={C.kicker} title={C.title} size="short">
        <p>{C.lede}</p>
      </WorldHero>
      <section className="page-section page-section--flush">
        <div className="container contact-layout">
          <ContactForm />
          <div className="contact-side">
            <article className="contact-tile" data-reveal="1">
              <h2 className="display display--sm">{C.discordTitle}</h2>
              <p>{C.discordBody}</p>
              <Button href={CONTACT.discord} variant="ghost">{C.discordCta}</Button>
            </article>
            <article className="contact-tile" data-reveal="2">
              <h2 className="display display--sm">{C.followTitle}</h2>
              <ul className="social">
                <li><a href={CONTACT.discord} target="_blank" rel="noopener noreferrer">Discord</a></li>
                <li><a href={CONTACT.x} target="_blank" rel="noopener noreferrer">X</a></li>
                <li><a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href={CONTACT.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>
              </ul>
            </article>
            <article className="contact-tile" data-reveal="3">
              <h2 className="display display--sm">{C.officeTitle}</h2>
              <address>
                {CONTACT.office.map((l) => <span key={l}>{l}</span>)}
              </address>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
