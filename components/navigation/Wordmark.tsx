import Link from 'next/link';

interface WordmarkProps {
  text: string;
  logoUrl?: string | null;
}

export function Wordmark({ text, logoUrl }: WordmarkProps) {
  return (
    <Link href="/" className="wordmark" aria-label={`${text}, home`}>
      {logoUrl ? (
        // The logo is an administrator-supplied asset of unknown dimensions.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" />
      ) : null}
      <span>{text}</span>
    </Link>
  );
}
