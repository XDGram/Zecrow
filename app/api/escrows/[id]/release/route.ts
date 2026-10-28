import { getEscrowOrder, recordEscrowSettlement } from "@/lib/escrowStore";
import { getAllowedOrigin } from "@/lib/walletAuth";
import { sendEscrowPayout } from "@/lib/zalletRpc";

// Release funds from the managed escrow account to the merchant after the buyer confirms
// delivery. The buyer initiates this from the order page.
//
// Authorization note: this prototype gates on the request origin and a funded status only.
// A production release must be authorised by the buyer's wallet (a signed confirmation or a
// one-time release code), since possession of the order link is not sufficient proof.

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  const { id: code } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(code)) return Response.json({ error: "Order not found." }, { status: 404 });

  try {
    const order = await getEscrowOrder(code);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.status === "released") {
      return Response.json({ status: "released", txid: order.settlementTxid ?? null }, { headers: { "Cache-Control": "no-store" } });
    }
    if (order.status !== "funded") {
      return Response.json({ status: order.status, error: "This order is not funded, so it cannot be released." }, { status: 409 });
    }
    if (!order.ownerWallet?.startsWith("utest1")) {
      return Response.json({ status: "error", error: "The merchant has no testnet payout address on file." }, { status: 400 });
    }

    const txid = await sendEscrowPayout({ to: order.ownerWallet, amountZec: order.amountZec, memo: `zecrow-release:${order.number}` });
    const updated = await recordEscrowSettlement(code, { kind: "released", txid });
    return Response.json({ status: "released", txid, orderStatus: updated?.status ?? "released" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const configured = !["zallet_not_configured", "zallet_auth_not_configured", "zallet_account_not_configured"].includes(reason);
    return Response.json({
      status: configured ? "error" : "unavailable",
      error: configured
        ? "Could not release funds from the escrow wallet. Check the wallet is unlocked, synced, and funded for fees."
        : "The Zcash testnet escrow wallet is not configured, so release cannot run yet.",
    }, { status: 503 });
  }
}
