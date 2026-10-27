# Zecrow

Zecrow is a Zecathon prototype exploring managed escrow for private commerce on Zcash. The proposed flow uses a merchant-created order, shielded Zcash funding, delivery confirmation with a one-time release code, and human review for disputes.

## Current implementation

- Next.js 16 application with a public product site and dashboard prototype.
- Noir Wallet connection accepts a Zcash testnet Unified Address. Sign-in uses a server-issued, one-time challenge, verifies the testnet message signature, and establishes an HTTP-only signed session cookie. Orders are owned by the derived transparent address used for signing, not linked to the shielded Unified Address.
- Merchant listing readiness calls the Groq API when `GROQ_API_KEY` is configured. It reviews the submitted draft and attached images, validates the returned JSON, and gates the wizard. This is a content readiness check, not product authentication or dispute resolution.
- Dispute AI has a provider route and structured report validation, but currently receives sample case data from the UI. It has no user authentication, order access control, evidence upload/storage, or persisted reports.
- Existing dashboard records, transactions, metrics, and disputes are illustrative sample data. Newly created orders appear in the merchant order list.
- When `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` are configured, orders are stored in Supabase Postgres and evidence photos are uploaded to a private Supabase Storage bucket. The migration is in `supabase/migrations/`.
- In local development without Supabase credentials, orders are saved in `.data/escrows.json`. This file store is only a preview fallback and is disabled in production. Buyer URLs contain a random bearer token; only its SHA-256 hash is stored in Supabase. Buyer pages receive short-lived signed photo URLs.
- The Supabase project is not connected yet. Apply the migration and configure the server environment before deploying.
- The local managed-custody backend has been ported to the current Zcash testnet node format: Zallet is built against Zebra v7 with its indexer enabled. A session-protected `/api/zcash/backend-status` route reports its sync/lock state. Set `ZALLET_RPC_URL` and `ZALLET_RPC_COOKIE_FILE` in the server environment to connect the app to it.
- Funding remains disabled because order-specific deposit addresses, a payment watcher, confirmation policy, and reliable payment-to-order association are not implemented. The local Zebra/Zallet wallet must also finish syncing before it can safely operate.
- Release-code verification, dispute decisions, expiry handling, refunds, and managed escrow payouts are not implemented. No AI output can trigger a financial action.

Do not treat the prototype screens as evidence that funds are held, an order was saved, or a decision was recorded.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configure listing AI

Create `.env.local` and add a server-side Groq key:

```text
GROQ_API_KEY=your_key_here
```

The listing checker uses `qwen/qwen3.8-27b` by default. Set `AI_MODEL` only to a model supported by the configured provider and capable of reviewing images for physical listings. Never expose the key with a `NEXT_PUBLIC_` variable.

## Connect Noir Wallet on Zcash testnet

1. Install the official Noir Wallet testnet extension from [Noir Wallet releases](https://github.com/NoirWallet/noir-wallet-sdk/releases). Choose a release asset whose filename ends in `-testnet.zip`.
2. In Chrome, extract the ZIP, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** to select the extracted extension folder.
3. Reload the local app and select **Connect wallet**. Zecrow accepts a connection only when Noir returns a Zcash testnet Unified Address.

The buyer sample page cannot send funds. The app has no order-backed deposit address, payment watcher, confirmation policy, or authenticated payment association. Do not send testnet funds to a configured address through a sample link.

## Remaining work before a real escrow demo

1. Create the hosted Supabase project, apply the migration, and set server secrets. Do not expose the service-role key to the browser.
2. Configure and operate the compatible Zebra v7 + Zallet testnet backend; keep the wallet seed and RPC cookie private and back up wallet data.
3. Implement order-specific testnet deposit addresses, deposit detection, confirmation and idempotency rules, and reliable order association. Keep buyer funding disabled until this is in place.
4. Implement the managed-custody service and secure signing/recovery operations. Define key ownership, backups, and service outage behavior.
5. Add server-validated one-time release codes, delivery deadlines, dispute freezes, and refund/release jobs. No path may bypass an open dispute or repeat a transfer.
6. Persist dispute evidence and AI reports, add participant/arbiter authorization, rate limiting, and audit access.
7. Replace illustrative dashboard records with persisted data, configure hosting and secrets, then run recovery and end-to-end testnet scenarios before claiming live escrow.

## Environment variables

See `.env.example` for placeholders. `.env.local` is private and must not be committed.
