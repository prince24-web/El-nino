# 🔌 How the Hardware Connects to the El Niño App (Simple Guide)

This guide explains in plain, simple terms how your physical sensors talk to the **El Niño** 3D Digital Twin — both on your laptop (`localhost:3000`) and on the live **Vercel** website.

---

## 1. How the Physical Wires Are Connected

All your sensors are plugged into your **ESP32** board, and the ESP32 is plugged into your laptop with a USB cable:

| Sensor | What It Does | ESP32 Pin |
| :--- | :--- | :--- |
| **🌱 Soil Moisture Probe** | Checks if the soil is dry or wet | **Pin `34`** (or **`VP`**) |
| **🌧️ Rain Sensor Plate** | Checks if rain droplets are falling | **Pin `35`** |
| **🌊 Red Water Sensor** | Checks if floodwater is rising | **Pin `32`** |
| **🔥 Fire / Flame Sensor** | Checks if there is fire nearby | **Pin `33`** |
| **⚡ Power & Ground** | Powers all the sensors | **`3V3`** (Power) & **`GND`** (Ground) |

---

## 2. How the Hardware Talks to the Software (3 Easy Steps)

Think of the connection like a **3-step relay race**:

```text
[1. Sensors & ESP32]  ──(USB Cable)──►  [2. Bridge Script]  ──(Internet)──►  [3. El Niño Website]
   Reads water & fire                    Reads USB COM3 &                     Updates the 3D Farm
   every 0.4 seconds                     sends to website                     on Laptop & Phones!
```

1. **Step 1 — The ESP32 Reads the Sensors**:  
   Every half-second, the ESP32 checks the soil, rain, water, and fire sensors and writes a short message down the USB cable (`COM3`) that looks like this:
   `{"soilMoisture": 85, "isRaining": true, "isFire": false}`
2. **Step 2 — The Bridge Script Picks It Up**:  
   A tiny Python script on your laptop (`hardware/serial_bridge.py`) listens to `COM3` and forwards that message to the website's mailbox (`/api/telemetry`).
3. **Step 3 — The 3D Farm Updates Live**:  
   The El Niño website checks `/api/telemetry` every second. When it sees `isRaining: true` or `isFire: true`, it immediately shows falling rain, rising floodwater, or fire flames in the 3D Digital Twin!

---

## 3. Will This Work on the Live Vercel Website?

**YES — 100%!** And you have **two easy ways** to use it with your live Vercel link during the hackathon demo:

### Option A: Keep ESP32 Plugged into Your Laptop USB (Recommended & Easiest!)
You don't even need to put Wi-Fi passwords onto the ESP32 chip.
1. Keep the ESP32 plugged into your laptop's USB port (`COM3`).
2. Your laptop has internet (via your phone hotspot or venue Wi-Fi).
3. In `hardware/serial_bridge.py`, paste your live Vercel link (for example, `https://el-nino-team8.vercel.app/api/telemetry`).
4. Now, your laptop forwards the USB sensor readings straight up to **Vercel in the cloud**!
5. **Result**: You can open your `.vercel.app` link on **your phone** or the **judges' phones**, pour water on the sensor on your table, and everyone's phone screen will start raining and flooding in 3D at the exact same time!

---

### Option B: Wireless Mode (ESP32 Connected to Your Phone Hotspot)
If you want the ESP32 to run on a powerbank without touching your laptop:
1. Open `hardware/esp32_firmware.ino`.
2. Type in your **Phone Hotspot Name**, **Hotspot Password**, and your **Vercel Link** (`https://your-app.vercel.app/api/telemetry`).
3. Upload it to the ESP32.
4. Now the ESP32 connects to your phone's Wi-Fi hotspot directly and sends the sensor readings straight to Vercel by itself!

---

## 4. Quick Checklist for Hackathon Demo Day

1. **Plug the ESP32 into your laptop USB**.
2. **Run the bridge script** in terminal:
   ```powershell
   python hardware/serial_bridge.py https://your-vercel-link.vercel.app
   ```
3. **Open the El Niño app** (on localhost or your Vercel link) and click **"3D Farm Digital Twin"**.
4. You will see the green badge: **`🟢 ESP32 Hardware Connected`** — you're ready to pour water and test fire live in front of the judges!
