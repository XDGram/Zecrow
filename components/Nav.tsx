"use client";

import { useEffect, useState } from "react";
import ZecrowMark from "./ZecrowMark";
import WalletConnect from "./WalletConnect";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Custody", href: "#custody" },
  { label: "Disputes", href: "#disputes" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2 text-ink">
          <ZecrowMark size={28} />
          <span className="text-[15px] font-bold tracking-[-0.035em]">Zecrow</span>
        </a>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13.5px] text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <WalletConnect />
          <a href="/dashboard/create" className="btn btn-dark">
            Create escrow
          </a>
        </div>
      </nav>
    </header>
  );
}
