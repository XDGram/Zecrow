create table if not exists public.escrows (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 5000),
  public_code_hash text not null unique,
  merchant_wallet text not null,
  item_type text not null check (item_type in ('physical', 'digital')),
  item text not null check (char_length(item) between 3 and 200),
  amount_zec numeric(20, 8) not null check (amount_zec > 0),
  description text not null check (char_length(description) between 40 and 2000),
  delivery_method text not null,
  shipping text not null default '',
  confirmation text not null default '',
  proof text not null default '',
  release_terms text not null check (char_length(release_terms) between 10 and 600),
  dispute_window_days integer not null check (dispute_window_days in (3, 7, 14)),
  link_expiry_hours integer not null check (link_expiry_hours in (24, 72, 168)),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'expired', 'funded', 'delivered', 'disputed', 'released', 'refunded')),
  payment_status text not null default 'not_connected' check (payment_status in ('not_connected', 'pending', 'confirmed', 'failed')),
  payment_txid text,
  payment_confirmations integer not null default 0 check (payment_confirmations >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists escrows_merchant_created_idx on public.escrows (merchant_wallet, created_at desc);
create index if not exists escrows_status_expiry_idx on public.escrows (status, expires_at);

create table if not exists public.escrow_evidence (
  id uuid primary key default gen_random_uuid(),
  escrow_id uuid not null references public.escrows(id) on delete cascade,
  object_path text not null unique,
  file_name text not null check (char_length(file_name) <= 120),
  position smallint not null check (position between 0 and 2),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  created_at timestamptz not null default now(),
  unique (escrow_id, position)
);

create table if not exists public.escrow_events (
  id uuid primary key default gen_random_uuid(),
  escrow_id uuid not null references public.escrows(id) on delete cascade,
  actor_wallet text,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists escrow_events_order_time_idx on public.escrow_events (escrow_id, created_at);

create table if not exists public.wallet_auth_challenges (
  nonce_hash text primary key,
  expires_at timestamptz not null,
  consumed_at timestamptz
);

alter table public.escrows enable row level security;
alter table public.escrow_evidence enable row level security;
alter table public.escrow_events enable row level security;
alter table public.wallet_auth_challenges enable row level security;

revoke all on public.escrows, public.escrow_evidence, public.escrow_events, public.wallet_auth_challenges from anon, authenticated;
grant all on public.escrows, public.escrow_evidence, public.escrow_events, public.wallet_auth_challenges to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('escrow-evidence', 'escrow-evidence', false, 2000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

