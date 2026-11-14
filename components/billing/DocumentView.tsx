import { formatDate, formatMoney, lineTotal } from '@/lib/billing/compute';
import { amountInWords } from '@/lib/billing/words';
import { KIND_LABELS, STATUS_LABELS, type BillingDocument, type Issuer } from '@/lib/billing/types';

interface DocumentViewProps {
  document: BillingDocument;
  issuer: Issuer;
  shareUrl: string;
}

// The document as the client sees it, matching Richard's formal invoice
// template: red section headings and table header, grey info panels, a
// numbered deliverables table, amount in words, banking details and a
// signature block. The PDF in lib/billing/pdf.ts follows the same structure.
export function DocumentView({ document, issuer, shareUrl }: DocumentViewProps) {
  const isInvoice = document.kind === 'invoice';
  const label = KIND_LABELS[document.kind].toUpperCase();
  const issuerAddress = issuer.address.split('\n').filter(Boolean);
  const clientAddress = document.client_address.split('\n').filter(Boolean);
  const year = document.issue_date.slice(0, 4);

  const details: Array<[string, string]> = [
    [`${KIND_LABELS[document.kind]} No.`, document.number],
    [`${KIND_LABELS[document.kind]} date`, formatDate(document.issue_date)],
  ];
  if (document.due_date) details.push([isInvoice ? 'Due date' : 'Valid until', formatDate(document.due_date)]);
  details.push(['Currency', document.currency]);
  details.push(['Status', STATUS_LABELS[document.status]]);

  const banking: Array<[string, string]> = [
    ['Account holder name', issuer.banking.accountName],
    ['Account number', issuer.banking.accountNumber],
    ['Bank name', issuer.banking.bankName],
    ['Branch', issuer.banking.branch],
    ['Bank address', issuer.banking.bankAddress],
    ['IBAN number', issuer.banking.iban],
    ['SWIFT code', issuer.banking.swift],
    ['M-Pesa', issuer.banking.mpesa],
  ].filter(([, value]) => value) as Array<[string, string]>;

  const showBanking = isInvoice && (banking.length > 0 || Boolean(document.payment_details));

  return (
    <article className={`inv inv--${document.kind}`} aria-label={`${KIND_LABELS[document.kind]} ${document.number}`}>
      <div className="inv__page">
        <span className="inv__rule" aria-hidden="true" />

        <header className="inv__head">
          <h1 className="inv__title">{label}</h1>
          {document.title ? <p className="inv__subtitle">{document.title}</p> : null}
        </header>

        <section className="inv__panels">
          <div className="inv__panel">
            {issuer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="inv__logo" src={issuer.logoUrl} alt={issuer.name} />
            ) : null}
            <p className="inv__party-name">{issuer.name}</p>
            {issuerAddress.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {issuer.phone ? <p><span className="inv__k">Phone</span>: {issuer.phone}</p> : null}
            {issuer.email ? <p><span className="inv__k">E-Mail</span>: {issuer.email}</p> : null}
          </div>
          <div className="inv__panel">
            <h2 className="inv__panel-title">{KIND_LABELS[document.kind]} details</h2>
            <dl className="inv__details">
              {details.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}:</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="inv__section">
          <h2 className="inv__heading">{isInvoice ? 'Bill to' : 'Prepared for'}</h2>
          <div className="inv__billto">
            <p className="inv__party-name">{document.client_name}</p>
            {document.client_company ? <p>{document.client_company}</p> : null}
            {clientAddress.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {document.client_email ? <p>{document.client_email}</p> : null}
            {document.client_phone ? <p>{document.client_phone}</p> : null}
          </div>
        </section>

        <section className="inv__section">
          <h2 className="inv__heading">{isInvoice ? 'Deliverables' : 'Items'}</h2>
          <table className="inv__table">
            <thead>
              <tr>
                <th className="inv__c-no">No.</th>
                <th>Description</th>
                <th className="inv__c-num">Qty</th>
                <th className="inv__c-num">Unit price ({document.currency})</th>
                <th className="inv__c-num">Total ({document.currency})</th>
              </tr>
            </thead>
            <tbody>
              {document.items.map((item, index) => (
                <tr key={index}>
                  <td className="inv__c-no" data-label="No.">{index + 1}</td>
                  <td data-label="Description">{item.description}</td>
                  <td className="inv__c-num" data-label="Qty">{item.quantity}</td>
                  <td className="inv__c-num" data-label="Unit price">{formatMoney(item.unit_price, '').trim()}</td>
                  <td className="inv__c-num" data-label="Total">{formatMoney(lineTotal(item), '').trim()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="inv__total-row">
                <td colSpan={4}>TOTAL</td>
                <td className="inv__c-num inv__total-amount">{formatMoney(document.total, '').trim()}</td>
              </tr>
            </tfoot>
          </table>

          {document.discount > 0 || document.tax_amount > 0 || (isInvoice && document.amount_paid > 0) ? (
            <dl className="inv__adjust">
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
              {isInvoice && document.amount_paid > 0 ? (
                <>
                  <div>
                    <dt>Paid</dt>
                    <dd>- {formatMoney(document.amount_paid, document.currency)}</dd>
                  </div>
                  <div className="inv__adjust-due">
                    <dt>Amount due</dt>
                    <dd>{formatMoney(document.balance_due, document.currency)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          ) : null}
        </section>

        <section className="inv__section">
          <h2 className="inv__heading">Amount in words</h2>
          <p className="inv__words">{amountInWords(isInvoice ? document.balance_due : document.total, document.currency)}</p>
        </section>

        {showBanking ? (
          <section className="inv__section">
            <h2 className="inv__heading">Banking details</h2>
            {banking.length > 0 ? (
              <table className="inv__bank">
                <tbody>
                  {banking.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {document.payment_details ? <p className="inv__pre">{document.payment_details}</p> : null}
          </section>
        ) : null}

        {!isInvoice && (document.payment_details || document.notes) ? (
          <section className="inv__section">
            <h2 className="inv__heading">Terms</h2>
            {document.payment_details ? <p className="inv__pre">{document.payment_details}</p> : null}
          </section>
        ) : null}

        {document.notes && isInvoice ? (
          <section className="inv__section">
            <h2 className="inv__heading">Notes</h2>
            <p className="inv__pre">{document.notes}</p>
          </section>
        ) : null}
        {document.notes && !isInvoice ? <p className="inv__pre inv__notes">{document.notes}</p> : null}

        <p className="inv__footline">
          {KIND_LABELS[document.kind]} - {issuer.name}
          {document.client_company || document.client_name ? ` | ${document.client_company || document.client_name}` : ''} | {year}
        </p>
      </div>

      <div className="inv__page inv__page--sign">
        <span className="inv__rule" aria-hidden="true" />
        <section className="inv__sign">
          <div className="inv__sign-col">
            <p className="inv__party-name">{issuer.name}</p>
            <p className="inv__sign-role">{isInvoice ? 'Service provider' : 'Prepared by'}</p>
            {issuer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="inv__sign-mark" src={issuer.logoUrl} alt="" />
            ) : null}
            <p className="inv__sign-line">Signature: ____________________________</p>
            <p className="inv__sign-line">Date: {formatDate(document.issue_date)}</p>
          </div>
          <div className="inv__sign-col">
            <p className="inv__party-name">For {document.client_company || document.client_name}</p>
            <p className="inv__sign-role">{isInvoice ? 'Received / Approved' : 'Accepted'}</p>
            <p className="inv__sign-line">Name: ____________________________</p>
            <p className="inv__sign-line">Signature / Date: ____________________</p>
          </div>
        </section>

        <footer className="inv__footer">
          <p className="inv__web">{issuer.website}</p>
          <p className="inv__link">{shareUrl}</p>
        </footer>
      </div>
    </article>
  );
}
