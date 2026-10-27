import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";

const PRIVATE = [
  "Shielded payment amounts are not public on the Zcash ledger",
  "Shielded transactions do not name the buyer or merchant",
  "Order details are off-chain and visible to permitted participants and operators",
];

const OPERATOR = [
  "Controls the escrow spending key and executes authorised transfers",
  "A valid buyer code triggers release under the agreed terms",
  "Can see order terms and submitted evidence for a case",
  "Disputes pause automatic release and refund actions",
];

export default function Custody() {
  return (
    <section id="custody" className="relative bg-bg-soft/75">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal>
          <SectionLabel title="CUSTODY" />
        </Reveal>
        <div className="mt-12 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Reveal delay={0.05}>
              <h3 className="display mt-6 text-[clamp(1.9rem,4vw,3rem)]">
                Managed escrow. No overstated claims.
              </h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft">
                Zecrow runs a{" "}
                <span className="font-medium text-ink">managed private escrow</span>: the
                service controls the escrow spending key. After the buyer receives the
                order, their valid one time code is the release mechanism: it confirms
                receipt and triggers the transfer to the merchant under the agreed terms.
                An open dispute pauses automatic release. This is managed custody, not
                trustless escrow.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Reveal className="h-full">
              <div className="card flex h-full flex-col p-6">
                <p className="eyebrow font-medium text-ink">Stays private</p>
                <ul className="mt-5 space-y-3.5">
                  {PRIVATE.map((t) => (
                    <li key={t} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-soft">
                      <Dot />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08} className="h-full">
              <div className="card flex h-full flex-col border-accent-soft bg-accent-wash/40 p-6">
                <p className="eyebrow font-medium text-accent-ink">Operator controls</p>
                <ul className="mt-5 space-y-3.5">
                  {OPERATOR.map((t) => (
                    <li key={t} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-soft">
                      <Dot accent />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dot({ accent = false }: { accent?: boolean }) {
  return (
    <span
      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: accent ? "var(--accent)" : "var(--ink-mute)" }}
    />
  );
}
