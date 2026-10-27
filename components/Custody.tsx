import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";

const PRIVATE = [
  "Shielded payment amounts are not public on the Zcash ledger",
  "Shielded transactions do not name the buyer or merchant",
  "Order details are off-chain and visible to permitted participants and operators",
];

const OPERATOR = [
  "Would control the escrow spending key and execute authorised transfers",
  "A valid buyer code is intended to trigger release under the agreed terms",
  "Would see order terms and submitted evidence for a case",
  "Disputes would pause automatic release and refund actions",
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
                The intended model is{" "}
                <span className="font-medium text-ink">managed private escrow</span>:
                Zecrow would control the escrow spending key. After the buyer receives
                the order, their valid one time code is the release mechanism: it confirms
                receipt and authorises the transfer under the agreed terms. An open
                dispute would pause automatic release. This is managed custody, not
                trustless escrow. The current prototype does not hold or transfer funds.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Reveal className="h-full">
              <div className="card flex h-full flex-col p-6">
                <p className="eyebrow font-medium text-ink">Privacy design</p>
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
                <p className="eyebrow font-medium text-accent-ink">Planned operator controls</p>
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
