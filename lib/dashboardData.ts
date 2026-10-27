/* Demo data for the Zecrow dashboard. Clearly illustrative — not live chain data.
   Physical + Digital goods only (services parked). */

export type OrderType = "physical" | "digital";

export type OrderStatus =
  | "awaiting_payment"
  | "funded"
  | "delivered"
  | "released"
  | "disputed"
  | "refunded";

export interface Order {
  id: string;
  item: string;
  type: OrderType;
  amountZec: number;
  counterparty: string; // masked shielded address
  role: "buyer" | "merchant";
  status: OrderStatus;
  created: string;
  deadline?: string;
}

export const STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "amber" | "blue" | "green" | "red" | "mute" }
> = {
  awaiting_payment: { label: "Awaiting payment", tone: "mute" },
  funded: { label: "Funded", tone: "amber" },
  delivered: { label: "Delivered", tone: "blue" },
  released: { label: "Released", tone: "green" },
  disputed: { label: "Disputed", tone: "red" },
  refunded: { label: "Refunded", tone: "mute" },
};

export const ORDERS: Order[] = [
  { id: "4817", item: "Vintage film camera", type: "physical", amountZec: 1.8, counterparty: "u1 fq…9kd2", role: "merchant", status: "disputed", created: "Jan 31", deadline: "Feb 06" },
  { id: "4816", item: "Mechanical keyboard", type: "physical", amountZec: 0.62, counterparty: "u1 7h…b14p", role: "merchant", status: "delivered", created: "Jan 30", deadline: "Feb 04" },
  { id: "4815", item: "Lightroom preset pack", type: "digital", amountZec: 0.12, counterparty: "u1 k9…m02a", role: "merchant", status: "released", created: "Jan 29" },
  { id: "4814", item: "UI kit — license", type: "digital", amountZec: 0.45, counterparty: "u1 ap…7f3c", role: "merchant", status: "funded", created: "Jan 29", deadline: "Feb 02" },
  { id: "4813", item: "Studio monitor (pair)", type: "physical", amountZec: 2.4, counterparty: "u1 d2…x88q", role: "merchant", status: "funded", created: "Jan 28", deadline: "Feb 03" },
  { id: "4812", item: "Ebook — Zcash dev guide", type: "digital", amountZec: 0.08, counterparty: "u1 zz…4k9r", role: "merchant", status: "released", created: "Jan 27" },
  { id: "4811", item: "Film scanner", type: "physical", amountZec: 1.15, counterparty: "u1 m4…q7t1", role: "merchant", status: "awaiting_payment", created: "Jan 27" },
  { id: "4810", item: "Sample pack — vol. 3", type: "digital", amountZec: 0.2, counterparty: "u1 8n…55wd", role: "merchant", status: "released", created: "Jan 26" },
];

const HELD_STATES: OrderStatus[] = ["funded", "delivered", "disputed"];

export function computeKpis(orders: Order[]) {
  const inEscrow = orders
    .filter((o) => HELD_STATES.includes(o.status))
    .reduce((sum, o) => sum + o.amountZec, 0);
  const active = orders.filter((o) => o.status !== "released" && o.status !== "refunded").length;
  const awaitingDelivery = orders.filter((o) => o.status === "funded").length;
  const openDisputes = orders.filter((o) => o.status === "disputed").length;
  return { inEscrow, active, awaitingDelivery, openDisputes };
}

// Cumulative ZEC held in escrow over the last 12 periods (demo trend).
export const ESCROW_SERIES = [1.2, 1.1, 1.6, 2.0, 1.8, 2.6, 3.1, 2.9, 3.8, 4.4, 5.1, 6.42];

export const DEADLINES = [
  { id: "4813", item: "Studio monitor (pair)", due: "in 2 days", type: "physical" as OrderType },
  { id: "4814", item: "UI kit — license", due: "in 1 day", type: "digital" as OrderType },
  { id: "4816", item: "Mechanical keyboard", due: "in 3 days", type: "physical" as OrderType },
];

/* On-chain transactions (shielded). "status" is confirmation state, never a client flag. */
export type TxKind = "fund" | "release" | "refund" | "deposit";

export interface Txn {
  id: string;
  kind: TxKind;
  order?: string;
  amountZec: number;
  txid: string;
  confirmations: number;
  status: "confirmed" | "pending";
  when: string;
}

export const TX_META: Record<TxKind, { label: string; dir: "in" | "out" }> = {
  fund: { label: "Escrow funded", dir: "in" },
  release: { label: "Released to merchant", dir: "out" },
  refund: { label: "Refunded to buyer", dir: "out" },
  deposit: { label: "Wallet deposit", dir: "in" },
};

export const TRANSACTIONS: Txn[] = [
  { id: "t1", kind: "fund", order: "4813", amountZec: 2.4, txid: "ztx 9f2a…e71c", confirmations: 3, status: "confirmed", when: "Jan 28 · 14:02" },
  { id: "t2", kind: "fund", order: "4814", amountZec: 0.45, txid: "ztx 4b8d…a0f2", confirmations: 1, status: "pending", when: "Jan 29 · 09:41" },
  { id: "t3", kind: "release", order: "4815", amountZec: 0.12, txid: "ztx c1e7…9k3d", confirmations: 42, status: "confirmed", when: "Jan 29 · 18:20" },
  { id: "t4", kind: "release", order: "4812", amountZec: 0.08, txid: "ztx 77aa…b4e9", confirmations: 61, status: "confirmed", when: "Jan 27 · 11:05" },
  { id: "t5", kind: "fund", order: "4816", amountZec: 0.62, txid: "ztx 2d9f…1m7q", confirmations: 8, status: "confirmed", when: "Jan 30 · 16:33" },
  { id: "t6", kind: "fund", order: "4817", amountZec: 1.8, txid: "ztx 5h2k…x88q", confirmations: 24, status: "confirmed", when: "Jan 31 · 10:12" },
  { id: "t7", kind: "deposit", amountZec: 3.0, txid: "ztx a0b1…c2d3", confirmations: 120, status: "confirmed", when: "Jan 26 · 08:00" },
  { id: "t8", kind: "release", order: "4810", amountZec: 0.2, txid: "ztx e4f5…6g7h", confirmations: 88, status: "confirmed", when: "Jan 26 · 20:47" },
];
