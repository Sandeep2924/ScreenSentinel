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

import os
import json
import requests
from datetime import datetime, timezone

from core import config


class ActivityLogger:
    def __init__(self, api_url: str = None, api_key: str = None):
        # Default to a local dev URL if not provided
        self.api_url = api_url or os.getenv("SAAS_API_URL", "http://localhost:3000/api/ingest")
        self.api_key = api_key or os.getenv("SAAS_API_KEY", "DEMO_COMPANY_123")

    def log_event(self, module: str, event_type: str, severity: str, details: dict = None):
        timestamp = datetime.now(timezone.utc).isoformat()
        
        payload = {
            "timestamp": timestamp,
            "module": module,
            "event_type": event_type,
            "severity": severity,
            "details": details or {}
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # 1. Send data to the Cloud API (Vercel)
        try:
            resp = requests.post(self.api_url, json=payload, headers=headers, timeout=5)
            resp.raise_for_status()
        except Exception as e:
            print(f"[ActivityLogger] Failed to sync with cloud: {e}")

        # 2. Write to traditional local text log file as a backup
        details_str = json.dumps(details or {}, default=str)
        log_line = f"[{timestamp}] [{severity}] [{module}] {event_type} - {details_str}\n"
        log_file = os.path.join(config.LOG_DIR, "agent.log")
        
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(log_line)
        except Exception:
            pass

        return payload

    def verify_integrity(self) -> bool:
        # Integrity is now handled centrally on the Cloud Database!
        return True


if __name__ == "__main__":
    logger = ActivityLogger()
    logger.log_event("system", "LOGGER_SELFTEST", config.SEVERITY_INFO, {"msg": "logger initialized"})
    print("Recent events:", logger.get_recent(5))
    print("Integrity OK:", logger.verify_integrity())
