export type BillingKind = 'invoice' | 'quotation';
export type BillingStatus = 'draft' | 'sent' | 'paid' | 'accepted' | 'declined' | 'cancelled';

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface BillingDocument {
  id: string;
  kind: BillingKind;
  number: string;
  share_path: string;
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
  subtotal: number;
  tax_amount: number;
  total: number;
  balance_due: number;
  payment_details: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Details of the business issuing the document, read from the profile and
// website settings so documents always carry the current brand.
export interface BankingDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  bankAddress: string;
  iban: string;
  swift: string;
  mpesa: string;
}

export interface Issuer {
  name: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  website: string;
  logoUrl: string | null;
  banking: BankingDetails;
}

export const KIND_LABELS: Record<BillingKind, string> = { invoice: 'Invoice', quotation: 'Quotation' };
export const KIND_PREFIX: Record<BillingKind, string> = { invoice: 'INV', quotation: 'QUO' };

export const STATUS_LABELS: Record<BillingStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

// Statuses that make sense for each kind of document.
export const STATUSES_BY_KIND: Record<BillingKind, BillingStatus[]> = {
  invoice: ['draft', 'sent', 'paid', 'cancelled'],
  quotation: ['draft', 'sent', 'accepted', 'declined', 'cancelled'],
};

export const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS'] as const;
