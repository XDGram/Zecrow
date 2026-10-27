import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export const metadata: Metadata = {
  title: "Dashboard  -  Zecrow",
  description: "Track your escrows, funding, deliveries and disputes.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen bg-bg-soft/40"
      style={{ "--radius-xl2": "0.9rem" } as React.CSSProperties}
    >
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1200px] px-5 py-5">
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-950">
            <strong>Prototype mode.</strong> Wallet sign-in now verifies on the server, and merchant orders require a signed session. Orders use Supabase when configured or local development storage in this preview. Transactions and disputes are sample data; testnet payment verification, release codes, refunds, and arbiter decisions are not connected.
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
