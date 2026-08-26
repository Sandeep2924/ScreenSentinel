import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/db";

export async function GET(req: NextRequest) {
  const agentId = req.headers.get("x-agent-id");
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const stats = await getStats(agentId);
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to load stats" }, { status: 500 });
  }
}
