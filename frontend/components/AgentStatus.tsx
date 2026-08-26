"use client";

import { useEffect, useState } from "react";
import type { StatsResponse } from "@/lib/types";

function timeAgo(iso: string | null): string {
  if (!iso) return "no events yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function AgentStatus() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // swallow — status just shows stale/unknown
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const ok = stats?.integrityOk ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulseSoft rounded-full bg-sage" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest2 text-ink-dim">
          agent live
        </span>
      </div>
      <p className="text-xs text-ink-faint">
        Last event: <span className="text-ink-dim">{timeAgo(stats?.lastEventAt ?? null)}</span>
      </p>
      <div className="flex items-center gap-1.5 pt-1">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            ok === null ? "bg-ink-faint" : ok ? "bg-sage" : "bg-crimson"
          }`}
        />
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
          {ok === null ? "checking chain" : ok ? "chain intact" : "chain broken"}
        </span>
      </div>
    </div>
  );
}
