import type { Severity } from "@/lib/types";

const STYLES: Record<Severity, string> = {
  CRITICAL: "bg-crimson-glow text-crimson border-crimson/40",
  WARNING: "bg-amber-glow text-amber border-amber/40",
  INFO: "bg-steel-glow text-steel border-steel/40",
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider ${STYLES[severity]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          severity === "CRITICAL" ? "bg-crimson" : severity === "WARNING" ? "bg-amber" : "bg-steel"
        }`}
      />
      {severity}
    </span>
  );
}
