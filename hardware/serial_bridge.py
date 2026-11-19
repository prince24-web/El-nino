import serial
import urllib.request
import json
import time

PORT = "COM3"
BAUD = 115200
API_URL = "http://localhost:3000/api/telemetry"

print(f"Starting El-Nino USB Serial Bridge: {PORT} -> {API_URL}")

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
                        req = urllib.request.Request(
                            API_URL,
                            data=json.dumps(payload).encode("utf-8"),
                            headers={"Content-Type": "application/json"},
                            method="POST",
                        )
                        with urllib.request.urlopen(req, timeout=2) as resp:
                            pass
                        print(f"[SYNCED] {json_str}")
                    except Exception as e:
                        print(f"[WARN] Sync error: {e}")
    except Exception as conn_err:
        print(f"[WAIT] Waiting for {PORT} ({conn_err})...")
        time.sleep(2)
