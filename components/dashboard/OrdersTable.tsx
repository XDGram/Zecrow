"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Package, FileDown } from "lucide-react";
import { useMemo, useState } from "react";
import { ORDERS, STATUS_META, type Order, type OrderType } from "@/lib/dashboardData";
import OrderDrawer from "./OrderDrawer";

type Tab = "all" | OrderType;

const PILL_TONE: Record<string, string> = {
  amber: "bg-accent-wash text-accent-ink",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  mute: "bg-bg-sunk text-ink-mute",
};

export default function OrdersTable({ limit, orders = ORDERS }: { limit?: number; orders?: Order[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const counts = useMemo(
    () => ({
      all: orders.length,
      physical: orders.filter((o) => o.type === "physical").length,
      digital: orders.filter((o) => o.type === "digital").length,
    }),
    [orders]
  );

  const rows = useMemo(() => {
    const r = orders.filter((o) => (tab === "all" ? true : o.type === tab)).filter((o) =>
      o.item.toLowerCase().includes(query.toLowerCase())
    );
    return limit ? r.slice(0, limit) : r;
  }, [orders, tab, query, limit]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "physical", label: "Physical" },
    { id: "digital", label: "Digital" },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-1 rounded-full bg-bg-sunk p-1" role="tablist" aria-label="Order type">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className="relative rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="orders-tab"
                    className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-sm)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={`relative z-10 ${active ? "text-ink" : "text-ink-mute hover:text-ink-soft"}`}>
                  {t.label}
                  <span className="ml-1.5 text-[10px] text-ink-faint">{counts[t.id]}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-mute">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders"
            className="w-28 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-mute sm:w-40"
          />
        </div>
      </div>

      {/* header */}
      <div className="hidden grid-cols-[1.6fr_0.8fr_1fr_1fr_0.5fr] gap-3 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-faint md:grid">
        <span>Order</span>
        <span>Amount</span>
        <span>Counterparty</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-line">
        <AnimatePresence mode="popLayout">
          {rows.map((o, i) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Row order={o} onOpen={() => setSelected(o)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px] text-ink-mute">No orders match that filter.</div>
        )}
      </div>

      <OrderDrawer order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Row({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const meta = STATUS_META[order.status];
  return (
    <div
      onClick={onOpen}
      className="group grid cursor-pointer grid-cols-[1.6fr_1fr_0.5fr] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-soft md:grid-cols-[1.6fr_0.8fr_1fr_1fr_0.5fr]"
    >
      <div className="flex items-center gap-2.5">
        <TypeIcon type={order.type} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-ink">{order.item}</div>
          <div className="text-[11px] text-ink-mute">
            #{order.id} · {order.type === "physical" ? "Physical" : "Digital"} · {order.created}
          </div>
        </div>
      </div>
      <div className="hidden text-[13px] font-semibold text-ink tabular-nums md:block">
        {order.amountZec.toFixed(2)} <span className="text-[11px] font-normal text-ink-mute">ZEC</span>
      </div>
      <div className="hidden font-mono text-[12px] text-ink-soft md:block">{order.counterparty}</div>
      <div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${PILL_TONE[meta.tone]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.tone === "green" ? "bg-emerald-500" : meta.tone === "red" ? "bg-red-500" : meta.tone === "blue" ? "bg-blue-500" : meta.tone === "amber" ? "bg-accent" : "bg-ink-faint"}`} />
          {meta.label}
        </span>
      </div>
      <div className="text-right">
        <button type="button" className="inline-flex items-center gap-0.5 text-[12px] font-medium text-ink-soft transition-colors group-hover:text-accent-ink">
          View
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-0.5">
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: OrderType }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-sunk text-ink-soft">
      {type === "physical" ? <Package size={16} strokeWidth={1.7} /> : <FileDown size={16} strokeWidth={1.7} />}
    </span>
  );
}
