# 🔌 El Niño — Hardware Wiring & Calibration Guide

**Microcontroller:** 38-Pin `ESP-WROOM-32D` (`ESP-32D`)  
**Power Source:** 5V USB Power Bank (100% Wireless Field Operation) or Laptop USB (`COM3`)  
**Firmware Entry Points:** `hardware/src/main.cpp` (PlatformIO) & `hardware/esp32_firmware.ino` (Arduino IDE)

---

## 1. Bill of Materials (Low-Cost Smallholder Kit)

| # | Component | Model / Variant | Approx. Cost (₦) | Role in El Niño |
| :-: | :--- | :--- | :---: | :--- |
| **1** | **Wi-Fi MCU** | 38-Pin `ESP-32D` (`CP2102` USB bridge) | ₦5,500 | Sensor polling, local fire alarm logic, HTTPS telemetry |
| **2** | **Soil Moisture Sensor #1** | `HW-080` Fork Probe + `LM393` (`AO` out) | ₦1,200 | Primary root-zone saturation (`0–100%`) |
| **3** | **Soil Moisture Sensor #2** | `HW-080` + `HW-103 v1.2` *(Optional)* | ₦1,200 | Secondary plot zone (auto-merged maximum reading) |
| **4** | **Raindrop Sensor** | `FC-37` Grid Plate + `LM393` (`AO` out) | ₦1,500 | Rain detection & precipitation intensity (`0–100%`) |
| **5** | **Water Level Strip** | Red Water Depth PCB Sensor (`S` out) | ₦1,000 | Measures standing flash-flood depth (`0–100%`) |
| **6** | **IR Flame Detector** | `YG1006` 3-Pin Module (`760–1100nm`) | ₦1,200 | Optical wildfire/bushfire flame detection |
| **7** | **Fire Alarm Buzzer** | 2-Pin **Passive Buzzer** (`1800Hz/1200Hz` PWM) | ₦400 | Immediate two-tone physical alarm on wildfire detection |
| **8** | **Wiring & Breadboard** | Mini breadboard + jumper wires + 5V Power Bank | ₦2,500 | Solderless field assembly |
| | **Total Kit Cost** | | **~₦14,500 (~$9)** | Affordable for smallholder cooperatives |

---

## 2. Complete 38-Pin `ESP-32D` Pinout Map

> [!IMPORTANT]
> **ADC1 vs. ADC2 Rule on ESP32:**  
> All analog sensors are deliberately wired to **ADC1 pins** (`32`, `34`, `35`, `36/VP`) along the bottom-left edge of the `ESP-32D`. On ESP32 chips, ADC2 pins fail to read while Wi-Fi is active; ADC1 pins operate smoothly alongside Wi-Fi HTTPS streaming.

```text
          TOP ROW (Spare GND pins available here)
   [GND] 23  22  TX  RX  21 [GND] 19  18   5  17  16   4   0   2  15  D1  D0 CLK
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ ┌──────────┐                                                          ┌────┐ │
  │ │  ESP-32D │                                                          │USB │◄── 🔋 Power Bank
  │ │ (Wi-Fi)  │                                                          └────┘ │
  │ └──────────┘                                                                 │
  └──────────────────────────────────────────────────────────────────────────────┘
   [3V3] EN [VP] VN [34] [35] [32] [33] [25]  26  27  14  12 [GND] 13  D2  D3 CMD 5V
     │       │       │    │    │    │    │                     │
     │       │       │    │    │    │    └─► 🔊 Passive Buzzer+└─► 🔵 Blue Rail (All GNDs)
     │       │       │    │    │    └──────► 🔥 Flame Sensor OUT
     │       │       │    │    └───────────► 🌊 Red Water Strip S
     │       │       │    └────────────────► 🌧️ Rain Board AO
     │       │       └─────────────────────► 🌱 Soil Board #1 AO
     │       └─────────────────────────────► 🌱 Soil Board #2 AO (optional)
     └─────────────────────────────────────► 🔴 Red Rail (All Sensor VCC / + pins)
```

---

## 3. Pin-by-Pin Wiring Reference Table

| Sensor Module | Sub-Assembly | Module Pin | `ESP-32D` Target Pin | Software Constant |
| :--- | :--- | :--- | :--- | :--- |
| **Power Rails** | USB Power Bank $\rightarrow$ `ESP-32D` Micro-USB | `3V3` / `GND` | Breadboard `+` / `-` Rails | — |
| **1. Soil Moisture #1** | 2-prong fork $\rightarrow$ top 2 pins of blue `LM393` board | `VCC` / `GND` / **`AO`** | `3V3` / `GND` / **`GPIO 34`** | `PIN_SOIL_1 = 34` |
| **2. Soil Moisture #2** | 2nd fork $\rightarrow$ top 2 pins of 2nd blue `LM393` board | `VCC` / `GND` / **`AO`** | `3V3` / `GND` / **`VP` (`GPIO 36`)** | `PIN_SOIL_2 = 36` |
| **3. FC-37 Rain Plate** | Square rain grid $\rightarrow$ top 2 pins of blue `LM393` board | `VCC` / `GND` / **`AO`** | `3V3` / `GND` / **`GPIO 35`** | `PIN_RAIN = 35` |
| **4. Red Water Strip** | Single red PCB (keep top pins dry) | `+` / `-` / **`S`** | `3V3` / `GND` / **`GPIO 32`** | `PIN_WATER = 32` |
| **5. IR Flame Sensor** | Verify printed labels (`VCC`, `GND`, `OUT`), ignore wire colors | `VCC` / `GND` / **`OUT`** | `3V3` / `GND` / **`GPIO 33`** | `PIN_FIRE = 33` |
| **6. Passive Buzzer** | 2-Pin Passive Buzzer (`1800Hz/1200Hz` PWM tone) | Long **`(+)`** / Short **`(-)`** | **`GPIO 25`** / `GND` | `PIN_BUZZER = 25` |

> **Never connect sensors to `D0`, `D1`, `D2`, `D3`, `CMD`, `CLK`, or `GPIO 12`** — those are internal SPI flash & boot strapping pins.

---

## 4. Sensor Calibration & Thresholds

| Sensor | Dry / Safe Raw Value | Triggered / Wet Raw Value | Firmware Calibration Constants |
| :--- | :--- | :--- | :--- |
| **Soil Moisture (`G34` / `VP`)** | `~3800 – 4095` (`0%`) | `~1100 – 1800` (`70–100%`) | `DRY_SOIL_ADC = 3800`, `WET_SOIL_ADC = 1100` |
| **Rain Plate (`G35`)** | `~3800 – 4095` (`0%`) | `< 3400` (`10–100%` intensity) | `RAIN_THRESHOLD = 3400`, `WET_RAIN_ADC = 1100` |
| **Red Water Strip (`G32`)** | `0 – 80` (`0%`) | `> 100` up to `2000+` (`100%`) | `map(rawWater, 80, 2000, 0, 100)` |
| **IR Flame (`G33`)** | `1` (`HIGH` — Green PWR LED on, DO LED off) | `0` (`LOW` — DO LED turns ON when flame is near) | `digitalRead(PIN_FIRE) == LOW` |

### Calibrating the IR Flame Sensor Blue Screw
1. Power the board under normal indoor/stage lighting.
2. Check that the **Green Power LED** is lit.
3. If the second trigger LED stays ON without any flame, turn the small blue cross-screw slowly **counter-clockwise** until the trigger LED just turns OFF (`firePin = 1`).
4. Bring a lighter flame 10–25 cm in front of the black IR photodiode: the trigger LED lights up, `GPIO 33` drops to `0`, and the **Passive Buzzer (`GPIO 25`)** pulses immediately with a `1800Hz/1200Hz` PWM siren (`200ms ON / 120ms OFF`).

---

## 5. Configuring Wireless Mode (`hardware/include/secrets.h`)

Edit `hardware/include/secrets.h` (gitignored so credentials never leak) before flashing for wireless power-bank operation:

```cpp
#define WIFI_SSID_1     "Your_Phone_Hotspot_Name"
#define WIFI_PASS_1     "Your_Hotspot_Password"
#define WIFI_SSID_2     ""
#define WIFI_PASS_2     ""
#define TELEMETRY_URL   "https://nino-three.vercel.app/api/telemetry"
#define BUZZER_IS_PASSIVE true    // Passive Buzzer (Beep #2: 1800Hz/1200Hz PWM)
```

Flash via PlatformIO (`python -m platformio run -d hardware --target upload`) or run `python hardware/test_sensors.py` over `COM3` to verify every pin and trigger the `'P'` Passive Buzzer test.
