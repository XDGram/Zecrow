"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Expand, Package, ShieldCheck, X } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { CODE_RELEASE_TERMS, PLATFORM_DISPUTE_WINDOW_DAYS } from "@/lib/listingCheck";
import ZecrowMark from "@/components/ZecrowMark";

type BuyerOrder = {
  number: number;
  type: "physical" | "digital";
  item: string;
  amountZec: string;
  description: string;
  images: { name: string; src: string }[];
  deliveryMethod: string;
  shipping: string;
  confirmation: string;
  proof: string;
  releaseTerms: string;
  disputeWindowDays: number;
  depositAddress: string | null;
  paymentMemo: string | null;
  payment: { status: "not_connected" | "pending" | "confirmed" | "failed"; txid: string | null; confirmations: number };
  expiresAt: string;
  status: "awaiting_payment" | "expired" | "funded" | "delivered" | "disputed" | "released" | "refunded";
};

type View = "review" | "accepted" | "declining" | "declined";

const DECLINE_REASONS = [
  "Item differs from the description",
  "Photos don't match the item",
  "Amount is wrong",
  "Delivery terms differ from what we agreed",
  "Something else",
];

const STEPS = ["Review", "Fund", "Released"];

export default function BuyerFlow() {
  const { status: walletStatus, connect, sendPayment } = useWallet();
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState<View>("review");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [funding, setFunding] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentTxid, setPaymentTxid] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [releaseTxid, setReleaseTxid] = useState("");
  const [releaseMessage, setReleaseMessage] = useState("");

  useEffect(() => {
    if (!code) return;
    let active = true;
    fetch(`/api/escrows/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const result = await response.json() as { order?: BuyerOrder; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error ?? "This order link could not be found.");
        if (active) setOrder(result.order);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "This order link could not be found.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [code]);

  const toggleReason = (reason: string) =>
    setReasons((prev) => prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]);

  const checkPayment = useCallback(async () => {
    if (!code || !order) return;
    try {
      const response = await fetch(`/api/escrows/${encodeURIComponent(code)}/payment`, { method: "POST" });
      const result = await response.json() as { status?: string; txid?: string; confirmations?: number; requiredConfirmations?: number; depositAddress?: string; paymentMemo?: string; error?: string };
      if (result.status === "ready" && result.depositAddress && result.paymentMemo) {
        setOrder((previous) => previous ? { ...previous, depositAddress: result.depositAddress!, paymentMemo: result.paymentMemo! } : previous);
        setPaymentMessage("Zcash testnet deposit address ready. You can fund this order with Noir Wallet.");
        return;
      }
      if (result.status === "funded") {
        setOrder((previous) => previous ? { ...previous, status: "funded", payment: { status: "confirmed", txid: result.txid ?? null, confirmations: result.confirmations ?? 0 } } : previous);
        setPaymentMessage(`Payment confirmed with ${result.confirmations ?? 0} testnet confirmation(s).`);
        return;
      }
      if (result.status === "confirming") {
        setPaymentTxid(result.txid ?? "");
        setPaymentMessage(`Payment detected. Waiting for confirmations (${result.confirmations ?? 0}/${result.requiredConfirmations ?? 1}).`);
      } else if (result.status === "amount_mismatch" || result.status === "ambiguous") {
        setPaymentMessage(result.error ?? "Payment needs manual review.");
      } else if (result.status === "unavailable") {
        setPaymentMessage(result.error ?? "Testnet payment checking is unavailable.");
      }
    } catch {
      setPaymentMessage("Could not check payment status. Retrying shortly.");
    }
  }, [code, order?.depositAddress, order?.paymentMemo]);

  useEffect(() => {
    if (view !== "accepted" || order?.status !== "awaiting_payment") return;
    void checkPayment();
    const timer = window.setInterval(() => void checkPayment(), 12_000);
    return () => window.clearInterval(timer);
  }, [view, order?.status, checkPayment]);

  const payWithWallet = async () => {
    if (!order?.depositAddress || !order.paymentMemo) return;
    setFunding(true);
    setPaymentMessage("");
    try {
      if (walletStatus !== "connected") {
        await connect();
        setPaymentMessage("Connect Noir Wallet to Zcash testnet, then press Fund again to approve the payment.");
        return;
      }
      const txid = await sendPayment({ to: order.depositAddress, amount: order.amountZec, memo: order.paymentMemo });
      setPaymentTxid(txid);
      setPaymentMessage("Payment broadcast. Checking the Zcash testnet wallet for confirmation.");
      await checkPayment();
    } catch (reason) {
      setPaymentMessage(reason instanceof Error ? reason.message : "The wallet payment did not complete.");
    } finally {
      setFunding(false);
    }
  };

  const releaseFunds = async () => {
    if (!code || order?.status !== "funded") return;
    setReleasing(true);
    setReleaseMessage("");
    try {
      const response = await fetch(`/api/escrows/${encodeURIComponent(code)}/release`, { method: "POST" });
      const result = await response.json() as { status?: string; txid?: string; error?: string };
      if (result.status === "released") {
        setReleaseTxid(result.txid ?? "");
        setOrder((previous) => previous ? { ...previous, status: "released" } : previous);
      } else {
        setReleaseMessage(result.error ?? "The release could not be completed.");
      }
    } catch {
      setReleaseMessage("Could not reach the escrow wallet to release funds.");
    } finally {
      setReleasing(false);
    }
  };

  if (loading) return <BuyerMessage title="Loading order" detail="Fetching the saved order details." />;
  if (error || !order) return <BuyerMessage title="Order link unavailable" detail={error || "This order link could not be found."} />;

  const expired = order.status === "expired";
  const stepIndex = order.status === "released" ? 2 : view === "accepted" ? 1 : 0;
  const delivery = order.type === "physical"
    ? (order.shipping?.trim() || "Shipping details are in the description") + " · confirm receipt with the one-time code"
    : `${order.deliveryMethod === "link" ? "Download link" : order.deliveryMethod === "file" ? "File delivery" : "License key"} · confirm delivery with the one-time code`;

  return (
    <div className="min-h-screen bg-bg-soft/50">
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-ink">
            <ZecrowMark size={24} />
            <span className="text-[14px] font-bold tracking-[-0.035em]">Zecrow</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            <ShieldCheck size={13} strokeWidth={1.8} /> Testnet prototype
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-8">
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-950">
          <strong>{expired ? "Order link expired." : "Review this order before you fund it."}</strong>{" "}
          {expired ? "This payment link can no longer be used." : "Check that the item, photos, amount and terms match what you agreed with the merchant."} Zcash testnet only — real funds never move. Fund, release and refund run against the managed escrow wallet when it is connected.
        </div>

        {/* progress */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${done ? "bg-ink text-white" : active ? "bg-accent text-white ring-4 ring-accent-wash" : "bg-bg-sunk text-ink-mute"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[12px] font-medium ${active || done ? "text-ink" : "text-ink-mute"}`}>{label}</span>
                {i < STEPS.length - 1 && <span className={`mx-1 h-px flex-1 ${done ? "bg-ink/40" : "bg-line"}`} />}
              </div>
            );
          })}
        </div>

        <div className="card overflow-hidden">
          {/* order summary */}
          <div className="border-b border-line p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-mute">Merchant order</span>
              <span className="font-mono text-[12px] text-ink-soft">#{order.number}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-sunk text-ink-soft">
                <Package size={20} strokeWidth={1.7} />
              </span>
              <div>
                <div className="text-[15px] font-semibold text-ink">{order.item}</div>
                <div className="text-[11.5px] text-ink-mute">{order.type === "physical" ? "Physical goods" : "Digital goods"} · order /e/{code}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="annotation text-ink-mute">What the merchant described</div>
              <p className="mt-1 whitespace-pre-line text-[12.5px] leading-6 text-ink-soft">{order.description}</p>
            </div>

            {/* photos */}
            {order.images.length > 0 && (
              <div className="mt-4">
                <div className="annotation mb-1.5 text-ink-mute">Photos · tap to view full size</div>
                <div className="grid grid-cols-3 gap-2">
                  {order.images.map((image, i) => (
                    <motion.button
                      key={`${image.name}-${i}`}
                      type="button"
                      onClick={() => setLightbox(i)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-bg-soft"
                      aria-label={`View ${image.name} full size`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.src} alt={image.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/25 group-hover:opacity-100">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow-[var(--shadow-sm)]"><Expand size={14} /></span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-end justify-between rounded-xl bg-bg-soft px-4 py-3">
              <div>
                <div className="annotation text-ink-mute">Amount</div>
                <div className="mt-0.5 text-[24px] font-semibold tracking-tight text-ink tabular-nums">
                  {Number(order.amountZec).toFixed(2)} <span className="text-[13px] font-normal text-ink-mute">ZEC</span>
                </div>
              </div>
              <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-accent-wash px-2.5 py-1 text-[11px] font-medium text-accent-ink">
                <motion.span aria-hidden className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" animate={{ x: ["0%", "360%"] }} transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }} />
                <ShieldCheck size={12} strokeWidth={1.9} /> Shielded
              </span>
            </div>
          </div>

          {/* terms */}
          <div className="space-y-2 border-b border-line p-5">
            <Term label="Delivery" value={delivery} />
            <Term label="Release mechanism" value={CODE_RELEASE_TERMS} />
            <Term label="Dispute window" value={`${PLATFORM_DISPUTE_WINDOW_DAYS} days · platform policy`} />
            <Term label="Payment link expires" value={new Date(order.expiresAt).toLocaleString()} />
          </div>

          {/* action area */}
          <div className="p-5">
            <AnimatePresence mode="wait" initial={false}>
              {expired ? (
                <Panel key="expired">
                  <button type="button" disabled className="btn btn-dark w-full !cursor-not-allowed !py-3 text-[14px] opacity-50">This order link has expired</button>
                </Panel>
              ) : view === "review" ? (
                <Panel key="review">
                  <p className="mb-3 text-center text-[12.5px] leading-5 text-ink-soft">Does everything above match what you agreed with the merchant?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setView("declining")}
                      className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-[13.5px] font-semibold text-ink-soft transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700">
                      <X size={16} /> Doesn&apos;t match
                    </motion.button>
                    <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setView("accepted")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-ink/90">
                      <Check size={16} /> Accept order
                    </motion.button>
                  </div>
                  <p className="mt-3 text-center text-[11px] leading-4 text-ink-faint">Accepting confirms the details look right. You still release funds only after delivery, with your one-time code.</p>
                </Panel>
              ) : view === "accepted" ? (
                <Panel key="accepted">
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={15} strokeWidth={2.4} /></span>
                    <div>
                      <div className="text-[13px] font-semibold text-emerald-900">Order accepted</div>
                      <p className="mt-0.5 text-[11.5px] leading-5 text-emerald-800">The details match. Funding is the next step — funds stay in escrow until you confirm delivery.</p>
                    </div>
                  </div>
                  {order.status === "released" ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-900"><ShieldCheck size={15} /> Funds released to the merchant</div>
                      <p className="mt-1 text-[11.5px] leading-5 text-emerald-800">The escrow paid the merchant on Zcash testnet. This order is complete.</p>
                      {releaseTxid && <p className="mt-2 break-all font-mono text-[10.5px] text-emerald-700">tx: {releaseTxid}</p>}
                    </div>
                  ) : order.status === "funded" ? (
                    <>
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] leading-5 text-emerald-800">Testnet payment confirmed and held in escrow. Release the funds once you have received the goods.</div>
                      <button type="button" onClick={() => void releaseFunds()} disabled={releasing} className="btn btn-dark mt-3 w-full !py-3 text-[14px] disabled:opacity-50">
                        {releasing ? "Releasing…" : "Confirm delivery & release to merchant"}
                      </button>
                      <p className="mt-2 text-center text-[11px] leading-5 text-ink-mute">Only release after you have the goods. This sends the escrowed testnet ZEC to the merchant and cannot be undone.</p>
                      {releaseMessage && <p className="mt-2 break-words text-center text-[11px] leading-5 text-red-700" role="status">{releaseMessage}</p>}
                    </>
                  ) : order.depositAddress && order.paymentMemo ? (
                    <>
                      <button type="button" onClick={() => void payWithWallet()} disabled={funding} className="btn btn-dark mt-3 w-full !py-3 text-[14px] disabled:opacity-50">
                        {funding ? "Waiting for wallet…" : `Fund ${Number(order.amountZec).toFixed(8)} ZEC with Noir`}
                      </button>
                      <p className="mt-2 text-center text-[11px] leading-5 text-ink-mute">Testnet payment only. Funds will remain in the escrow wallet while release and refund actions are being built.</p>
                    </>
                  ) : (
                    <>
                      <button type="button" disabled className="btn btn-dark mt-3 w-full !cursor-not-allowed !py-3 text-[14px] opacity-50">Testnet escrow wallet not ready</button>
                      <p className="mt-2 text-center text-[11px] leading-5 text-ink-mute">The order has no deposit address yet. The escrow wallet must be unlocked and configured before this link can accept funds.</p>
                    </>
                  )}
                  {paymentMessage && <p className="mt-3 break-words text-center text-[11px] leading-5 text-ink-soft" role="status">{paymentMessage}{paymentTxid ? ` · ${paymentTxid.slice(0, 12)}…` : ""}</p>}
                  <button type="button" onClick={() => setView("review")} className="mt-3 w-full text-[12px] font-medium text-ink-mute transition-colors hover:text-ink">Back to review</button>
                </Panel>
              ) : view === "declining" ? (
                <Panel key="declining">
                  <div className="text-[13px] font-semibold text-ink">What doesn&apos;t match?</div>
                  <p className="mt-0.5 text-[11.5px] leading-5 text-ink-mute">Pick anything that is off, and add detail so the merchant can fix it.</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {DECLINE_REASONS.map((reason) => {
                      const on = reasons.includes(reason);
                      return (
                        <button key={reason} type="button" onClick={() => toggleReason(reason)}
                          className={`rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${on ? "border-red-300 bg-red-50 text-red-700" : "border-line bg-white text-ink-soft hover:border-ink/20"}`}>
                          {on ? "✓ " : ""}{reason}
                        </button>
                      );
                    })}
                  </div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={600}
                    placeholder="Describe what differs from what you agreed (e.g. condition, missing parts, wrong variant)…"
                    className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-mute focus:border-ink/20" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setView("review")} className="btn btn-ghost !py-2.5 text-[13px]">Back</button>
                    <button type="button" disabled={reasons.length === 0 && !note.trim()} onClick={() => setView("declined")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40">
                      Submit decline
                    </button>
                  </div>
                </Panel>
              ) : (
                <Panel key="declined">
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"><X size={15} strokeWidth={2.4} /></span>
                    <div>
                      <div className="text-[13px] font-semibold text-red-900">Order declined</div>
                      <p className="mt-0.5 text-[11.5px] leading-5 text-red-800">You reported that this order doesn&apos;t match what was agreed. No funds were sent.</p>
                    </div>
                  </div>
                  {(reasons.length > 0 || note.trim()) && (
                    <div className="mt-3 rounded-xl border border-line bg-bg-soft px-4 py-3">
                      <div className="annotation text-ink-mute">Your reason</div>
                      {reasons.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1.5">{reasons.map((r) => <span key={r} className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-700">{r}</span>)}</div>}
                      {note.trim() && <p className="mt-2 text-[12px] leading-5 text-ink-soft">{note.trim()}</p>}
                    </div>
                  )}
                  <p className="mt-3 text-center text-[11px] leading-5 text-ink-mute">Your response is shown here. In this prototype it isn&apos;t sent to the merchant yet — share it with them directly.</p>
                  <button type="button" onClick={() => setView("review")} className="mt-3 w-full text-[12px] font-medium text-ink-mute transition-colors hover:text-ink">Back to review</button>
                </Panel>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[12px] leading-5 text-ink-soft">
          <ShieldCheck size={15} strokeWidth={1.7} className="mt-0.5 shrink-0 text-accent-ink" />
          <span><span className="font-medium text-ink">Custody model:</span> managed escrow on Zcash testnet. Funds are held by the escrow wallet and released to the merchant on your confirmation, or refunded by an arbiter — not trustless custody.</span>
        </div>
      </main>

      {/* lightbox */}
      <Lightbox images={order.images} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
      {children}
    </motion.div>
  );
}

function Lightbox({ images, index, onClose, onIndex }: { images: { name: string; src: string }[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const open = index !== null;
  const go = useCallback((dir: number) => {
    if (index === null) return;
    onIndex((index + dir + images.length) % images.length);
  }, [index, images.length, onIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  return (
    <AnimatePresence>
      {open && index !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6">
                <ChevronLeft size={22} />
              </button>
              <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6">
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <motion.figure
            key={index}
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-full max-w-3xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[index].src} alt={images[index].name} className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl" />
            <figcaption className="mt-3 flex items-center gap-2 text-[12px] text-white/80">
              <span className="truncate">{images[index].name}</span>
              <span className="text-white/50">·</span>
              <span>{index + 1} / {images.length}</span>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BuyerMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-soft/50 px-5">
      <section className="card w-full max-w-md p-6 text-center">
        <div className="text-[18px] font-semibold tracking-tight text-ink">{title}</div>
        <p className="mt-2 text-[13px] leading-5 text-ink-soft">{detail}</p>
        <Link href="/" className="btn btn-dark mt-5 !py-2.5 text-[13px]">Back to Zecrow</Link>
      </section>
    </main>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 text-[12.5px]">
      <span className="shrink-0 text-ink-mute">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
