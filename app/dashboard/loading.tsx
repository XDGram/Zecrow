export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] rounded-xl bg-bg-sunk" />
        ))}
      </div>
      <div className="h-52 rounded-xl bg-bg-sunk" />
      <div className="h-72 rounded-xl bg-bg-sunk" />
    </div>
  );
}
