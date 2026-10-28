/** Centered section heading for the content that follows. */
export default function SectionLabel({ title }: { title: string }) {
  return (
    <h2 className="w-full text-center text-[clamp(1.5rem,2.4vw,2rem)] font-bold tracking-tight text-ink">
      {title}
    </h2>
  );
}
