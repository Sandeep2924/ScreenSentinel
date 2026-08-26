"""
webcam_monitor.py
Detects when the webcam is in use and, on Windows, which apps accessed it.

Two strategies are combined:
1. Windows only: read the registry key that Windows itself maintains for
   camera consent/usage (HKCU/HKLM ...CapabilityAccessManager...webcam).
   This is the most reliable signal on Windows 10/11 and needs no extra
   permissions.
2. Cross-platform fallback: try to briefly open the default camera with
   OpenCV. If it's already claimed by another process, the open will fail
   or return not-readable — a weak "busy" signal you can use on
   macOS/Linux until you wire up a platform-specific API.

Requires: pywin32 (Windows only, for registry access), opencv-python (optional)
"""

import sys
import time
import platform

from core import config
from core.activity_logger import ActivityLogger

IS_WINDOWS = platform.system() == "Windows"

if IS_WINDOWS:
    import winreg

REG_PATHS = [
    r"Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam",
    r"Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam\NonPackaged",
]


class WebcamMonitor:
    def __init__(self, logger: ActivityLogger, alert_callback=None):
        self.logger = logger
        self.alert_callback = alert_callback
        self._last_seen_active = set()

    # ------------------------------------------------------------------
    def _read_windows_camera_usage(self):
        """
        Returns a list of dicts: {app, last_used_start, last_used_stop, currently_active}
        by reading Windows' own camera consent store.
        """
        results = []
        for base_path in REG_PATHS:
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, base_path)
            except FileNotFoundError:
                continue

            i = 0
            while True:
                try:
                    app_key_name = winreg.EnumKey(key, i)
                except OSError:
                    break
                i += 1
                try:
                    app_key = winreg.OpenKey(key, app_key_name)
                    start_time, _ = winreg.QueryValueEx(app_key, "LastUsedTimeStart")
                    stop_time, _ = winreg.QueryValueEx(app_key, "LastUsedTimeStop")
                    # Windows encodes "currently active" as stop_time == 0
                    currently_active = (stop_time == 0)
                    results.append({
                        "app": app_key_name,
                        "last_used_start": start_time,
                        "last_used_stop": stop_time,
                        "currently_active": currently_active,
                    })
                except OSError:
                    continue
        return results

    # ------------------------------------------------------------------
    def _check_camera_busy_fallback(self) -> bool:
        """Cross-platform weak signal: can we grab the default camera right now?"""
        try:
            import cv2
        except ImportError:
            return False  # opencv not installed; skip this check

        cap = cv2.VideoCapture(0)
        try:
            is_opened = cap.isOpened()
            if not is_opened:
                return True  # likely held by another process
            ok, _ = cap.read()
            return not ok
        finally:
            cap.release()

    # ------------------------------------------------------------------
    def scan_once(self):
        events = []

        if IS_WINDOWS:
            usage = self._read_windows_camera_usage()
            active_now = {u["app"] for u in usage if u["currently_active"]}

            newly_active = active_now - self._last_seen_active
            for app in newly_active:
                event = self.logger.log_event(
                    module="webcam_monitor",
                    event_type="WEBCAM_ACCESS_STARTED",
                    severity=config.SEVERITY_WARNING,
                    details={"app": app},
                )
                events.append(event)
                if self.alert_callback:
                    self.alert_callback(event)

            self._last_seen_active = active_now
        else:
            busy = self._check_camera_busy_fallback()
            if busy and "generic" not in self._last_seen_active:
                event = self.logger.log_event(
                    module="webcam_monitor",
                    event_type="WEBCAM_BUSY_UNKNOWN_OWNER",
                    severity=config.SEVERITY_INFO,
                    details={"note": "camera unavailable — likely in use by another process"},
                )
                events.append(event)
                if self.alert_callback:
                    self.alert_callback(event)
                self._last_seen_active = {"generic"}
            elif not busy:
                self._last_seen_active = set()

        return events

    # ------------------------------------------------------------------
    def run_forever(self):
        print(f"[webcam_monitor] platform={'Windows (registry)' if IS_WINDOWS else 'fallback (opencv busy-check)'}")
        while True:
            self.scan_once()
            time.sleep(config.WEBCAM_SCAN_INTERVAL)


if __name__ == "__main__":
    logger = ActivityLogger()
    monitor = WebcamMonitor(logger)
    monitor.run_forever()
