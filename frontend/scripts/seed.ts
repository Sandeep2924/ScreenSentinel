/**
 * Generates realistic demo activity spanning the last 48 hours, written
 * through the same insertEvent() path the real app would use, so the
 * hash chain is genuinely valid end-to-end.
 *
 * Run with: npm run seed
 */
import { clearAllEvents, insertEvent } from "../lib/db";

const RECORDERS = [
  { name: "obs64.exe", label: "OBS Studio" },
  { name: "camtasia.exe", label: "Camtasia" },
  { name: "bandicam.exe", label: "Bandicam" },
  { name: "screencastify.exe", label: "Screencastify" },
];

const UNKNOWN_PROCESSES = ["svchost_helper.exe", "sysupd_x64.exe", "capd.exe", "rtx_agent.exe"];

const WEBCAM_APPS = ["zoom.exe", "chrome.exe", "unknown_app.exe", "teams.exe"];

const VIDEO_PATHS = [
  "C:\\Users\\jdoe\\Videos\\capture_2026_08_24.mp4",
  "C:\\Users\\jdoe\\Desktop\\out.mkv",
  "C:\\Users\\jdoe\\Downloads\\session_rec.mov",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isoMinutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

async function main() {
  await clearAllEvents();

  const totalMinutes = 48 * 60;
  const events: { offsetMin: number; module: string; type: string; severity: string; details: Record<string, unknown> }[] = [];

  // Baseline informational heartbeat every ~40 min
  for (let m = totalMinutes; m >= 0; m -= 40) {
    events.push({
      offsetMin: m,
      module: "system",
      type: "HEARTBEAT",
      severity: "INFO",
      details: { msg: "agent healthy" },
    });
  }

  // Scattered webcam access events
  for (let i = 0; i < 30; i++) {
    events.push({
      offsetMin: Math.floor(Math.random() * totalMinutes),
      module: "webcam_monitor",
      type: "WEBCAM_ACCESS_STARTED",
      severity: "WARNING",
      details: { app: rand(WEBCAM_APPS) },
    });
  }

  // Occasional suspicious unknown-process CPU spikes
  for (let i = 0; i < 14; i++) {
    events.push({
      offsetMin: Math.floor(Math.random() * totalMinutes),
      module: "process_monitor",
      type: "SUSPICIOUS_RESOURCE_USAGE",
      severity: "WARNING",
      details: { process: rand(UNKNOWN_PROCESSES), pid: 1000 + Math.floor(Math.random() * 8000), note: "sustained high CPU, unrecognized process" },
    });
  }

  // Rarer, serious: known recorder detected
  for (let i = 0; i < 9; i++) {
    const r = rand(RECORDERS);
    events.push({
      offsetMin: Math.floor(Math.random() * totalMinutes),
      module: "process_monitor",
      type: "RECORDER_DETECTED",
      severity: "CRITICAL",
      details: { process: r.name, pid: 1000 + Math.floor(Math.random() * 8000), matched: r.label, user: "jdoe" },
    });
  }

  // New video files appearing
  for (let i = 0; i < 11; i++) {
    events.push({
      offsetMin: Math.floor(Math.random() * totalMinutes),
      module: "screen_recording_detector",
      type: "NEW_VIDEO_FILE_DETECTED",
      severity: "WARNING",
      details: { path: rand(VIDEO_PATHS) },
    });
  }

  // GPU load info blips
  for (let i = 0; i < 20; i++) {
    events.push({
      offsetMin: Math.floor(Math.random() * totalMinutes),
      module: "screen_recording_detector",
      type: "HIGH_GPU_LOAD",
      severity: "INFO",
      details: { gpu: "NVIDIA RTX 4060", load_pct: (55 + Math.random() * 40).toFixed(1) },
    });
  }

  // A couple of concentrated "incidents": recorder + webcam + video file close together
  for (let i = 0; i < 3; i++) {
    const base = Math.floor(Math.random() * (totalMinutes - 30));
    const r = rand(RECORDERS);
    events.push({ offsetMin: base, module: "process_monitor", type: "RECORDER_DETECTED", severity: "CRITICAL", details: { process: r.name, pid: 4321, matched: r.label, user: "jdoe" } });
    events.push({ offsetMin: base - 1, module: "webcam_monitor", type: "WEBCAM_ACCESS_STARTED", severity: "WARNING", details: { app: r.name } });
    events.push({ offsetMin: base - 3, module: "screen_recording_detector", type: "NEW_VIDEO_FILE_DETECTED", severity: "WARNING", details: { path: rand(VIDEO_PATHS) } });
  }

  events.sort((a, b) => b.offsetMin - a.offsetMin); // oldest (largest offset) first

  for (const e of events) {
    await insertEvent(isoMinutesAgo(e.offsetMin), e.module, e.type, e.severity, e.details);
  }

  console.log(`Seeded ${events.length} hash-chained demo events.`);
}

main().catch(console.error);
