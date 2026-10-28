import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";

const EVIDENCE = [
  { party: "Buyer", title: "Item arrived damaged", meta: "2 photos · Submitted 10:42" },
  { party: "Merchant", title: "Packed before dispatch", meta: "Order photos · Submitted 11:08" },
];

export default function Disputes() {
  return (
    <section id="disputes" className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      <Reveal>
        <SectionLabel title="DISPUTES" />
      </Reveal>
      <div className="mt-12 grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal delay={0.05}>
            <h3 className="display mt-6 text-[clamp(1.9rem,4vw,3rem)]">
              When a deal is contested, evidence does the talking.
            </h3>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Either side can open a dispute under the agreed order terms. If funds are
              still in escrow, the case pauses any pending automatic release or expiry
              refund while both sides submit evidence for review.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-ink-mute">
              AI compares the submissions with the order terms and organises possible
              facts, claims, gaps and follow up questions. Its report is advisory only.
              An authorised human arbiter makes and records the decision. If a valid
              buyer code has already triggered a transfer, opening a dispute later
              cannot reverse it.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <CaseReviewIllustration />
        </Reveal>
      </div>
    </section>
  );
}

function CaseReviewIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-white p-5 shadow-[var(--shadow-md)] sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-[13px] font-semibold text-ink">Case review</div>
            <div className="annotation mt-1 text-ink-faint">ORDER #4817 · DISPUTE OPEN</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-accent-soft bg-accent-wash/60 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-ink">Auto actions paused</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-bg-soft px-4 py-3">
          <div className="flex items-center gap-3">
            <EscrowIcon />
            <div>
              <div className="whitespace-nowrap text-[11px] font-semibold text-ink">Example: funds held</div>
              <div className="text-[10px] text-ink-mute">Awaiting human review</div>
            </div>
          </div>
          <span className="annotation shrink-0 whitespace-nowrap text-ink-faint">1.80 ZEC</span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow font-medium text-ink">Submitted evidence</span>
            <span className="annotation text-ink-faint">2 SIDES</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {EVIDENCE.map((item) => (
              <div key={item.party} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
                <EvidenceIcon />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px]">
                    <span className="font-semibold text-ink">{item.party}</span>
                    <span className="text-ink-faint">{item.title}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-ink-mute">{item.meta}</div>
                </div>
                <span className="text-[10px] font-medium text-ink-faint">VIEW</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-[#fbfaf7] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow font-medium text-ink">AI evidence summary</span>
            <span className="annotation text-ink-faint">ADVISORY ONLY</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <SummaryMark label="Supported facts" count="03" />
            <SummaryMark label="Claims to review" count="02" />
            <SummaryMark label="Open questions" count="02" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2.5">
            <HumanIcon />
            <div>
              <div className="text-[11px] font-semibold text-ink">Human arbiter decision</div>
              <div className="text-[10px] text-ink-mute">Required before funds move</div>
            </div>
          </div>
          <span className="flex shrink-0 flex-col items-end gap-1.5" role="status" aria-label="Pending human arbiter decision">
            <span className="annotation text-accent-ink">PENDING</span>
            <span className="review-loader" aria-hidden="true" />
          </span>
        </div>
        <p className="annotation mt-4 text-ink-faint">Illustrative case view · No live case data</p>
      </div>
    </div>
  );
}

function SummaryMark({ label, count }: { label: string; count: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-2">
      <div className="text-[15px] font-semibold tracking-tight text-ink">{count}</div>
      <div className="mt-1 text-[9px] leading-tight text-ink-mute">{label}</div>
    </div>
  );
}

function EscrowIcon() {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-accent-ink"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>;
}

function EvidenceIcon() {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-soft text-ink-mute"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h9l5 5v11H5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 4v5h5M8 15l2.5-2.5 2 2 1.5-1.5 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg></span>;
}

function HumanIcon() {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-soft text-ink-mute"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20c.7-3.3 3.2-5 7-5s6.3 1.7 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>;
}
