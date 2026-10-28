import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CODE_RELEASE_TERMS, PLATFORM_DISPUTE_WINDOW_DAYS } from "@/lib/listingCheck";

// Identity used for judge/reviewer demo orders created without a signed-in wallet.
export const DEMO_MERCHANT_WALLET = "zecrow-demo-merchant";
// Fallback payout address for demo orders when ESCROW_DEPOSIT_ADDRESS is unset.
const DEMO_PAYOUT_FALLBACK =
  "utest1e26444y7fq6t65dnugpygc46lkrx92gnf9lqvtf7dx8r5cka5x2jhvu8c829xq82waxf837auye2l3ampcwa9tsmuehfcm7cjnvkgjjt7uxtmsprjp9mj77agzukuzsjm453j8kr4uthtq938ht0j6y82s0j0qm0p068rpdpwyjna3kx";

export type EscrowType = "physical" | "digital";
export type EscrowOrder = {
  id: string;
  number: number;
  code: string;
  ownerWallet: string;
  merchantPayoutAddress: string;
  type: EscrowType;
  item: string;
  amountZec: string;
  description: string;
  images: { name: string; dataUrl: string }[];
  deliveryMethod: string;
  shipping: string;
  confirmation: string;
  proof: string;
  releaseTerms: string;
  disputeWindowDays: number;
  linkExpiryHours: number;
  depositAddress: string | null;
  paymentMemo: string | null;
  settlementTxid?: string | null;
  createdAt: string;
  expiresAt: string;
  status: "awaiting_payment" | "expired" | "funded" | "delivered" | "disputed" | "released" | "refunded";
  payment: { status: "not_connected" | "pending" | "confirmed" | "failed"; txid: string | null; confirmations: number };
};

type Store = { version: 1; orders: EscrowOrder[] };
type NewEscrow = Omit<EscrowOrder, "id" | "number" | "code" | "ownerWallet" | "createdAt" | "expiresAt" | "status" | "payment">;
// Fallback JSON store used when Supabase is not configured. Locally it lives in the project's
// .data dir; on serverless hosts (e.g. Vercel) the bundle filesystem is read-only, so it uses the
// OS temp dir instead. Note: serverless temp storage is per-instance and ephemeral — fine for a
// demo, not durable multi-user persistence. Configure Supabase for that.
const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "zecrow-data")
  : path.join(process.cwd(), ".data");
const storePath = path.join(dataDir, "escrows.json");
let writeQueue: Promise<unknown> = Promise.resolve();

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function currentStatus(order: EscrowOrder): EscrowOrder {
  if (order.status === "awaiting_payment" && Date.parse(order.expiresAt) <= Date.now()) {
    return { ...order, status: "expired" };
  }
  return order;
}

function fromRow(row: Record<string, unknown>, code = "", images: { name: string; dataUrl: string }[] = []): EscrowOrder {
  const status = String(row.status) as EscrowOrder["status"];
  return currentStatus({
    id: String(row.id),
    number: Number(row.order_number),
    code,
    ownerWallet: String(row.merchant_wallet),
    merchantPayoutAddress: String(row.merchant_payout_address ?? ""),
    type: row.item_type as EscrowType,
    item: String(row.item),
    amountZec: String(row.amount_zec),
    description: String(row.description),
    images,
    deliveryMethod: String(row.delivery_method),
    shipping: String(row.shipping ?? ""),
    confirmation: String(row.confirmation ?? ""),
    proof: String(row.proof ?? ""),
    releaseTerms: String(row.release_terms),
    disputeWindowDays: Number(row.dispute_window_days),
    linkExpiryHours: Number(row.link_expiry_hours),
    depositAddress: typeof row.deposit_address === "string" ? row.deposit_address : null,
    paymentMemo: typeof row.payment_memo === "string" ? row.payment_memo : null,
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
    status,
    payment: {
      status: String(row.payment_status ?? "not_connected") as EscrowOrder["payment"]["status"],
      txid: typeof row.payment_txid === "string" ? row.payment_txid : null,
      confirmations: Number(row.payment_confirmations ?? 0),
    },
  });
}

async function readLocalStore(): Promise<Store> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version === 1 && Array.isArray(parsed.orders)) {
      return {
        version: 1,
        orders: parsed.orders.map((order) => ({
          ...order,
          depositAddress: order.depositAddress ?? null,
          paymentMemo: order.paymentMemo ?? null,
          payment: order.payment ?? { status: "not_connected", txid: null, confirmations: 0 },
        })),
      };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return { version: 1, orders: [] };
}

async function writeLocalStore(store: Store) {
  await mkdir(path.dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, storePath);
}

function serial<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

function createCode() {
  return randomBytes(24).toString("hex");
}

export async function createEscrowOrder(input: NewEscrow, ownerWallet: string): Promise<EscrowOrder> {
  const supabase = supabaseAdmin();

  if (!supabase) {
    return serial(async () => {
      const store = await readLocalStore();
      const number = Math.max(5000, ...store.orders.map((order) => order.number + 1));
      let code = createCode();
      while (store.orders.some((order) => order.code === code)) code = createCode();

      const createdAt = new Date().toISOString();
      const order: EscrowOrder = {
        ...input,
        id: randomUUID(),
        number,
        code,
        ownerWallet,
        createdAt,
        expiresAt: new Date(Date.now() + input.linkExpiryHours * 60 * 60 * 1000).toISOString(),
        status: "awaiting_payment",
        payment: { status: "not_connected", txid: null, confirmations: 0 },
      };
      store.orders.unshift(order);
      await writeLocalStore(store);
      return order;
    });
  }

  const code = createCode();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + input.linkExpiryHours * 60 * 60 * 1000).toISOString();
  const insert = await supabase.from("escrows").insert({
    id,
    public_code_hash: hashCode(code),
    merchant_wallet: ownerWallet,
    merchant_payout_address: input.merchantPayoutAddress,
    item_type: input.type,
    item: input.item,
    amount_zec: input.amountZec,
    description: input.description,
    delivery_method: input.deliveryMethod,
    shipping: input.shipping,
    confirmation: input.confirmation,
    proof: input.proof,
    release_terms: input.releaseTerms,
    dispute_window_days: input.disputeWindowDays,
    link_expiry_hours: input.linkExpiryHours,
    deposit_address: input.depositAddress,
    payment_memo: input.paymentMemo,
    expires_at: expiresAt,
  }).select("*").single();
  if (insert.error || !insert.data) throw new Error("Could not save the order to Supabase.");

  const storagePaths: string[] = [];
  const evidenceRows: Record<string, unknown>[] = [];
  try {
    for (let position = 0; position < input.images.length; position++) {
      const image = input.images[position];
      const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(image.dataUrl);
      if (!match) throw new Error("An order photo has an invalid format.");
      const extension = match[1] === "image/jpeg" ? "jpg" : match[1].slice("image/".length);
      const objectPath = `${id}/${position}-${randomUUID()}.${extension}`;
      const bytes = Buffer.from(match[2], "base64");
      const uploaded = await supabase.storage.from("escrow-evidence").upload(objectPath, bytes, {
        contentType: match[1],
        upsert: false,
      });
      if (uploaded.error) throw new Error("Could not store the order photos.");
      storagePaths.push(objectPath);
      evidenceRows.push({ escrow_id: id, object_path: objectPath, file_name: image.name.slice(0, 120), position, content_type: match[1] });
    }
    if (evidenceRows.length) {
      const evidence = await supabase.from("escrow_evidence").insert(evidenceRows);
      if (evidence.error) throw new Error("Could not save order photo records.");
    }
    const event = await supabase.from("escrow_events").insert({ escrow_id: id, actor_wallet: ownerWallet, event_type: "order_created" });
    if (event.error) throw new Error("Could not record the order event.");
  } catch (error) {
    if (storagePaths.length) await supabase.storage.from("escrow-evidence").remove(storagePaths);
    await supabase.from("escrows").delete().eq("id", id);
    throw error;
  }

  return fromRow(insert.data, code, input.images);
}

export async function getEscrowOrder(code: string): Promise<EscrowOrder | null> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const result = await supabase.from("escrows").select("*, escrow_evidence(*)").eq("public_code_hash", hashCode(code)).maybeSingle();
    if (result.error || !result.data) return null;
    const evidence = Array.isArray(result.data.escrow_evidence) ? result.data.escrow_evidence as Record<string, unknown>[] : [];
    const signed = evidence.length ? await supabase.storage.from("escrow-evidence").createSignedUrls(evidence.map((image) => String(image.object_path)), 3600) : { data: [], error: null };
    if (signed.error) throw new Error("Could not load private order photos.");
    const images = evidence.map((image, index) => ({
      name: String(image.file_name),
      dataUrl: String(signed.data?.[index]?.signedUrl ?? ""),
    }));
    return fromRow(result.data, code, images);
  }

  const store = await readLocalStore();
  const order = store.orders.find((entry) => entry.code === code);
  return order ? currentStatus(order) : null;
}

export async function listEscrowOrders(ownerWallet: string): Promise<EscrowOrder[]> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const result = await supabase.from("escrows").select("*").eq("merchant_wallet", ownerWallet).order("created_at", { ascending: false });
    if (result.error) throw new Error("Could not load merchant orders from Supabase.");
    return (result.data ?? []).map((row) => fromRow(row as Record<string, unknown>));
  }

  const store = await readLocalStore();
  return store.orders.filter((order) => order.ownerWallet === ownerWallet).map(currentStatus);
}

export async function recordEscrowPayment(code: string, payment: { status: "pending" | "confirmed"; txid: string; confirmations: number }): Promise<EscrowOrder | null> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const status = payment.status === "confirmed" ? "funded" : "awaiting_payment";
    const result = await supabase.from("escrows").update({
      payment_status: payment.status,
      payment_txid: payment.txid,
      payment_confirmations: payment.confirmations,
      status,
    }).eq("public_code_hash", hashCode(code)).eq("status", "awaiting_payment").select("*").maybeSingle();
    if (result.error) throw new Error("Could not update escrow payment status.");
    if (result.data) return fromRow(result.data, code);
    return getEscrowOrder(code);
  }

  return serial(async () => {
    const store = await readLocalStore();
    const index = store.orders.findIndex((order) => order.code === code);
    if (index < 0) return null;
    const order = currentStatus(store.orders[index]);
    if (order.status !== "awaiting_payment") return order;
    const updated: EscrowOrder = {
      ...order,
      payment: { status: payment.status, txid: payment.txid, confirmations: payment.confirmations },
      status: payment.status === "confirmed" ? "funded" : "awaiting_payment",
    };
    store.orders[index] = updated;
    await writeLocalStore(store);
    return updated;
  });
}

/**
 * Record a payer-reported funding payment (no managed watcher). Used when the platform does
 * not run a Zallet node: the buyer's wallet broadcasts a real shielded testnet payment and
 * reports the resulting txid. The order is marked funded with payment_status "pending" to
 * reflect that the escrow operator still verifies receipt — it is not chain-verified here.
 */
export async function recordReportedFunding(code: string, txid: string): Promise<EscrowOrder | null> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const result = await supabase.from("escrows").update({ payment_status: "pending", payment_txid: txid, status: "funded" })
      .eq("public_code_hash", hashCode(code)).eq("status", "awaiting_payment").select("*").maybeSingle();
    if (result.error) throw new Error("Could not record the reported payment.");
    if (result.data) return fromRow(result.data, code);
    return getEscrowOrder(code);
  }

  return serial(async () => {
    const store = await readLocalStore();
    const index = store.orders.findIndex((order) => order.code === code);
    if (index < 0) return null;
    const order = currentStatus(store.orders[index]);
    if (order.status !== "awaiting_payment") return order;
    const updated: EscrowOrder = { ...order, status: "funded", payment: { status: "pending", txid, confirmations: 0 } };
    store.orders[index] = updated;
    await writeLocalStore(store);
    return updated;
  });
}

/** Settle a funded order: release to the merchant or refund to the buyer, recording the payout txid. */
export async function recordEscrowSettlement(code: string, settlement: { kind: "released" | "refunded"; txid: string }): Promise<EscrowOrder | null> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const result = await supabase.from("escrows").update({ status: settlement.kind })
      .eq("public_code_hash", hashCode(code)).eq("status", "funded").select("*").maybeSingle();
    if (result.error) throw new Error("Could not update escrow settlement status.");
    if (result.data) {
      // Best-effort audit trail; the payout txid is already returned to the caller.
      await supabase.from("escrow_events").insert({ escrow_id: result.data.id, event_type: settlement.kind, details: { txid: settlement.txid } });
      return fromRow(result.data, code);
    }
    return getEscrowOrder(code);
  }

  return serial(async () => {
    const store = await readLocalStore();
    const index = store.orders.findIndex((order) => order.code === code);
    if (index < 0) return null;
    const order = currentStatus(store.orders[index]);
    if (order.status !== "funded") return order;
    const updated: EscrowOrder = { ...order, status: settlement.kind, settlementTxid: settlement.txid };
    store.orders[index] = updated;
    await writeLocalStore(store);
    return updated;
  });
}

/**
 * Demo-only funding (no wallet, no on-chain transaction). Lets a reviewer walk an order from
 * awaiting_payment to funded so they can see the full lifecycle. The txid is left null and the
 * payment is flagged "pending" so the UI can label it honestly as a simulated payment.
 */
export async function recordDemoFunding(code: string): Promise<EscrowOrder | null> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const result = await supabase.from("escrows").update({ payment_status: "pending", payment_txid: null, status: "funded" })
      .eq("public_code_hash", hashCode(code)).eq("status", "awaiting_payment").select("*").maybeSingle();
    if (result.error) throw new Error("Could not record the demo payment.");
    if (result.data) return fromRow(result.data, code);
    return getEscrowOrder(code);
  }

  return serial(async () => {
    const store = await readLocalStore();
    const index = store.orders.findIndex((order) => order.code === code);
    if (index < 0) return null;
    const order = currentStatus(store.orders[index]);
    if (order.status !== "awaiting_payment") return order;
    const updated: EscrowOrder = { ...order, status: "funded", payment: { status: "pending", txid: null, confirmations: 0 } };
    store.orders[index] = updated;
    await writeLocalStore(store);
    return updated;
  });
}

/**
 * Create a pre-populated demo order so hackathon reviewers can open a real order page without a
 * wallet. It is an ordinary order owned by a demo merchant identity; funding/release use the
 * simulated (demo) paths so no on-chain transaction is required.
 */
export async function createDemoOrder(): Promise<EscrowOrder> {
  const payoutAddress = process.env.ESCROW_DEPOSIT_ADDRESS?.startsWith("utest1")
    ? process.env.ESCROW_DEPOSIT_ADDRESS
    : DEMO_PAYOUT_FALLBACK;
  return createEscrowOrder({
    type: "digital",
    item: "Demo order · Lightroom preset pack",
    amountZec: "1.25",
    description:
      "Reviewer demo order. A downloadable pack of 40 Lightroom presets, delivered as a private link after the buyer confirms with their one-time Zecrow release code. This order is pre-filled so you can walk the full escrow flow — review, fund, and release — without a wallet.",
    images: [],
    deliveryMethod: "link",
    shipping: "",
    merchantPayoutAddress: payoutAddress,
    confirmation: "code",
    proof: "",
    releaseTerms: CODE_RELEASE_TERMS,
    disputeWindowDays: PLATFORM_DISPUTE_WINDOW_DAYS,
    linkExpiryHours: 168,
    depositAddress: null,
    paymentMemo: null,
  }, DEMO_MERCHANT_WALLET);
}

export async function saveEscrowDepositDetails(code: string, details: { address: string; memo: string }): Promise<EscrowOrder | null> {
  const supabase = supabaseAdmin();
  if (supabase) {
    const result = await supabase.from("escrows").update({ deposit_address: details.address, payment_memo: details.memo })
      .eq("public_code_hash", hashCode(code)).eq("status", "awaiting_payment").is("deposit_address", null).is("payment_memo", null)
      .select("*").maybeSingle();
    if (result.error) throw new Error("Could not attach a deposit address to this order.");
    if (result.data) return fromRow(result.data, code);
    return getEscrowOrder(code);
  }

  return serial(async () => {
    const store = await readLocalStore();
    const index = store.orders.findIndex((order) => order.code === code);
    if (index < 0) return null;
    const order = currentStatus(store.orders[index]);
    if (order.status !== "awaiting_payment") return order;
    if (order.depositAddress && order.paymentMemo) return order;
    const updated = { ...order, depositAddress: details.address, paymentMemo: details.memo };
    store.orders[index] = updated;
    await writeLocalStore(store);
    return updated;
  });
}
