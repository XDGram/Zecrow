"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ZecrowMark from "@/components/ZecrowMark";
import { PRIMARY, SECONDARY, isActive } from "./nav";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-white px-3 py-5 lg:flex">
      <Link href="/" className="mb-7 flex items-center gap-2 px-2 text-ink">
        <ZecrowMark size={26} />
        <span className="text-[15px] font-bold tracking-[-0.035em]">Zecrow</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active ? "bg-bg-sunk text-ink" : "text-ink-soft hover:bg-bg-soft hover:text-ink"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />}
              <span className={active ? "text-accent-ink" : "text-ink-mute group-hover:text-ink-soft"}>{item.icon}</span>
              {item.label}
              {item.badge ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-black">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-line pt-3">
        {SECONDARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active ? "bg-bg-sunk text-ink" : "text-ink-soft hover:bg-bg-soft hover:text-ink"
              }`}
            >
              <span className={active ? "text-accent-ink" : "text-ink-mute"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <div className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-wash text-[11px] font-bold text-accent-ink">EM</span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12.5px] font-semibold text-ink">Merchant</div>
            <div className="truncate text-[10.5px] text-ink-mute">u1 fq…9kd2</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
