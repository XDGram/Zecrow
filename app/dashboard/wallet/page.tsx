import PageHeader from "@/components/dashboard/PageHeader";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import { ORDERS, computeKpis } from "@/lib/dashboardData";

export default function WalletPage() {
  const kpis = computeKpis(ORDERS);
  const tiles = [
    { label: "Available", value: "3.00", tone: "text-ink" },
    { label: "In escrow", value: kpis.inEscrow.toFixed(2), tone: "text-accent-ink" },
    { label: "Pending", value: "0.45", tone: "text-ink-mute" },
  ];

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Your connected Noir Wallet on Zcash testnet. Balances are shielded."
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          {/* wallet card */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-black shadow-[var(--shadow-md)]"
            style={{ background: "linear-gradient(135deg,#ffe6a6 0%,#f4b728 46%,#cf8f12 100%)" }}
          >
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/35 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="text-[13px] font-bold tracking-tight">Escrow wallet</span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Testnet
              </span>
            </div>
            <div className="relative mt-5 text-[9px] font-bold uppercase tracking-[0.16em] text-black/55">Shielded balance</div>
            <div className="relative mt-0.5 font-mono text-[26px] font-semibold tracking-[0.14em] text-black/85">
              ••••••<span className="ml-2 text-[13px] font-bold tracking-normal">ZEC</span>
            </div>
            <div className="relative mt-4 font-mono text-[11px] text-black/70">u1 fq…9kd2</div>
            <div className="relative mt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-black/85 py-2 text-[11.5px] font-semibold text-white transition-transform hover:scale-[1.02]">Deposit</button>
              <button className="flex-1 rounded-full bg-white/70 py-2 text-[11.5px] font-semibold text-black/80 transition-transform hover:scale-[1.02]">Withdraw</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {tiles.map((t) => (
              <div key={t.label} className="card p-3">
                <div className="text-[10.5px] text-ink-mute">{t.label}</div>
                <div className={`mt-1 text-[14px] font-semibold tabular-nums ${t.tone}`}>{t.value}</div>
                <div className="text-[9px] text-ink-faint">ZEC</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Wallet activity</h2>
          <TransactionsTable />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">Illustrative · Zcash testnet demo</p>
    </>
  );
}
