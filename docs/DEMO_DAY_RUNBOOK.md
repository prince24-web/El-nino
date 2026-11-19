# 🎬 El Niño — Hackathon Demo Day Runbook (Team 8)

Follow this quick checklist to deliver a **flawless, zero-lag live cyber-physical demonstration** on your laptop AND the judges' phones via `https://nino-three.vercel.app`.

---

## 1. Pre-Demo Cloud & Hardware Setup (10 Minutes Before Pitch)

### A. Verify Vercel Environment Variables (`nino-three.vercel.app`)
In your **Vercel Project Settings $\rightarrow$ Environment Variables**, confirm all 3 keys are set:
1. `GEMINI_API_KEY` — Google Gemini API Key
2. `SUPABASE_URL` — `https://sdqsnkoohiqpcboxtbsp.supabase.co`
3. `SUPABASE_ANON_KEY` — Your Supabase publishable key

*(After pushing updates to `main`, trigger or wait ~45s for Vercel to finish deploying.)*

### B. Flash Your Phone Hotspot onto the ESP-32D
1. Turn on your **Phone Personal Hotspot** (2.4 GHz Wi-Fi — note: ESP32 only connects to **2.4 GHz**, not 5 GHz-only hotspots; on iPhone enable *"Maximize Compatibility"*).
2. Put your hotspot name and password into `hardware/include/secrets.h`:
   ```cpp
   #define WIFI_SSID_1     "Your_Hotspot_Name"
   #define WIFI_PASS_1     "Your_Hotspot_Password"
   #define TELEMETRY_URL   "https://nino-three.vercel.app/api/telemetry"
   #define BUZZER_IS_PASSIVE true
   ```
3. Plug ESP32 into laptop USB and run:
   ```powershell
   python -m platformio run -d hardware --target upload
   ```
4. **Unplug the laptop USB cable and plug the ESP32 into your 5V Power Bank!**
   - Listen for the clean **1800Hz / 1200Hz two-tone startup chirp** from the Passive Buzzer (`GPIO 25`).
   - Within ~5 seconds, `nino-three.vercel.app` turns green: **`ESP32 Live`**.

### C. Arm the Judges' Phones
1. Share `https://nino-three.vercel.app` with the judges (QR code or short link).
2. Ask them to tap the pulsing amber **`Tap to Arm Phone Fire Siren`** button in the top bar once (mobile browsers require one user tap to unlock speaker audio — they will hear a tiny confirmation chirp and the badge turns **`🔔 Phone Alarm Armed`**).

---

## 2. Live 3-Minute Stage Script

| Time | Demo Action | What Happens Live |
| :--- | :--- | :--- |
| **0:00 – 0:30** | **1. Baseline & Wireless Proof** | Lift the ESP32 powered solely by the power bank. Show the **3D Farm Digital Twin** orbiting smoothly on screen & judges' phones showing `Soil ~0–40% • Safe`. |
| **0:30 – 1:15** | **2. Live AI Sensor Tool Calling** | In the main Chat, tap **`📡 Check live farm sensor status`** (or type *"How is the soil moisture on my farm right now?"*). Gemini invokes `get_live_farm_sensors()`, shows the **`AI Read Live Tool`** badge, and quotes the exact live ESP32 percentages! |
| **1:15 – 2:00** | **3. Pour Water (Rain + Flash Flood)** | Pour water from a bottle onto the **FC-37 Rain Grid (`GPIO 35`)** and into the soil/red strip (`GPIO 34`, `GPIO 32`).<br>• 3D sky darkens and **2,400 raindrops fall**.<br>• **Reflective blue floodwater plane rises** over the ridges.<br>• Click **`Ask AI for Rain & Flood Plan`** for instant furrow drainage advice. |
| **2:00 – 2:35** | **4. Wildfire Alarm (Buzzer + All Phones)** | Flick a lighter ~15cm from the **IR Flame Sensor (`GPIO 33`)**.<br>• Physical **Passive Buzzer (`GPIO 25`, 1800Hz/1200Hz PWM)** blares immediately (`<20ms`).<br>• **Every judge's phone** flashes red **`🔥 WILDFIRE EMERGENCY DETECTED`** and sounds the **Web Audio Fire Siren** + vibration!<br>• Tap **`Emergency Fire Protocol`** for instant firebreak guidance. |
| **2:35 – 3:00** | **5. Leaf Disease Scan + Market Prices** | Upload a diseased tomato/maize leaf photo $\rightarrow$ Gemini diagnoses **Late Blight**, prescribes **Ridomil Gold** knapsack dosage in **Naira (₦)**, and answers Mile 12/Bodija market price questions. |

---

## 3. Instant Stage Failover ("Judges Insurance")
If venue Wi-Fi congests or a battery dies mid-pitch:
1. Open **3D Farm Digital Twin** $\rightarrow$ click **`Backup Sliders`**.
2. Use **`Pour Rain`**, **`Trigger Flame`**, or **`Test Flash Flood`** — these write directly to `/api/telemetry` and Supabase, updating all phones seamlessly!
3. Before the next team or judge group, click **`Reset`** in the modal header to return cleanly to `Awaiting ESP32 Hardware Feed…`.
