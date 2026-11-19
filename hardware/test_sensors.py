import json
import sys
import time
import serial

PORT = "COM3"
BAUD = 115200


def classify_soil(raw_val: int) -> str:
    if raw_val >= 3700:
        return "Connected (Dry / Open Air)"
    if raw_val <= 1500:
        return "Connected (Wet / Submerged)"
    if 1500 < raw_val < 3700:
        return "Connected (Moist Soil)"
    return "Check wiring"


def classify_rain(raw_val: int) -> str:
    if raw_val >= 3400:
        return "Connected (Dry Plate)"
    if 20 < raw_val < 3400:
        return "Connected (Wet / Rain Detected)"
    return "Floating / Low signal — check wire"


def classify_water(raw_val: int) -> str:
    if raw_val <= 100:
        return "Connected (Dry / No Standing Water)"
    return f"Connected (Water Detected, ADC {raw_val})"


def classify_flame(fire_pin: int) -> str:
    if fire_pin == 1:
        return "Connected & Calibrated (Clear / Safe)"
    return "LOW (0) — Either flame near OR turn blue screw CCW / check VCC-GND!"


def main():
    print(f"Opening {PORT} at {BAUD} baud for live Phase 1 sensor & buzzer diagnostics...")
    try:
        ser = serial.Serial(PORT, BAUD, timeout=0.4)
    except Exception as exc:
        print(f"ERROR: Could not open {PORT}: {exc}")
        sys.exit(1)

    # Pulse RTS to cleanly reset ESP-32D so we capture the boot self-test & warnings
    ser.dtr = False
    ser.rts = True
    time.sleep(0.15)
    ser.rts = False
    time.sleep(0.1)
    ser.reset_input_buffer()

    packets = []
    buzzer_boot_ok = False
    buzzer_a_ok = False
    buzzer_p_ok = False
    ledc_errors = []
    fire_boot_warn = False
    wifi_note = ""

    sent_a = False
    sent_a_time = 0.0
    sent_p = False

    t_start = time.time()
    while (time.time() - t_start < 10.0) and not (buzzer_a_ok and buzzer_p_ok and len(packets) >= 6):
        raw = ser.readline().decode("utf-8", errors="replace").strip()
        if raw:
            if raw.startswith("TELEMETRY_JSON:"):
                payload_str = raw[len("TELEMETRY_JSON:"):]
                try:
                    pkt = json.loads(payload_str)
                    packets.append(pkt)
                    print(f"  [PKT #{len(packets)}] {payload_str}")
                except json.JSONDecodeError:
                    print(f"  [BAD JSON] {raw}")
            else:
                print(f"  [LOG] {raw}")
                if "ledc_get_duty" in raw:
                    ledc_errors.append(raw)
                if "[BUZZER] Boot self-test" in raw:
                    buzzer_boot_ok = True
                if "[BUZZER] TEST_A" in raw:
                    buzzer_a_ok = True
                if "[BUZZER] TEST_P" in raw:
                    buzzer_p_ok = True
                if "[WARN] GPIO 33" in raw:
                    fire_boot_warn = True
                if raw.startswith("[WIFI]"):
                    wifi_note = raw

        # Step 1: After 3 packets, trigger Beep #1 (Pure Active DC 500ms)
        if len(packets) >= 3 and not sent_a:
            print("\n>>> Sending 'A' — BEEP #1 (Pure Active DC 500ms on GPIO 25)...")
            ser.write(b"A\n")
            ser.flush()
            sent_a = True
            sent_a_time = time.time()

        # Step 2: 1.2s after Beep #1, trigger Beep #2 (Passive 1800Hz/1200Hz Fire Tone 500ms)
        if sent_a and not sent_p and (time.time() - sent_a_time >= 1.2):
            print("\n>>> Sending 'P' — BEEP #2 (Passive 1800Hz/1200Hz Dual-Tone Fire Siren 500ms on GPIO 25)...")
            ser.write(b"P\n")
            ser.flush()
            sent_p = True

    ser.close()

    print("\n" + "=" * 76)
    print("EL-NINO PHASE 1 — LIVE HARDWARE DIAGNOSTIC REPORT (COM3)")
    print("=" * 76)
    if not packets:
        print("FAILED: No TELEMETRY_JSON packets received from ESP-32D on COM3!")
        sys.exit(2)

    latest = packets[-1]
    s1_vals = [p.get("rawSoil1", 0) for p in packets]
    s2_vals = [p.get("rawSoil2", 0) for p in packets]
    rain_vals = [p.get("rawRain", 0) for p in packets]
    water_vals = [p.get("rawWater", 0) for p in packets]
    fire_vals = [p.get("firePin", 1) for p in packets]

    rows = [
        ("Soil Moisture #1", "GPIO 34", f"{latest.get('rawSoil1')} ({min(s1_vals)}..{max(s1_vals)})", classify_soil(latest.get("rawSoil1", 0))),
        ("Soil Moisture #2", "VP (GPIO 36)", f"{latest.get('rawSoil2')} ({min(s2_vals)}..{max(s2_vals)})", classify_soil(latest.get("rawSoil2", 0))),
        ("FC-37 Rain Plate", "GPIO 35", f"{latest.get('rawRain')} ({min(rain_vals)}..{max(rain_vals)})", classify_rain(latest.get("rawRain", 0))),
        ("Red Water Strip", "GPIO 32", f"{latest.get('rawWater')} ({min(water_vals)}..{max(water_vals)})", classify_water(latest.get("rawWater", 0))),
        ("IR Flame Sensor", "GPIO 33", f"pin={latest.get('firePin')} (vals={set(fire_vals)})", classify_flame(latest.get("firePin", 1))),
        ("Buzzer Boot Test", "GPIO 25", f"boot={'OK' if buzzer_boot_ok else 'NO'}", "Clean single beep (0 LEDC errs)" if (buzzer_boot_ok and not ledc_errors) else f"LEDC errs={len(ledc_errors)}"),
        ("Buzzer Test A / P", "GPIO 25", f"A={'OK' if buzzer_a_ok else 'NO'}, P={'OK' if buzzer_p_ok else 'NO'}", "Listen for Beep #1 (Active) vs Beep #2 (Passive)"),
    ]

    print(f"{'Sensor':<20} | {'Pin':<12} | {'Live Reading':<24} | {'Status'}")
    print("-" * 76)
    for name, pin, reading, status in rows:
        print(f"{name:<20} | {pin:<12} | {reading:<24} | {status}")
    print("-" * 76)
    print(f"Packets captured: {len(packets)} | LEDC errors: {len(ledc_errors)} | {wifi_note or 'Wi-Fi Active'}")
    if fire_boot_warn:
        print("WARNING: GPIO 33 read LOW at boot. Check Flame Sensor power LED & blue pot screw.")
    print("=" * 76)


if __name__ == "__main__":
    main()
