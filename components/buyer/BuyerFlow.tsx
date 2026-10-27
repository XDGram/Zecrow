"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import ZecrowMark from "@/components/ZecrowMark";
import { useWallet } from "@/components/wallet/WalletProvider";

type Step = "review" | "connecting" | "funding" | "funded" | "confirm" | "released" | "error";

const ORDER = {
  merchant: "u1 fq…9kd2",
  item: "Vintage film camera",
  type: "physical" as const,
  amountZec: 1.8,
  delivery: "Ships tracked · released by your one-time code",
  release: "Funds release to the seller when you confirm receipt.",
  dispute: "7 days",
  photos: 3,
};

const PROGRESS: { key: string; label: string }[] = [
  { key: "fund", label: "Fund" },
  { key: "deliver", label: "Delivery" },
  { key: "release", label: "Released" },
];

function stageIndex(step: Step) {
  if (step === "released") return 3;
  if (step === "funded" || step === "confirm") return 1;
  return 0;
}

export default function BuyerFlow() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "8f2a1c";
  const { connection, installed, connect, sendPayment } = useWallet();
  const [step, setStep] = useState<Step>("review");
  const [txid, setTxid] = useState<string | null>(null);
  const [error, setError] = useState("");

  const recipient = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? "").trim();

  const fund = async () => {
    setError("");
    // Real shielded payment when both the wallet and an escrow address are available.
    if (installed && recipient) {
      try {
        setStep("connecting");
        if (!connection) await connect();
        setStep("funding");
        const id = await sendPayment({
          to: recipient,
          amount: ORDER.amountZec.toFixed(2),
          memo: `zecrow:${code}`,
        });
        setTxid(id);
        setStep("funded");
      } catch {
        setStep("error");
        setError("The payment was cancelled or failed. No funds moved.");
      }
      return;
    }
    // No live wallet/escrow configured — run the clearly-labelled testnet demo.
    setStep("connecting");
    setTimeout(() => setStep("funding"), 1100);
    setTimeout(() => setStep("funded"), 3100);
  };

  const stage = stageIndex(step);

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
            Secure escrow
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-8">
        {/* progress */}
        <div className="mb-6 flex items-center gap-2">
          {PROGRESS.map((p, i) => {
            const done = i < stage;
            const active = i === stage;
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
              <span className="text-[12px] text-ink-mute">You&apos;re paying</span>
              <span className="font-mono text-[12px] text-ink-soft">{ORDER.merchant}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-sunk text-ink-soft">
                <Package size={20} strokeWidth={1.7} />
              </span>
              <div>
                <div className="text-[15px] font-semibold text-ink">{ORDER.item}</div>
                <div className="text-[11.5px] text-ink-mute">Physical goods · link /e/{code}</div>
              </div>
            </div>

            {/* photos */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: ORDER.photos }).map((_, i) => (
                <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-lg bg-[linear-gradient(135deg,#fff6e3,#fdeccb)] text-accent-ink/60">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="8.5" cy="9" r="1.2" fill="currentColor" /></svg>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-end justify-between rounded-xl bg-bg-soft px-4 py-3">
              <div>
                <div className="annotation text-ink-mute">Amount</div>
                <div className="mt-0.5 text-[24px] font-semibold tracking-tight text-ink tabular-nums">
                  {ORDER.amountZec.toFixed(2)} <span className="text-[13px] font-normal text-ink-mute">ZEC</span>
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
            <Term label="Delivery" value={ORDER.delivery} />
            <Term label="Release" value={ORDER.release} />
            <Term label="Dispute window" value={ORDER.dispute} />
          </div>

          {/* action area */}
          <div className="p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <ActionArea step={step} onFund={fund} onReceived={() => setStep("confirm")} onReleased={() => setStep("released")} amount={ORDER.amountZec} txid={txid} error={error} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* custody note */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[12px] leading-5 text-ink-soft">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-accent-ink"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          Your payment is held in <span className="font-medium text-ink">managed escrow</span> and only released when you confirm receipt — or a human arbiter decides a dispute. This is managed custody, not trustless escrow.
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Protected by Zecrow · {txid ? "Zcash testnet · payment broadcast on-chain" : "Zcash testnet demo · no funds move"}
        </p>
      </main>
    </div>
  );
}

function ActionArea({ step, onFund, onReceived, onReleased, amount, txid, error }: { step: Step; onFund: () => void; onReceived: () => void; onReleased: () => void; amount: number; txid: string | null; error: string }) {
  if (step === "review") {
    return (
      <button onClick={onFund} className="btn btn-dark w-full !py-3 text-[14px]">
        Fund {amount.toFixed(2)} ZEC with your wallet
      </button>
    );
  }
  if (step === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          {error || "The payment could not be completed."}
        </div>
        <button onClick={onFund} className="btn btn-dark w-full !py-3 text-[14px]">Try again</button>
      </div>
    );
  }
  if (step === "connecting" || step === "funding") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl bg-bg-soft py-4 text-[13px] font-medium text-ink-soft">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="animate-spin text-accent"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
        {step === "connecting" ? "Waiting for wallet…" : "Confirming shielded payment…"}
      </div>
    );
  }
  if (step === "funded") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Funded — your payment is safe in escrow
        </div>
        {txid && (
          <p className="break-all rounded-lg bg-bg-soft px-3 py-2 text-center font-mono text-[10.5px] text-ink-mute">txid {txid}</p>
        )}
        <p className="text-[12.5px] leading-5 text-ink-soft">The seller will ship your order. Once it arrives, confirm receipt to release the funds.</p>
        <button onClick={onReceived} className="btn btn-dark w-full !py-3 text-[14px]">I&apos;ve received my order</button>
      </div>
    );
  }
  if (step === "confirm") {
    return <ConfirmReceipt onReleased={onReleased} />;
  }
  return (
    <div className="py-2 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="text-[16px] font-semibold text-ink">Funds released</div>
      <p className="mt-1.5 text-[12.5px] text-ink-soft">The seller has been paid. Thanks for using Zecrow escrow.</p>
    </div>
  );
}

function ConfirmReceipt({ onReleased }: { onReleased: () => void }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const filled = digits.every((d) => d !== "");

  const set = (i: number, v: string) => {
    const c = v.replace(/\D/g, "").slice(-1);
    setDigits((p) => p.map((d, j) => (j === i ? c : d)));
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-semibold text-ink">Enter your release code</p>
        <p className="mt-1 text-[12px] text-ink-soft">The one-time code from your delivery confirms receipt and releases the funds.</p>
      </div>
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            className="h-12 w-full rounded-xl border border-line bg-white text-center text-[18px] font-semibold text-ink outline-none transition-colors focus:border-accent/70"
          />
        ))}
      </div>
      <button onClick={onReleased} disabled={!filled} className="btn btn-dark w-full !py-3 text-[14px] disabled:opacity-40">
        Release funds to seller
      </button>
    </div>
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
