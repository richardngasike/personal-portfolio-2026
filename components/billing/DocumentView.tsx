import { formatDate, formatMoney, lineTotal } from '@/lib/billing/compute';
import { KIND_LABELS, STATUS_LABELS, type BillingDocument, type Issuer } from '@/lib/billing/types';

interface DocumentViewProps {
  document: BillingDocument;
  issuer: Issuer;
}

// The document as the client sees it. The PDF in lib/billing/pdf.ts follows
// the same structure, so the page and the download match.
export function DocumentView({ document, issuer }: DocumentViewProps) {
  const isInvoice = document.kind === 'invoice';
  const label = KIND_LABELS[document.kind];
  const clientLines = [document.client_company, ...document.client_address.split('\n'), document.client_email, document.client_phone].filter(Boolean);

  return (
    <article className={`doc doc--${document.kind}`} aria-label={`${label} ${document.number}`}>
      <header className="doc__header">
        <div className="doc__issuer">
          {issuer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="doc__logo" src={issuer.logoUrl} alt={issuer.name} />
          ) : (
            <p className="doc__issuer-name">{issuer.name}</p>
          )}
          <p className="doc__issuer-contact">{[issuer.location, issuer.email, issuer.phone].filter(Boolean).join(' / ')}</p>
        </div>
        <div className="doc__title">
          <h1>{label}</h1>
          <p className="doc__number">{document.number}</p>
        </div>
      </header>

      <section className="doc__parties">
        <div>
          <h2 className="doc__label">{isInvoice ? 'Billed to' : 'Prepared for'}</h2>
          <p className="doc__client">{document.client_name}</p>
          {clientLines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <dl className="doc__facts">
          <div>
            <dt>Date</dt>
            <dd>{formatDate(document.issue_date)}</dd>
          </div>
          {document.due_date ? (
            <div>
              <dt>{isInvoice ? 'Due date' : 'Valid until'}</dt>
              <dd>{formatDate(document.due_date)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Status</dt>
            <dd>
              <span className="doc__status" data-status={document.status}>
                {STATUS_LABELS[document.status]}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {document.title ? <p className="doc__subject">{document.title}</p> : null}

      <div className="doc__table-wrap">
        <table className="doc__table">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col" className="doc__num">Qty</th>
              <th scope="col" className="doc__num">Unit price</th>
              <th scope="col" className="doc__num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, index) => (
              <tr key={index}>
                <td data-label="Description">{item.description}</td>
                <td data-label="Qty" className="doc__num">{item.quantity}</td>
                <td data-label="Unit price" className="doc__num">{formatMoney(item.unit_price, '').trim()}</td>
                <td data-label="Amount" className="doc__num doc__amount">{formatMoney(lineTotal(item), '').trim()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="doc__summary">
        <div className="doc__terms">
          {document.payment_details ? (
            <div>
              <h2 className="doc__label">{isInvoice ? 'Payment details' : 'Terms'}</h2>
              <p className="doc__pre">{document.payment_details}</p>
            </div>
          ) : null}
          {document.notes ? (
            <div>
              <h2 className="doc__label">Notes</h2>
              <p className="doc__pre">{document.notes}</p>
            </div>
          ) : null}
        </div>

        <dl className="doc__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatMoney(document.subtotal, document.currency)}</dd>
          </div>
          {document.discount > 0 ? (
            <div>
              <dt>Discount</dt>
              <dd>- {formatMoney(document.discount, document.currency)}</dd>
            </div>
          ) : null}
          {document.tax_amount > 0 ? (
            <div>
              <dt>Tax ({document.tax_rate}%)</dt>
              <dd>{formatMoney(document.tax_amount, document.currency)}</dd>
            </div>
          ) : null}
          <div className="doc__total">
            <dt>Total</dt>
            <dd>{formatMoney(document.total, document.currency)}</dd>
          </div>
          {isInvoice && document.amount_paid > 0 ? (
            <div>
              <dt>Paid</dt>
              <dd>- {formatMoney(document.amount_paid, document.currency)}</dd>
            </div>
          ) : null}
          <div className="doc__due">
            <dt>{isInvoice ? 'Amount due' : 'Quoted total'}</dt>
            <dd>{formatMoney(isInvoice ? document.balance_due : document.total, document.currency)}</dd>
          </div>
        </dl>
      </section>

      {!isInvoice ? <p className="doc__accept">To accept this quotation, reply to confirm and work will be scheduled.</p> : null}

      <footer className="doc__footer">{[issuer.name, issuer.email, issuer.phone, issuer.website].filter(Boolean).join(' / ')}</footer>
    </article>
  );
}
