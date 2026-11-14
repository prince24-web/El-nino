/*
 * ============================================================================
 * 🌿 El-Nino — ESP32 Cyber-Physical Farmland IoT Node
 * ============================================================================
 * Hardware:
 *   - ESP32 Development Board (NodeMCU-32S / ESP32-WROOM)
 *   - Analog Soil Moisture Sensor -> GPIO 34 (ADC1_CH6)
 *   - FC-37 Rain Drop Sensor -> GPIO 35 (ADC1_CH7)
 *   - IR Obstacle Avoidance Sensor (used as Flame/Fire Detector) -> GPIO 33
 *
 * Wiring Table:
 *   -------------------------------------------------------------------------
 *   Sensor                     Pin on Sensor       ESP32 Pin
 *   -------------------------------------------------------------------------
 *   Soil Moisture Sensor       VCC                 3.3V (or VIN)
 *                              GND                 GND
 *                              AOUT                GPIO 34
 *
 *   Rain Drop Sensor (FC-37)   VCC                 3.3V (or VIN)
 *                              GND                 GND
 *                              AOUT                GPIO 35
 *
 *   IR Obstacle (Fire Detector)VCC                 3.3V
 *                              GND                 GND
 *                              OUT                 GPIO 33 (Active LOW)
 *   -------------------------------------------------------------------------
 *
 * Calibration Note for Fire Detection:
 *   - The IR obstacle sensor uses a black photodiode sensitive to 760nm-1100nm
 *     Infrared light emitted strongly by open flames (lighters, matches, fires).
 *   - Turn the small on-board potentiometer screw until the onboard LED turns OFF
 *     under normal room lighting.
 *   - When an open flame/lighter is brought within 10-30cm, the sensor triggers
 *     and pulls GPIO 33 LOW.
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi Credentials (use your mobile phone personal hotspot)
const char* ssid = "YOUR_HOTSPOT_NAME";
const char* password = "YOUR_HOTSPOT_PASSWORD";

// Next.js App Telemetry Endpoint (e.g. your Vercel deployment or local IP)
// Replace with your live Vercel domain or local IP (e.g. http://192.168.43.100:3000/api/telemetry)
const char* serverUrl = "https://your-el-nino.vercel.app/api/telemetry";

// Pin Assignments (ADC1 pins that work simultaneously with Wi-Fi)
const int PIN_SOIL = 34; // Analog Soil Moisture
const int PIN_RAIN = 35; // Analog Raindrop plate
const int PIN_FIRE = 33; // Digital IR Obstacle / Flame Sensor (Active LOW)

// Calibration Constants (Adjust based on sensor dry/wet readings)
const int DRY_SOIL_ADC  = 3500; // Value in air/bone dry soil
const int WET_SOIL_ADC  = 1200; // Value submerged in water
const int RAIN_THRESHOLD = 2600; // ADC below this = active rain droplets

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n🌿 Booting El-Nino Agricultural IoT Node...");

  // Configure digital pin for IR Obstacle / Fire detector
  pinMode(PIN_FIRE, INPUT_PULLUP);

  // Connect to Wi-Fi
  Serial.printf("Connecting to Wi-Fi network: %s ", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ Wi-Fi Connected Successfully!");
    Serial.print("Node IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠ Wi-Fi connection timed out. Retrying in main loop...");
  }
}

void loop() {
  // Reconnect Wi-Fi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconnecting to Wi-Fi...");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  // 1. Read Soil Moisture (Analog ADC 0 - 4095)
  int rawSoil = analogRead(PIN_SOIL);
  // Map ADC reading to percentage (0% = dry, 100% = flooded)
  int soilPercent = map(rawSoil, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  // 2. Read Rain Drop Plate (Analog ADC 0 - 4095)
  int rawRain = analogRead(PIN_RAIN);
  bool isRaining = (rawRain < RAIN_THRESHOLD);

  // 3. Read Fire / Flame Sensor (Active LOW on IR Obstacle Module)
  int firePinState = digitalRead(PIN_FIRE);
  bool isFire = (firePinState == LOW);

  // Serial Diagnostic Output
  Serial.println("----------------------------------------------");
  Serial.printf("🌱 Soil Moisture: %d%% (ADC: %d)\n", soilPercent, rawSoil);
  Serial.printf("🌧 Rain Status:   %s (ADC: %d)\n", isRaining ? "RAINING!" : "Dry", rawRain);
  Serial.printf("🔥 Fire Status:   %s (Pin: %d)\n", isFire ? "🔥 FLAME DETECTED!" : "Clear", firePinState);

  // 4. Send HTTP POST to El-Nino Cloud Server
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload
  String payload = "{";
  payload += "\"soilMoisture\":" + String(soilPercent) + ",";
  payload += "\"isRaining\":" + String(isRaining ? "true" : "false") + ",";
  payload += "\"isFire\":" + String(isFire ? "true" : "false") + ",";
  payload += "\"rawSoil\":" + String(rawSoil) + ",";
  payload += "\"rawRain\":" + String(rawRain);
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("✓ Cloud Synced! HTTP Status: %d\n", httpCode);
  } else {
    Serial.printf("✗ Sync Failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();

  // Transmit telemetry every 2 seconds
  delay(2000);
}
