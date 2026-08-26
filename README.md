# ScreenSentinel — Unauthorized Screen Capture & Recording Detection

ScreenSentinel is an AI-assisted, modular endpoint security agent and dashboard designed to detect, log, and alert on unauthorized screen recording, screenshots, and webcam access in real time. 

It features a **Python-based detection backend** that monitors system activity, and a **Next.js frontend dashboard** that visualizes the detected threats using a tamper-evident, hash-chained SQLite ledger.

## 🚀 Features

* **Process Monitoring:** Actively scans for known recording software (OBS Studio, Camtasia, Snipping Tool, etc.) and flags unrecognized processes exhibiting recorder-like CPU usage.
* **File System Watcher:** Monitors common save directories (`Downloads`, `Videos`, `Desktop`, `Pictures/Screenshots`) for newly created media files (`.mp4`, `.mkv`, `.png`, `.jpg`).
* **Webcam Auditing:** Monitors the Windows registry to detect which applications are actively using the camera.
* **Audio Alerts:** Emits a system beep via `winsound` the moment a warning or critical alert is triggered.
* **Tamper-Evident Ledger:** All events are logged to a local SQLite database using a SHA-256 hash chain (similar to a blockchain) to ensure that past event logs cannot be maliciously altered or deleted without breaking the chain.
* **Real-time Dashboard:** A Next.js web interface that polls the database to provide a live feed of alerts, chronological timelines, and system integrity status.

---

## 📂 Project Structure

The repository is divided into two decoupled systems:

```text
screen_sentinel/
├── backend/                              # Python Detection Agent
│   ├── core/
│   │   ├── config.py                     # Tunables: blocklists, thresholds, paths
│   │   ├── activity_logger.py            # SQLite logging (hash-chained)
│   │   ├── process_monitor.py            # Process & anomaly detection
│   │   ├── webcam_monitor.py             # Webcam usage detection
│   │   ├── screen_recording_detector.py  # Filesystem & GPU heuristic
│   │   └── alert_system.py               # Sound alerts & webhooks
│   ├── data/                             # SQLite DB lives here (auto-created)
│   ├── tests/                            # Unit tests
│   ├── main.py                           # Daemon runner for all monitors
│   └── requirements.txt                  
│
└── frontend/                             # Next.js Dashboard
    ├── app/                              # React pages & Next.js API routes
    ├── components/                       # UI components (charts, tables, etc.)
    ├── lib/                              # Database connection & hash verification
    ├── scripts/                          # DB Seeding scripts
    └── package.json                      
```

---

## 🛠️ Prerequisites

* **Backend:** Python 3.8+ 
* **Frontend:** Node.js **v20.x** (Strictly required for `better-sqlite3` native bindings). We recommend using `nvm` to manage Node versions.

---

## ⚙️ Setup & Installation

### 1. Backend Setup (Python)
Open a terminal and navigate to the `backend` folder:
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```
*(Note: `pywin32` is required on Windows for webcam registry checks.)*

### 2. Frontend Setup (Next.js)
Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend

# Ensure you are on Node 20 (Important for SQLite native compilation)
nvm use 20  # or use the provided .nvmrc

# Install dependencies
npm install
```

---

## 🏃‍♂️ Running the System

You must run both the backend agent and the frontend dashboard simultaneously in separate terminal windows.

**Start the Backend Agent:**
```bash
cd backend
python main.py
```
*The agent will immediately begin scanning your system in the background.*

**Start the Frontend Dashboard:**
```bash
cd frontend
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your web browser to view the live dashboard.*

---

## 🧪 Testing the Detection

Once both servers are running, you can test the system's detection capabilities live:

1. **Test Screenshot Detection:** 
   Press `Win + Shift + S` and take a snip, or manually create a `.png` file inside your `C:\Users\<user>\Pictures\Screenshots` folder. The system will beep and log a `NEW_SCREENSHOT_DETECTED` warning.
2. **Test Screen Recording File Detection:** 
   Create a dummy file ending in `.mp4` inside your `Downloads` or `Videos` folder.
3. **Test Process Detection:** 
   Open OBS Studio or the Windows Snipping Tool. The system will beep and log a `RECORDER_DETECTED` critical alert. Alternatively, rename any harmless executable (like `python.exe`) to `obs.exe` and launch it.
4. **Seed Dummy Data (Optional):**
   If you want to test the dashboard UI with a large set of data, you can run the seed script which simulates 48 hours of complex events:
   ```bash
   cd frontend
   npm run seed
   ```

---

## 🛡️ Security & Integrity

ScreenSentinel treats integrity as a first-class citizen. Every row in `activity_log.db` computes a `row_hash` based on its own contents combined with the `prev_hash` of the row before it. 

You can manually verify the integrity of the ledger at any time by running the unit tests:
```bash
cd backend
python -m unittest discover tests
```
The frontend dashboard also performs a live integrity check every 5 seconds, displaying an `INTACT` or `BROKEN` badge at the top right of the screen.
