"use client";

import { useState } from "react";
import type { IntegrityResponse } from "@/lib/types";

export default function IntegrityCheck() {
  const [result, setResult] = useState<IntegrityResponse | null>(null);
  const [checking, setChecking] = useState(false);

  async function verify() {
    setChecking(true);
    try {
      const res = await fetch("/api/integrity", { cache: "no-store" });
      const data: IntegrityResponse = await res.json();
      setResult(data);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-panel px-4 py-2.5">
      <button
        onClick={verify}
        disabled={checking}
        className="focus-ring rounded-sm border border-line bg-panel2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest2 text-ink-dim transition-colors hover:border-amber/40 hover:text-amber disabled:opacity-50"
      >
        {checking ? "Verifying…" : "Verify chain"}
      </button>
      {result && (
        <span
          className={`font-mono text-xs ${result.ok ? "text-sage" : "text-crimson"}`}
        >
          {result.ok
            ? `✓ ${result.checkedRows} rows verified, chain intact`
            : `✕ tamper detected at row ${result.brokenAtId}`}
        </span>
      )}
      {!result && (
        <span className="font-mono text-xs text-ink-faint">
          Recomputes every row's SHA-256 link
        </span>
      )}
    </div>
  );
}
