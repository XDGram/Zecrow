import PageHeader from "@/components/dashboard/PageHeader";
import ZcashBackendStatus from "@/components/dashboard/ZcashBackendStatus";
import WalletAccountSummary from "@/components/dashboard/WalletAccountSummary";

export default function WalletPage() {
  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Your wallet connection and managed Zcash testnet wallet status."
      />

      <ZcashBackendStatus />

      <div className="grid gap-4 lg:grid-cols-2">
        <WalletAccountSummary />
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">What is active now</h2>
          <ul className="mt-3 space-y-2.5 text-xs leading-5 text-ink-soft">
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />Noir Wallet testnet connection and signed merchant identity.</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />Zallet managed wallet status and chain scan progress.</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />Order deposit addresses, transfers and balances are not active yet.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
