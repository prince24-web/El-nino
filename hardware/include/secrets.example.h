#pragma once

// Primary Wi-Fi (e.g. your mobile phone personal hotspot on demo day)
#define WIFI_SSID_1     "YOUR_HOTSPOT_NAME"
#define WIFI_PASS_1     "YOUR_HOTSPOT_PASSWORD"

// Optional Backup Wi-Fi (e.g. venue or home Wi-Fi)
#define WIFI_SSID_2     ""
#define WIFI_PASS_2     ""

// Live El Niño Telemetry Endpoint (Vercel production HTTPS URL)
// For local LAN testing, change to: "http://<YOUR_LAPTOP_IP>:3000/api/telemetry"
#define TELEMETRY_URL   "https://nino-three.vercel.app/api/telemetry"

// Buzzer type on GPIO 25:
// false = 2-pin Active Buzzer (solid black bottom, beeps with 3.3V HIGH)
// true  = 2-pin Passive Buzzer (green PCB bottom, requires PWM tone)
#define BUZZER_IS_PASSIVE true
