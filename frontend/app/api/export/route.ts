import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/db";

function csvEscape(value: unknown): string {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const module = searchParams.get("module") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const agentId = req.headers.get("x-agent-id");
  if (!agentId) return new NextResponse("Unauthorized", { status: 401 });

  const { events } = await getEvents(agentId, { module, severity, search, limit: 5000, offset: 0 });

  const header = ["id", "timestamp", "module", "event_type", "severity", "details", "prev_hash", "row_hash"];
  const lines = [header.join(",")];
  for (const e of events) {
    lines.push(
      [
        e.id,
        e.timestamp,
        e.module,
        e.event_type,
        e.severity,
        JSON.stringify(e.details),
        e.prev_hash,
        e.row_hash,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="screen_guard_log_${Date.now()}.csv"`,
    },
  });
}
