import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export const metadata: Metadata = {
  title: "Dashboard — Zecrow",
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
        <main className="mx-auto w-full max-w-[1200px] px-5 py-5">{children}</main>
      </div>
    </div>
  );
}
