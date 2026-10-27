"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type Evidence = { party: string; title: string; meta: string; photos: number };

const EVIDENCE: Evidence[] = [
  { party: "Buyer", title: "Item arrived damaged", meta: "2 photos · Jan 31 · 10:42", photos: 2 },
  { party: "Merchant", title: "Packed intact before dispatch", meta: "3 photos · Jan 31 · 11:08", photos: 3 },
];

export default function EvidenceList() {
  const [open, setOpen] = useState<Evidence | null>(null);

  return (
    <>
      <div className="space-y-2.5">
        {EVIDENCE.map((e) => (
          <div key={e.party} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-soft text-ink-mute">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 4v5h5" stroke="currentColor" strokeWidth="1.5" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px]"><span className="font-semibold text-ink">{e.party}</span> <span className="text-ink-soft">· {e.title}</span></div>
              <div className="text-[10.5px] text-ink-mute">{e.meta}</div>
            </div>
            <button onClick={() => setOpen(e)} className="text-[11px] font-medium text-ink-soft transition-colors hover:text-ink">View</button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lg)]"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="text-[13px] font-semibold text-ink">{open.party} evidence</div>
                <button onClick={() => setOpen(null)} className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-soft hover:text-ink" aria-label="Close">
                  <svg viewBox="0 0 20 20" width="13" height="13" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: open.photos }).map((_, i) => (
                    <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-lg bg-bg-sunk text-ink-mute">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="8.5" cy="9" r="1.2" fill="currentColor" /></svg>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[13px] font-medium text-ink">{open.title}</div>
                <div className="text-[11px] text-ink-mute">{open.meta}</div>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-bg-soft px-3 py-2 text-[11px] leading-5 text-ink-soft">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-ink-mute"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  Image-provenance check not run. It can be run with consent during review.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
