"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { TRANSACTIONS, TX_META, type Txn, type TxKind } from "@/lib/dashboardData";

type Filter = "all" | "fund" | "release" | "refund";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fund", label: "Funding" },
  { id: "release", label: "Releases" },
  { id: "refund", label: "Refunds" },
];

export default function TransactionsTable() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => (filter === "all" ? TRANSACTIONS : TRANSACTIONS.filter((t) => t.kind === filter)),
    [filter]
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-1 rounded-full bg-bg-sunk p-1">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className="relative rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors"
              >
                {active && (
                  <motion.span layoutId="tx-tab" className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-sm)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className={`relative z-10 ${active ? "text-ink" : "text-ink-mute hover:text-ink-soft"}`}>{f.label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-ink-mute">{rows.length} transactions</span>
      </div>

      <div className="hidden grid-cols-[1.4fr_0.8fr_1.2fr_0.8fr_0.9fr] gap-3 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-faint md:grid">
        <span>Type</span>
        <span>Amount</span>
        <span>Transaction</span>
        <span>Confirmations</span>
        <span className="text-right">Time</span>
      </div>

      <div className="divide-y divide-line">
        <AnimatePresence mode="popLayout">
          {rows.map((t, i) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, delay: i * 0.02 }}>
              <Row tx={t} />
            </motion.div>
          ))}
        </AnimatePresence>
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-ink-mute">No transactions in this filter yet.</div>
        )}
      </div>
    </div>
  );
}

function Row({ tx }: { tx: Txn }) {
  const meta = TX_META[tx.kind];
  const out = meta.dir === "out";
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.9fr] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-soft md:grid-cols-[1.4fr_0.8fr_1.2fr_0.8fr_0.9fr]">
      <div className="flex items-center gap-2.5">
        <DirIcon out={out} kind={tx.kind} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-ink">{meta.label}</div>
          <div className="text-[11px] text-ink-mute">{tx.order ? `Order #${tx.order}` : "Wallet"}</div>
        </div>
      </div>
      <div className={`text-[13px] font-semibold tabular-nums ${out ? "text-ink" : "text-emerald-600"}`}>
        {out ? "−" : "+"}{tx.amountZec.toFixed(2)} <span className="text-[11px] font-normal text-ink-mute">ZEC</span>
      </div>
      <div className="hidden items-center gap-1.5 md:flex">
        <span className="font-mono text-[12px] text-ink-soft">{tx.txid}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-ink-faint"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="hidden md:block">
        {tx.status === "pending" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-2.5 py-1 text-[11px] font-medium text-accent-ink">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> {tx.confirmations} conf · pending
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {tx.confirmations} conf
          </span>
        )}
      </div>
      <div className="text-right text-[11.5px] text-ink-mute">{tx.when}</div>
    </div>
  );
}

function DirIcon({ out, kind }: { out: boolean; kind: TxKind }) {
  const tone = out ? "bg-accent-wash text-accent-ink" : "bg-emerald-50 text-emerald-600";
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      {kind === "refund" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5 4 10l5 5M4 10h11a5 5 0 0 1 0 10h-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : out ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17 7 7 17m8 0H7V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </span>
  );
}
