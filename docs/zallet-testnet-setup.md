# Zallet testnet escrow wallet — setup

Zecrow's managed escrow needs a Zcash **testnet** wallet with an RPC interface that the app can
reach. We use [Zallet](https://github.com/zcash/zallet) (the ECC wallet replacing the deprecated
`zcashd` embedded wallet). The app talks to it from `lib/zalletRpc.ts`.

> Zallet is **alpha** — breaking changes happen, and you may have to delete and recreate the
> wallet. Treat this as a demo/testnet wallet only. Never put mainnet funds in it.

## What the app calls

| Purpose | RPC method |
| --- | --- |
| Wallet sync/lock status | `getwalletstatus` |
| Derive a per-order deposit address | `z_getaddressforaccount` |
| Watch for a deposit | `z_listunspent` |
| Release / refund payout | `z_sendfromaccount` |

## 1. Install & initialise

Follow the Zallet book: https://zcash.github.io/wallet . In short:

```bash
# build or install the zallet binary, then:
zallet init                      # creates the config
zallet generate-mnemonic         # or import one; back it up
```

Edit the generated config for **testnet** and point it at a testnet chain source
(a synced `zebrad`/`lightwalletd` testnet node). Let the wallet sync fully.

## 2. Create the escrow account and get its UUID

```bash
zallet rpc z_getnewaccount           # creates an account; note the account_uuid
zallet rpc z_listaccounts            # shows account_uuid values
```

Copy the escrow account's `account_uuid` → this is `ZALLET_ESCROW_ACCOUNT_UUID`.

## 3. Fund it with testnet ZEC (incl. a fee buffer)

Get a deposit address and request testnet ZEC from a faucet:

```bash
zallet rpc z_getaddressforaccount "<account_uuid>" '["orchard"]'
```

Send that address some testnet ZEC from a faucet. **Keep a small buffer** (e.g. 0.01+ TAZ)
beyond what you'll test with: each order deposit is the exact order amount, so the escrow
wallet pays release/refund transaction fees from its own balance.

## 4. Expose the RPC and point the app at it

Start the RPC interface (see `zallet rpc` / `add-rpc-user` in the book). Then set these
**server-only** env vars (local `.env.local`, and the Vercel project for the hosted demo):

```bash
ZALLET_RPC_URL=http://127.0.0.1:28232          # your Zallet RPC endpoint
ZALLET_RPC_COOKIE_FILE=/path/to/.cookie         # "user:pass" basic-auth cookie file
ZALLET_ESCROW_ACCOUNT_UUID=<account_uuid>

# optional tuning
ZEC_REQUIRED_CONFIRMATIONS=1                     # confirmations before an order is "funded"
ZEC_PAYOUT_MINCONF=1                             # min confirmations spent on release/refund
ZALLET_FUND_SOURCE=orchard                       # orchard | sapling | any_transparent
ZALLET_PRIVACY_POLICY=FullPrivacy                # z_sendfromaccount privacy policy
```

The app reads the cookie file for HTTP basic auth, so the Next.js server process must be able
to read it. On Vercel (serverless) a local Zallet node isn't reachable — run the hosted demo
against a Zallet node exposed over an authenticated, HTTPS-reachable URL, or demo locally.

## 5. Verify

With the wallet unlocked and synced:

- Dashboard → Wallet should show the backend status as reachable.
- Create an order, open its buyer link, Accept → a deposit address appears.
- Pay it from a Noir testnet wallet → the order flips to **funded** after `ZEC_REQUIRED_CONFIRMATIONS`.
- Click **Confirm delivery & release** → `z_sendfromaccount` pays the merchant; the order shows **released** with the payout txid.

If a step returns an "unavailable" message, the wallet is unset, locked, still syncing, or
out of fee funds — the API surfaces which, and never fabricates a success.
