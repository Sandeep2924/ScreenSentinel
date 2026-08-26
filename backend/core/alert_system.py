"""
alert_system.py
Turns logged events into user-facing (and optionally admin-facing) alerts.

Core: desktop notification via plyer, with a cooldown so the same
event_type doesn't spam the user every scan cycle.

Stretch hooks included but commented/no-op by default: email and Slack/
Teams webhook. Fill in credentials/webhook URLs to enable.
"""

import time
from collections import defaultdict

from core import config

try:
    from plyer import notification
    _HAS_PLYER = False # Disabled due to Shell_NotifyIconW failures
except ImportError:
    _HAS_PLYER = False


class AlertSystem:
    def __init__(self, cooldown_seconds: int = 30):
        self.cooldown_seconds = cooldown_seconds
        self._last_fired = defaultdict(float)  # event_type -> last fire timestamp
        self.email_enabled = False
        self.webhook_url = None  # set to a Slack/Teams incoming webhook URL to enable

    # ------------------------------------------------------------------
    def _should_fire(self, event_type: str) -> bool:
        now = time.time()
        if now - self._last_fired[event_type] < self.cooldown_seconds:
            return False
        self._last_fired[event_type] = now
        return True

    # ------------------------------------------------------------------
    def _desktop_notify(self, title: str, message: str):
        if _HAS_PLYER:
            try:
                notification.notify(title=title, message=message, timeout=6)
                return
            except Exception:
                pass
        # Fallback: plain console alert if plyer/notifications aren't available
        print(f"\n[ALERT] {title}: {message}\n")
        try:
            import winsound
            # Play a short beep (frequency 800Hz, duration 300ms)
            winsound.Beep(800, 300)
        except ImportError:
            pass

    # ------------------------------------------------------------------
    def _send_webhook(self, text: str):
        if not self.webhook_url:
            return
        try:
            import requests
            requests.post(self.webhook_url, json={"text": text}, timeout=5)
        except Exception as e:
            print(f"[alert_system] webhook send failed: {e}")

    # ------------------------------------------------------------------
    def handle_event(self, event: dict):
        """
        Called by the monitoring modules whenever they log a new event.
        Decides whether to notify based on severity + cooldown.
        """
        severity = event.get("severity", config.SEVERITY_INFO)
        event_type = event.get("event_type", "UNKNOWN")
        details = event.get("details", {})

        if severity == config.SEVERITY_INFO:
            return  # don't bother the user for informational events

        if not self._should_fire(event_type):
            return

        title = f"ScreenSentinel — {severity}"
        message = self._format_message(event_type, details)

        self._desktop_notify(title, message)

        if severity == config.SEVERITY_CRITICAL:
            self._send_webhook(f"*{title}*\n{message}")

    # ------------------------------------------------------------------
    @staticmethod
    def _format_message(event_type: str, details: dict) -> str:
        if event_type == "RECORDER_DETECTED":
            return f"Screen recorder detected: {details.get('matched')} (pid {details.get('pid')})"
        if event_type == "SUSPICIOUS_RESOURCE_USAGE":
            return f"Unrecognized process '{details.get('process')}' shows recorder-like CPU usage"
        if event_type == "WEBCAM_ACCESS_STARTED":
            return f"Webcam access started by: {details.get('app')}"
        if event_type == "NEW_VIDEO_FILE_DETECTED":
            return f"New video file saved: {details.get('path')}"
        if event_type == "NEW_SCREENSHOT_DETECTED":
            return f"New screenshot saved: {details.get('path')}"
        return f"{event_type}: {details}"


if __name__ == "__main__":
    alerts = AlertSystem(cooldown_seconds=5)
    alerts.handle_event({
        "severity": config.SEVERITY_CRITICAL,
        "event_type": "RECORDER_DETECTED",
        "details": {"matched": "OBS Studio", "pid": 1234},
    })
