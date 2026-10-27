import PageHeader from "@/components/dashboard/PageHeader";

const DOCS = [
  { name: "Escrow agreement  -  #4817", kind: "Agreement", order: "4817", date: "Jan 31", size: "48 KB" },
  { name: "Delivery evidence  -  #4816", kind: "Evidence", order: "4816", date: "Jan 30", size: "2.1 MB" },
  { name: "Release receipt  -  #4815", kind: "Receipt", order: "4815", date: "Jan 29", size: "22 KB" },
  { name: "License key record  -  #4814", kind: "Record", order: "4814", date: "Jan 29", size: "4 KB" },
  { name: "Escrow agreement  -  #4813", kind: "Agreement", order: "4813", date: "Jan 28", size: "47 KB" },
  { name: "Release receipt  -  #4812", kind: "Receipt", order: "4812", date: "Jan 27", size: "21 KB" },
];

const KIND_TONE: Record<string, string> = {
  Agreement: "bg-blue-50 text-blue-700",
  Evidence: "bg-accent-wash text-accent-ink",
  Receipt: "bg-emerald-50 text-emerald-700",
  Record: "bg-bg-sunk text-ink-mute",
};

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Agreements, delivery evidence and receipts, kept per order. Private evidence is access-controlled."
      />

      <div className="card divide-y divide-line overflow-hidden">
        {DOCS.map((d) => (
          <div key={d.name} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-soft">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-sunk text-ink-soft">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M14 3v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-ink">{d.name}</div>
              <div className="text-[11px] text-ink-mute">Order #{d.order} · {d.date} · {d.size}</div>
            </div>
            <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline ${KIND_TONE[d.kind]}`}>{d.kind}</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-white hover:text-ink" aria-label="Download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">Illustrative · demo records</p>
    </>
  );
}
