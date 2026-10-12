"use client";

import Link from "next/link";
import { useState } from "react";
import { WorldBackdrop } from "@/components/ui/WorldHero";
import { Wordmark } from "@/components/ui/Wordmark";
import { SIGNIN_COPY as S } from "@/lib/copy";
import { AUTH_HANDOFF_URL } from "@/lib/config";

/**
 * Sign in. Authentication lives on the existing dashboard platform, so a valid
 * submission (and the Google / reset actions) hand over to it.
 */
export function SignInView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email address you signed up with.");
    if (!password) return setError("Enter your password.");
    setError(null);
    window.location.href = AUTH_HANDOFF_URL;
  };

  return (
    <section className="auth" aria-labelledby="signin-title">
      <div className="auth__form-side">
        <div className="auth__form-wrap">
          <h1 id="signin-title" className="display display--lg">{S.title}</h1>
          <p className="auth__lede">{S.lede}</p>
          <form className="form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="si-email">{S.email}</label>
              <input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="si-password">{S.password}</label>
              <div className="pw">
                <input id="si-password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="pw__toggle" onClick={() => setShow((v) => !v)} aria-pressed={show}>
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="auth__row">
              <div className="check">
                <input id="si-keep" type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
                <label htmlFor="si-keep">{S.keep}</label>
              </div>
              <a href={AUTH_HANDOFF_URL} className="auth__link">{S.reset}</a>
            </div>
            {error && <p className="form__error" role="alert">{error}</p>}
            <button type="submit" className="btn btn--primary btn--lg btn--block">
              <span className="btn__aperture" aria-hidden="true" />
              <span className="btn__label">{S.submit}</span>
            </button>
          </form>
          <p className="auth__or"><span>{S.or}</span></p>
          <a href={AUTH_HANDOFF_URL} className="btn btn--ghost btn--lg btn--block auth__google">
            <span className="btn__aperture" aria-hidden="true" />
            <svg className="auth__g" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#F5F8FF" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.98-4.3 2.98-7.33z" />
              <path fill="#9DDCFF" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
              <path fill="#3185FF" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9z" />
              <path fill="#175CFF" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98z" />
            </svg>
            <span className="btn__label">{S.google}</span>
          </a>
          <p className="auth__new">
            {S.newTo} <Link href="/start">{S.start}</Link>
          </p>
        </div>
      </div>

      <aside className="auth__panel" aria-label={S.panelKicker}>
        <WorldBackdrop world="portal" className="auth__world" />
        <div className="auth__panel-inner">
          <p className="auth__kicker">
            <Wordmark /> <span>{S.panelKicker}</span>
          </p>
          <h2 className="display display--md">{S.panelTitle}</h2>
          <ul className="auth__points">
            {S.points.map((p) => (
              <li key={p.label}>
                <strong>{p.value}</strong>
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
          <ul className="auth__quotes">
            {S.quotes.map((q) => (
              <li key={q.name}>
                <figure>
                  <blockquote>{q.text}</blockquote>
                  <figcaption>
                    <span className="auth__avatar" aria-hidden="true">{q.initial}</span>
                    <span>
                      <strong>{q.name}</strong>
                      <small>{q.plan}</small>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
