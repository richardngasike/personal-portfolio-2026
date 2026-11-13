export interface ContactInput {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(0, max);
}

// Shared by the browser form and the API route, so both apply the same rules.
export function validateContact(raw: Record<string, unknown>): { data: ContactInput; errors: ContactErrors } {
  const data: ContactInput = {
    fullName: clean(raw.fullName, 200),
    email: clean(raw.email, 300).toLowerCase(),
    subject: clean(raw.subject, 300),
    message: clean(raw.message, 6000),
  };
  const errors: ContactErrors = {};

  if (data.fullName.length < 2) errors.fullName = 'Enter your full name.';
  else if (data.fullName.length > 120) errors.fullName = 'Name must be 120 characters or fewer.';

  if (!data.email) errors.email = 'Enter your email address.';
  else if (data.email.length > 254 || !EMAIL_PATTERN.test(data.email)) errors.email = 'Enter a valid email address.';

  if (data.subject.length < 2) errors.subject = 'Enter a subject.';
  else if (data.subject.length > 200) errors.subject = 'Subject must be 200 characters or fewer.';

  if (data.message.length < 10) errors.message = 'Message must be at least 10 characters.';
  else if (data.message.length > 5000) errors.message = 'Message must be 5,000 characters or fewer.';

  return { data, errors };
}
