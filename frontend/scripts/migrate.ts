import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("DROP TABLE IF EXISTS events;");
    await pool.query(`
      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        agent_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        module TEXT NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        details TEXT,
        prev_hash TEXT,
        row_hash TEXT NOT NULL
      )
    `);
    console.log("Migration complete!");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

migrate();
