'use server';

import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireAdminAction, UnauthorisedError } from '@/lib/auth/require-admin';
import { computeTotals } from './compute';
import { CURRENCIES, KIND_PREFIX, STATUSES_BY_KIND, type BillingKind, type BillingStatus, type LineItem } from './types';

export interface BillingInput {
  kind: BillingKind;
  status: BillingStatus;
  title: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  issue_date: string;
  due_date: string | null;
  currency: string;
  items: LineItem[];
  discount: number;
  tax_rate: number;
  amount_paid: number;
  payment_details: string;
  notes: string;
}

export interface BillingResult {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
// No 0/O or 1/I, so a code read aloud or copied by hand is not misread.
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const MAX_AMOUNT = 999_999_999_999;

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim().slice(0, max) : '';
}

function amount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function shareCode(): string {
  let code = '';
  for (let index = 0; index < 8; index += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

function validate(input: BillingInput) {
  const errors: Record<string, string> = {};
  const kind: BillingKind = input?.kind === 'quotation' ? 'quotation' : 'invoice';
  const status = STATUSES_BY_KIND[kind].includes(input?.status) ? input.status : 'draft';

  const clientName = text(input?.client_name, 200);
  if (!clientName) errors.client_name = 'Enter the client name.';

  const clientEmail = text(input?.client_email, 254).toLowerCase();
  if (clientEmail && !EMAIL_PATTERN.test(clientEmail)) errors.client_email = 'Enter a valid email address.';

  const issueDate = text(input?.issue_date, 10);
  if (!DATE_PATTERN.test(issueDate) || Number.isNaN(Date.parse(issueDate))) errors.issue_date = 'Enter the date.';

  const dueDate = text(input?.due_date, 10) || null;
  if (dueDate && (!DATE_PATTERN.test(dueDate) || Number.isNaN(Date.parse(dueDate)))) errors.due_date = 'Enter a valid date.';
  else if (dueDate && issueDate && dueDate < issueDate) errors.due_date = 'This date cannot be before the document date.';

  const currency = (CURRENCIES as readonly string[]).includes(input?.currency) ? input.currency : 'KES';

  const items: LineItem[] = [];
  for (const raw of Array.isArray(input?.items) ? input.items.slice(0, 100) : []) {
    const description = text(raw?.description, 500);
    const quantity = amount(raw?.quantity);
    const unitPrice = amount(raw?.unit_price);
    if (!description && !quantity && !unitPrice) continue;
    if (!description || Number.isNaN(quantity) || Number.isNaN(unitPrice) || quantity <= 0 || unitPrice < 0 || unitPrice > MAX_AMOUNT || quantity > 1_000_000) {
      errors.items = 'Each line needs a description, a quantity above zero and a price.';
      continue;
    }
    items.push({ description, quantity, unit_price: unitPrice });
  }
  if (items.length === 0 && !errors.items) errors.items = 'Add at least one line.';

  const discount = amount(input?.discount ?? 0);
  if (Number.isNaN(discount) || discount < 0 || discount > MAX_AMOUNT) errors.discount = 'Enter a valid discount.';
  const taxRate = amount(input?.tax_rate ?? 0);
  if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) errors.tax_rate = 'Enter a rate between 0 and 100.';
  const amountPaid = kind === 'invoice' ? amount(input?.amount_paid ?? 0) : 0;
  if (Number.isNaN(amountPaid) || amountPaid < 0 || amountPaid > MAX_AMOUNT) errors.amount_paid = 'Enter a valid amount.';

  const totals = computeTotals(items, discount || 0, taxRate || 0, amountPaid || 0);
  if (!errors.amount_paid && totals.amountPaid > totals.total) errors.amount_paid = 'This is more than the total.';

  return {
    errors,
    kind,
    data: {
      status,
      title: text(input?.title, 200),
      client_name: clientName,
      client_company: text(input?.client_company, 200),
      client_email: clientEmail,
      client_phone: text(input?.client_phone, 40),
      client_address: text(input?.client_address, 500),
      issue_date: issueDate,
      due_date: dueDate,
      currency,
      items,
      discount: totals.discount,
      tax_rate: taxRate || 0,
      amount_paid: totals.amountPaid,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total: totals.total,
      balance_due: totals.balanceDue,
      payment_details: text(input?.payment_details, 2000),
      notes: text(input?.notes, 3000),
    },
  };
}


// Turns a Postgres error into a message the admin can act on. Only admins
// ever see these, so naming the cause is safe and saves a debugging round-trip.
function dbMessage(error: { code?: string; message?: string } | null, fallback: string): string {
  if (!error) return fallback;
  console.error('[billing] db error', error.code, error.message);
  if (error.code === '42P01') return 'The billing table does not exist yet. Run supabase/add-billing.sql in the Supabase SQL Editor, then try again.';
  if (error.code === '42501') return 'You are not authorised, or the billing security policy is missing. Re-run supabase/add-billing.sql.';
  if (error.code === '23514') return 'A value is out of range (check the amounts, tax rate and dates).';
  if (error.code === '23505') return 'That number is already taken. Please try again.';
  return error.message ? `${fallback} (${error.message})` : fallback;
}

export async function saveBillingDocument(id: string | null, input: BillingInput): Promise<BillingResult> {
  try {
    const { supabase } = await requireAdminAction();
    const { errors, kind, data } = validate(input);
    if (Object.keys(errors).length > 0) return { ok: false, message: 'Please correct the highlighted fields.', errors };

    if (id) {
      if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Document not found.' };
      // The number, kind and link never change once a document exists.
      const { error } = await supabase.from('billing_documents').update(data).eq('id', id);
      if (error) return { ok: false, message: dbMessage(error, 'The document could not be saved.') };
      revalidatePath('/admin/billing', 'layout');
      return { ok: true, id, message: 'Saved.' };
    }

    const [year, month, day] = data.issue_date.split('-').map(Number);
    const prefix = `${KIND_PREFIX[kind]}-${year}-`;

    // Next number in this year's series; retried if two saves collide.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: latest } = await supabase
        .from('billing_documents')
        .select('number')
        .like('number', `${prefix}%`)
        .order('number', { ascending: false })
        .limit(1);
      const last = latest?.[0]?.number ? Number(String(latest[0].number).slice(prefix.length)) : 0;
      const number = `${prefix}${String((Number.isFinite(last) ? last : 0) + 1 + attempt).padStart(4, '0')}`;
      const share_path = `${kind}/${year}/${month}/${day}-${shareCode()}`;

      const { data: created, error } = await supabase
        .from('billing_documents')
        .insert({ ...data, kind, number, share_path })
        .select('id')
        .single();

      if (!error && created) {
        revalidatePath('/admin/billing', 'layout');
        return { ok: true, id: created.id as string, message: `${number} created.` };
      }
      if (error?.code !== '23505') return { ok: false, message: dbMessage(error, 'The document could not be created.') };
    }
    return { ok: false, message: 'A unique number could not be assigned. Please try again.' };
  } catch (error) {
    if (error instanceof UnauthorisedError) return { ok: false, message: error.message };
    console.error('[billing]', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}

export async function setBillingStatus(id: string, status: BillingStatus): Promise<BillingResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Document not found.' };
    const { data: row } = await supabase.from('billing_documents').select('kind, total').eq('id', id).maybeSingle();
    if (!row) return { ok: false, message: 'Document not found.' };
    if (!STATUSES_BY_KIND[row.kind as BillingKind].includes(status)) return { ok: false, message: 'That status does not apply.' };

    // Marking an invoice paid settles the balance in the same step.
    const update: Record<string, unknown> = { status };
    if (status === 'paid') {
      update.amount_paid = row.total;
      update.balance_due = 0;
    }
    const { error } = await supabase.from('billing_documents').update(update).eq('id', id);
    if (error) return { ok: false, message: 'The status could not be changed.' };
    revalidatePath('/admin/billing', 'layout');
    return { ok: true, message: 'Status updated.' };
  } catch (error) {
    if (error instanceof UnauthorisedError) return { ok: false, message: error.message };
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}

export async function deleteBillingDocument(id: string): Promise<BillingResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Document not found.' };
    const { error } = await supabase.from('billing_documents').delete().eq('id', id);
    if (error) return { ok: false, message: 'The document could not be deleted.' };
    revalidatePath('/admin/billing', 'layout');
    return { ok: true, message: 'Document deleted. Its link no longer works.' };
  } catch (error) {
    if (error instanceof UnauthorisedError) return { ok: false, message: error.message };
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}
