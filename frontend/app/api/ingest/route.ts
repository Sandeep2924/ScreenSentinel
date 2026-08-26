import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { computeRowHash, GENESIS_HASH } from "@/lib/hashchain";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 });
    }
    
    // In a real SaaS, you would look up the tenant/agent ID from the API key in the database.
    // For this MVP, we will just use the API key itself as the agent_id.
    const agent_id = authHeader.split(" ")[1];
    
    const body = await req.json();
    const { timestamp, module: mod, event_type, severity, details } = body;

    if (!timestamp || !mod || !event_type || !severity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await initDb();
    const pool = getDb();
    const detailsJson = JSON.stringify(details ?? {});
    
    // Get the last hash for this specific agent to maintain their independent hash chain
    const lastRes = await pool.query(
      "SELECT row_hash FROM events WHERE agent_id = $1 ORDER BY id DESC LIMIT 1",
      [agent_id]
    );
    const prevHash = lastRes.rows.length > 0 ? lastRes.rows[0].row_hash : GENESIS_HASH;
    
    // The hash computation now includes the agent_id to prevent cross-tenant tampering
    const payload = `${agent_id}|${prevHash}|${timestamp}|${mod}|${event_type}|${severity}|${detailsJson}`;
    
    // We compute the SHA-256 hash natively in Node
    const crypto = require("crypto");
    const rowHash = crypto.createHash("sha256").update(payload).digest("hex");

    await pool.query(
      `INSERT INTO events (agent_id, timestamp, module, event_type, severity, details, prev_hash, row_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [agent_id, timestamp, mod, event_type, severity, detailsJson, prevHash, rowHash]
    );

    return NextResponse.json({ success: true, agent_id, rowHash });

  } catch (err: any) {
    console.error("Ingest error:", err);
    return NextResponse.json({ error: err.message ?? "Ingest failed" }, { status: 500 });
  }
}
