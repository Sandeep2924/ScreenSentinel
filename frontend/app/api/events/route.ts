import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const module = searchParams.get("module") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const { events, total } = await getEvents({ module, severity, search, limit, offset });
    return NextResponse.json({ events, total, limit, offset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to load events" }, { status: 500 });
  }
}
