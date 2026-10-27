"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
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
  expiresAt: string;
  status: "awaiting_payment" | "expired";
};

const PROGRESS: { key: string; label: string }[] = [
  { key: "fund", label: "Fund" },
  { key: "deliver", label: "Delivery" },
  { key: "release", label: "Released" },
];

export default function BuyerFlow() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <BuyerMessage title="Loading order" detail="Fetching the saved order details." />;
  if (error || !order) return <BuyerMessage title="Order link unavailable" detail={error || "This order link could not be found."} />;

  const delivery = order.type === "physical"
    ? "Delivery details are in the order description. Confirm receipt with the one-time code."
    : `${order.deliveryMethod === "link" ? "Download link" : order.deliveryMethod === "file" ? "File delivery" : "License key"} · confirm delivery with the one-time code`;
  return (
    <div className="min-h-screen bg-bg-soft/50">
      {/* top bar */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-ink">
            <ZecrowMark size={24} />
            <span className="text-[14px] font-bold tracking-[-0.035em]">Zecrow</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="9" rx="2.2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Testnet prototype
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-8">
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-950">
          <strong>{order.status === "expired" ? "Order link expired." : "Saved order preview."}</strong> {order.status === "expired" ? "This payment link can no longer be used." : "Review the merchant's terms before proceeding."} Testnet payment verification, release-code checks, refunds, and escrow custody are not connected, so do not send funds.
        </div>
        {/* progress */}
        <div className="mb-6 flex items-center gap-2">
          {PROGRESS.map((p, i) => {
            const done = false;
            const active = i === 0;
            return (
              <div key={p.key} className="flex flex-1 items-center gap-2">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${done ? "bg-ink text-white" : active ? "bg-accent text-white ring-4 ring-accent-wash" : "bg-bg-sunk text-ink-mute"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[12px] font-medium ${active || done ? "text-ink" : "text-ink-mute"}`}>{p.label}</span>
                {i < PROGRESS.length - 1 && <span className={`mx-1 h-px flex-1 ${done ? "bg-ink/40" : "bg-line"}`} />}
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
            <p className="mt-3 text-[12px] leading-5 text-ink-soft">{order.description}</p>

            {/* photos */}
            {order.images.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2">
              {order.images.map((image, i) => (
                <div key={`${image.name}-${i}`} role="img" aria-label={image.name} className="aspect-[4/3] rounded-lg bg-cover bg-center" style={{ backgroundImage: `url("${image.src}")` }} />
              ))}
            </div>}

            <div className="mt-4 flex items-end justify-between rounded-xl bg-bg-soft px-4 py-3">
              <div>
                <div className="annotation text-ink-mute">Amount</div>
                <div className="mt-0.5 text-[24px] font-semibold tracking-tight text-ink tabular-nums">
                  {Number(order.amountZec).toFixed(2)} <span className="text-[13px] font-normal text-ink-mute">ZEC</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-2.5 py-1 text-[11px] font-medium text-accent-ink">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6c-1.4 0-2.7-.3-3.8-.8M4 4l16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                Shielded
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
              <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <div className="space-y-3">
                  <button type="button" disabled className="btn btn-dark w-full !cursor-not-allowed !py-3 text-[14px] opacity-50">
                    {order.status === "expired" ? "This order link has expired" : "Payment verification is not connected"}
                  </button>
                  <p className="text-center text-[12px] leading-5 text-ink-mute">
                    This saved order has no testnet deposit address or payment watcher. The payment action stays disabled until a deposit can be verified and tied to this order.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* custody note */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[12px] leading-5 text-ink-soft">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-accent-ink"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          <span className="font-medium text-ink">Custody model:</span> managed escrow is planned. This saved order does not hold funds or process releases and refunds.
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Zcash testnet wallet connection is not attached to this order yet. No funds move on this page.
        </p>
      </main>
    </div>
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
