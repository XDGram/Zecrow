import { getEscrowOrder, recordDemoFunding } from "@/lib/escrowStore";
import { getAllowedOrigin } from "@/lib/walletAuth";

// Demo-only funding for hackathon reviewers: advances an order to "funded" WITHOUT a wallet and
// WITHOUT any on-chain transaction. The UI labels this clearly as a simulated payment. The real
// shielded payment flow (report-funding) remains the honest, on-chain path.

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  const { id: code } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(code)) return Response.json({ error: "Order not found." }, { status: 404 });

  try {
    const order = await getEscrowOrder(code);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.status === "funded" || order.status === "released") {
      return Response.json({ status: order.status, demo: true }, { headers: { "Cache-Control": "no-store" } });
    }
    if (order.status !== "awaiting_payment") {
      return Response.json({ status: order.status, error: "This order can no longer be funded." }, { status: 409 });
    }
    const updated = await recordDemoFunding(code);
    return Response.json({ status: "funded", demo: true, orderStatus: updated?.status ?? "funded" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error", error: "Could not record the demo payment." }, { status: 500 });
  }
}
