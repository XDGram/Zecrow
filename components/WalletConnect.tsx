"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ZcashConnectResult } from "@noir-wallet/sdk";
import { useWallet, shortAddress } from "@/components/wallet/WalletProvider";

const TESTNET_EXTENSION_RELEASES = "https://github.com/NoirWallet/noir-wallet-sdk/releases";

/* Gold "Zecrow" shielded wallet card  -  balance stays masked by design. */
function WalletCard({ connection }: { connection: ZcashConnectResult | null }) {
  return (
    <div
      className="relative mx-auto aspect-[1.62/1] w-full max-w-[20.5rem] overflow-hidden rounded-2xl p-4 shadow-[var(--shadow-md)]"
      style={{ background: "linear-gradient(135deg,#ffe6a6 0%,#f4b728 46%,#cf8f12 100%)" }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/35 blur-2xl" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_130%_at_0%_0%,rgba(255,255,255,0.45),transparent_42%)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-black">
          <svg viewBox="0 0 48 48" width="18" height="18" fill="#0b0b0d" aria-hidden="true">
            <path d="M24 17 C20 12 13 9 6 10 C9 12 12 13 15 15 C11 14 7 14 3 16 C8 17 12 18 16 19 C12 19 8 21 5 24 C11 23 16 23 21 25 L23 29 L24 33 L25 29 L27 25 C32 23 37 23 43 24 C40 21 36 19 32 19 C36 18 40 18 45 16 C41 14 37 14 33 15 C36 13 39 12 42 10 C35 9 28 12 24 17 Z" />
          </svg>
          <span className="text-[13px] font-bold tracking-tight">Zecrow</span>
        </div>
        <span className="rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-black/70">Testnet</span>
      </div>
      <div className="relative mt-4">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black/55">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6c-1.5 0-2.8-.3-4-.8M4 4l16 16" stroke="#0b0b0d" strokeOpacity="0.55" strokeWidth="1.7" strokeLinecap="round" /></svg>
          Shielded balance
        </div>
        <div className="mt-1 font-mono text-[20px] font-semibold tracking-[0.18em] text-black/85">••••••<span className="ml-1.5 text-[12px] font-bold tracking-normal">ZEC</span></div>
      </div>
      <div className="relative mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-black/70">{connection ? shortAddress(connection.shielded) : "u1 ·· ·· ·· ··"}</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-black/70">
          <span className={`h-1.5 w-1.5 rounded-full ${connection ? "bg-emerald-600" : "bg-black/35"}`} />
          {connection ? "Linked" : "Noir Wallet"}
        </span>
      </div>
    </div>
  );
}

export default function WalletConnect() {
  const { status, connection, session, message, signingIn, connect, signIn, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const copyAddress = async () => {
    if (!connection) return;
    try {
      await navigator.clipboard.writeText(connection.shielded);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const isConnected = status === "connected" && !!connection;

  return (
    <>
      <button
        type="button"
        className={`btn !px-3 !py-2.5 text-xs sm:!px-5 sm:!py-3 sm:text-sm ${isConnected ? "btn-ghost" : "btn-dark"}`}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-label={isConnected ? "Wallet account" : "Sign in"}
      >
        {isConnected && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />}
        {isConnected ? (
          <>
            <span className="sm:hidden">{session ? "Signed in" : "Linked"}</span>
            <span className="hidden sm:inline">{shortAddress(connection!.transparent)}</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">Sign in</span>
            <span className="hidden sm:inline">Sign in</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              className="wallet-ring relative w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <section role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title" className="relative overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[var(--shadow-lg)]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(75%_100%_at_50%_0%,var(--accent-wash),transparent_75%)]" />
                <button type="button" className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 text-ink-soft backdrop-blur transition-colors hover:bg-bg-soft hover:text-ink" onClick={() => setIsOpen(false)} aria-label="Close wallet dialog">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>

                <div className="relative p-6 sm:p-7">
                  <WalletCard connection={isConnected ? connection : null} />

                  <div className="mt-5 text-center">
                    <h2 id="wallet-dialog-title" className="text-[20px] font-semibold tracking-tight text-ink">
                      {session ? "Signed in" : isConnected ? "Finish signing in" : "Sign in with Noir Wallet"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      {session
                        ? "Your signature was verified on this browser. You're signed in to Zecrow for this session."
                        : isConnected
                          ? "Your wallet is linked on Zcash testnet. Sign in to prove you control this account."
                          : "Sign in with Noir Wallet on Zcash testnet. Zecrow never asks for your recovery phrase."}
                    </p>
                  </div>

                  {isConnected ? (
                    <div className="mt-6 space-y-3">
                      <p className="break-all rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-center font-mono text-[11px] leading-5 text-ink-soft">{connection!.shielded}</p>

                      {session ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12.5px] font-medium text-emerald-800">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          Wallet signature verified for this session
                        </div>
                      ) : (
                        <button type="button" onClick={() => void signIn()} disabled={signingIn} className="btn btn-dark w-full !py-2.5 text-[13px] disabled:opacity-60">
                          {signingIn ? "Waiting for signature…" : "Sign in"}
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button type="button" className="btn btn-ghost flex-1 !py-2.5 text-xs" onClick={copyAddress}>{copied ? "Copied ✓" : "Copy address"}</button>
                        <button type="button" className="btn btn-ghost flex-1 !py-2.5 text-xs" onClick={() => void disconnect()}>Sign out</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => void connect()} disabled={status === "connecting"} className="group mt-6 flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[var(--shadow-md)] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent-ink transition-transform duration-200 group-hover:scale-105">
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><rect x="3.5" y="6" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 10h17M7.5 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">Noir Wallet</span>
                          <span className="block text-xs text-ink-mute">Zcash shielded account · testnet</span>
                        </span>
                        {status === "connecting" ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="animate-spin text-accent"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                          </span>
                        ) : (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className="shrink-0 text-ink-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent-ink"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </button>

                      {message && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900">{message}</p>}
                      {status === "wrong-network" && !message && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900">A mainnet account was detected and disconnected. Use the Noir Wallet testnet build.</p>}

                      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-mute">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="9" rx="2.2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        Non-custodial · we never see your keys
                      </div>
                      <div className="my-4 h-px bg-line" />
                      <a className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink" href={TESTNET_EXTENSION_RELEASES} target="_blank" rel="noreferrer">
                        Get the official testnet extension
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </a>
                      <p className="mt-3 text-center text-xs leading-5 text-ink-mute">Install the release whose filename ends in <span className="font-mono">-testnet.zip</span>, then reload this page.</p>
                    </>
                  )}
                </div>
              </section>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
