import "server-only";

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const localChallenges = new Map<string, number>();

function digest(nonce: string) {
  return createHash("sha256").update(nonce).digest("hex");
}

export async function storeWalletChallenge(nonce: string, expiresAt: number) {
  const supabase = supabaseAdmin();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") return false;
    localChallenges.set(digest(nonce), expiresAt);
    return true;
  }
  const now = new Date().toISOString();
  const hash = digest(nonce);
  const [, inserted] = await Promise.all([
    supabase.from("wallet_auth_challenges").delete().lt("expires_at", now),
    supabase.from("wallet_auth_challenges").insert({ nonce_hash: hash, expires_at: new Date(expiresAt).toISOString() }),
  ]);
  return !inserted.error;
}

export async function consumeWalletChallenge(nonce: string) {
  const supabase = supabaseAdmin();
  const hash = digest(nonce);
  const now = new Date().toISOString();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") return false;
    const expiresAt = localChallenges.get(hash);
    localChallenges.delete(hash);
    return Boolean(expiresAt && expiresAt > Date.now());
  }
  const { data, error } = await supabase
    .from("wallet_auth_challenges")
    .update({ consumed_at: now })
    .eq("nonce_hash", hash)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .select("nonce_hash")
    .maybeSingle();
  return !error && Boolean(data);
}
