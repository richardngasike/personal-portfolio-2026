import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

interface ContactCtaProps {
  heading: string;
  text?: string;
}

export function ContactCta({ heading, text }: ContactCtaProps) {
  return (
    <section className="cta" aria-labelledby="contact-cta-heading">
      <div className="container">
        <div className="cta__inner">
        <div>
          <h2 id="contact-cta-heading" className="heading-2">
            {heading}
          </h2>
          {text ? <p>{text}</p> : null}
        </div>
        <Link href="/contact" className="btn btn--primary">
          Get in Touch <FiArrowRight aria-hidden="true" />
        </Link>
        </div>
      </div>
    </section>
  );
}
