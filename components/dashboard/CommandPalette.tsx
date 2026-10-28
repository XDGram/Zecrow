"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Cmd = { label: string; href: string; hint: string };

const COMMANDS: Cmd[] = [
  { label: "Overview", href: "/dashboard", hint: "Page" },
  { label: "Orders", href: "/dashboard/orders", hint: "Page" },
  { label: "Transactions", href: "/dashboard/transactions", hint: "Page" },
  { label: "Disputes", href: "/dashboard/disputes", hint: "Page" },
  { label: "Documents", href: "/dashboard/documents", hint: "Page" },
  { label: "Wallet", href: "/dashboard/wallet", hint: "Page" },
  { label: "Settings", href: "/dashboard/settings", hint: "Page" },
  { label: "Create escrow", href: "/dashboard/create", hint: "Action" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].href); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-2 text-[12px] text-ink-mute transition-colors hover:text-ink md:flex"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        Search
        <kbd className="rounded border border-line bg-white px-1.5 text-[10px] font-medium text-ink-mute">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-start justify-center bg-ink/40 p-4 pt-[14vh] backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lg)]"
              initial={{ opacity: 0, scale: 0.98, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-ink-mute"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  onKeyDown={onInputKey}
                  placeholder="Search pages and actions…"
                  className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-mute"
                />
                <kbd className="rounded border border-line bg-bg-soft px-1.5 text-[10px] text-ink-mute">esc</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {results.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[13px] text-ink-mute">No matches.</div>
                ) : (
                  results.map((c, i) => (
                    <button
                      key={c.href}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(c.href)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${i === active ? "bg-bg-sunk" : ""}`}
                    >
                      <span className="text-[13.5px] font-medium text-ink">{c.label}</span>
                      <span className="text-[10.5px] text-ink-mute">{c.hint}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
