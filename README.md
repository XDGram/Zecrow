# Zecrow

Zecrow is a Zecathon prototype exploring managed escrow for private commerce on Zcash. The proposed flow uses a merchant-created order, shielded Zcash funding, delivery confirmation with a one-time release code, and human review for disputes.

## Current implementation

- Next.js 16 application with a public product site and dashboard prototype.
- Noir Wallet connection accepts a Zcash testnet Unified Address. Sign-in uses a server-issued, one-time challenge, verifies the testnet message signature, and establishes an HTTP-only signed session cookie. Orders are owned by the derived transparent address used for signing, not linked to the shielded Unified Address.
- Merchant listing readiness calls Gemini when `GEMINI_API_KEY` is configured. It reviews the submitted draft and attached images, validates the returned JSON, and gates the wizard. This is a content readiness check, not product authentication or dispute resolution.
- Dispute AI has a provider route and structured report validation, but currently receives sample case data from the UI. It has no user authentication, order access control, evidence upload/storage, or persisted reports.
- Existing dashboard records, transactions, metrics, and disputes are illustrative sample data. Newly created orders appear in the merchant order list.
- When `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` are configured, orders are stored in Supabase Postgres and evidence photos are uploaded to a private Supabase Storage bucket. The migration is in `supabase/migrations/`.
- In local development without Supabase credentials, orders are saved in `.data/escrows.json`. This file store is only a preview fallback and is disabled in production. Buyer URLs contain a random bearer token; only its SHA-256 hash is stored in Supabase. Buyer pages receive short-lived signed photo URLs.
- The Supabase project is not connected yet. Apply the migration and configure the server environment before deploying.
- The local managed-custody backend uses Zallet with Zebra testnet. A session-protected `/api/zcash/backend-status` route reports its sync/lock state. Set `ZALLET_RPC_URL`, `ZALLET_RPC_COOKIE_FILE`, and `ZALLET_ESCROW_ACCOUNT_UUID` in the server environment to derive shielded payment addresses.
- The buyer link can initiate a shielded Noir Wallet testnet payment and poll Zallet for a note carrying that order's private memo reference. The server matches the memo, amount, and confirmations before marking an order funded. This polling is buyer-page driven; there is not yet a background payment watcher.
- Release-code verification, dispute decisions, expiry handling, refunds, and managed escrow payouts are not implemented. No AI output can trigger a financial action.

Do not treat the prototype screens as evidence that funds are held, an order was saved, or a decision was recorded.

## How the AI, the release code, and images fit together

### AI review (advisory only — it never decides or moves funds)

There are two distinct AI roles, and neither can trigger a financial action. Every prompt treats listing/case text as untrusted data, not instructions, and every model response is validated against a strict server-side schema before it is shown; invalid or unconfigured responses fail honestly rather than being fabricated.

- **Listing quality reviewer** (`lib/listingCheck.ts`, `/api/escrows/listing-check`). Gates the create-order wizard. It compares the merchant's claims and photos against each other and reports what is and is not supported. It explicitly cannot authenticate goods, prove ownership, or guarantee a dispute outcome — it is a readiness check, not product authentication.
- **Dispute evidence organizer** (`lib/aiReview.ts`, `/api/escrows/[id]/ai-review`). Summarizes and organizes dispute evidence for a **human arbiter**. By design it keeps "buyer wins"/"merchant wins" out of its output, separates supported facts from unproven claims, flags possible manipulation only as an unverified concern, and emits a versioned structured report (`zecrow.ai-review.v1`). A human makes the decision separately. This route currently accepts caller-supplied sample data and has no access control, so it must not be exposed as a live service yet.

### One-time release code (the delivery-confirmation trigger)

Every order uses the same fixed platform release trigger: *"The buyer confirms delivery with the one-time Zecrow release code"* (`CODE_RELEASE_TERMS`). This term is written into each order at creation and surfaced to the listing reviewer as fixed policy, so the release condition is consistent across all orders and is not something a merchant can redefine. A fixed dispute window (currently 7 days) accompanies it.

What is **not** implemented yet: the `release` route only gates on request origin and a `funded` status. **Server-validated verification of the one-time code is still a stub** — possession of the order link is deliberately noted in the code as insufficient proof for a production release. No path releases or refunds funds based on AI output.

### How images support the flow

Images do real work in two places, both with privacy guardrails:

- **At listing time**, the reviewer inspects the actual pixels of each supplied product photo (up to three, which may be arranged as numbered panels on a single contact sheet) and returns one finding per photo — whether each plausibly depicts the described item and whether it contradicts a written claim. A "strong" verdict requires every photo to match. Validated item-stage image findings can be reused in the later terms step so the same pixels are not re-billed for re-inspection.
- **At dispute time**, an optional reverse-image / web-detection provenance check (`lib/imageProvenance.ts`) can see whether a submitted photo also appears elsewhere online. It is **consent-gated and provider-gated**: nothing is sent to a third party without explicit consent, no provider adapter is wired yet (so it currently reports an honest `unavailable`), and a match is treated only as an unverified concern — never as proof of fraud.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configure listing AI

Create `.env.local` and add a server-side Gemini key:

```text
GEMINI_API_KEY=your_key_here
```

The listing checker uses `gemini-3.5-flash-lite` by default. Set `AI_MODEL` only to a model supported by Gemini and capable of reviewing images for physical listings. Never expose the key with a `NEXT_PUBLIC_` variable.

## Connect Noir Wallet on Zcash testnet

1. Install the official Noir Wallet testnet extension from [Noir Wallet releases](https://github.com/NoirWallet/noir-wallet-sdk/releases). Choose a release asset whose filename ends in `-testnet.zip`.
2. In Chrome, extract the ZIP, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** to select the extracted extension folder.
3. Reload the local app and select **Connect wallet**. Zecrow accepts a connection only when Noir returns a Zcash testnet Unified Address.

The buyer page can start a shielded Noir Wallet payment only after Zallet derives an order deposit address. Do not send funds unless the page displays that order's address and payment is marked available. Release and refund transfers are still unimplemented.

## Remaining work before a real escrow demo

1. Create the hosted Supabase project, apply the migration, and set server secrets. Do not expose the service-role key to the browser.
2. Configure and operate the compatible Zebra v7 + Zallet testnet backend; keep the wallet seed and RPC cookie private and back up wallet data.
3. Initialize and back up a Zallet escrow account, configure its UUID, and verify that the wallet is unlocked and synchronized before accepting testnet funds.
4. Add a server-side payment watcher and harden payment matching for late, partial, duplicate, and reorged deposits. Current status polling runs only while the buyer order page is open.
5. Implement the managed-custody service and secure signing/recovery operations. Define key ownership, backups, and service outage behavior.
6. Add server-validated one-time release codes, delivery deadlines, dispute freezes, and refund/release jobs. No path may bypass an open dispute or repeat a transfer.
7. Persist dispute evidence and AI reports, add participant/arbiter authorization, rate limiting, and audit access.
8. Replace illustrative dashboard records with persisted data, configure hosting and secrets, then run recovery and end-to-end testnet scenarios before claiming live escrow.

## Environment variables

See `.env.example` for placeholders. `.env.local` is private and must not be committed.
