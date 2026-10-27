"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ListingVerdict, Verdict } from "@/lib/listingCheck";

type Draft = {
  type: "physical" | "digital" | null;
  item: string;
  amount: string;
  description: string;
  imageCount: number;
  shipping?: string;
  proof?: string;
  release?: string;
  disputeWindowDays?: string;
};

type Server =
  | { status: "completed"; verdict: ListingVerdict }
  | { status: "unavailable"; reason?: string }
  | { status: "error"; reason?: string };

type Phase = "idle" | "checking" | "completed" | "unavailable" | "error";

const VERDICT_META: Record<Verdict, { label: string; ring: string; chip: string; dot: string }> = {
  incomplete: { label: "Needs work", ring: "#e0a800", chip: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  fair: { label: "Fair", ring: "#2563eb", chip: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  strong: { label: "Strong", ring: "#059669", chip: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
};

/* Instant, deterministic readiness — updates on every keystroke so the panel always
   feels live, even before the AI verdict returns. */
function localReadiness(d: Draft) {
  const checks = [
    { label: "Item named", done: d.item.trim().length >= 3 },
    { label: "Amount set", done: Number(d.amount) > 0 },
    { label: "Described (40+ chars)", done: d.description.trim().length >= 40 },
    d.type === "physical"
      ? { label: "Photo added", done: d.imageCount >= 1 }
      : { label: "Delivery proof chosen", done: Boolean(d.proof) },
    { label: "Terms added", done: Boolean((d.shipping || "").trim() || (d.release || "").trim()) },
  ];
  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  return { checks, score };
}

export default function ListingCheck({ draft }: { draft: Draft }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [verdict, setVerdict] = useState<ListingVerdict | null>(null);
  const [reason, setReason] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const { checks, score } = localReadiness(draft);
  const ready = Boolean(draft.type && draft.item.trim().length >= 3 && Number(draft.amount) > 0);

  // Debounced live AI verdict — fires ~900ms after the seller stops typing.
  const sig = JSON.stringify(draft);
  useEffect(() => {
    if (!ready) {
      setPhase("idle");
      setVerdict(null);
      return;
    }
    setPhase("checking");
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch("/api/escrows/listing-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal: ac.signal,
        });
        const data = (await res.json()) as Server;
        if (ac.signal.aborted) return;
        if (data.status === "completed") {
          setVerdict(data.verdict);
          setPhase("completed");
        } else if (data.status === "unavailable") {
          setReason(data.reason ?? "");
          setPhase("unavailable");
        } else {
          setReason(data.reason ?? "");
          setPhase("error");
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setPhase("error");
      }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, ready]);

  const activeVerdict: Verdict = verdict?.verdict ?? (score >= 80 ? "strong" : score >= 50 ? "fair" : "incomplete");
  const meta = VERDICT_META[activeVerdict];

  return (
    <div className="mx-auto mt-4 max-w-2xl">
      <div className="card relative overflow-hidden p-5">
        {/* animated scan sheen while checking */}
        <AnimatePresence>
          {phase === "checking" && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/10 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-3">
          {/* readiness ring + pulsing AI orb */}
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--line)" strokeWidth="4" />
              <motion.circle
                cx="24" cy="24" r="20" fill="none" stroke={meta.ring} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - score / 100) }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </svg>
            <motion.span
              className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full"
              style={{ background: meta.ring }}
              animate={phase === "checking" ? { scale: [1, 1.6, 1], opacity: [1, 0.5, 1] } : { scale: 1, opacity: 1 }}
              transition={{ repeat: phase === "checking" ? Infinity : 0, duration: 1 }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-ink">AI listing check</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>{meta.label}</span>
              <span className="ml-auto text-[10.5px] uppercase tracking-wider text-ink-faint">Advisory</span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-ink-mute">
              {phase === "checking"
                ? "Reviewing your draft…"
                : phase === "completed" && verdict
                ? verdict.headline
                : phase === "unavailable"
                ? "Live AI check is offline — the readiness checklist still works."
                : phase === "error"
                ? "Couldn't reach the AI check — your readiness checklist still works."
                : ready
                ? "Keep filling in details for a live verdict."
                : "Pick a type and name your item to start the live check."}
            </p>
          </div>
        </div>

        {/* instant readiness checklist */}
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                c.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-bg-soft text-ink-mute"
              }`}
            >
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${c.done ? "bg-emerald-500 text-white" : "bg-ink/10 text-transparent"}`}>
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5 5 9l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {c.label}
            </span>
          ))}
        </div>

        {/* AI verdict detail */}
        <AnimatePresence mode="wait">
          {phase === "completed" && verdict && (
            <motion.div
              key="v"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative mt-4 space-y-2 border-t border-line pt-3"
            >
              <VList label="Strong points" items={verdict.strengths} dot="bg-emerald-500" />
              <VList label="Suggestions" items={verdict.suggestions} dot="bg-amber-500" />
              <VList label="Worth clarifying" items={verdict.flags} dot="bg-red-500" />
              <p className="text-[10.5px] leading-4 text-ink-faint">{verdict.disclaimer}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="relative mt-3 text-[10.5px] leading-4 text-ink-faint">
          Checks clarity only — it never verifies the goods, approves the sale, or moves funds.
        </p>
      </div>
    </div>
  );
}

function VList({ label, items, dot }: { label: string; items: string[]; dot: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[11.5px] leading-5 text-ink-soft">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
