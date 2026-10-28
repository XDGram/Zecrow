import ZecrowMark from "./ZecrowMark";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Custody", href: "#custody" },
  { label: "Disputes", href: "#disputes" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg-soft/75">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-ink">
              <ZecrowMark size={26} />
              <span className="text-[15px] font-bold tracking-[-0.035em]">Zecrow</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-mute">
              Private escrow for real commerce on Zcash. Managed custody, honestly
              disclosed. Not trustless escrow.
            </p>
          </div>

          <nav aria-label="Explore Zecrow">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[13.5px] text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="annotation text-ink-faint">Zecrow / 2025 | Built for The Zecathon</p>
          <p className="annotation text-ink-faint">Shielded Payments</p>
        </div>
      </div>
    </footer>
  );
}
