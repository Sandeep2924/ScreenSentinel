"""
config.py
Central configuration: known recorder signatures, thresholds, paths.
Edit this file to tune the system for your environment without touching logic code.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Webhooks / Integrations
WEBHOOK_URL = os.getenv("WEBHOOK_URL")

# ----------------------------------------------------------------------
# Paths
# ----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
LOG_DIR = os.path.join(BASE_DIR, "logs")
DB_PATH = os.path.join(DATA_DIR, "activity_log.db")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# ----------------------------------------------------------------------
# Known screen-recording / streaming software (process name -> risk label)
# Extend this list as you discover more tools in your environment.
# Matching is case-insensitive and checks if the token appears in the
# process name, so "obs64.exe" matches "obs".
# ----------------------------------------------------------------------
KNOWN_RECORDERS = {
    "obs": "OBS Studio",
    "obs64": "OBS Studio",
    "camtasia": "Camtasia",
    "bandicam": "Bandicam",
    "fraps": "Fraps",
    "screencastify": "Screencastify",
    "loom": "Loom",
    "xsplit": "XSplit",
    "nvidia share": "NVIDIA ShadowPlay",
    "gamebar": "Windows Game Bar",
    "quicktime player": "QuickTime Player",
    "screenflow": "ScreenFlow",
    "ffmpeg": "FFmpeg (CLI capture)",
    "vlc": "VLC (can capture screen)",
    "icecream screen recorder": "Icecream Screen Recorder",
    "apowersoft": "ApowerREC",
    "snippingtool": "Windows Snipping Tool",
}

# Processes that are allowed to record even though they match the list
# above (e.g. your own IT-approved conferencing tool). Add exact process
# names here.
WHITELISTED_PROCESSES = {
    "zoom.exe",
    "teams.exe",
    "screen_sentinel.exe",  # this app itself, once packaged
}

# ----------------------------------------------------------------------
# File-system watch: directories where recordings typically get saved,
# and extensions that indicate a video was just written.
# ----------------------------------------------------------------------
WATCHED_DIRECTORIES = [
    os.path.join(os.path.expanduser("~"), "Videos"),
    os.path.join(os.path.expanduser("~"), "Desktop"),
    os.path.join(os.path.expanduser("~"), "Downloads"),
    os.path.join(os.path.expanduser("~"), "Pictures", "Screenshots"),
]

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".flv", ".wmv", ".webm"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}

# ----------------------------------------------------------------------
# Polling intervals (seconds)
# ----------------------------------------------------------------------
PROCESS_SCAN_INTERVAL = 3
WEBCAM_SCAN_INTERVAL = 3
ANOMALY_CHECK_INTERVAL = 5

# ----------------------------------------------------------------------
# Anomaly detection thresholds (used by the lightweight ML/statistical
# module). These are simple starting points — replace with a trained
# model's decision boundary once you have real usage data.
# ----------------------------------------------------------------------
CPU_SPIKE_PERCENT = 70          # sustained per-process CPU% considered high
GPU_ENCODE_PROC_NAMES = {"nvenc", "quicksync", "amf"}  # substrings for GPU encoder use
FEATURE_WINDOW_SECONDS = 30     # rolling window for building behavior features

# ----------------------------------------------------------------------
# Alert severities
# ----------------------------------------------------------------------
SEVERITY_INFO = "INFO"
SEVERITY_WARNING = "WARNING"
SEVERITY_CRITICAL = "CRITICAL"
