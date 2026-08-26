import { NextResponse } from "next/server";
import { getStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = getStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to load stats" }, { status: 500 });
  }
}
