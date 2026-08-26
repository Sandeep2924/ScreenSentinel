import { NextResponse } from "next/server";
import { verifyIntegrity } from "@/lib/db";

export async function GET() {
  try {
    const result = await verifyIntegrity();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Integrity check failed" }, { status: 500 });
  }
}
