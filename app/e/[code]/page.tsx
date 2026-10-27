import { Suspense } from "react";
import type { Metadata } from "next";
import BuyerFlow from "@/components/buyer/BuyerFlow";

export const metadata: Metadata = {
  title: "Fund escrow  -  Zecrow",
  description: "Review the order and fund it with shielded Zcash. Released when you confirm delivery.",
};

export default function BuyerPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-soft/50" />}>
      <BuyerFlow />
    </Suspense>
  );
}
