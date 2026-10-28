alter table public.escrows
  add column if not exists deposit_address text,
  add column if not exists payment_memo text;

create unique index if not exists escrows_payment_memo_unique_idx
  on public.escrows (payment_memo)
  where payment_memo is not null;
