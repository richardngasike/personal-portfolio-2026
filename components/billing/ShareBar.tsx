'use client';

import { useState } from 'react';
import { FiCheck, FiDownload, FiLink, FiPrinter, FiShare2 } from 'react-icons/fi';

interface ShareBarProps {
  url: string;
  pdfHref: string;
  title: string;
}

export function ShareBar({ url, pdfHref, title }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled by the person; nothing to do.
        return;
      }
    }
    await copy();
  }

  return (
    <div className="billing__actions">
      <a className="btn btn--primary" href={pdfHref} download>
        <FiDownload aria-hidden="true" /> Download PDF
      </a>
      <button type="button" className="btn btn--outline" onClick={share}>
        <FiShare2 aria-hidden="true" /> Share
      </button>
      <button type="button" className="btn btn--outline" onClick={copy}>
        {copied ? <FiCheck aria-hidden="true" /> : <FiLink aria-hidden="true" />} {copied ? 'Link copied' : 'Copy link'}
      </button>
      <button type="button" className="btn btn--outline" onClick={() => window.print()}>
        <FiPrinter aria-hidden="true" /> Print
      </button>
    </div>
  );
}
