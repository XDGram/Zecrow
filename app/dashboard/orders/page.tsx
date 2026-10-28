"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import OrdersTable from "@/components/dashboard/OrdersTable";
import { ORDERS, STATUS_META, type OrderStatus } from "@/lib/dashboardData";
import { useWallet } from "@/components/wallet/WalletProvider";

const SUMMARY: OrderStatus[] = ["awaiting_payment", "funded", "delivered", "disputed", "released", "expired"];

export default function OrdersPage() {
  const { session } = useWallet();
  const [orders, setOrders] = useState(ORDERS);

  useEffect(() => {
    if (!session) {
      setOrders(ORDERS);
      return;
    }
    let active = true;
    fetch("/api/escrows")
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { orders?: { number: number; item: string; type: "physical" | "digital"; amountZec: string; createdAt: string; status: OrderStatus }[] };
        if (!active || !Array.isArray(result.orders)) return;
        const saved = result.orders.map((order) => ({
          id: String(order.number),
          item: order.item,
          type: order.type,
          amountZec: Number(order.amountZec),
          counterparty: "Buyer link",
          role: "merchant" as const,
          status: order.status,
          created: new Date(order.createdAt).toLocaleDateString(),
        }));
        setOrders([...saved, ...ORDERS]);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [session]);

  const counts = Object.fromEntries(
    SUMMARY.map((s) => [s, orders.filter((o) => o.status === s).length])
  ) as Record<OrderStatus, number>;

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every escrow you've created  -  physical and digital goods."
        action={
          <Link href="/dashboard/create" className="btn btn-dark !py-2.5">
            <span className="text-base leading-none">+</span> Create escrow
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {SUMMARY.map((s) => (
          <div key={s} className="card p-3.5">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  s === "released" ? "bg-emerald-500" : s === "disputed" ? "bg-red-500" : s === "delivered" ? "bg-blue-500" : "bg-accent"
                }`}
              />
              <span className="text-[11.5px] text-ink-mute">{STATUS_META[s].label}</span>
            </div>
            <div className="mt-1 text-[19px] font-semibold tracking-tight text-ink tabular-nums">{counts[s]}</div>
          </div>
        ))}
      </div>

      <OrdersTable orders={orders} />
    </>
  );
}
