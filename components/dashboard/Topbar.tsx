import Link from "next/link";
import MobileNav from "./MobileNav";
import CommandPalette from "./CommandPalette";
import WalletConnect from "@/components/WalletConnect";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-tight text-ink">Good afternoon, Emma</div>
            <div className="hidden text-[11.5px] text-ink-mute sm:block">Here&apos;s what&apos;s moving across your escrows</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <CommandPalette />

          <WalletConnect />

          <Link href="/dashboard/create" className="btn btn-dark !py-2.5">
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Create escrow</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
