-- Issuer billing identity: your address and banking details, shown on every
-- invoice and quotation. Entered once under Admin > Website settings.
-- Paste this whole file into the Supabase SQL Editor and run it once.

alter table public.website_settings
  add column if not exists invoice_from_address text not null default '',
  add column if not exists bank_account_name   text not null default '',
  add column if not exists bank_account_number text not null default '',
  add column if not exists bank_name           text not null default '',
  add column if not exists bank_branch         text not null default '',
  add column if not exists bank_address        text not null default '',
  add column if not exists bank_iban           text not null default '',
  add column if not exists bank_swift          text not null default '',
  add column if not exists mpesa_details       text not null default '';
