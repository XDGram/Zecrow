import { getEscrowOrder, recordEscrowPayment, saveEscrowDepositDetails } from "@/lib/escrowStore";
import { getAllowedOrigin } from "@/lib/walletAuth";
import { createEscrowDepositDetails, listEscrowPaymentNotes } from "@/lib/zalletRpc";

type Note = { txid?: string; value?: number; valueZat?: number; confirmations?: number; memo?: string; memoStr?: string };

function toZatoshis(value: unknown): bigint | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const decimal = typeof value === "number" ? value.toFixed(8) : value;
  if (!/^\d+(?:\.\d{1,8})?$/.test(decimal)) return null;
  const [whole, fraction = ""] = decimal.split(".");
  return BigInt(whole) * BigInt(100_000_000) + BigInt(fraction.padEnd(8, "0"));
}

function noteValue(note: Note): bigint | null {
  if (typeof note.valueZat === "number" && Number.isSafeInteger(note.valueZat)) return BigInt(note.valueZat);
  if (typeof note.valueZat === "string" && /^\d+$/.test(note.valueZat)) return BigInt(note.valueZat);
  return toZatoshis(note.value);
}

function noteMemo(note: Note) {
  if (typeof note.memoStr === "string") return note.memoStr.replace(/\0+$/g, "");
  if (typeof note.memo === "string" && /^[a-f0-9]+$/i.test(note.memo) && note.memo.length % 2 === 0) {
    return Buffer.from(note.memo, "hex").toString("utf8").replace(/\0+$/g, "");
  }
  return "";
}

function amountText(zatoshis: bigint) {
  const whole = zatoshis / BigInt(100_000_000);
  const fraction = (zatoshis % BigInt(100_000_000)).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export async function POST(request: Request, context: RouteContext<"/api/escrows/[id]/payment">) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  const { id: code } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(code)) return Response.json({ error: "Order not found." }, { status: 404 });

  try {
    let order = await getEscrowOrder(code);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.status === "expired" || Date.parse(order.expiresAt) <= Date.now()) {
      return Response.json({ status: "expired", error: "This payment link has expired." }, { status: 410 });
    }
    if (order.status !== "awaiting_payment") {
      return Response.json({ status: order.status, payment: order.payment }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!order.depositAddress || !order.paymentMemo) {
      const details = await createEscrowDepositDetails();
      order = await saveEscrowDepositDetails(code, details);
      if (!order?.depositAddress || !order.paymentMemo) return Response.json({ status: "unavailable", error: "The Zcash testnet escrow wallet is not ready to accept this order." }, { status: 503 });
    }

    const notes = await listEscrowPaymentNotes(order.depositAddress);
    const matches = (Array.isArray(notes) ? notes : []).filter((note) => noteMemo(note) === order.paymentMemo);
    if (!matches.length) return Response.json({ status: "ready", depositAddress: order.depositAddress, paymentMemo: order.paymentMemo, confirmations: 0 }, { headers: { "Cache-Control": "no-store" } });

    const byTransaction = new Map<string, { amount: bigint; confirmations: number }>();
    for (const note of matches) {
      if (typeof note.txid !== "string" || !/^[a-f0-9]{64}$/i.test(note.txid)) continue;
      const value = noteValue(note);
      if (value === null || value <= BigInt(0)) continue;
      const txid = note.txid.toLowerCase();
      const current = byTransaction.get(txid) ?? { amount: BigInt(0), confirmations: Number.MAX_SAFE_INTEGER };
      current.amount += value;
      const confirmations = Number(note.confirmations);
      current.confirmations = Math.min(current.confirmations, Number.isSafeInteger(confirmations) ? Math.max(0, confirmations) : 0);
      byTransaction.set(txid, current);
    }

    const expected = toZatoshis(order.amountZec);
    if (expected === null) return Response.json({ status: "error", error: "The saved order amount is invalid." }, { status: 500 });
    const exact = [...byTransaction.entries()].filter(([, tx]) => tx.amount === expected);
    if (exact.length > 1 || byTransaction.size > 1) {
      return Response.json({ status: "ambiguous", error: "More than one payment matches this order reference. Manual review is required." }, { status: 409 });
    }
    if (!byTransaction.size) return Response.json({ status: "awaiting_payment", confirmations: 0 }, { headers: { "Cache-Control": "no-store" } });

    const [txid, received] = [...byTransaction.entries()][0];
    if (received.amount !== expected) {
      return Response.json({ status: "amount_mismatch", received: amountText(received.amount), expected: order.amountZec, confirmations: received.confirmations }, { status: 409 });
    }
    const configuredConfirmations = Number(process.env.ZEC_REQUIRED_CONFIRMATIONS);
    const requiredConfirmations = Number.isSafeInteger(configuredConfirmations) ? Math.max(1, Math.min(100, configuredConfirmations)) : 1;
    const status = received.confirmations >= requiredConfirmations ? "confirmed" : "pending";
    const updated = await recordEscrowPayment(code, { status, txid, confirmations: received.confirmations });
    return Response.json({
      status: status === "confirmed" ? "funded" : "confirming",
      txid,
      received: amountText(received.amount),
      confirmations: received.confirmations,
      requiredConfirmations,
      orderStatus: updated?.status ?? "awaiting_payment",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable", error: "Could not check this payment against the Zcash testnet wallet." }, { status: 503 });
  }
}
