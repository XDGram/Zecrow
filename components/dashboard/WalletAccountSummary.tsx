"use client";

import { useState } from "react";
import { shortAddress, useWallet } from "@/components/wallet/WalletProvider";

export default function WalletAccountSummary() {
  const { connection, session, status } = useWallet();
  const [copied, setCopied] = useState(false);
  const address = connection?.shielded ?? null;

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Noir Wallet</h2>
          <p className="mt-1 text-xs text-ink-mute">Buyer and merchant wallet connection on Zcash testnet.</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${session ? "bg-emerald-50 text-emerald-700" : status === "connected" ? "bg-accent-wash text-accent-ink" : "bg-bg-sunk text-ink-mute"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${session ? "bg-emerald-500" : status === "connected" ? "bg-accent" : "bg-ink-faint"}`} />
          {session ? "Signed in" : status === "connected" ? "Wallet linked" : "Not signed in"}
        </span>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Shielded address</div>
        {address ? (
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-line bg-bg-soft p-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-soft" title={address}>{shortAddress(address)}</span>
            <button type="button" onClick={copyAddress} className="shrink-0 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-medium text-ink-soft transition-colors hover:text-ink">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-line bg-bg-soft px-3 py-3 text-xs text-ink-mute">Sign in with Noir Wallet from the top bar to see your testnet address.</p>
        )}
        <p className="mt-3 text-[11px] leading-5 text-ink-mute">Escrow balances and transfers are not shown here yet. Testnet funding stays disabled until deposit tracking and order matching are live.</p>
      </div>
    </section>
  );
}
