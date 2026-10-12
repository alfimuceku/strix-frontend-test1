import { FaqItem } from "./FaqItem";

/** Native <details> disclosures with an animated answer height (see FaqItem). */
export function FaqList({ items, openFirst = true }: { items: { q: string; a: string }[]; openFirst?: boolean }) {
  return (
    <div className="faq">
      {items.map((f, i) => (
        <FaqItem key={f.q} q={f.q} a={f.a} open={openFirst && i === 0} />
      ))}
    </div>
  );
}
