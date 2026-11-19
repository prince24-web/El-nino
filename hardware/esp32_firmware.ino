/*
 * ============================================================================
 * 🌿 El-Nino — Wireless ESP-32D Cyber-Physical Farmland IoT Node (Arduino IDE)
 * ============================================================================
 * Hardware Pinout (38-Pin ESP-32D Bottom Row — ADC1 Safe for Wi-Fi):
 *   - Soil Moisture #1 (AO)      -> GPIO 34 (ADC1_CH6)
 *   - Soil Moisture #2 (AO)      -> GPIO 36 (VP / ADC1_CH0, optional)
 *   - Raindrop Plate FC-37 (AO)  -> GPIO 35 (ADC1_CH7)
 *   - Red Water Depth Strip (S)  -> GPIO 32 (ADC1_CH4)
 *   - IR Flame Sensor (OUT)      -> GPIO 33 (Digital Input, Active LOW)
 *   - Fire Alarm Buzzer (+)      -> GPIO 25 (Digital / Tone Output)
 *   - Power & Ground             -> 3V3 (Red Rail) & GND (Blue Rail)
 *
 * Wiring Checklist:
 *   1. Soil Moisture Probe -> Blue LM393 Board -> VCC:3V3, GND:GND, AO:GPIO 34
 *   2. Raindrop Plate      -> Blue LM393 Board -> VCC:3V3, GND:GND, AO:GPIO 35
 *   3. Red Water Strip     -> +:3V3, -:GND, S:GPIO 32
 *   4. IR Flame Sensor     -> VCC:3V3, GND:GND, OUT:GPIO 33
 *   5. 2-Pin Active Buzzer -> Long Leg(+):GPIO 25, Short Leg(-):GND
 * ============================================================================
 */

#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#if __has_include("secrets.h")
  #include "secrets.h"
#elif __has_include("include/secrets.h")
  #include "include/secrets.h"
#else
  #define WIFI_SSID_1     "YOUR_HOTSPOT_NAME"
  #define WIFI_PASS_1     "YOUR_HOTSPOT_PASSWORD"
  #define WIFI_SSID_2     ""
  #define WIFI_PASS_2     ""
  #define TELEMETRY_URL   "https://nino-three.vercel.app/api/telemetry"
  #define BUZZER_IS_PASSIVE false
#endif

// Pin Assignments
const int PIN_SOIL_1 = 34;  // Soil Moisture #1 (AO)
const int PIN_SOIL_2 = 36;  // Soil Moisture #2 (VP / GPIO 36)
const int PIN_RAIN   = 35;  // FC-37 Raindrop Plate (AO)
const int PIN_WATER  = 32;  // Red Water Level Sensor (S)
const int PIN_FIRE   = 33;  // IR Flame Sensor (OUT - Active LOW: 0 = Fire, 1 = Clear)
const int PIN_BUZZER = 25;  // Fire Alarm Buzzer (+)

// Calibration Constants
const int DRY_SOIL_ADC   = 3800;
const int WET_SOIL_ADC   = 1100;
const int DRY_RAIN_ADC   = 3800;
const int WET_RAIN_ADC   = 1100;
const int RAIN_THRESHOLD = 3400;

const unsigned long SENSOR_INTERVAL_MS = 500;
const unsigned long HEARTBEAT_POST_MS  = 1500;
const unsigned long EVENT_DEBOUNCE_MS  = 300;
const unsigned long BUZZER_ON_MS       = 200;
const unsigned long BUZZER_OFF_MS      = 120;

WiFiMulti wifiMulti;
bool hasWifiConfigured = false;

unsigned long lastSensorReadMs   = 0;
unsigned long lastHttpPostMs     = 0;
unsigned long lastStateChangeMs  = 0;
unsigned long lastBuzzerToggleMs = 0;

bool buzzerState   = false;
bool passiveHighTone = true;
bool prevIsFire    = false;
bool prevIsRaining = false;

int effectiveMoisture = 0;
int activeSoilPct     = 0;
int rainIntensity     = 0;
int waterPct          = 0;
bool isRaining        = false;
bool isFire           = false;
int activeRawSoil     = 4095;
int rawSoil1          = 4095;
int rawSoil2          = 4095;
int rawRain           = 4095;
int rawWater          = 0;
int firePin           = HIGH;

void initBuzzerDriver() {
  if (BUZZER_IS_PASSIVE) {
    ledcSetup(0, 1800, 8);
    ledcAttachPin(PIN_BUZZER, 0);
    ledcWriteTone(0, 0);
  } else {
    ledcDetachPin(PIN_BUZZER);
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW);
  }
  buzzerState = false;
}

void buzzerOn() {
  if (BUZZER_IS_PASSIVE) {
    ledcWriteTone(0, passiveHighTone ? 1800 : 1300);
    passiveHighTone = !passiveHighTone;
  } else {
    digitalWrite(PIN_BUZZER, HIGH);
  }
  buzzerState = true;
}

void buzzerOff() {
  if (BUZZER_IS_PASSIVE) {
    ledcWriteTone(0, 0);
  } else {
    digitalWrite(PIN_BUZZER, LOW);
  }
  buzzerState = false;
}

void runBootBuzzerTest() {
  buzzerOn();
  delay(220);
  buzzerOff();
  Serial.println("[BUZZER] Boot self-test executed on GPIO 25");
}

void runTestActiveBeep() {
  ledcDetachPin(PIN_BUZZER);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(500);
  digitalWrite(PIN_BUZZER, LOW);
  initBuzzerDriver();
  Serial.println("[BUZZER] TEST_A (Pure Active DC 500ms) done");
}

void runTestPassiveBeep() {
  ledcSetup(0, 1600, 8);
  ledcAttachPin(PIN_BUZZER, 0);
  ledcWriteTone(0, 1800);
  delay(250);
  ledcWriteTone(0, 1200);
  delay(250);
  ledcWriteTone(0, 0);
  ledcDetachPin(PIN_BUZZER);
  initBuzzerDriver();
  Serial.println("[BUZZER] TEST_P (Passive 1800Hz/1200Hz Fire Tone 500ms) done");
}

void runManualTestBeep() {
  buzzerOn();
  delay(350);
  buzzerOff();
  Serial.println("[BUZZER] Manual 350ms test beep triggered on GPIO 25");
}

void readAllSensors() {
  rawSoil1 = analogRead(PIN_SOIL_1);
  rawSoil2 = analogRead(PIN_SOIL_2);
  rawRain  = analogRead(PIN_RAIN);
  rawWater = analogRead(PIN_WATER);
  firePin  = digitalRead(PIN_FIRE);

  int soilPct1 = constrain(map(rawSoil1, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100), 0, 100);
  int soilPct2 = constrain(map(rawSoil2, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100), 0, 100);

  activeSoilPct = (soilPct1 >= soilPct2) ? soilPct1 : soilPct2;
  activeRawSoil = (soilPct1 >= soilPct2) ? rawSoil1 : rawSoil2;

  isRaining = (rawRain < RAIN_THRESHOLD && rawRain > 20);
  rainIntensity = isRaining ? constrain(map(rawRain, DRY_RAIN_ADC, WET_RAIN_ADC, 0, 100), 10, 100) : 0;

  waterPct = constrain(map(rawWater, 80, 2000, 0, 100), 0, 100);

  effectiveMoisture = max(activeSoilPct, max(waterPct, rainIntensity));
  isFire = (firePin == LOW);
}

void updateFireBuzzer() {
  unsigned long now = millis();
  if (isFire) {
    unsigned long elapsed = now - lastBuzzerToggleMs;
    if (buzzerState && elapsed >= BUZZER_ON_MS) {
      buzzerOff();
      lastBuzzerToggleMs = now;
    } else if (!buzzerState && elapsed >= BUZZER_OFF_MS) {
      buzzerOn();
      lastBuzzerToggleMs = now;
    }
  } else if (buzzerState) {
    buzzerOff();
  }
}

void emitSerialDiagnostics(bool wifiConnected) {
  Serial.print("[SENSORS] Soil1(G34):");
  Serial.print(rawSoil1);
  Serial.print(" (");
  Serial.print(activeSoilPct);
  Serial.print("%) | Soil2(VP):");
  Serial.print(rawSoil2);
  Serial.print(" | Rain(G35):");
  Serial.print(rawRain);
  Serial.print(" (");
  Serial.print(isRaining ? "RAIN" : "DRY");
  Serial.print(" ");
  Serial.print(rainIntensity);
  Serial.print("%) | Water(G32):");
  Serial.print(rawWater);
  Serial.print(" (");
  Serial.print(waterPct);
  Serial.print("%) | Fire(G33):");
  Serial.print(firePin);
  Serial.print(" (");
  Serial.print(isFire ? "FIRE!" : "SAFE");
  Serial.print(") | Buzzer(G25):");
  Serial.println(isFire ? "ALARM" : "IDLE");

  Serial.print("TELEMETRY_JSON:{\"soilMoisture\":");
  Serial.print(effectiveMoisture);
  Serial.print(",\"soilProbePct\":");
  Serial.print(activeSoilPct);
  Serial.print(",\"rainIntensity\":");
  Serial.print(rainIntensity);
  Serial.print(",\"waterLevel\":");
  Serial.print(waterPct);
  Serial.print(",\"isRaining\":");
  Serial.print(isRaining ? "true" : "false");
  Serial.print(",\"isFire\":");
  Serial.print(isFire ? "true" : "false");
  Serial.print(",\"buzzerActive\":");
  Serial.print(isFire ? "true" : "false");
  Serial.print(",\"rawSoil\":");
  Serial.print(activeRawSoil);
  Serial.print(",\"rawSoil1\":");
  Serial.print(rawSoil1);
  Serial.print(",\"rawSoil2\":");
  Serial.print(rawSoil2);
  Serial.print(",\"rawRain\":");
  Serial.print(rawRain);
  Serial.print(",\"rawWater\":");
  Serial.print(rawWater);
  Serial.print(",\"firePin\":");
  Serial.print(firePin);
  Serial.print(",\"wifiConnected\":");
  Serial.print(wifiConnected ? "true" : "false");
  Serial.println(",\"device\":\"ESP-32D-Wireless\"}");
}

void postTelemetryToCloud() {
  if (!hasWifiConfigured) return;
  if (wifiMulti.run() != WL_CONNECTED) return;

  String payload = "{\"soilMoisture\":" + String(effectiveMoisture)
                 + ",\"soilProbePct\":" + String(activeSoilPct)
                 + ",\"rainIntensity\":" + String(rainIntensity)
                 + ",\"waterLevel\":" + String(waterPct)
                 + ",\"isRaining\":" + String(isRaining ? "true" : "false")
                 + ",\"isFire\":" + String(isFire ? "true" : "false")
                 + ",\"buzzerActive\":" + String(isFire ? "true" : "false")
                 + ",\"rawSoil\":" + String(activeRawSoil)
                 + ",\"rawRain\":" + String(rawRain)
                 + ",\"rawWater\":" + String(rawWater)
                 + ",\"firePin\":" + String(firePin)
                 + ",\"device\":\"ESP-32D-WiFi\"}";

  HTTPClient http;
  http.setTimeout(2500);
  String url = String(TELEMETRY_URL);

  if (url.startsWith("https://")) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure();
    if (http.begin(secureClient, url)) {
      http.addHeader("Content-Type", "application/json");
      int code = http.POST(payload);
      Serial.print("[CLOUD] HTTPS POST -> ");
      Serial.println(code);
      http.end();
    }
  } else {
    WiFiClient client;
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/json");
      int code = http.POST(payload);
      Serial.print("[CLOUD] HTTP POST -> ");
      Serial.println(code);
      http.end();
    }
  }
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  pinMode(PIN_FIRE, INPUT_PULLUP);
  initBuzzerDriver();

  delay(500);
  Serial.println("\n=======================================================");
  Serial.println("   EL-NINO — ESP-32D Wireless Farm Guardian (Phase 1)");
  Serial.println("=======================================================");

  runBootBuzzerTest();

  if (digitalRead(PIN_FIRE) == LOW) {
    Serial.println("[WARN] GPIO 33 is LOW at boot — if no flame is present, check Flame Sensor power/GND polarity or turn blue potentiometer screw counter-clockwise until signal LED turns OFF.");
  }

  String ssid1 = String(WIFI_SSID_1);
  if (ssid1 != "YOUR_HOTSPOT_NAME" && ssid1.length() > 0) {
    hasWifiConfigured = true;
    WiFi.mode(WIFI_STA);
    wifiMulti.addAP(WIFI_SSID_1, WIFI_PASS_1);
    if (strlen(WIFI_SSID_2) > 0) wifiMulti.addAP(WIFI_SSID_2, WIFI_PASS_2);
    Serial.print("[WIFI] Connecting to: ");
    Serial.println(WIFI_SSID_1);
    unsigned long startAttempt = millis();
    while (wifiMulti.run() != WL_CONNECTED && millis() - startAttempt < 6000) {
      delay(250);
      Serial.print(".");
    }
    Serial.println();
  } else {
    hasWifiConfigured = false;
    Serial.println("[WIFI] Placeholder SSID detected — running in USB Serial sensor test mode (update secrets.h for wireless Vercel sync).");
  }

  readAllSensors();
  prevIsFire = isFire;
  prevIsRaining = isRaining;
}

void loop() {
  while (Serial.available() > 0) {
    char cmd = (char)Serial.read();
    if (cmd == 'A' || cmd == 'a') runTestActiveBeep();
    else if (cmd == 'P' || cmd == 'p') runTestPassiveBeep();
    else if (cmd == 'B' || cmd == 'b') runManualTestBeep();
  }

  unsigned long now = millis();
  if (now - lastSensorReadMs >= SENSOR_INTERVAL_MS) {
    lastSensorReadMs = now;
    readAllSensors();
    emitSerialDiagnostics(hasWifiConfigured && (WiFi.status() == WL_CONNECTED));

    bool stateChanged = (isFire != prevIsFire) || (isRaining != prevIsRaining);
    if (stateChanged && (now - lastStateChangeMs >= EVENT_DEBOUNCE_MS)) {
      lastStateChangeMs = now;
      prevIsFire = isFire;
      prevIsRaining = isRaining;
      if (hasWifiConfigured) {
        postTelemetryToCloud();
        lastHttpPostMs = now;
      }
    }
  }

  updateFireBuzzer();

  if (hasWifiConfigured && (now - lastHttpPostMs >= HEARTBEAT_POST_MS)) {
    lastHttpPostMs = now;
    postTelemetryToCloud();
  }
}
