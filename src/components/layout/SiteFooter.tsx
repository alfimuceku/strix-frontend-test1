import Link from "next/link";
import { CONTACT, DISCLAIMER } from "@/lib/data";
import { AFFILIATES_URL, SIGN_IN_PATH, START_PATH } from "@/lib/config";
import { Wordmark } from "@/components/ui/Wordmark";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__horizon" aria-hidden="true">
        <span className="site-footer__mark" />
      </div>
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Wordmark />
          <h2>Get started</h2>
          <div className="site-footer__start">
            <Link href={START_PATH} className="btn btn--primary btn--md">
              <span className="btn__aperture" aria-hidden="true" />
              <span className="btn__label">Start an evaluation</span>
            </Link>
            <Link href={SIGN_IN_PATH} className="btn btn--ghost btn--md">
              <span className="btn__aperture" aria-hidden="true" />
              <span className="btn__label">Sign In</span>
            </Link>
          </div>
          <h2>Address</h2>
          <address>
            {CONTACT.office.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </address>
        </div>
        <nav aria-label="Platform">
          <h2>Platform</h2>
          <ul>
            <li><Link href="/plans">Pricing</Link></li>
            <li><Link href="/rules">Rules</Link></li>
            <li><Link href="/payouts">Payouts</Link></li>
            <li><Link href={SIGN_IN_PATH}>Dashboard</Link></li>
            <li><Link href="/rules#every-plan">Approved Tickers</Link></li>
            <li><a href={AFFILIATES_URL}>Affiliates</a></li>
          </ul>
        </nav>
        <nav aria-label="Support">
          <h2>Support</h2>
          <ul>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
          </ul>
          <h2 className="site-footer__h-gap">Resources</h2>
          <ul>
            <li><Link href="/faq">Blog</Link></li>
            <li><Link href="/legal#terms">Terms of Service</Link></li>
            <li><Link href="/legal#privacy">Privacy Policy</Link></li>
            <li><Link href="/legal#rewards">Rewards Terms</Link></li>
            <li><Link href="/rules#live">Live Program Rules</Link></li>
          </ul>
        </nav>
        <nav aria-label="Community">
          <h2>Community</h2>
          <ul>
            <li><a href={CONTACT.discord} {...ext}>Discord</a></li>
            <li><a href={CONTACT.x} {...ext}>X</a></li>
            <li><a href={CONTACT.instagram} {...ext}>Instagram</a></li>
            <li><a href={CONTACT.tiktok} {...ext}>TikTok</a></li>
          </ul>
          <a className="site-footer__trust" href={CONTACT.trustpilot} {...ext}>Review us on Trustpilot</a>
        </nav>
      </div>
      <div className="site-footer__legal">
        {DISCLAIMER.map((d) => (
          <p key={d.title}>
            <strong>{d.title}</strong> {d.body}
          </p>
        ))}
        <p className="site-footer__copy">Copyright © 2026 Strix Options LLC. All rights reserved.</p>
      </div>
    </footer>
  );
}
