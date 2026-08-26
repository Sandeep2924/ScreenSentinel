"use client";

import { useEffect, useState } from "react";
import LedgerTable from "@/components/LedgerTable";
import IntegrityCheck from "@/components/IntegrityCheck";
import type { LogEvent } from "@/lib/types";

const MODULES = [
  { value: "all", label: "All modules" },
  { value: "process_monitor", label: "Process Monitor" },
  { value: "webcam_monitor", label: "Webcam Monitor" },
  { value: "screen_recording_detector", label: "Screen Rec. Detector" },
  { value: "alert_system", label: "Alert System" },
  { value: "system", label: "System" },
];

const SEVERITIES = [
  { value: "all", label: "All severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "WARNING", label: "Warning" },
  { value: "INFO", label: "Info" },
];

const PAGE_SIZE = 25;

export default function LogsPage() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [module, setModule] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(0);
  }, [module, severity, search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (module !== "all") params.set("module", module);
      if (severity !== "all") params.set("severity", severity);
      if (search) params.set("search", search);

      try {
        const res = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setEvents(data.events ?? []);
          setTotal(data.total ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [module, severity, search, page]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (module !== "all") params.set("module", module);
    if (severity !== "all") params.set("severity", severity);
    if (search) params.set("search", search);
    window.location.href = `/api/export?${params.toString()}`;
  }

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
            02 / Ledger
          </p>
          <h1 className="mt-1 font-mono text-2xl font-semibold text-ink">Activity Ledger</h1>
          <p className="mt-1 text-sm text-ink-dim">
            Every entry is hash-chained to the one before it — click a row to inspect details.
          </p>
        </div>
        <IntegrityCheck />
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="focus-ring rounded-sm border border-line bg-panel px-3 py-2 font-mono text-xs text-ink-dim outline-none"
        >
          {MODULES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="focus-ring rounded-sm border border-line bg-panel px-3 py-2 font-mono text-xs text-ink-dim outline-none"
        >
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search event type, process, path…"
          className="focus-ring min-w-[240px] flex-1 rounded-sm border border-line bg-panel px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint outline-none"
        />

        <button
          onClick={exportCsv}
          className="focus-ring rounded-sm border border-line bg-panel2 px-3 py-2 font-mono text-[11px] uppercase tracking-widest2 text-ink-dim transition-colors hover:border-amber/40 hover:text-amber"
        >
          Export CSV
        </button>
      </div>

      <LedgerTable events={events} />

      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono text-xs text-ink-faint">
          {loading ? "Loading…" : `${total} entries · page ${page + 1} of ${maxPage + 1}`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 font-mono text-xs text-ink-dim disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={page >= maxPage}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 font-mono text-xs text-ink-dim disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
