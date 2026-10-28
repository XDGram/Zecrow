"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";

type Step = {
  n: string;
  title: string;
  navTitle: string;
  detail: string;
  note: string;
  glyph: React.ReactNode;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Build the order",
    navTitle: "Order",
    detail: "The merchant describes the item, amount and delivery expectations, chooses how long the payment link stays open, and adds product photos for physical goods. Zecrow applies the same release-code and dispute policies to every order.",
    note: "Merchant describes the order",
    glyph: <GlyphOrder />,
  },
  {
    n: "02",
    title: "Check order readiness",
    navTitle: "AI check",
    detail: "Before sharing, an AI readiness check reviews the description and uploaded product images for clarity and useful detail. If something is weak or missing, it asks for specific improvements. This helps create a clearer order record; it does not authenticate the product or decide a future dispute.",
    note: "Pre share quality check",
    glyph: <GlyphCheck />,
  },
  {
    n: "03",
    title: "Buyer reviews and funds",
    navTitle: "Funding",
    detail: "The merchant shares the order link with the buyer. Before funding, the buyer checks the item, amount, delivery details, Zecrow's release-code process and the platform dispute window, then records a refund destination. The payment link has its own expiry.",
    note: "Link expiry applies before funding",
    glyph: <GlyphShield />,
  },
  {
    n: "04",
    title: "Deliver with a one time code",
    navTitle: "Delivery",
    detail: "After funding is confirmed, the merchant fulfils the order. Once the buyer receives it, they use the unique order code to confirm receipt. A valid code triggers release to the merchant. The delivery deadline starts after funding.",
    note: "Code triggers the release",
    glyph: <GlyphCode />,
  },
  {
    n: "05",
    title: "Release, refund or review",
    navTitle: "Outcome",
    detail: "A valid buyer code triggers release to the merchant. If the delivery deadline passes without receipt, the buyer can follow the platform refund process to their recorded refund destination. A dispute opened while funds remain in escrow pauses pending automatic action for human review. A transfer already triggered by a code cannot be reversed by a later dispute.",
    note: "A dispute pauses automatic action",
    glyph: <GlyphRelease />,
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const selected = STEPS[active];
  const reduceMotion = useReducedMotion();

  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      <Reveal><SectionLabel title="HOW IT WORKS" /></Reveal>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal delay={0.05}>
          <h3 className="display max-w-2xl text-[clamp(1.9rem,4vw,3.1rem)]">
            A clear path from agreement to delivery.
          </h3>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-sm text-[14.5px] leading-relaxed text-ink-soft">
            Follow the path or jump to a step to see what happens next.
          </p>
        </Reveal>
      </div>

      <div className="mt-12 overflow-x-auto pb-2 [scrollbar-width:thin] lg:overflow-visible">
        <div className="flex w-max min-w-full gap-1 rounded-full bg-bg-sunk p-1.5 lg:w-full lg:min-w-0" role="tablist" aria-label="Order flow steps">
          {STEPS.map((step, i) => {
            const isActive = active === i;
            return (
              <motion.button
                key={step.n}
                id={`flow-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="flow-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(event) => {
                  const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                  if (delta !== 0) {
                    event.preventDefault();
                    const next = (i + delta + STEPS.length) % STEPS.length;
                    setActive(next);
                    document.getElementById(`flow-tab-${next}`)?.focus();
                  }
                }}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                className="relative flex min-w-0 items-center gap-2.5 rounded-full px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 lg:flex-1 lg:shrink lg:justify-center lg:px-2"
              >
                {isActive && <motion.span layoutId="flow-pill-active" className="absolute inset-0 rounded-full bg-ink shadow-[var(--shadow-md)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className={`relative z-10 flex h-6 w-6 items-center justify-center transition-colors ${isActive ? "text-accent" : "text-ink-faint"}`}>{step.glyph}</span>
                <span className={`relative z-10 truncate whitespace-nowrap text-[12px] font-medium transition-colors sm:text-[13px] ${isActive ? "text-white" : "text-ink-soft"}`}>{step.navTitle}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-[minmax(0,1fr)_minmax(330px,0.8fr)] md:gap-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected.n}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="min-h-[220px] pt-1"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span className="annotation text-accent-ink">STEP {selected.n} OF 05</span>
              <span className="h-px w-8 bg-accent" />
              <span className="annotation text-ink-faint">{selected.note}</span>
            </div>
            <h4 className="display mt-3 text-2xl text-ink">{selected.title}</h4>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ink-soft">{selected.detail}</p>
          </motion.div>
        </AnimatePresence>
        <div id="flow-panel" role="tabpanel" aria-labelledby={`flow-tab-${active}`} aria-label={`${selected.title} wallet preview`}>
          <WalletPreview active={active} reduceMotion={!!reduceMotion} />
        </div>
      </div>
    </section>
  );
}

function WalletPreview({ active, reduceMotion }: { active: number; reduceMotion: boolean }) {
  const states = [
    "Order ready for review",
    "Add the details buyers need",
    "Buyer funds the escrow",
    "Release code confirms receipt",
    "Release, refund, or review",
  ];
  const progress = active < 2 ? 0 : active === 2 ? 0.5 : 1;

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -4, rotateX: 1.5 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101114] p-6 text-white shadow-[0_24px_60px_-35px_rgba(10,10,15,0.55)] sm:p-7"
      style={{ perspective: 900, transformStyle: "preserve-3d" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent"><GlyphWallet /></span>
            <div>
              <div className="text-[13px] font-semibold tracking-tight">Escrow wallet</div>
              <div className="annotation text-white/45">ZECROW · ORDER #4817</div>
            </div>
          </div>
          <span className={`annotation rounded-full border px-2.5 py-1 transition-colors ${active >= 2 ? "border-accent/30 bg-accent/10 text-accent" : "border-white/10 text-white/45"}`}>{active >= 3 ? "RELEASED" : active >= 2 ? "FUNDS HELD" : "ORDER OPEN"}</span>
        </div>

        <div className="mt-7 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <div className="annotation text-white/45">ORDER AMOUNT</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[2.25rem] font-semibold tracking-[-0.06em]">1.80</span>
              <span className="text-[13px] font-medium text-white/60">ZEC</span>
            </div>
          </div>
          <span className="mb-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium tracking-wide text-white/55">SHIELDED</span>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_18px_1fr_18px_1fr] items-center">
          <WalletNode label="Buyer" icon={<GlyphWallet />} active={active >= 2} />
          <FlowConnector progress={progress} threshold={0.5} />
          <WalletNode label="Escrow" icon={<GlyphShield />} active={active >= 2} />
          <FlowConnector progress={progress} threshold={1} />
          <WalletNode label="Merchant" icon={<GlyphRelease />} active={active >= 3} />
        </div>

        <div className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors ${active >= 3 ? "border-accent/30 bg-accent/[0.08]" : "border-white/10 bg-white/[0.035]"}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active >= 3 ? "bg-accent/15 text-accent" : "bg-white/[0.06] text-white/45"}`}><GlyphCode /></span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white/85">Buyer release code</div>
              <div className="text-[10px] text-white/40">Confirms receipt to unlock transfer</div>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] ${active >= 3 ? "text-accent" : "text-white/35"}`}>{active >= 3 ? "Released" : "Required"}</span>
        </div>

        <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-4">
          <span className={`h-2 w-2 rounded-full ${active >= 2 ? "bg-accent" : "bg-white/25"}`} />
          <span className="text-[12px] font-medium text-white/75">{states[active]}</span>
        </div>
        <div className="annotation mt-4 text-white/30">FLOW PREVIEW ONLY</div>
      </div>
    </motion.div>
  );
}

function WalletNode({ label, icon, active }: { label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${active ? "border-accent/50 bg-accent/15 text-accent" : "border-white/10 bg-white/[0.04] text-white/35"}`}>
        {icon}
      </span>
      <span className={`text-[10px] font-medium sm:text-[11px] ${active ? "text-white/90" : "text-white/40"}`}>{label}</span>
    </div>
  );
}

function FlowConnector({ progress, threshold }: { progress: number; threshold: number }) {
  const filled = progress >= threshold;
  return (
    <span className="relative mb-5 h-px bg-white/15">
      <motion.span
        className="absolute inset-y-0 left-0 bg-accent"
        animate={{ width: filled ? "100%" : "0%" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      {progress > 0 && progress < 1 && threshold === 1 && (
        <motion.span
          className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_12px_rgba(233,162,26,0.7)]"
          animate={{ left: `${Math.min(progress * 100, 100)}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      )}
    </span>
  );
}

/* Functional line icons replace decorative marks in the interactive flow. */
function GlyphOrder() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M8 9h8M8 13h5M8 17h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function GlyphWallet() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18M16 14h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M6 6V4.8A1.8 1.8 0 0 1 7.8 3H18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function GlyphCheck() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10a2 2 0 0 1 2 2v13H5V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 9h7m-7 4h3m2 2 1.5 1.5L19 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function GlyphShield() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function GlyphCode() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="m9 9-2 3 2 3m6-6 2 3-2 3m-2-7-2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function GlyphRelease() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.7"/></svg>;
}
