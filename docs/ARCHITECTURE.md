# 🏗️ El Niño — Cyber-Physical System Architecture

**Team:** El Nino Team 8 (Buildathon Group 8)  
**Live Deployment:** `https://elnino-three.vercel.app`  
**Repository:** `https://github.com/prince24-web/el-nino`

---

## 1. Architectural Philosophy

**El Niño** is designed as a **closed-loop Cyber-Physical System (CPS)** unifying three layers:
1. **Autonomous Edge IoT Node (ESP-32D + 5 Farm Sensors + Physical Passive Buzzer)** — Runs wirelessly off a 5V USB power bank, reacts locally to wildfires in `<20ms` (`1800Hz/1200Hz` PWM siren), and pushes live readings to the cloud over Wi-Fi HTTPS.
2. **Serverless Cloud & Persistence Layer (Next.js 16 on Vercel + Supabase PostgreSQL)** — Solves serverless instance isolation by persisting real-time telemetry and hazard logs in PostgreSQL (`farm_telemetry`, `farm_alerts`), enabling simultaneous multi-client sync across laptops and judges' mobile phones.
3. **Multimodal AI & 3D Digital Twin Layer (Google Gemini 3.1 Flash + Three.js WebGL)** — Gives farmers both a real-time 3D visualization of their plot and an AI agronomy assistant capable of **native tool calling** against live physical sensors.

---

## 2. End-to-End System Topology

```mermaid
flowchart TB
  subgraph Edge["1. Wireless Physical Farm Plot (5V Power Bank)"]
    PB["🔋 5V Power Bank (Micro-USB)"] --> ESP["ESP-32D Microcontroller\n(Dual-Core 240MHz + Wi-Fi)"]
    SOIL["🌱 Soil Moisture Probes\n(GPIO 34 & VP/36)"] --> ESP
    RAIN["🌧️ FC-37 Raindrop Grid\n(GPIO 35)"] --> ESP
    WATER["🌊 Red Water Depth Strip\n(GPIO 32)"] --> ESP
    FLAME["🔥 IR Flame Detector\n(GPIO 33 - Active LOW)"] --> ESP
    ESP -- "<20ms Local Interrupt Loop\n(GPIO 25 LEDC PWM)" --> BUZZ["🔊 Passive Buzzer Siren\n(1800Hz / 1200Hz Physical Alarm)"]
  end

  subgraph Cloud["2. Vercel Serverless + Supabase PostgreSQL"]
    ESP -- "HTTPS POST (WiFiClientSecure)\n1.5s Heartbeat + Instant Fire/Rain Event" --> POST["POST /api/telemetry"]
    POST --> STORE["src/lib/telemetry-store.ts\n(Transition Alert Engine + 20s Cooldown)"]
    STORE <--> SUPA[("🗄️ Supabase Postgres\n• farm_telemetry\n• farm_alerts")]
    STORE --> GET["GET /api/telemetry"]
    STORE --> CHAT["POST /api/chat\n(Gemini 3.1 Flash)"]
  end

  subgraph Clients["3. Farmers' & Judges' Phones (Browser / Mobile Web)"]
    GET -- "1s Global Hook Poll\n(useFarmTelemetry)" --> SIREN["🚨 Web Audio Fire Siren\n(880Hz ↔ 1320Hz) + Vibration"]
    GET --> TWIN["🌍 Three.js 3D Farm Twin\n(2,400 Raindrops, Flood Plane, Flame Plumes)"]
    CHAT <--> AI["🤖 Gemini Function Calling\n(get_live_farm_sensors,\nget_farm_alert_history,\nlookup_nigerian_agronomy)"]
  end
```

---

## 3. Why Supabase Persistence Matters for Vercel Serverless

In a traditional single-process Node server (`localhost`), holding telemetry in an in-memory variable works because every browser shares one process. On **Vercel Serverless**, incoming requests (`POST /api/telemetry` from the ESP32 and `GET /api/telemetry` from judges' phones) can be routed to **isolated, ephemeral function containers** that do not share RAM.

| Requirement | In-Memory Only | El Niño Hybrid (`telemetry-store.ts` + Supabase) |
| :--- | :--- | :--- |
| **Multi-device sync on Vercel** | ❌ Judges' phones see empty state | ✅ All phones read the exact same live PostgreSQL row |
| **Zero-latency local fallback** | ✅ Instant RAM read | ✅ Automatic in-memory fallback if offline/unconfigured |
| **Historical audit trail** | ❌ Lost on restart | ✅ Transition events (`WILDFIRE`, `FLOOD`, `RAIN`, `DROUGHT`) logged in `farm_alerts` |
| **AI historical reasoning** | ❌ Present snapshot only | ✅ Gemini calls `get_farm_alert_history()` for time-series context |

---

## 4. Gemini Live Sensor Tool-Calling Sequence

When a farmer or judge asks *"How is the soil moisture on my farm right now?"*, the assistant does not guess — it executes a live hardware read via Gemini Function Calling:

```mermaid
sequenceDiagram
  actor User as Farmer / Judge (Phone)
  participant UI as Next.js Chat UI
  participant ChatAPI as POST /api/chat
  participant Gemini as Gemini 3.1 Flash
  participant DB as Supabase (farm_telemetry)

  User->>UI: "How is my farm soil moisture & fire status?"
  UI->>ChatAPI: Stream Request
  ChatAPI->>Gemini: Turn 1 (Prompt + 3 Function Declarations)
  Gemini-->>ChatAPI: FunctionCall: get_live_farm_sensors()
  ChatAPI->>DB: Fetch latest ESP-32D row
  DB-->>ChatAPI: { soilMoisture: 78, waterLevel: 65, isFire: false, isOnline: true }
  ChatAPI-->>UI: Stream [TOOL_CALL: get_live_farm_sensors | SUMMARY: Soil 78%...]
  ChatAPI->>Gemini: Turn 2 (FunctionResponse payload)
  Gemini-->>ChatAPI: Stream grounded agronomic advice
  ChatAPI-->>UI: Live tokens rendered with sensor badge + Markdown
```

---

## 5. Latency & Reliability Engineering

| Path | Target Latency | Fault Tolerance Mechanism |
| :--- | :--- | :--- |
| **Flame Sensor $\rightarrow$ Physical Buzzer** | **`< 20 ms`** | Non-blocking `millis()` loop runs locally on ESP32; works even with **zero Wi-Fi**. |
| **Flame Sensor $\rightarrow$ Judges' Phones** | **`~1.0 – 1.8 s`** | Event-driven `POST` triggers immediately on state transition + 1s frontend poll. |
| **Phone Browser Audio Playback** | **Instant** | Pure Web Audio API oscillator synthesis (`alarm-audio.ts`) avoids network MP3 fetch delays; arms via 1-tap header pill or any touch gesture. |
| **Stage Demo Failsafe** | **Instant** | Built-in **Backup Sliders** in `FarmSimulation3D` can inject test readings into `/api/telemetry` if venue Wi-Fi blocks outbound ESP32 traffic. |
