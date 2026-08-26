import type { ModuleCount } from "@/lib/types";

const LABELS: Record<string, string> = {
  process_monitor: "Process Monitor",
  webcam_monitor: "Webcam Monitor",
  screen_recording_detector: "Screen Recording Detector",
  alert_system: "Alert System",
  system: "System",
};

export default function ModuleBreakdown({ data }: { data: ModuleCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.module}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-xs text-ink-dim">{LABELS[d.module] ?? d.module}</span>
            <span className="font-mono text-xs tabular text-ink-faint">{d.count}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
            <div
              className="h-full rounded-full bg-amber/70"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-xs text-ink-faint">No events logged yet.</p>
      )}
    </div>
  );
}
