import Link from "next/link";
import StatTiles from "@/components/dashboard/StatTiles";
import EscrowChart from "@/components/dashboard/EscrowChart";
import OrdersTable from "@/components/dashboard/OrdersTable";
import RightRail from "@/components/dashboard/RightRail";
import { ORDERS, computeKpis, ESCROW_SERIES } from "@/lib/dashboardData";

export default function OverviewPage() {
  const kpis = computeKpis(ORDERS);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-4">
        <StatTiles
          inEscrow={kpis.inEscrow}
          active={kpis.active}
          awaitingDelivery={kpis.awaitingDelivery}
          openDisputes={kpis.openDisputes}
        />
        <EscrowChart series={ESCROW_SERIES} />
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-[12.5px] font-medium text-ink-soft transition-colors hover:text-ink">
              View all →
            </Link>
          </div>
          <OrdersTable limit={5} />
        </div>
      </div>

      <div className="xl:sticky xl:top-[88px] xl:self-start">
        <RightRail />
      </div>
    </div>
  );
}
