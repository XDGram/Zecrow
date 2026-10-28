"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type Action = "release" | "refund" | "request";

const META: Record<Action, { label: string; confirm: string; done: string }> = {
  release: { label: "Preview release to merchant", confirm: "Preview a release decision for the merchant?", done: "Release to merchant" },
  refund: { label: "Preview refund to buyer", confirm: "Preview a refund decision for the buyer?", done: "Refund to buyer" },
  request: { label: "Preview evidence request", confirm: "Preview a request for additional evidence?", done: "Request more evidence" },
};

export default function DisputeDecision() {
  const [pending, setPending] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [decided, setDecided] = useState<Action | null>(null);

  if (decided) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-600"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div className="text-[12.5px] font-medium text-emerald-800">Preview only: {META[decided].done}. No decision was saved and no funds moved.</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button onClick={() => setPending("release")} className="btn btn-dark !py-2.5 text-[12.5px]">Preview release</button>
        <button onClick={() => setPending("refund")} className="btn btn-ghost !py-2.5 text-[12.5px]">Preview refund</button>
        <button onClick={() => setPending("request")} className="btn btn-ghost !py-2.5 text-[12.5px]">Preview request</button>
      </div>

      <AnimatePresence>
        {pending && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            onMouseDown={(e) => e.target === e.currentTarget && setPending(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-lg)]"
              initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
            >
              <div className="text-[15px] font-semibold text-ink">{META[pending].label}</div>
              <p className="mt-1.5 text-[12.5px] leading-5 text-ink-soft">{META[pending].confirm} This local preview does not save a decision or move funds.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason for the decision (required)"
                className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-accent/70"
              />
              <div className="mt-4 flex gap-2">
                <button
                  disabled={!reason.trim()}
                  onClick={() => { setDecided(pending); setPending(null); }}
                  className="btn btn-dark flex-1 !py-2.5 text-[13px] disabled:opacity-40"
                >
                  Preview action
                </button>
                <button onClick={() => setPending(null)} className="btn btn-ghost !px-4 !py-2.5 text-[13px]">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
