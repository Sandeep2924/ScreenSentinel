export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "amber" | "crimson" | "sage";
}) {
  const toneClass = {
    default: "text-ink",
    amber: "text-amber",
    crimson: "text-crimson",
    sage: "text-sage",
  }[tone];

  return (
    <div className="relative rounded-md border border-line bg-panel px-5 py-4 shadow-panel overflow-hidden">
      <div className="absolute inset-0 bg-grid bg-grid opacity-[0.4] pointer-events-none" />
      <p className="relative text-[11px] font-mono uppercase tracking-widest2 text-ink-faint">{label}</p>
      <p className={`relative mt-2 font-mono text-3xl font-semibold tabular ${toneClass}`}>{value}</p>
      {sub && <p className="relative mt-1 text-xs text-ink-dim">{sub}</p>}
    </div>
  );
}
