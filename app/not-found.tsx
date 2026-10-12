import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="page-section not-found">
      <div className="container">
        <h1 className="display display--lg">This page is outside the map.</h1>
        <p className="prose">The link may be old or mistyped. Head back to the start or see the plans.</p>
        <div className="cta-row">
          <Button href="/" size="lg">Go to the homepage</Button>
          <Button href="/plans" variant="ghost" size="lg">See the plans</Button>
        </div>
      </div>
    </section>
  );
}
