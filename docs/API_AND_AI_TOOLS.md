# 📡 El Niño — API Contracts, Database Schema & Gemini AI Tools

This document details all REST endpoints, Supabase PostgreSQL schemas, and Gemini native function-calling tools powering **El Niño**.

---

## 1. Telemetry REST API (`/api/telemetry`)

### `GET /api/telemetry`
Returns the latest persisted farm sensor state from Supabase (`farm_telemetry`), with automatic in-memory fallback.

- **Query Parameters:**
  - `includeHistory=true` *(optional)* — Also includes the 10 most recent entries from `farm_alerts`.
- **Response (`200 OK`):**
```json
{
  "soilMoisture": 78,
  "soilProbePct": 64,
  "waterLevel": 78,
  "rainIntensity": 82,
  "isRaining": true,
  "isFire": false,
  "buzzerActive": false,
  "rawSoil": 2070,
  "rawRain": 1580,
  "rawWater": 1620,
  "firePin": 1,
  "lastUpdated": "2026-11-19T12:15:30.412Z",
  "device": "ESP-32D-WiFi",
  "packetsReceived": 42,
  "source": "esp32",
  "isOnline": true,
  "alerts": [
    {
      "id": 14,
      "device_id": "demo-farm-01",
      "alert_type": "RAIN",
      "severity": "MEDIUM",
      "message": "Active rainfall detected on rain plate (82% intensity).",
      "sensor_snapshot": { "soilMoisture": 78, "waterLevel": 78, "isRaining": true, "isFire": false },
      "created_at": "2026-11-19T12:15:25.100Z"
    }
  ]
}
```
> `isOnline` evaluates to `true` when `source !== "awaiting"` and the latest reading arrived within the last `15 seconds`.

### `POST /api/telemetry`
Ingests live telemetry from the `ESP-32D` (or stage backup sliders) and persists it to Supabase. Automatically inserts transition alerts into `farm_alerts` (with a 20-second cooldown per alert type).

- **Request Body (ESP32 Payload):**
```json
{
  "soilMoisture": 85,
  "soilProbePct": 72,
  "waterLevel": 85,
  "rainIntensity": 90,
  "isRaining": true,
  "isFire": false,
  "buzzerActive": false,
  "rawSoil": 1850,
  "rawRain": 1350,
  "rawWater": 1790,
  "firePin": 1,
  "device": "ESP-32D-WiFi"
}
```
- **Reset Body:** `{ "reset": true }` clears the node back to `"awaiting"` state.

---

## 2. Supabase PostgreSQL Schema

```sql
CREATE TABLE public.farm_telemetry (
  device_id TEXT PRIMARY KEY,
  soil_moisture INTEGER,
  soil_probe_pct INTEGER DEFAULT 0,
  water_level INTEGER DEFAULT 0,
  rain_intensity INTEGER DEFAULT 0,
  is_raining BOOLEAN NOT NULL DEFAULT FALSE,
  is_fire BOOLEAN NOT NULL DEFAULT FALSE,
  buzzer_active BOOLEAN NOT NULL DEFAULT FALSE,
  raw_soil INTEGER,
  raw_rain INTEGER,
  raw_water INTEGER,
  fire_pin INTEGER,
  packets_received INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'awaiting',
  device_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.farm_alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL DEFAULT 'demo-farm-01',
  alert_type TEXT NOT NULL CHECK (alert_type IN ('WILDFIRE', 'FLOOD', 'RAIN', 'DROUGHT')),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  message TEXT NOT NULL,
  sensor_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
Both tables have **Row Level Security (RLS)** enabled with scoped policies restricted to `device_id = 'demo-farm-01'`.

---

## 3. Gemini AI Chat & Native Tool Calling (`POST /api/chat`)

Uses `@google/genai` (`gemini-3.1-flash-lite`) with **two-turn streaming function calling**.

### Registered Gemini Function Declarations (`src/lib/gemini-tools.ts`)

| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| **`get_live_farm_sensors`** | `{}` *(none)* | Reads real-time ESP32 soil moisture %, flood depth %, rain intensity %, flame/fire status, raw ADC values, and computes `farmHealthStatus` (`WILDFIRE_EMERGENCY`, `FLOOD_HAZARD`, `RAINFALL_ACTIVE`, `DROUGHT_STRESS`, `OPTIMAL`, `AWAITING_HARDWARE`). |
| **`get_farm_alert_history`** | `{ limit?: number }` | Queries recent `WILDFIRE`, `FLOOD`, `RAIN`, and `DROUGHT` transition events from Supabase `farm_alerts`. |
| **`lookup_nigerian_agronomy`** | `{ query: string }` | Retrieves grounded crop calendars, local Yoruba/Hausa/Igbo names, knapsack chemical dosages in Naira (₦), and Mile 12/Bodija/Dawanau commodity prices from `src/lib/agronomy-data.ts`. |

### Stream Metadata Directives
When tools or vision pathology run, `/api/chat` prepends structured single-line tags consumed by `src/app/page.tsx`:
- **Live Sensor Tool Badge:** `[TOOL_CALL: get_live_farm_sensors | SUMMARY: Soil 78% • Water 65% • Rain: Yes (82%) • Fire: Safe • Live]`
- **Leaf Disease Vision Badge:** `[DIAGNOSIS: Tomato Late Blight | SEVERITY: Very High]`
