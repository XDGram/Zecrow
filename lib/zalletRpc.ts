import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

type JsonRpcEnvelope<T> = { result?: T; error?: { message?: string; code?: number } };
type ReceivedNote = { txid?: string; address?: string; value?: number; valueZat?: number; confirmations?: number; memo?: string; memoStr?: string };

export type ZalletWalletStatus = {
  node_tip: { height: number };
  wallet_tip?: { height: number };
  fully_synced_height?: number;
  sync_work_remaining?: {
    unscanned_blocks: number;
    progress: { numerator: number; denominator: number };
  };
  locked: boolean;
};

async function zalletRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const endpoint = process.env.ZALLET_RPC_URL;
  const cookiePath = process.env.ZALLET_RPC_COOKIE_FILE;
  if (!endpoint || !cookiePath) throw new Error("zallet_not_configured");

  const cookie = (await readFile(cookiePath, "utf8")).trim();
  if (!cookie || !cookie.includes(":")) throw new Error("zallet_auth_not_configured");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${Buffer.from(cookie).toString("base64")}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: randomUUID(), method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error("zallet_unavailable");

  const payload = await response.json() as JsonRpcEnvelope<T>;
  const status = payload.result;
  if (payload.error) throw new Error(`zallet_rpc_${payload.error.code ?? "error"}`);
  if (status === undefined || status === null) throw new Error("zallet_invalid_response");
  return status;
}

export async function getZalletWalletStatus(): Promise<ZalletWalletStatus> {
  const status = await zalletRpc<ZalletWalletStatus>("getwalletstatus");
  if (typeof status.locked !== "boolean" || !Number.isSafeInteger(status.node_tip?.height)) throw new Error("zallet_invalid_response");
  return status;
}

/** Derive a fresh testnet Unified Address with shielded receivers only. */
export async function createEscrowDepositDetails(): Promise<{ address: string; memo: string }> {
  const account = process.env.ZALLET_ESCROW_ACCOUNT_UUID;
  if (!account) throw new Error("zallet_account_not_configured");
  const status = await getZalletWalletStatus();
  if (status.locked) throw new Error("zallet_wallet_locked");
  if (Number(status.sync_work_remaining?.unscanned_blocks) > 0) throw new Error("zallet_wallet_syncing");
  const result = await zalletRpc<{ address?: string }>("z_getaddressforaccount", [account, ["sapling", "orchard"]]);
  if (typeof result.address !== "string" || !result.address.startsWith("utest1")) throw new Error("zallet_invalid_deposit_address");
  return { address: result.address, memo: `zecrow:${randomBytes(20).toString("hex")}` };
}

/** Zallet returns account-level notes for a Unified Address filter; the random order memo disambiguates orders. */
export async function listEscrowPaymentNotes(address: string): Promise<ReceivedNote[]> {
  if (!address.startsWith("utest1")) throw new Error("zallet_invalid_deposit_address");
  return zalletRpc<ReceivedNote[]>("z_listunspent", [0, 9_999_999, false, [address]]);
}

function extractTxid(result: unknown): string | null {
  if (typeof result === "string" && /^[a-f0-9]{64}$/i.test(result)) return result.toLowerCase();
  if (Array.isArray(result)) {
    const first = result.find((v) => typeof v === "string" && /^[a-f0-9]{64}$/i.test(v));
    return typeof first === "string" ? first.toLowerCase() : null;
  }
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    const candidates = [r.txid, Array.isArray(r.txids) ? r.txids[0] : undefined];
    for (const c of candidates) if (typeof c === "string" && /^[a-f0-9]{64}$/i.test(c)) return c.toLowerCase();
  }
  return null;
}

/**
 * Pay out escrow funds from the managed account to a recipient (merchant on release,
 * buyer on refund). Uses Zallet's `z_sendfromaccount`, which spends from an account UUID
 * with an isolating fund source and returns the resulting transaction id(s).
 *
 * Note: the managed escrow account must hold a small testnet-ZEC buffer beyond the order
 * amount to cover the transaction fee — the deposit is exactly the order amount, so the
 * platform wallet pays the fee. Zallet is alpha; verify these params against your node.
 */
export async function sendEscrowPayout(opts: { to: string; amountZec: string; memo?: string }): Promise<string> {
  const account = process.env.ZALLET_ESCROW_ACCOUNT_UUID;
  if (!account) throw new Error("zallet_account_not_configured");
  if (!opts.to.startsWith("utest1")) throw new Error("zallet_invalid_recipient_address");

  const status = await getZalletWalletStatus();
  if (status.locked) throw new Error("zallet_wallet_locked");
  if (Number(status.sync_work_remaining?.unscanned_blocks) > 0) throw new Error("zallet_wallet_syncing");

  const fundSource = process.env.ZALLET_FUND_SOURCE || "orchard";
  const privacyPolicy = process.env.ZALLET_PRIVACY_POLICY || "FullPrivacy";
  const minconf = Number.isSafeInteger(Number(process.env.ZEC_PAYOUT_MINCONF)) ? Math.max(1, Number(process.env.ZEC_PAYOUT_MINCONF)) : 1;

  const recipient: Record<string, unknown> = { address: opts.to, amount: Number(opts.amountZec) };
  if (opts.memo) recipient.memo = Buffer.from(opts.memo, "utf8").toString("hex");

  const result = await zalletRpc<unknown>("z_sendfromaccount", [account, fundSource, [recipient], minconf, privacyPolicy]);
  const txid = extractTxid(result);
  if (!txid) throw new Error("zallet_no_txid");
  return txid;
}
