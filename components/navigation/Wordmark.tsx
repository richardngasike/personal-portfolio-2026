import Link from 'next/link';

interface WordmarkProps {
  text: string;
  logoUrl?: string | null;
}

// Site identity in the header and footer. When a signature or logo has been
// uploaded in Admin > Website settings it replaces the name; the name stays
// in the markup for screen readers and search engines.
export function Wordmark({ text, logoUrl }: WordmarkProps) {
  return (
    <Link href="/" className={`wordmark${logoUrl ? ' wordmark--image' : ''}`} aria-label={`${text}, home`}>
      {logoUrl ? (
        <>
          {/* Administrator-supplied asset of unknown dimensions. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" />
          <span className="visually-hidden">{text}</span>
        </>
      ) : (
        <span>{text}</span>
      )}
    </Link>
  );
}
