"""
main.py
Entry point. Wires up the shared ActivityLogger + AlertSystem and runs
process_monitor, webcam_monitor, and screen_recording_detector concurrently
as daemon threads.

Run with:
    python main.py
"""

import threading
import time
import sys

from core.activity_logger import ActivityLogger
from core.alert_system import AlertSystem
from core.process_monitor import ProcessMonitor
from core.webcam_monitor import WebcamMonitor
from core.screen_recording_detector import ScreenRecordingDetector
from core import config


def main():
    logger = ActivityLogger()
    alerts = AlertSystem(cooldown_seconds=30)

    logger.log_event("system", "STARTUP", config.SEVERITY_INFO, {"msg": "ScreenSentinel starting"})

    process_monitor = ProcessMonitor(logger, alert_callback=alerts.handle_event)
    webcam_monitor = WebcamMonitor(logger, alert_callback=alerts.handle_event)
    screen_detector = ScreenRecordingDetector(logger, alert_callback=alerts.handle_event)

    threads = [
        threading.Thread(target=process_monitor.run_forever, daemon=True, name="ProcessMonitor"),
        threading.Thread(target=webcam_monitor.run_forever, daemon=True, name="WebcamMonitor"),
        threading.Thread(target=screen_detector.run_forever, daemon=True, name="ScreenRecordingDetector"),
    ]

    for t in threads:
        t.start()
        print(f"[main] started {t.name}")

    print("\nScreenSentinel is running. Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.log_event("system", "SHUTDOWN", config.SEVERITY_INFO, {"msg": "ScreenSentinel stopped by user"})
        print("\n[main] Shutting down. Integrity check:", logger.verify_integrity())
        sys.exit(0)


if __name__ == "__main__":
    main()
