'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/components/admin/Toast';
import { computeTotals, formatMoney, lineTotal } from '@/lib/billing/compute';
import { saveBillingDocument, type BillingInput } from '@/lib/billing/actions';
import {
  CURRENCIES,
  KIND_LABELS,
  STATUS_LABELS,
  STATUSES_BY_KIND,
  type BillingDocument,
  type BillingKind,
  type LineItem,
} from '@/lib/billing/types';

interface BillingFormProps {
  kind: BillingKind;
  id: string | null;
  initial: BillingDocument | null;
}

const EMPTY_ITEM: LineItem = { description: '', quantity: 1, unit_price: 0 };

function today(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
}

export function BillingForm({ kind, id, initial }: BillingFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInvoice = kind === 'invoice';
  const [status, setStatus] = useState(initial?.status ?? 'draft');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [clientName, setClientName] = useState(initial?.client_name ?? '');
  const [clientCompany, setClientCompany] = useState(initial?.client_company ?? '');
  const [clientEmail, setClientEmail] = useState(initial?.client_email ?? '');
  const [clientPhone, setClientPhone] = useState(initial?.client_phone ?? '');
  const [clientAddress, setClientAddress] = useState(initial?.client_address ?? '');
  const [issueDate, setIssueDate] = useState(initial?.issue_date ?? today());
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'KES');
  const [items, setItems] = useState<LineItem[]>(initial?.items?.length ? initial.items : [{ ...EMPTY_ITEM }]);
  const [discount, setDiscount] = useState(String(initial?.discount ?? 0));
  const [taxRate, setTaxRate] = useState(String(initial?.tax_rate ?? 0));
  const [amountPaid, setAmountPaid] = useState(String(initial?.amount_paid ?? 0));
  const [paymentDetails, setPaymentDetails] = useState(initial?.payment_details ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const totals = useMemo(
    () => computeTotals(items, Number(discount) || 0, Number(taxRate) || 0, isInvoice ? Number(amountPaid) || 0 : 0),
    [items, discount, taxRate, amountPaid, isInvoice],
  );

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: field === 'description' ? value : Number(value) } : item,
      ),
    );
  }

  function moveItem(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit(nextStatus?: string) {
    const effectiveStatus = (nextStatus ?? status) as BillingInput['status'];
    const input: BillingInput = {
      kind,
      status: effectiveStatus,
      title,
      client_name: clientName,
      client_company: clientCompany,
      client_email: clientEmail,
      client_phone: clientPhone,
      client_address: clientAddress,
      issue_date: issueDate,
      due_date: dueDate || null,
      currency,
      items,
      discount: Number(discount) || 0,
      tax_rate: Number(taxRate) || 0,
      amount_paid: Number(amountPaid) || 0,
      payment_details: paymentDetails,
      notes,
    };

    startTransition(async () => {
      const result = await saveBillingDocument(id, input);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message || 'The document could not be saved.');
        if (result.errors) {
          const first = Object.keys(result.errors)[0];
          document.getElementById(`bf-${first}`)?.focus();
        }
        return;
      }
      setErrors({});
      setStatus(effectiveStatus);
      toast.success(result.message || 'Saved.');
      if (!id && result.id) router.push(`/admin/billing/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <form
      className="record-form billing-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="billing-form__grid">
        <div className="billing-form__main">
          <section className="panel">
            <header className="panel__header">
              <h2>Client</h2>
            </header>
            <div className="panel__body field-grid">
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-client_name">
                  Client name <span aria-hidden="true">*</span>
                </label>
                <input id="bf-client_name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} aria-invalid={Boolean(errors.client_name)} />
                {errors.client_name ? <p className="field__error">{errors.client_name}</p> : null}
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-client_company">Company</label>
                <input id="bf-client_company" type="text" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-client_email">Email</label>
                <input id="bf-client_email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} aria-invalid={Boolean(errors.client_email)} />
                {errors.client_email ? <p className="field__error">{errors.client_email}</p> : null}
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-client_phone">Phone</label>
                <input id="bf-client_phone" type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="bf-client_address">Address</label>
                <textarea id="bf-client_address" rows={2} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="panel">
            <header className="panel__header panel__header--split">
              <h2>Line items</h2>
              <button type="button" className="abtn abtn--ghost abtn--small" onClick={() => setItems((c) => [...c, { ...EMPTY_ITEM }])}>
                <FiPlus aria-hidden="true" /> Add line
              </button>
            </header>
            <div className="panel__body">
              {errors.items ? <p className="field__error">{errors.items}</p> : null}
              <div className="line-items">
                {items.map((item, index) => (
                  <div key={index} className="line-item">
                    <div className="line-item__desc">
                      <label className="visually-hidden" htmlFor={`bf-item-${index}`}>Description for line {index + 1}</label>
                      <input id={index === 0 ? 'bf-items' : `bf-item-${index}`} type="text" placeholder="Service or description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                    </div>
                    <div className="line-item__qty">
                      <label className="visually-hidden" htmlFor={`bf-qty-${index}`}>Quantity</label>
                      <input id={`bf-qty-${index}`} type="number" min="0" step="any" inputMode="decimal" placeholder="Qty" value={item.quantity || ''} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                    </div>
                    <div className="line-item__price">
                      <label className="visually-hidden" htmlFor={`bf-price-${index}`}>Unit price</label>
                      <input id={`bf-price-${index}`} type="number" min="0" step="any" inputMode="decimal" placeholder="Unit price" value={item.unit_price || ''} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                    </div>
                    <div className="line-item__total">{formatMoney(lineTotal(item), currency)}</div>
                    <div className="line-item__controls">
                      <button type="button" className="icon-button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="Move up"><FiArrowUp aria-hidden="true" /></button>
                      <button type="button" className="icon-button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="Move down"><FiArrowDown aria-hidden="true" /></button>
                      <button type="button" className="icon-button icon-button--danger" onClick={() => setItems((c) => (c.length > 1 ? c.filter((_, i) => i !== index) : c))} disabled={items.length === 1} aria-label="Remove line"><FiTrash2 aria-hidden="true" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <header className="panel__header"><h2>{isInvoice ? 'Payment and notes' : 'Terms and notes'}</h2></header>
            <div className="panel__body field-grid">
              <div className="field">
                <label className="field__label" htmlFor="bf-payment_details">{isInvoice ? 'Payment details' : 'Terms'}</label>
                <textarea id="bf-payment_details" rows={3} value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} placeholder={isInvoice ? 'M-Pesa Paybill, bank account, or other payment instructions' : 'Validity, scope and conditions'} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="bf-notes">Notes</label>
                <textarea id="bf-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        <aside className="billing-form__side">
          <section className="panel">
            <header className="panel__header"><h2>Details</h2></header>
            <div className="panel__body field-grid">
              <div className="field">
                <label className="field__label" htmlFor="bf-title">Title</label>
                <input id="bf-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isInvoice ? 'e.g. Website development' : 'e.g. Mobile app proposal'} />
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-issue_date">Date <span aria-hidden="true">*</span></label>
                <input id="bf-issue_date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} aria-invalid={Boolean(errors.issue_date)} />
                {errors.issue_date ? <p className="field__error">{errors.issue_date}</p> : null}
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-due_date">{isInvoice ? 'Due date' : 'Valid until'}</label>
                <input id="bf-due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-invalid={Boolean(errors.due_date)} />
                {errors.due_date ? <p className="field__error">{errors.due_date}</p> : null}
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-currency">Currency</label>
                <select id="bf-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-status">Status</label>
                <select id="bf-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  {STATUSES_BY_KIND[kind].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="panel">
            <header className="panel__header"><h2>Totals</h2></header>
            <div className="panel__body field-grid">
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-discount">Discount ({currency})</label>
                <input id="bf-discount" type="number" min="0" step="any" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} aria-invalid={Boolean(errors.discount)} />
              </div>
              <div className="field field--half">
                <label className="field__label" htmlFor="bf-tax_rate">Tax rate (%)</label>
                <input id="bf-tax_rate" type="number" min="0" max="100" step="any" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} aria-invalid={Boolean(errors.tax_rate)} />
              </div>
              {isInvoice ? (
                <div className="field">
                  <label className="field__label" htmlFor="bf-amount_paid">Amount paid ({currency})</label>
                  <input id="bf-amount_paid" type="number" min="0" step="any" inputMode="decimal" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} aria-invalid={Boolean(errors.amount_paid)} />
                  {errors.amount_paid ? <p className="field__error">{errors.amount_paid}</p> : null}
                </div>
              ) : null}
            </div>
            <dl className="billing-summary">
              <div><dt>Subtotal</dt><dd>{formatMoney(totals.subtotal, currency)}</dd></div>
              {totals.discount > 0 ? <div><dt>Discount</dt><dd>- {formatMoney(totals.discount, currency)}</dd></div> : null}
              {totals.taxAmount > 0 ? <div><dt>Tax ({taxRate || 0}%)</dt><dd>{formatMoney(totals.taxAmount, currency)}</dd></div> : null}
              <div className="billing-summary__total"><dt>Total</dt><dd>{formatMoney(totals.total, currency)}</dd></div>
              {isInvoice && totals.amountPaid > 0 ? (
                <>
                  <div><dt>Paid</dt><dd>- {formatMoney(totals.amountPaid, currency)}</dd></div>
                  <div className="billing-summary__due"><dt>Amount due</dt><dd>{formatMoney(totals.balanceDue, currency)}</dd></div>
                </>
              ) : null}
            </dl>
          </section>
        </aside>
      </div>

      <div className="record-form__bar">
        <p className="record-form__status">
          {id ? `${KIND_LABELS[kind]} ${initial?.number}` : `New ${kind}`}
        </p>
        <div className="record-form__actions">
          <Link href="/admin/billing" className="abtn abtn--ghost">Cancel</Link>
          <button type="button" className="abtn abtn--ghost" disabled={pending} onClick={() => submit('draft')}>Save draft</button>
          <button type="button" className="abtn abtn--primary" disabled={pending} onClick={() => submit(status === 'draft' ? 'sent' : status)}>
            {pending ? 'Saving...' : id ? 'Save changes' : 'Create and get link'}
          </button>
        </div>
      </div>
    </form>
  );
}
