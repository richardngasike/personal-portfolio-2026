'use client';

import { useRef, useState, type FormEvent } from 'react';
import { FiCheckCircle, FiSend } from 'react-icons/fi';
import { validateContact, type ContactErrors, type ContactInput } from '@/lib/validations/contact';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY: ContactInput = { fullName: '', email: '', subject: '', message: '' };

export function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');
  const [website, setWebsite] = useState('');
  const startedAt = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  function update(field: keyof ContactInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const { data, errors: found } = validateContact({ ...values });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setStatus('error');
      setFeedback('Please correct the highlighted fields.');
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus('submitting');
    setFeedback('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, website, startedAt: startedAt.current }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        errors?: ContactErrors;
      } | null;

      if (response.ok && result?.ok) {
        setStatus('success');
        setValues(EMPTY);
        setErrors({});
        startedAt.current = Date.now();
        return;
      }

      setErrors(result?.errors ?? {});
      setStatus('error');
      setFeedback(result?.message || 'Your message could not be sent. Please try again.');
    } catch {
      setStatus('error');
      setFeedback('Your message could not be sent. Check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <FiCheckCircle aria-hidden="true" />
        <h3 className="heading-3">Message sent</h3>
        <p>Thank you for getting in touch. I will reply to the email address you provided.</p>
        <button type="button" className="btn btn--outline btn--small" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  const fields: Array<{ name: keyof ContactInput; label: string; type: string; autoComplete?: string }> = [
    { name: 'fullName', label: 'Full name', type: 'text', autoComplete: 'name' },
    { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
    { name: 'subject', label: 'Subject', type: 'text' },
  ];

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
      {fields.map((field) => (
        <div key={field.name} className="form__field">
          <label htmlFor={`contact-${field.name}`}>{field.label}</label>
          <input
            id={`contact-${field.name}`}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            onChange={(event) => update(field.name, event.target.value)}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={errors[field.name] ? `contact-${field.name}-error` : undefined}
            required
          />
          {errors[field.name] ? (
            <p id={`contact-${field.name}-error`} className="form__error">
              {errors[field.name]}
            </p>
          ) : null}
        </div>
      ))}

      <div className="form__field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          required
        />
        {errors.message ? (
          <p id="contact-message-error" className="form__error">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive technology, visible to bots. */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {status === 'error' && feedback ? (
        <p className="form__alert" role="alert">
          {feedback}
        </p>
      ) : null}

      <button type="submit" className="btn btn--dark btn--block" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
        <FiSend aria-hidden="true" />
      </button>
    </form>
  );
}
