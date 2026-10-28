"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ZecrowMark from "@/components/ZecrowMark";
import { PRIMARY, SECONDARY, isActive } from "./nav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // close on route change
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-bg-soft hover:text-ink lg:hidden"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.aside
              className="flex h-full w-72 max-w-[82%] flex-col border-r border-line bg-white px-3 py-5"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6 flex items-center justify-between px-2">
                <Link href="/" className="flex items-center gap-2 text-ink">
                  <ZecrowMark size={26} />
                  <span className="text-[15px] font-bold tracking-[-0.035em]">Zecrow</span>
                </Link>
                <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft" aria-label="Close menu">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1">
                {PRIMARY.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium ${active ? "bg-bg-sunk text-ink" : "text-ink-soft"}`}>
                      <span className={active ? "text-accent-ink" : "text-ink-mute"}>{item.icon}</span>
                      {item.label}
                      {item.badge ? <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-black">{item.badge}</span> : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="space-y-1 border-t border-line pt-3">
                {SECONDARY.map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-ink-soft">
                    <span className="text-ink-mute">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <Link href="/dashboard/create" className="btn btn-dark mt-2 w-full !py-2.5 text-[13px]">+ Create escrow</Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
