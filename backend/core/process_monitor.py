"""
process_monitor.py
Watches running processes and flags known screen-recording tools, plus
processes exhibiting recorder-like resource usage (a lightweight stand-in
for the "AI/behavioral" detection layer described in the project plan).

Requires: psutil (pip install psutil)
"""

import time
import psutil
from collections import defaultdict

from core import config
from core.activity_logger import ActivityLogger


class ProcessMonitor:
    def __init__(self, logger: ActivityLogger, alert_callback=None):
        self.logger = logger
        self.alert_callback = alert_callback  # function(event_dict) -> None
        self._known_flagged_pids = set()
        self._cpu_history = defaultdict(list)  # pid -> list of recent cpu% samples

    # ------------------------------------------------------------------
    def _match_known_recorder(self, proc_name: str):
        name_lower = proc_name.lower()
        for token, label in config.KNOWN_RECORDERS.items():
            if token in name_lower:
                return label
        return None

    # ------------------------------------------------------------------
    def _is_whitelisted(self, proc_name: str) -> bool:
        return proc_name.lower() in {p.lower() for p in config.WHITELISTED_PROCESSES}

    # ------------------------------------------------------------------
    def _check_behavioral_anomaly(self, proc: psutil.Process) -> bool:
        """
        Very simple heuristic stand-in for an ML anomaly detector:
        sustained high CPU usage combined with the process being unrecognized
        is treated as suspicious. Swap this out for a trained model later
        (see docs/ML_UPGRADE_PATH.md idea in the README).
        """
        try:
            cpu = proc.cpu_percent(interval=None)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False

        history = self._cpu_history[proc.pid]
        history.append(cpu)
        if len(history) > 10:
            history.pop(0)

        sustained_high = len(history) >= 5 and sum(history[-5:]) / 5 >= config.CPU_SPIKE_PERCENT
        return sustained_high

    # ------------------------------------------------------------------
    def scan_once(self):
        """Single pass over all running processes. Returns list of flagged events."""
        flagged = []

        for proc in psutil.process_iter(attrs=["pid", "name", "exe", "username"]):
            try:
                info = proc.info
                name = info.get("name") or ""
                pid = info.get("pid")

                if self._is_whitelisted(name):
                    continue

                label = self._match_known_recorder(name)
                if label and pid not in self._known_flagged_pids:
                    self._known_flagged_pids.add(pid)
                    event = self.logger.log_event(
                        module="process_monitor",
                        event_type="RECORDER_DETECTED",
                        severity=config.SEVERITY_CRITICAL,
                        details={"process": name, "pid": pid, "matched": label,
                                 "user": info.get("username"), "exe": info.get("exe")},
                    )
                    flagged.append(event)
                    if self.alert_callback:
                        self.alert_callback(event)
                    continue

                # Behavioral check for everything else (skip whitelisted/known)
                if self._check_behavioral_anomaly(proc) and pid not in self._known_flagged_pids:
                    self._known_flagged_pids.add(pid)
                    event = self.logger.log_event(
                        module="process_monitor",
                        event_type="SUSPICIOUS_RESOURCE_USAGE",
                        severity=config.SEVERITY_WARNING,
                        details={"process": name, "pid": pid,
                                 "note": "sustained high CPU, unrecognized process"},
                    )
                    flagged.append(event)
                    if self.alert_callback:
                        self.alert_callback(event)

            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        return flagged

    # ------------------------------------------------------------------
    def run_forever(self):
        print(f"[process_monitor] watching for: {list(config.KNOWN_RECORDERS.values())}")
        while True:
            self.scan_once()
            time.sleep(config.PROCESS_SCAN_INTERVAL)


if __name__ == "__main__":
    logger = ActivityLogger()
    monitor = ProcessMonitor(logger)
    monitor.run_forever()
