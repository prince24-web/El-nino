import serial
import urllib.request
import json
import time
import sys

PORT = "COM3"
BAUD = 115200

# Sends to local dev server by default.
# If you pass your Vercel URL (e.g. python hardware/serial_bridge.py https://el-nino.vercel.app),
# it will sync your USB ESP32 sensors to BOTH localhost AND your live Vercel site!
TARGETS = ["http://localhost:3000/api/telemetry"]

if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
    vercel_base = sys.argv[1].rstrip("/")
    if not vercel_base.endswith("/api/telemetry"):
        vercel_base += "/api/telemetry"
    TARGETS.append(vercel_base)

print(f"Starting El-Nino USB Serial Bridge on {PORT} -> {TARGETS}")

while True:
    try:
        with serial.Serial(PORT, BAUD, timeout=2) as ser:
            print(f"Connected to {PORT} at {BAUD} baud.")
            while True:
                raw_line = ser.readline().decode("utf-8", errors="replace").strip()
                if raw_line.startswith("TELEMETRY_JSON:"):
                    json_str = raw_line[len("TELEMETRY_JSON:"):]
                    try:
                        payload = json.loads(json_str)
                        body = json.dumps(payload).encode("utf-8")
                        for url in TARGETS:
                            try:
                                req = urllib.request.Request(
                                    url,
                                    data=body,
                                    headers={"Content-Type": "application/json"},
                                    method="POST",
                                )
                                with urllib.request.urlopen(req, timeout=2.5):
                                    pass
                            except Exception:
                                pass
                        print(f"[SYNCED] {json_str}")
                    except Exception as e:
                        print(f"[WARN] Parse error: {e}")
    except Exception as conn_err:
        print(f"[WAIT] Waiting for {PORT} ({conn_err})...")
        time.sleep(2)
