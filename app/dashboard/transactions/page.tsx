import PageHeader from "@/components/dashboard/PageHeader";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import { TRANSACTIONS } from "@/lib/dashboardData";

export default function TransactionsPage() {
  const inflow = TRANSACTIONS.filter((t) => t.kind === "fund" || t.kind === "deposit").reduce((s, t) => s + t.amountZec, 0);
  const outflow = TRANSACTIONS.filter((t) => t.kind === "release" || t.kind === "refund").reduce((s, t) => s + t.amountZec, 0);
  const pending = TRANSACTIONS.filter((t) => t.status === "pending").length;

  const tiles = [
    { label: "Total in", value: `+${inflow.toFixed(2)} ZEC`, tone: "text-emerald-600" },
    { label: "Total out", value: `−${outflow.toFixed(2)} ZEC`, tone: "text-ink" },
    { label: "Pending", value: `${pending}`, tone: "text-accent-ink" },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Shielded on-chain movements  -  funding, releases and refunds. Status is confirmation state, not a client flag."
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="card p-3.5">
            <div className="text-[11.5px] text-ink-mute">{t.label}</div>
            <div className={`mt-1 text-[18px] font-semibold tracking-tight tabular-nums ${t.tone}`}>{t.value}</div>
          </div>
        ))}
      </div>

      <TransactionsTable />
      <p className="mt-3 text-[11px] text-ink-faint">Illustrative · Zcash testnet demo data</p>
    </>
  );
}
