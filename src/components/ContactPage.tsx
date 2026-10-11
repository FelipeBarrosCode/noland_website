import { useState, type FormEvent } from "react";
import { CookieConsent } from "./CookieConsent";
import { SiteFooter } from "./ExperienceSections";
import { HashScroll } from "./HashScroll";
import { MotionSystem } from "./MotionSystem";
import { Navigation } from "./Navigation";

const CONTACT_EMAIL = "felipe.ba.moura@gmail.com";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submitContactForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = encodeURIComponent(`Noland contact from ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <HashScroll />
      <MotionSystem />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content" className="contact-page">
        <div className="shell contact-page__inner">
          <div className="contact-page__copy">
            <p className="eyebrow"><span aria-hidden="true">//</span> CONTACT</p>
            <h1>Let&apos;s talk about <em>Noland.</em></h1>
            <p>Questions, feedback, or partnership ideas? Send a message and I&apos;ll get back to you.</p>
            <a className="contact-page__email" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>

          <form className="contact-form" onSubmit={submitContactForm}>
            <label>
              <span>Name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Message</span>
              <textarea
                name="message"
                rows={7}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
            </label>
            <button className="button button--primary button--large" type="submit">
              Send email <span aria-hidden="true">↗</span>
            </button>
            <p className="contact-form__note">This opens your email app with the message ready to send.</p>
          </form>
        </div>
      </main>
      <SiteFooter />
      <CookieConsent />
    </>
  );
}
