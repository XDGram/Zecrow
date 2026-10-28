import PageHeader from "@/components/dashboard/PageHeader";
import EvidenceList from "@/components/dashboard/EvidenceList";
import DisputeDecision from "@/components/dashboard/DisputeDecision";
import AiReviewRunner from "@/components/dashboard/AiReviewRunner";

export default function DisputesPage() {
  return (
    <>
      <PageHeader title="Disputes" subtitle="Open cases freeze automatic release until a human arbiter decides." />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        {/* case list */}
        <div className="space-y-3">
          <div className="card p-3.5 ring-1 ring-accent/30">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Dispute open
              </span>
              <span className="text-[11px] text-ink-mute">#4817</span>
            </div>
            <div className="mt-2.5 text-[14px] font-semibold text-ink">Vintage film camera</div>
            <div className="text-[11.5px] text-ink-mute">Physical · 1.80 ZEC held</div>
          </div>

          <div className="card p-3.5 opacity-70">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Resolved
              </span>
              <span className="text-[11px] text-ink-mute">#4792</span>
            </div>
            <div className="mt-2.5 text-[14px] font-semibold text-ink">Audio interface</div>
            <div className="text-[11.5px] text-ink-mute">Physical · released to merchant</div>
          </div>
        </div>

        {/* case detail */}
        <div className="card relative overflow-hidden p-5">
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="text-[15px] font-semibold text-ink">Case #4817 · Vintage film camera</div>
                <div className="text-[11.5px] text-ink-mute">Opened Jan 31 · auto-release paused</div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-soft bg-accent-wash/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Example balance · 1.80 ZEC
              </span>
            </div>

            {/* evidence */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">Submitted evidence</span>
                <span className="text-[10.5px] uppercase tracking-wider text-ink-faint">2 sides</span>
              </div>
              <div className="mt-3">
                <EvidenceList />
              </div>
            </div>

            {/* AI review */}
            <div className="mt-5">
              <AiReviewRunner orderId="4817" />
            </div>

            {/* decision */}
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">Human arbiter decision</span>
                <span className="rounded-full bg-accent-wash px-2 py-0.5 text-[10px] font-semibold text-accent-ink">Required</span>
              </div>
              <div className="mt-3">
                <DisputeDecision />
              </div>
              <p className="mt-2.5 text-[11px] text-ink-mute">Local preview only. Authentication, arbiter permissions, decision storage, and fund movement are not connected.</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-ink-faint">Illustrative case view · no live case data</p>
    </>
  );
}
