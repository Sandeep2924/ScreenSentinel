"use client";

import { useState } from "react";
import type { LogEvent } from "@/lib/types";
import SeverityBadge from "./SeverityBadge";

const MODULE_LABELS: Record<string, string> = {
  process_monitor: "Process Monitor",
  webcam_monitor: "Webcam Monitor",
  screen_recording_detector: "Screen Rec. Detector",
  alert_system: "Alert System",
  system: "System",
};

function shortHash(h: string): string {
  if (!h || h === "GENESIS") return "GENESIS";
  return `${h.slice(0, 6)}…${h.slice(-4)}`;
}

function formatTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function summarizeDetails(details: Record<string, unknown>): string {
  const entries = Object.entries(details);
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("  ·  ");
}

export default function LedgerTable({ events }: { events: LogEvent[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="relative overflow-x-auto rounded-md border border-line bg-panel shadow-panel">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="w-10" />
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              Timestamp
            </th>
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              Module
            </th>
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              Event
            </th>
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              Severity
            </th>
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              Details
            </th>
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              Chain (prev → row)
            </th>
          </tr>
        </thead>
        <tbody className="relative">
          {events.map((e, idx) => {
            const { date, time } = formatTime(e.timestamp);
            const expanded = expandedId === e.id;
            const severityLine =
              e.severity === "CRITICAL" ? "bg-crimson" : e.severity === "WARNING" ? "bg-amber" : "bg-steel";

            return (
              <tr
                key={e.id}
                onClick={() => setExpandedId(expanded ? null : e.id)}
                className={`focus-ring cursor-pointer border-b border-line/70 transition-colors hover:bg-panel2/60 ${
                  idx === events.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="relative">
                  <span className={`absolute inset-y-0 left-0 w-[3px] ${severityLine}`} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-ink-dim">
                  <span className="text-ink-faint">{date}</span>{" "}
                  <span className="tabular text-ink">{time}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-ink">
                  {MODULE_LABELS[e.module] ?? e.module}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-ink-dim">
                  {e.event_type}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <SeverityBadge severity={e.severity} />
                </td>
                <td className="max-w-[280px] truncate px-3 py-3 text-xs text-ink-faint">
                  {expanded ? (
                    <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-ink-dim">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  ) : (
                    summarizeDetails(e.details)
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
                    <span className="rounded-sm bg-panel2 px-1.5 py-0.5">{shortHash(e.prev_hash)}</span>
                    <span className="text-amber">⛓</span>
                    <span className="rounded-sm border border-amber/30 bg-amber-glow px-1.5 py-0.5 text-amber">
                      {shortHash(e.row_hash)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}

          {events.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-faint">
                No events match these filters. Widen the filters, or check the agent is running.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
