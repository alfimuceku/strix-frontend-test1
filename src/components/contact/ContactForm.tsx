"use client";

import { useState } from "react";
import { CONTACT } from "@/lib/data";
import { CONTACT_COPY as C } from "@/lib/copy";
import { ApertureMark } from "./ApertureMark";

/**
 * No support endpoint is wired yet, so "Send message" composes the email in the
 * visitor's mail app. Replace `onSubmit` with an API call when one exists.
 */
export function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email address we should reply to.");
    if (message.trim().length < 5) return setError("Add a message so we know how to help.");
    setError(null);
    const body = `${message}\n\nReply to: ${email}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Question from strixoptionsfunding.com")}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the address is visible to copy by hand */
    }
  };

  return (
    <div className="contact-card" data-reveal>
      <div className="contact-card__head">
        <div className="contact-card__title">
          <ApertureMark />
          <div>
            <h2 className="display display--sm">{C.emailTitle}</h2>
            <p>{C.emailSub}</p>
          </div>
        </div>
        <div className="copy-field">
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <button type="button" onClick={copy} aria-live="polite">
            {copied ? C.copied : C.copy}
          </button>
        </div>
      </div>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="contact-email">{C.yourEmail}</label>
          <input id="contact-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="contact-message">{C.message}</label>
          <textarea id="contact-message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--lg">
          <span className="btn__aperture" aria-hidden="true" />
          <span className="btn__label">{C.send}</span>
        </button>
      </form>
    </div>
  );
}
