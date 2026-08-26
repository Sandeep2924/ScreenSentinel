import { NextRequest, NextResponse } from "next/server";
import { verifyIntegrity } from "@/lib/db";

export async function GET(req: NextRequest) {
  const agentId = req.headers.get("x-agent-id");
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await verifyIntegrity(agentId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Integrity check failed" }, { status: 500 });
  }
}
