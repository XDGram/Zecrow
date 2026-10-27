import { readWalletSession } from "@/lib/walletAuth";
import { getZalletWalletStatus } from "@/lib/zalletRpc";

export async function GET(request: Request) {
  if (!readWalletSession(request)) {
    return Response.json({ error: "Sign in with your Zcash testnet wallet." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const status = await getZalletWalletStatus();
    const progress = status.sync_work_remaining?.progress;
    return Response.json({
      network: "testnet",
      nodeHeight: status.node_tip.height,
      walletHeight: status.wallet_tip?.height ?? null,
      fullySyncedHeight: status.fully_synced_height ?? null,
      unscannedBlocks: status.sync_work_remaining?.unscanned_blocks ?? 0,
      syncProgress: progress && progress.denominator > 0 ? Math.min(1, progress.numerator / progress.denominator) : null,
      locked: status.locked,
      ready: !status.locked,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const configured = !["zallet_not_configured", "zallet_auth_not_configured"].includes(reason);
    return Response.json({
      network: "testnet",
      ready: false,
      state: configured ? "unavailable" : "not_configured",
      error: configured ? "The Zcash escrow wallet is not reachable." : "The Zcash escrow wallet is not configured for this app.",
    }, { status: configured ? 503 : 503, headers: { "Cache-Control": "no-store" } });
  }
}
