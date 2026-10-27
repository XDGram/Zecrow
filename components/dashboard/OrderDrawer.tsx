"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Package, FileDown } from "lucide-react";
import { STATUS_META, type Order, type OrderStatus, type OrderType } from "@/lib/dashboardData";

const PILL_TONE: Record<string, string> = {
  amber: "bg-accent-wash text-accent-ink",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  mute: "bg-bg-sunk text-ink-mute",
};

const STEPS: Record<OrderType, string[]> = {
  physical: ["Created", "Funded", "Shipped", "Received", "Released"],
  digital: ["Created", "Funded", "Delivered", "Confirmed", "Released"],
};

// How many steps are complete for a given status.
function progress(status: OrderStatus): number {
  switch (status) {
    case "awaiting_payment": return 1;
    case "funded": return 2;
    case "delivered": return 3;
    case "disputed": return 3;
    case "released": return 5;
    case "refunded": return 2;
    default: return 1;
  }
}

export default function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          className="fixed inset-0 z-[80] flex justify-end bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.aside
            className="flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-[var(--shadow-lg)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Content order={order} onClose={onClose} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Content({ order, onClose }: { order: Order; onClose: () => void }) {
  const meta = STATUS_META[order.status];
  const steps = STEPS[order.type];
  const done = progress(order.status);
  const paused = order.status === "disputed";

  return (
    <>
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-sunk text-ink-soft">
            {order.type === "physical" ? <Package size={18} strokeWidth={1.7} /> : <FileDown size={18} strokeWidth={1.7} />}
          </span>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-ink">{order.item}</div>
            <div className="text-[11.5px] text-ink-mute">#{order.id} · {order.type === "physical" ? "Physical" : "Digital"} goods</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:bg-bg-soft hover:text-ink" aria-label="Close">
          <svg viewBox="0 0 20 20" width="15" height="15" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {/* amount + status */}
        <div className="flex items-center justify-between rounded-xl bg-bg-soft p-4">
          <div>
            <div className="annotation text-ink-mute">{order.status === "awaiting_payment" ? "Order amount" : order.status === "expired" ? "Amount" : "In escrow"}</div>
            <div className="mt-0.5 text-[22px] font-semibold tracking-tight text-ink tabular-nums">
              {order.amountZec.toFixed(2)} <span className="text-[12px] font-normal text-ink-mute">ZEC</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${PILL_TONE[meta.tone]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.tone === "green" ? "bg-emerald-500" : meta.tone === "red" ? "bg-red-500" : meta.tone === "blue" ? "bg-blue-500" : meta.tone === "amber" ? "bg-accent" : "bg-ink-faint"}`} />
            {meta.label}
          </span>
        </div>

        {/* stepper */}
        <section>
          <SectionTitle>Escrow progress</SectionTitle>
          {paused && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Auto-release paused  -  dispute open
            </div>
          )}
          <ol className="relative ml-1 space-y-4 border-l border-line pl-5">
            {steps.map((s, i) => {
              const isDone = i < done;
              const isActive = i === done && !paused && order.status !== "released";
              return (
                <li key={s} className="relative">
                  <span className={`absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${isDone ? "bg-ink text-white" : isActive ? "bg-accent text-white ring-4 ring-accent-wash" : "bg-bg-sunk"}`}>
                    {isDone && <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <div className={`text-[13px] ${isDone || isActive ? "font-medium text-ink" : "text-ink-mute"}`}>{s}</div>
                  {isActive && <div className="text-[11px] text-accent-ink">In progress</div>}
                </li>
              );
            })}
          </ol>
        </section>

        {/* type-specific delivery / evidence */}
        <section>
          <SectionTitle>{order.type === "physical" ? "Delivery" : "Digital delivery"}</SectionTitle>
          <div className="space-y-2">
            {order.type === "physical" ? (
              <>
                <InfoRow label="Details" value="See the order description" />
                <InfoRow label="Receipt confirmation" value="Buyer one-time release code" />
                <InfoRow label="Release code" value={order.status === "released" ? "Used ✓" : "Pending"} />
              </>
            ) : (
              <>
                <InfoRow label="Delivery method" value="Download link" />
                <InfoRow label="Receipt confirmation" value="Buyer one-time release code" />
                <InfoRow label="Content" value="Shared with buyer only" />
              </>
            )}
          </div>
        </section>

        {/* terms */}
        <section>
          <SectionTitle>Terms</SectionTitle>
          <div className="space-y-2">
            <InfoRow label="Counterparty" value={order.counterparty} mono />
            <InfoRow label="Created" value={order.created} />
            <InfoRow label="Dispute window" value="7 days" />
            {order.deadline && <InfoRow label="Deadline" value={order.deadline} />}
          </div>
        </section>

        {/* audit trail */}
        <section>
          <SectionTitle>Activity</SectionTitle>
          <div className="space-y-3">
            <Event label="Order created" when={order.created} />
            {done >= 2 && <Event label="Example funding event" when={order.created} />}
            {done >= 3 && <Event label={order.type === "physical" ? "Example shipment event" : "Example delivery event"} when={order.deadline ?? order.created} />}
            {paused && <Event label="Example dispute event" when={order.created} tone="red" />}
            {order.status === "released" && <Event label="Example release event" when={order.created} tone="green" />}
          </div>
        </section>
      </div>

      {/* actions */}
      <div className="border-t border-line p-4">
        <Actions />
        <p className="mt-2.5 text-center text-[10.5px] text-ink-faint">Illustrative · testnet demo</p>
      </div>
    </>
  );
}

function Actions() {
  return (
    <div className="rounded-lg bg-bg-soft px-3 py-2.5 text-center text-[12px] leading-5 text-ink-mute">
      Order actions are unavailable because this drawer shows sample data.
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{children}</h3>;
}
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-ink-mute">{label}</span>
      <span className={`font-medium text-ink ${mono ? "font-mono text-[12px]" : ""}`}>{value}</span>
    </div>
  );
}
function Event({ label, when, tone }: { label: string; when: string; tone?: "red" | "green" }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone === "red" ? "bg-red-500" : tone === "green" ? "bg-emerald-500" : "bg-ink-faint"}`} />
      <div>
        <div className="text-[13px] font-medium text-ink">{label}</div>
        <div className="text-[11px] text-ink-mute">{when}</div>
      </div>
    </div>
  );
}
