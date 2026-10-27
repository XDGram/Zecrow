import "server-only";

import { readFile } from "node:fs/promises";

type JsonRpcEnvelope<T> = { result?: T; error?: { message?: string; code?: number } };

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

export async function getZalletWalletStatus(): Promise<ZalletWalletStatus> {
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
    body: JSON.stringify({ jsonrpc: "2.0", id: "zecrow-status", method: "getwalletstatus", params: [] }),
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error("zallet_unavailable");

  const payload = await response.json() as JsonRpcEnvelope<ZalletWalletStatus>;
  const status = payload.result;
  if (payload.error || !status || typeof status.locked !== "boolean" || !Number.isSafeInteger(status.node_tip?.height)) {
    throw new Error("zallet_invalid_response");
  }
  return status;
}
