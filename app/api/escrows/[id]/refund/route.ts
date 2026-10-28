import { getEscrowOrder, recordEscrowSettlement } from "@/lib/escrowStore";
import { getAllowedOrigin, readWalletSession } from "@/lib/walletAuth";
import { sendEscrowPayout } from "@/lib/zalletRpc";

// Refund a funded order to the buyer. The buyer's sending address cannot be recovered from a
// shielded deposit, so the caller must supply the refund address explicitly.
//
// Authorization note: refunds are a dispute outcome. This prototype requires a signed wallet
// session and a funded status; a production system would restrict this to the assigned arbiter.

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  if (!readWalletSession(request)) return Response.json({ error: "Sign in with your Zcash testnet wallet to issue a refund." }, { status: 401 });

  const { id: code } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(code)) return Response.json({ error: "Order not found." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const refundAddress = typeof body.refundAddress === "string" ? body.refundAddress.trim() : "";
  if (!refundAddress.startsWith("utest1")) {
    return Response.json({ status: "error", error: "Provide the buyer's Zcash testnet (utest1…) refund address." }, { status: 400 });
  }

  try {
    const order = await getEscrowOrder(code);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.status === "refunded") {
      return Response.json({ status: "refunded", txid: order.settlementTxid ?? null }, { headers: { "Cache-Control": "no-store" } });
    }
    if (order.status !== "funded") {
      return Response.json({ status: order.status, error: "This order is not funded, so it cannot be refunded." }, { status: 409 });
    }

    const txid = await sendEscrowPayout({ to: refundAddress, amountZec: order.amountZec, memo: `zecrow-refund:${order.number}` });
    const updated = await recordEscrowSettlement(code, { kind: "refunded", txid });
    return Response.json({ status: "refunded", txid, orderStatus: updated?.status ?? "refunded" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const configured = !["zallet_not_configured", "zallet_auth_not_configured", "zallet_account_not_configured"].includes(reason);
    return Response.json({
      status: configured ? "error" : "unavailable",
      error: configured
        ? "Could not send the refund from the escrow wallet. Check it is unlocked, synced, and funded for fees."
        : "The Zcash testnet escrow wallet is not configured, so refunds cannot run yet.",
    }, { status: 503 });
  }
}
