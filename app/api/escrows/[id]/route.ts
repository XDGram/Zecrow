import { getEscrowOrder } from "@/lib/escrowStore";
import { readWalletSession } from "@/lib/walletAuth";
import { PLATFORM_DISPUTE_WINDOW_DAYS } from "@/lib/listingCheck";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: code } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(code)) return Response.json({ error: "Order not found." }, { status: 404 });
  try {
    const order = await getEscrowOrder(code);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    const session = readWalletSession(_request);
    if (order.status === "expired" && session?.address === order.ownerWallet) {
      return Response.json({ error: "This unpaid order link has expired." }, { status: 410 });
    }
    return Response.json({ order: {
      number: order.number,
      code: order.code,
      type: order.type,
      item: order.item,
      amountZec: order.amountZec,
      description: order.description,
      images: order.images.map((image) => ({ name: image.name, src: image.dataUrl })),
      deliveryMethod: order.deliveryMethod,
      shipping: order.shipping,
      confirmation: order.confirmation,
      proof: order.proof,
      releaseTerms: order.releaseTerms,
      disputeWindowDays: PLATFORM_DISPUTE_WINDOW_DAYS,
      depositAddress: order.depositAddress,
      paymentMemo: order.paymentMemo,
      payment: order.payment,
      expiresAt: order.expiresAt,
      status: order.status,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Order service is unavailable." }, { status: 503 });
  }
}
