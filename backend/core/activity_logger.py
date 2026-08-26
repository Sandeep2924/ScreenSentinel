"""
activity_logger.py
Centralized, timestamped, tamper-evident activity logging.

Every other module (process_monitor, webcam_monitor, screen_recording_detector,
alert_system) calls ActivityLogger.log_event() so there is a single source of
truth for "what happened and when".

Tamper-evidence: each row stores a SHA-256 hash chained to the previous row's
hash (like a mini blockchain). If someone edits an old row without recomputing
every hash after it, verify_integrity() will detect the break.
"""

import sqlite3
import hashlib
import json
import os
from datetime import datetime, timezone

from core import config


class ActivityLogger:
    def __init__(self, db_path: str = config.DB_PATH):
        self.db_path = db_path
        self._init_db()

    # ------------------------------------------------------------------
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                module TEXT NOT NULL,
                event_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                details TEXT,
                prev_hash TEXT,
                row_hash TEXT NOT NULL
            )
            """
        )
        conn.commit()
        conn.close()

    # ------------------------------------------------------------------
    def _last_hash(self, cur) -> str:
        cur.execute("SELECT row_hash FROM events ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        return row[0] if row else "GENESIS"

    @staticmethod
    def _compute_hash(prev_hash: str, timestamp: str, module: str,
                       event_type: str, severity: str, details: str) -> str:
        payload = f"{prev_hash}|{timestamp}|{module}|{event_type}|{severity}|{details}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    # ------------------------------------------------------------------
    def log_event(self, module: str, event_type: str, severity: str, details: dict = None):
        """
        module:     'process_monitor' | 'webcam_monitor' | 'screen_recording_detector'
                    | 'alert_system' | 'system'
        event_type: short machine-readable label, e.g. 'RECORDER_DETECTED'
        severity:   config.SEVERITY_INFO / WARNING / CRITICAL
        details:    dict of extra context (process name, pid, path, etc.)
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        details_str = json.dumps(details or {}, default=str)

        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        prev_hash = self._last_hash(cur)
        row_hash = self._compute_hash(prev_hash, timestamp, module, event_type, severity, details_str)

        cur.execute(
            """
            INSERT INTO events (timestamp, module, event_type, severity, details, prev_hash, row_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (timestamp, module, event_type, severity, details_str, prev_hash, row_hash),
        )
        conn.commit()
        conn.close()
        return {"timestamp": timestamp, "module": module, "event_type": event_type,
                "severity": severity, "details": details or {}}

    # ------------------------------------------------------------------
    def get_recent(self, limit: int = 50):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    # ------------------------------------------------------------------
    def export_csv(self, out_path: str):
        import csv
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM events ORDER BY id ASC")
        rows = cur.fetchall()
        conn.close()

        if not rows:
            return None

        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            for r in rows:
                writer.writerow(dict(r))
        return out_path

    # ------------------------------------------------------------------
    def verify_integrity(self) -> bool:
        """Walks the hash chain and confirms no row has been tampered with."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM events ORDER BY id ASC")
        rows = cur.fetchall()
        conn.close()

        prev_hash = "GENESIS"
        for r in rows:
            expected = self._compute_hash(
                prev_hash, r["timestamp"], r["module"], r["event_type"],
                r["severity"], r["details"]
            )
            if expected != r["row_hash"] or r["prev_hash"] != prev_hash:
                return False
            prev_hash = r["row_hash"]
        return True


if __name__ == "__main__":
    logger = ActivityLogger()
    logger.log_event("system", "LOGGER_SELFTEST", config.SEVERITY_INFO, {"msg": "logger initialized"})
    print("Recent events:", logger.get_recent(5))
    print("Integrity OK:", logger.verify_integrity())
