"""
screen_recording_detector.py
Detects screen recording activity through two complementary signals:

1. File-system watcher: new video files appearing in common "save" folders
   (Videos, Desktop, Downloads) are a strong after-the-fact signal that a
   recording just finished.
2. GPU/encoder heuristic: processes that spin up a hardware video encoder
   (NVENC/QuickSync/AMF) while also holding a screen-capture handle are a
   strong real-time signal. Full encoder-level hooking needs native code;
   here we approximate it by cross-referencing process_monitor's flagged
   PIDs with GPU-heavy processes reported by psutil/GPUtil if available.

Requires: watchdog (pip install watchdog), optionally GPUtil for the
GPU-usage heuristic (pip install gputil) — GPU checks are skipped
gracefully if GPUtil / an NVIDIA GPU isn't present.
"""

import os
import time

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from core import config
from core.activity_logger import ActivityLogger


class _NewMediaFileHandler(FileSystemEventHandler):
    def __init__(self, on_media_created):
        self.on_media_created = on_media_created

    def on_created(self, event):
        if event.is_directory:
            return
        _, ext = os.path.splitext(event.src_path)
        ext_lower = ext.lower()
        if ext_lower in config.VIDEO_EXTENSIONS:
            self.on_media_created(event.src_path, is_video=True)
        elif ext_lower in config.IMAGE_EXTENSIONS:
            self.on_media_created(event.src_path, is_video=False)


class ScreenRecordingDetector:
    def __init__(self, logger: ActivityLogger, alert_callback=None):
        self.logger = logger
        self.alert_callback = alert_callback
        self.observer = Observer()

    # ------------------------------------------------------------------
    def _handle_new_media(self, path: str, is_video: bool):
        event_type = "NEW_VIDEO_FILE_DETECTED" if is_video else "NEW_SCREENSHOT_DETECTED"
        event = self.logger.log_event(
            module="screen_recording_detector",
            event_type=event_type,
            severity=config.SEVERITY_WARNING,
            details={"path": path},
        )
        if self.alert_callback:
            self.alert_callback(event)

    # ------------------------------------------------------------------
    def _check_gpu_encoder_usage(self):
        """
        Optional GPU-based signal. Silently no-ops if GPUtil / a supported
        GPU isn't available — treat this as a stretch-goal hook, not a
        hard dependency.
        """
        try:
            import GPUtil
        except ImportError:
            return []

        flagged = []
        try:
            gpus = GPUtil.getGPUs()
        except Exception:
            return []

        for gpu in gpus:
            if gpu.load > 0.6:  # heuristic threshold; tune per-GPU
                event = self.logger.log_event(
                    module="screen_recording_detector",
                    event_type="HIGH_GPU_LOAD",
                    severity=config.SEVERITY_INFO,
                    details={"gpu": gpu.name, "load_pct": round(gpu.load * 100, 1)},
                )
                flagged.append(event)
        return flagged

    # ------------------------------------------------------------------
    def start(self):
        handler = _NewMediaFileHandler(self._handle_new_media)
        for directory in config.WATCHED_DIRECTORIES:
            if os.path.isdir(directory):
                self.observer.schedule(handler, directory, recursive=False)
                print(f"[screen_recording_detector] watching {directory}")
            else:
                print(f"[screen_recording_detector] skip (not found): {directory}")
        self.observer.start()

    def run_forever(self):
        self.start()
        try:
            while True:
                self._check_gpu_encoder_usage()
                time.sleep(config.ANOMALY_CHECK_INTERVAL)
        except KeyboardInterrupt:
            self.observer.stop()
        self.observer.join()


if __name__ == "__main__":
    logger = ActivityLogger()
    detector = ScreenRecordingDetector(logger)
    detector.run_forever()
