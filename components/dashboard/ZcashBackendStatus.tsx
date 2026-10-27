"use client";

import { useEffect, useState } from "react";

type BackendStatus = {
  ready?: boolean;
  network?: string;
  nodeHeight?: number;
  walletHeight?: number | null;
  fullySyncedHeight?: number | null;
  unscannedBlocks?: number;
  syncProgress?: number | null;
  locked?: boolean;
  state?: "unavailable" | "not_configured";
  error?: string;
};

export default function ZcashBackendStatus() {
  const [status, setStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/zcash/backend-status", { cache: "no-store" });
        const body = await response.json() as BackendStatus;
        if (active) setStatus(body);
      } catch {
        if (active) setStatus({ state: "unavailable", error: "Could not reach the Zcash escrow wallet." });
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const percent = status?.syncProgress == null ? null : Math.round(status.syncProgress * 100);
  const heading = status?.ready
    ? "Escrow wallet ready"
    : status?.state === "not_configured"
      ? "Escrow wallet not connected"
      : status?.state === "unavailable"
        ? "Escrow wallet unavailable"
        : status?.locked
          ? "Escrow wallet syncing"
          : "Checking escrow wallet";

  return (
    <section className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${status?.ready ? "bg-emerald-500" : status?.locked ? "animate-pulse bg-amber-500" : "bg-ink-faint"}`} />
            <h2 className="text-sm font-semibold text-ink">{heading}</h2>
          </div>
          <p className="mt-1 text-xs text-ink-mute">
            {status?.error ?? (status?.locked
              ? "The wallet stays locked until it has scanned the testnet chain. Funding is unavailable during sync."
              : status?.ready
                ? "Zallet is connected to Zebra on Zcash testnet. Order funding is still disabled until deposit tracking is ready."
                : "Connect your wallet and configure the local Zallet RPC to view managed-custody status.")}
          </p>
        </div>
        {status?.nodeHeight != null && (
          <div className="text-right text-[11px] tabular-nums text-ink-mute">
            <div>Node {status.nodeHeight.toLocaleString()}</div>
            <div>Wallet {status.walletHeight?.toLocaleString() ?? "Scanning"}</div>
          </div>
        )}
      </div>
      {status?.locked && percent != null && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-ink-mute">
            <span>Wallet scan progress</span><span>{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-sunk)]">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${percent}%` }} />
          </div>
          {!!status.unscannedBlocks && <div className="mt-1 text-[10px] text-ink-faint">{status.unscannedBlocks.toLocaleString()} blocks left to scan</div>}
        </div>
      )}
    </section>
  );
}
