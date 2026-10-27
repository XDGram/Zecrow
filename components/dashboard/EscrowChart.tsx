"use client";

import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

const W = 640;
const H = 200;
const PAD_Y = 22;
const RANGES = ["1M", "3M", "1Y", "All"];
const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];

function smoothPath(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export default function EscrowChart({ series }: { series: number[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [range, setRange] = useState("All");

  const { pts, linePath, areaPath, max } = useMemo(() => {
    const max = Math.max(...series) * 1.1;
    const min = 0;
    const span = max - min || 1;
    const pts = series.map((v, i) => {
      const x = (i / (series.length - 1)) * W;
      const y = H - PAD_Y - ((v - min) / span) * (H - PAD_Y * 2);
      return [x, y] as const;
    });
    const linePath = smoothPath(pts);
    const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
    return { pts, linePath, areaPath, max };
  }, [series]);

  const last = series[series.length - 1];
  const hi = hover ?? series.length - 1;
  const hp = pts[hi];

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, idx)));
  };

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11.5px] font-medium text-ink-mute">Total held in escrow</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[22px] font-semibold tracking-tight text-ink tabular-nums">
              {last.toFixed(2)}
            </span>
            <span className="text-[12px] font-medium text-ink-mute">ZEC</span>
            <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
              +18% this month
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-bg-soft p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                range === r ? "bg-white text-ink shadow-[var(--shadow-sm)]" : "text-ink-mute hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="h-36 w-full overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="escrow-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#escrow-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* hover guide */}
          <line x1={hp[0]} x2={hp[0]} y1="0" y2={H} stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <circle cx={hp[0]} cy={hp[1]} r="4" fill="var(--accent)" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* floating tooltip */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-center shadow-[var(--shadow-md)]"
          style={{ left: `${(hp[0] / W) * 100}%`, top: `${(hp[1] / H) * 100 * 0.88}%` }}
        >
          <div className="text-[11px] font-semibold text-ink tabular-nums">{series[hi].toFixed(2)} ZEC</div>
          <div className="text-[9px] text-ink-mute">{MONTHS[hi] ?? ""}</div>
        </div>
      </div>

      <div className="mt-2 flex justify-between px-1 text-[10px] text-ink-mute">
        {MONTHS.filter((_, i) => i % 3 === 0).map((m) => (
          <span key={m}>{m}</span>
        ))}
        <span>Now</span>
      </div>
      <p className="mt-3 text-[10.5px] text-ink-faint">Illustrative · testnet demo data</p>
      <span className="sr-only">Range {range}, peak {max.toFixed(2)} ZEC</span>
    </div>
  );
}
