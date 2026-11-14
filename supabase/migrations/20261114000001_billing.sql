-- Invoices and quotations.
-- Run this file once in the Supabase SQL Editor (it does not touch any
-- existing table).

create table public.billing_documents (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('invoice', 'quotation')),
  -- Human reference shown on the document, e.g. INV-2026-0007.
  number           text not null unique,
  -- Path of the public link, e.g. invoice/2026/7/28-K7M2Q9XA. The random
  -- code is what keeps the link private to whoever it was shared with.
  share_path       text not null unique,
  status           text not null default 'draft'
                     check (status in ('draft', 'sent', 'paid', 'accepted', 'declined', 'cancelled')),
  title            text not null default '',
  client_name      text not null check (char_length(client_name) between 1 and 200),
  client_company   text not null default '',
  client_email     text not null default '',
  client_phone     text not null default '',
  client_address   text not null default '',
  issue_date       date not null default current_date,
  due_date         date,
  currency         text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  items            jsonb not null default '[]'::jsonb,
  discount         numeric(14, 2) not null default 0 check (discount >= 0),
  tax_rate         numeric(5, 2) not null default 0 check (tax_rate between 0 and 100),
  amount_paid      numeric(14, 2) not null default 0 check (amount_paid >= 0),
  -- Stored so lists and the public page never recompute money differently.
  subtotal         numeric(14, 2) not null default 0,
  tax_amount       numeric(14, 2) not null default 0,
  total            numeric(14, 2) not null default 0,
  balance_due      numeric(14, 2) not null default 0,
  payment_details  text not null default '',
  notes            text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint billing_items_is_array check (jsonb_typeof(items) = 'array'),
  constraint billing_dates_ordered check (due_date is null or due_date >= issue_date)
);

create index billing_documents_list_idx on public.billing_documents (kind, issue_date desc);

create trigger billing_documents_updated_at
  before update on public.billing_documents
  for each row execute function public.set_updated_at();

-- Administrators only. Visitors have no access to this table at all: the
-- public link is served by the application, which looks a document up by its
-- exact share_path with the service role and never lists documents.
alter table public.billing_documents enable row level security;

revoke all on public.billing_documents from anon, authenticated;
grant select, insert, update, delete on public.billing_documents to authenticated;

create policy "billing_documents: admin only" on public.billing_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
