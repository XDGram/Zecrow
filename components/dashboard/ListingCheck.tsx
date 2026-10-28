"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { getListingPreflight, type ClaimAssessment, type ListingDraft, type ListingVerdict, type Verdict } from "@/lib/listingCheck";

type Phase = "idle" | "checking" | "completed" | "unavailable" | "error";
type Response = { status: "completed"; verdict: ListingVerdict } | { status: "unavailable" | "error"; reason?: string };
const META: Record<Verdict, { label: string; chip: string }> = {
  incomplete: { label: "Needs work", chip: "border-red-200 bg-red-50 text-red-800" },
  fair: { label: "Needs changes", chip: "border-red-200 bg-red-50 text-red-800" },
  strong: { label: "Ready", chip: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export default function ListingCheck({ draft, onPass }: { draft: ListingDraft | null; onPass: (signature: string | null) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [verdict, setVerdict] = useState<ListingVerdict | null>(null);
  const [reason, setReason] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const signature = useMemo(() => draft ? JSON.stringify(draft) : "no-draft", [draft]);
  const preflight = draft ? getListingPreflight(draft) : null;
  const canReview = Boolean(preflight?.ready);

  useEffect(() => {
    onPass(null);
    abortRef.current?.abort();
    setVerdict(null);
    setReason("");
    const currentDraft = draft;
    if (!currentDraft || !canReview) { setPhase("idle"); return; }
    setPhase("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      abortRef.current = controller;
      try {
        const response = await fetch("/api/escrows/listing-check", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(currentDraft), signal: controller.signal,
        });
        const data = await response.json() as Response;
        if (controller.signal.aborted) return;
        if (data.status === "completed") {
          setVerdict(data.verdict); setPhase("completed");
          if (data.verdict.verdict === "strong") onPass(signature);
        } else { setReason(data.reason ?? "The listing could not be reviewed."); setPhase(data.status); }
      } catch (error) {
        if ((error as Error).name !== "AbortError") { setReason("Could not reach the listing review service."); setPhase("error"); }
      }
    }, 650);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canReview, draft, onPass, retryCount, signature]);

  const strong = phase === "completed" && verdict?.verdict === "strong";
  const hasIssues = phase === "completed" && Boolean(verdict) && verdict?.verdict !== "strong";
  const label = phase === "checking" ? "Reviewing listing and photos" : phase === "completed" ? verdict?.headline : phase === "unavailable" || phase === "error" ? reason : !draft ? "Choose a product type to begin" : canReview ? "Waiting for review" : "Complete the checklist to start the AI review";
  const failed = phase === "unavailable" || phase === "error";
  const assessmentStyle: Record<ClaimAssessment, string> = {
    consistent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    unclear: "bg-amber-50 text-amber-800 border-amber-200",
    questionable: "bg-red-50 text-red-700 border-red-200",
  };

  const blockers = preflight?.checks.filter((check) => !check.done) ?? [];

  return <section className={`card p-4 transition-colors sm:p-5 ${hasIssues ? "border-red-300 bg-red-50/50" : strong ? "border-emerald-300 bg-emerald-50/30" : ""}`} aria-live="polite">
    <div className="zec-review-stage rounded-lg border border-line bg-bg-soft px-3 py-2" role={phase === "checking" ? "status" : undefined} aria-label={phase === "checking" ? "Reviewing this step" : undefined}>
      <ReviewLoader hasIssues={hasIssues || failed} passed={strong} settled={phase === "idle" || failed} />
      <div><p className="text-[11px] font-semibold text-ink">{phase === "checking" ? "Checking your details" : phase === "completed" ? "Review complete" : failed ? "Review did not finish" : "Live review"}</p><p className="text-[10.5px] text-ink-mute">{phase === "checking" ? "Comparing the listing with the photos" : failed ? "The AI service returned an error. Your draft is still here." : !draft ? "Photo and claim checks will appear here" : phase === "completed" ? "Your verdict and any fixes appear below" : "The review stays here as you complete each step"}</p></div>
    </div>
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2"><h3 className="text-[13px] font-semibold text-ink">{!draft ? "AI listing review" : draft.stage === "item" ? "Item check" : "Terms check"}</h3>
          {phase === "completed" && verdict && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${META[verdict.verdict].chip}`}>{META[verdict.verdict].label}</span>}
        </div>
        <p className="mt-1 text-[11.5px] text-ink-mute">{label}</p>
      </div>
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-ink-faint">Live check</span>
    </div>

    {preflight && <div className="mt-4 grid grid-cols-8 gap-1" aria-label={`Listing completeness ${preflight.score}%`}>
      {Array.from({ length: 8 }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i < Math.round(preflight.score / 100 * 8) ? "bg-accent" : "bg-bg-sunk"}`} />)}
    </div>}

    {preflight && <div className="mt-4 flex flex-wrap gap-1.5">
      {preflight.checks.map((check) => <span key={check.id} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] ${check.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-bg-soft text-ink-mute"}`}>
        <span aria-hidden>{check.done ? "✓" : "·"}</span>{check.label}
      </span>)}
    </div>}
    {!draft && <p className="mt-3 text-[11px] leading-4 text-ink-soft">Choose physical or digital goods. The review animation and findings will stay visible here.</p>}
    {blockers.length > 0 && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2" role="status">
      <p className="text-[10.5px] font-semibold text-amber-900">Complete these before this step can pass</p>
      <p className="mt-0.5 text-[10.5px] leading-4 text-amber-800">{blockers.map((check) => check.label).join(" · ")}</p>
    </div>}
    {failed && canReview && <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-800 transition-colors hover:bg-red-50">Retry AI review</button>}

    <AnimatePresence mode="wait">
      {phase === "completed" && verdict && <motion.div key="result" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-3 border-t border-line pt-3">
        {verdict.image_checks.length > 0 && <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Photo review</h4>
          <div className="mt-1.5 space-y-1.5">{verdict.image_checks.map((check) => <div key={check.image} className="rounded-lg border border-line bg-white px-3 py-2">
            <div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-ink">Photo {check.image}</span><span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold capitalize ${assessmentStyle[check.assessment]}`}>{check.assessment}</span></div>
            <p className="mt-1 text-[11px] text-ink-soft">{check.observation} {check.note}</p>
          </div>)}</div>
        </div>}
        {verdict.claim_checks.length > 0 && <div><h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Claim consistency</h4>
          <ul className="mt-1 space-y-1">{verdict.claim_checks.map((check, i) => <li key={i} className="flex gap-2 text-[11px] leading-4 text-ink-soft"><span className={`font-semibold ${check.assessment === "consistent" ? "text-emerald-700" : "text-amber-700"}`}>{check.assessment}</span><span><b className="font-medium text-ink">{check.claim}:</b> {check.note}</span></li>)}</ul>
        </div>}
        {verdict.suggestions.length > 0 && <ResultList label="Changes to make" items={verdict.suggestions} />}
        {verdict.flags.length > 0 && <ResultList label="Needs clarification" items={verdict.flags} />}
        <p className="text-[10.5px] leading-4 text-ink-faint">{verdict.disclaimer}</p>
      </motion.div>}
    </AnimatePresence>
    {!strong && phase === "completed" && draft?.stage === "item" && <p className={`mt-3 text-[11px] font-semibold ${hasIssues ? "text-red-800" : "text-amber-800"}`}>Resolve the checklist and review notes. The next step unlocks after a strong review.</p>}
    {!strong && phase === "completed" && draft?.stage === "terms" && <p className="mt-3 text-[11px] font-medium text-ink-mute">These notes are advisory — the release and dispute terms are fixed by the platform, so you can continue.</p>}
    <p className="mt-3 text-[10px] leading-4 text-ink-faint">The review checks visible consistency and listing clarity. It cannot prove authenticity, ownership, or hidden product details.</p>
  </section>;
}

function ReviewLoader({ hasIssues, passed, settled }: { hasIssues: boolean; passed: boolean; settled: boolean }) {
  const state = [hasIssues ? "has-issues" : "", passed ? "passed" : "", settled ? "settled" : ""].filter(Boolean).join(" ");
  return <div className={`zec-review-loader ${state}`} aria-hidden="true">
    {Array.from({ length: 7 }, (_, index) => <span key={index} className="zec-review-loader__square" />)}
  </div>;
}

function ResultList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return <div><h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{label}</h4><ul className="mt-1 space-y-1">{items.map((item, i) => <li key={i} className="flex gap-2 text-[11px] leading-4 text-ink-soft"><span className="text-accent">•</span>{item}</li>)}</ul></div>;
}
