"use client";

import { motion } from "framer-motion";
import { Package, FileDown } from "lucide-react";
import { DEADLINES, type OrderType } from "@/lib/dashboardData";

export default function RightRail() {
  return (
    <div className="space-y-3">
      <WalletCard />
      <Deadlines />
      <FeaturedDispute />
    </div>
  );
}

function WalletCard() {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-3.5 text-black shadow-[var(--shadow-md)]"
      style={{ background: "linear-gradient(135deg,#ffe6a6 0%,#f4b728 46%,#cf8f12 100%)" }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/35 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <span className="text-[12px] font-bold tracking-tight">Escrow wallet</span>
        <span className="flex items-center gap-1 rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Testnet
        </span>
      </div>
      <div className="relative mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-black/55">Shielded balance</div>
      <div className="relative mt-0.5 font-mono text-[19px] font-semibold tracking-[0.16em] text-black/85">
        ••••••<span className="ml-1.5 text-[12px] font-bold tracking-normal">ZEC</span>
      </div>
      <div className="relative mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-black/70">u1 fq…9kd2</span>
        <button className="rounded-full bg-black/85 px-3 py-1 text-[10.5px] font-semibold text-white transition-transform hover:scale-[1.03]">
          Deposit
        </button>
      </div>
    </div>
  );
}

function Deadlines() {
  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Upcoming releases</span>
        <span className="text-[11px] text-ink-mute">{DEADLINES.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {DEADLINES.map((d, i) => {
          const soon = i === 0;
          return (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <TypeDot type={d.type} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-ink">{d.item}</div>
                <div className="text-[10.5px] text-ink-mute">#{d.id}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${soon ? "bg-accent-wash text-accent-ink" : "bg-bg-sunk text-ink-mute"}`}>
                {d.due}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeaturedDispute() {
  return (
    <div className="card relative overflow-hidden p-3.5">
      <span aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Dispute open
          </span>
          <span className="text-[11px] text-ink-mute">#4817</span>
        </div>
        <div className="mt-3 text-[14px] font-semibold text-ink">Vintage film camera</div>
        <div className="text-[11.5px] text-ink-mute">1.80 ZEC held · auto-release paused</div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10.5px] text-ink-mute">
            <span>AI evidence review</span>
            <span>ready</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-sunk">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <button className="btn btn-dark mt-4 w-full !py-2.5 text-[12.5px]">Review dispute</button>
      </div>
    </div>
  );
}

function TypeDot({ type }: { type: OrderType }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-sunk text-ink-soft">
      {type === "physical" ? <Package size={15} strokeWidth={1.7} /> : <FileDown size={15} strokeWidth={1.7} />}
    </span>
  );
}
