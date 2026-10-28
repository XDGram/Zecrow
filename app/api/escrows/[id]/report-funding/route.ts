import { getEscrowOrder, recordReportedFunding } from "@/lib/escrowStore";
import { getAllowedOrigin } from "@/lib/walletAuth";

// Path B (no managed node): the buyer's wallet broadcasts a real shielded testnet payment to
// the platform escrow address and reports the txid here. The order is marked funded, pending
// the escrow operator's verification — it is not chain-verified by the server.
//
// Only available when a managed Zallet watcher is NOT configured; otherwise funding is
// verified on-chain through the /payment route instead.

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  if (process.env.ZALLET_RPC_URL) {
    return Response.json({ status: "error", error: "This deployment verifies payments on-chain; use the managed payment flow." }, { status: 409 });
  }

  const { id: code } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(code)) return Response.json({ error: "Order not found." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const txid = typeof body.txid === "string" ? body.txid.trim().toLowerCase() : "";
  if (!/^[a-f0-9]{64}$/.test(txid)) {
    return Response.json({ status: "error", error: "A valid transaction id is required." }, { status: 400 });
  }

  try {
    const order = await getEscrowOrder(code);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.status === "funded" || order.status === "released") {
      return Response.json({ status: order.status, txid: order.payment.txid ?? txid }, { headers: { "Cache-Control": "no-store" } });
    }
    if (order.status !== "awaiting_payment") {
      return Response.json({ status: order.status, error: "This order can no longer be funded." }, { status: 409 });
    }
    const updated = await recordReportedFunding(code, txid);
    return Response.json({ status: "funded", txid, orderStatus: updated?.status ?? "funded" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error", error: "Could not record this payment." }, { status: 500 });
  }
}
