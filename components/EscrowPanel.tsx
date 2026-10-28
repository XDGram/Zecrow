"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Hero product panel: an illustrative Zecrow escrow order card on a soft
 * amber wash (the Northstar product-panel slot). Static preview, not live data.
 */

const STAGES = [
  { label: "Order", status: "Order created", detail: "The buyer and seller agree on the order details." },
  { label: "Payment", status: "Example: funded", detail: "In the intended flow, a server-side payment watcher verifies the deposit before the order moves forward." },
  { label: "Delivery", status: "Delivery in progress", detail: "The seller shares delivery details with the buyer." },
  { label: "Release", status: "Example: release step", detail: "In the intended flow, the buyer's valid one-time code is the release mechanism." },
];
const STEPS = ["Created", "Funded", "Delivered", "Released"];

export default function EscrowPanel() {
  const [stage, setStage] = useState(2);
  const current = STAGES[stage];
  return (
    <div className="card wash-amber overflow-hidden shadow-[var(--shadow-lg)]">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <div className="ml-3 flex items-center gap-1.5 rounded-md bg-white/70 px-2.5 py-1">
          <LockIcon />
          <span className="annotation normal-case tracking-normal text-ink-mute">
            zecrow.app/e/8f2a…
          </span>
        </div>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 px-3 pt-3" role="group" aria-label="Escrow preview stages">
        {STAGES.map((t, i) => {
          const active = i === stage;
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={active}
              onClick={() => setStage(i)}
              className={`relative rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "text-ink"
                  : "text-ink-mute"
              }`}
            >
              {active && <motion.span layoutId="escrow-stage-pill" className="absolute inset-0 rounded-lg bg-white shadow-[var(--shadow-sm)]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* body */}
      <div className="m-3 mt-3 rounded-xl border border-line bg-white p-5">
        {/* header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-sunk">
              <CameraIcon />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink">Vintage film camera</p>
              <p className="text-[12.5px] text-ink-mute">Physical goods · Order #4817</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-2.5 py-1 text-[12px] font-medium text-accent-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {current.status}
          </span>
        </div>

        {/* amount */}
        <div className="mt-5 flex items-end justify-between rounded-lg bg-bg-soft px-4 py-3">
          <div>
            <p className="annotation text-ink-mute">Example amount</p>
            <p className="mt-1 text-[22px] font-semibold tracking-tight text-ink">
              1.80 <span className="text-[14px] text-ink-mute">ZEC</span>
            </p>
          </div>
          <div className="text-right">
            <p className="annotation text-ink-mute">Shielded</p>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-soft">
              <LockIcon /> Orchard
            </p>
          </div>
        </div>

        {/* stepper */}
        <div className="mt-6 flex items-center">
          {STEPS.map((label, i) => {
            const done = i < stage;
            const active = i === stage;
            return <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-ink text-white"
                      : active
                        ? "bg-accent text-white ring-4 ring-accent-wash"
                        : "bg-bg-sunk text-ink-mute"
                  }`}
                >
                  {done ? <CheckIcon /> : i + 1}
                </div>
                <span
                  className={`mt-2 text-[11px] ${
                    active ? "font-medium text-ink" : "text-ink-mute"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 mb-5 h-px flex-1 ${
                    done ? "bg-ink/40" : "bg-line"
                  }`}
                />
              )}
            </div>
          })}
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-mute" aria-live="polite">{current.detail}</p>
      </div>

      {/* floating confirm chip */}
      <div className="mx-3 mb-4 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-wash">
            <ShieldIcon />
          </div>
          <span className="text-[12.5px] text-ink-soft">
            Auto-release holds while a dispute is open
          </span>
        </div>
        <span className="annotation text-ink-faint">Illustrative preview</span>
      </div>
    </div>
  );
}

/* ---- icons ---- */
function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" className="text-ink-mute" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" className="text-ink-mute" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-ink">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent-ink">
      <path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
