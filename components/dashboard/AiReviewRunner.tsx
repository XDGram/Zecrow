"use client";

import { useState } from "react";
import type { AiReport } from "@/lib/aiReview";

type Provenance = { status: string; reason?: string };
type Result =
  | { status: "completed"; report: AiReport; model?: string; provenance?: Provenance }
  | { status: "unavailable"; reason?: string; provenance?: Provenance }
  | { status: "error"; reason?: string };

const CASE = {
  type: "physical" as const,
  amountZec: 1.8,
  terms: [
    "Item: Vintage film camera, as described",
    "Ships tracked; released by the buyer's one-time code",
    "7-day dispute window",
  ],
  buyerClaim: "The item arrived damaged.",
  merchantClaim: "It was packed intact before dispatch.",
  evidence: [
    { evidence_id: "ev-buyer-1", party: "Buyer", description: "Two photos showing a cracked camera body." },
    { evidence_id: "ev-merchant-1", party: "Merchant", description: "Three photos of the item packed before dispatch." },
  ],
};

export default function AiReviewRunner({ orderId = "4817" }: { orderId?: string }) {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [consent, setConsent] = useState(false);

  const run = async () => {
    setState("running");
    setResult(null);
    try {
      const res = await fetch(`/api/escrows/${orderId}/ai-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...CASE, consentImageProvenance: consent }),
      });
      const data = (await res.json()) as Result;
      setResult(data);
    } catch {
      setResult({ status: "error", reason: "Could not reach the review service." });
    } finally {
      setState("done");
    }
  };

  return (
    <div className="rounded-xl border border-line bg-[#fbfaf7] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink">AI evidence review</span>
        <span className="text-[10.5px] uppercase tracking-wider text-ink-faint">Advisory only</span>
      </div>

      {state === "idle" && (
        <div className="mt-3 space-y-3">
          <p className="text-[11.5px] leading-5 text-ink-mute">
            Organises the evidence into a neutral summary for the arbiter. It never moves funds or decides the case.
          </p>
          <label className="flex items-start gap-2 text-[11.5px] text-ink-soft">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
            Also run an image-provenance check (sends the disputed photos to an external reverse-image service).
          </label>
          <button onClick={run} className="btn btn-dark !py-2.5 text-[12.5px]">Run AI review</button>
        </div>
      )}

      {state === "running" && (
        <div className="mt-3 flex items-center gap-2.5 text-[12.5px] text-ink-soft">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className="animate-spin text-accent"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
          Reviewing evidence…
        </div>
      )}

      {state === "done" && result && <ResultView result={result} onRetry={run} />}
    </div>
  );
}

function ResultView({ result, onRetry }: { result: Result; onRetry: () => void }) {
  if (result.status === "unavailable") {
    return (
      <div className="mt-3 space-y-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-5 text-amber-900">
          AI review unavailable — {result.reason ?? "provider not configured."} Manual review stays available.
        </div>
        <button onClick={onRetry} className="btn btn-ghost !py-2 text-[12px]">Try again</button>
      </div>
    );
  }
  if (result.status === "error") {
    return (
      <div className="mt-3 space-y-2">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11.5px] leading-5 text-red-700">
          {result.reason ?? "The review failed."} No decision was made.
        </div>
        <button onClick={onRetry} className="btn btn-ghost !py-2 text-[12px]">Try again</button>
      </div>
    );
  }

  const r = result.report;
  return (
    <div className="mt-3 space-y-3">
      <p className="text-[12px] leading-5 text-ink-soft">{r.case_summary}</p>

      {r.evidence_items.map((e) => (
        <div key={e.evidence_id} className="rounded-lg border border-line bg-white px-3 py-2.5">
          <div className="text-[11.5px] font-semibold text-ink">{e.evidence_id}</div>
          <div className="mt-0.5 text-[11px] text-ink-soft">{e.what_it_shows}</div>
          {e.concerns.length > 0 && <div className="mt-1 text-[10.5px] text-accent-ink">Concerns: {e.concerns.join("; ")}</div>}
          {e.limitations.length > 0 && <div className="mt-0.5 text-[10.5px] text-ink-mute">Limits: {e.limitations.join("; ")}</div>}
        </div>
      ))}

      <Group label="Missing information" items={r.missing_information} />
      <Group label="Contradictions" items={r.contradictions} />
      <Group label="Follow-up questions" items={r.follow_up_questions} />

      <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-[11px]">
        <span className="text-ink-mute">Confidence</span>
        <span className="font-semibold uppercase text-accent-ink">{r.confidence}</span>
      </div>

      {result.provenance && (
        <div className="text-[10.5px] text-ink-mute">Image provenance: {result.provenance.status}{result.provenance.reason ? ` — ${result.provenance.reason}` : ""}</div>
      )}

      <p className="text-[10.5px] leading-4 text-ink-faint">{r.disclaimer}</p>
      <div className="rounded-lg border border-accent-soft bg-accent-wash/50 px-3 py-2 text-[11.5px] font-medium text-accent-ink">Human decision required</div>
    </div>
  );
}

function Group({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[11.5px] leading-5 text-ink-soft">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-mute" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
