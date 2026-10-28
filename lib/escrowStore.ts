import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type EscrowType = "physical" | "digital";
export type EscrowOrder = {
  id: string;
  number: number;
  code: string;
  ownerWallet: string;
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
  createdAt: string;
  expiresAt: string;
  status: "awaiting_payment" | "expired" | "funded" | "delivered" | "disputed" | "released" | "refunded";
  payment: { status: "not_connected" | "pending" | "confirmed" | "failed"; txid: string | null; confirmations: number };
};

type Store = { version: 1; orders: EscrowOrder[] };
type NewEscrow = Omit<EscrowOrder, "id" | "number" | "code" | "ownerWallet" | "createdAt" | "expiresAt" | "status" | "payment">;
const storePath = path.join(process.cwd(), ".data", "escrows.json");
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
  if (!supabase && process.env.NODE_ENV === "production") {
    throw new Error("Hosted order storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

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

  if (process.env.NODE_ENV === "production") throw new Error("Hosted order storage is not configured.");
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

  if (process.env.NODE_ENV === "production") throw new Error("Hosted order storage is not configured.");
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

  if (process.env.NODE_ENV === "production") throw new Error("Hosted order storage is not configured.");
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

  if (process.env.NODE_ENV === "production") throw new Error("Hosted order storage is not configured.");
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
