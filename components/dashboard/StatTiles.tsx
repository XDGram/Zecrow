"use client";

import { motion } from "framer-motion";
import { useCountUp } from "./useCountUp";

type Tile = {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  trend: string;
  trendUp: boolean;
  spark: number[];
  accent?: boolean;
};

export default function StatTiles({
  inEscrow,
  active,
  awaitingDelivery,
  openDisputes,
}: {
  inEscrow: number;
  active: number;
  awaitingDelivery: number;
  openDisputes: number;
}) {
  const tiles: Tile[] = [
    { label: "In escrow", value: inEscrow, decimals: 2, suffix: "ZEC", trend: "+18%", trendUp: true, spark: [2, 2.6, 2.4, 3.2, 3.9, 4.6, 5.3, 6.42], accent: true },
    { label: "Active orders", value: active, trend: "+3", trendUp: true, spark: [3, 4, 4, 5, 5, 6, 6, 6] },
    { label: "Awaiting delivery", value: awaitingDelivery, trend: "2 due soon", trendUp: false, spark: [1, 2, 1, 2, 3, 2, 2, 2] },
    { label: "Open disputes", value: openDisputes, trend: "needs review", trendUp: false, spark: [0, 0, 1, 0, 1, 1, 0, 1] },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          <Tile {...t} />
        </motion.div>
      ))}
    </div>
  );
}

function Tile({ label, value, decimals, suffix, trend, trendUp, spark, accent }: Tile) {
  const shown = useCountUp(value, 1100, decimals ?? 0);
  return (
    <div
      className={`card group relative h-full overflow-hidden p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${
        accent ? "bg-[linear-gradient(135deg,#fffaf0,#ffffff)]" : ""
      }`}
    >
      {accent && <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent-wash/70 blur-2xl" />}
      <div className="relative flex items-center justify-between">
        <span className="text-[11.5px] font-medium text-ink-mute">{label}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold ${
            trendUp ? "bg-emerald-50 text-emerald-700" : "bg-bg-sunk text-ink-mute"
          }`}
        >
          {trend}
        </span>
      </div>
      <div className="relative mt-1.5 flex items-end gap-1">
        <span className="text-[19px] font-semibold tracking-tight text-ink tabular-nums">{shown}</span>
        {suffix && <span className="mb-0.5 text-[11px] font-medium text-ink-mute">{suffix}</span>}
      </div>
      <Sparkline data={spark} accent={accent} />
    </div>
  );
}

function Sparkline({ data, accent }: { data: number[]; accent?: boolean }) {
  const w = 120;
  const h = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const stroke = accent ? "var(--accent)" : "var(--ink-faint)";
  const fill = accent ? "var(--accent)" : "var(--ink-mute)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2.5 h-6 w-full" preserveAspectRatio="none">
      <polygon points={area} fill={fill} fillOpacity={accent ? 0.1 : 0.06} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={stroke} />
    </svg>
  );
}
