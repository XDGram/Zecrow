-- The merchant's shielded testnet receiving address, used as the release payout target.
-- This is distinct from merchant_wallet (the sign-in / identity address).
alter table public.escrows
  add column if not exists merchant_payout_address text;
