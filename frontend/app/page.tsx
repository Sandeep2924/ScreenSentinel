"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import SeverityTimeline from "@/components/charts/SeverityTimeline";
import ModuleBreakdown from "@/components/charts/ModuleBreakdown";
import LedgerTable from "@/components/LedgerTable";
import IntegrityCheck from "@/components/IntegrityCheck";
import type { StatsResponse, LogEvent } from "@/lib/types";

export default function OverviewPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<LogEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          fetch("/api/stats", { cache: "no-store" }),
          fetch("/api/events?limit=8", { cache: "no-store" }),
        ]);
        const statsData = await statsRes.json();
        const eventsData = await eventsRes.json();
        if (!cancelled) {
          setStats(statsData);
          setRecent(eventsData.events ?? []);
        }
      } catch {
        // keep last known state on transient fetch errors
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
            01 / Overview
          </p>
          <h1 className="mt-1 font-mono text-2xl font-semibold text-ink">Detection Overview</h1>
          <p className="mt-1 text-sm text-ink-dim">
            Real-time signal across process, webcam, and screen-capture monitoring.
          </p>
        </div>
        <IntegrityCheck />
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Events (24h)"
          value={stats ? String(stats.last24h) : "—"}
          sub={`${stats?.totalEvents ?? 0} total logged`}
        />
        <StatCard
          label="Critical alerts"
          value={stats ? String(stats.bySeverity.CRITICAL) : "—"}
          sub="Known recorders detected"
          tone="crimson"
        />
        <StatCard
          label="Warnings"
          value={stats ? String(stats.bySeverity.WARNING) : "—"}
          sub="Webcam / unknown activity"
          tone="amber"
        />
        <StatCard
          label="Chain status"
          value={stats ? (stats.integrityOk ? "INTACT" : "BROKEN") : "—"}
          sub="Tamper-evident log"
          tone={stats?.integrityOk ? "sage" : "crimson"}
        />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-md border border-line bg-panel p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest2 text-ink-dim">
              Severity — last 24h
            </h2>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-steel" />info</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber" />warning</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-crimson" />critical</span>
            </div>
          </div>
          <SeverityTimeline data={stats?.timeline ?? []} />
        </div>

        <div className="rounded-md border border-line bg-panel p-5 shadow-panel">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest2 text-ink-dim">
            By module
          </h2>
          <ModuleBreakdown data={stats?.byModule ?? []} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest2 text-ink-dim">
            Recent entries
          </h2>
          <Link
            href="/logs"
            className="focus-ring font-mono text-[11px] uppercase tracking-widest2 text-amber hover:underline"
          >
            View full ledger →
          </Link>
        </div>
        <LedgerTable events={recent} />
      </section>
    </div>
  );
}
