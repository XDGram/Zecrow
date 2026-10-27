import Reveal from "./Reveal";

export default function CTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="wash-amber relative overflow-hidden rounded-[1.75rem] border border-accent-soft px-8 py-20 text-center md:py-24">
        <div className="dotgrid pointer-events-none absolute inset-0 opacity-50" />
        <Reveal>
          <p className="eyebrow relative font-medium text-accent-ink">Ready when you are</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display relative mt-5 text-[clamp(2rem,5vw,3.6rem)]">
            Start your first escrow.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="relative mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Create a private payment link in minutes. No funds move until delivery is
            confirmed or a human arbiter decides.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/dashboard/create" className="btn btn-dark px-7">
              Create an escrow
            </a>
            <a href="#how" className="btn btn-ghost px-7">
              How it works
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
