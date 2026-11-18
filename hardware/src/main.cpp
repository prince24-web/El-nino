#include <Arduino.h>

const int PIN_SOIL_1 = 34;  // Soil Moisture #1 (AO)
const int PIN_SOIL_2 = 36;  // Soil Moisture #2 (VP / GPIO 36)
const int PIN_RAIN   = 35;  // FC-37 Raindrop Plate (AO)
const int PIN_WATER  = 32;  // Red Water Level Sensor (S)
const int PIN_FIRE   = 33;  // IR Flame Sensor (OUT - Active LOW: 0 = Fire, 1 = Clear)

const int DRY_SOIL_ADC   = 3800;
const int WET_SOIL_ADC   = 1100;
const int DRY_RAIN_ADC   = 3800;
const int WET_RAIN_ADC   = 1100;
const int RAIN_THRESHOLD = 3400;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  pinMode(PIN_FIRE, INPUT_PULLUP);
  delay(300);
  Serial.println();
  Serial.println("=== EL-NINO ESP-32D SENSOR NODE READY ===");
}

void loop() {
  int rawSoil1 = analogRead(PIN_SOIL_1);
  int rawSoil2 = analogRead(PIN_SOIL_2);
  int rawRain  = analogRead(PIN_RAIN);
  int rawWater = analogRead(PIN_WATER);

  pinMode(PIN_FIRE, INPUT_PULLUP);
  delayMicroseconds(50);
  int firePin  = digitalRead(PIN_FIRE);

  // 1. Soil Moisture % (G34 & VP/36)
  int soilPct1 = map(rawSoil1, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100);
  soilPct1 = constrain(soilPct1, 0, 100);

  int soilPct2 = map(rawSoil2, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100);
  soilPct2 = constrain(soilPct2, 0, 100);

  int activeSoilPct = (soilPct1 >= soilPct2) ? soilPct1 : soilPct2;
  int activeRawSoil = (soilPct1 >= soilPct2) ? rawSoil1 : rawSoil2;

  // 2. Rain Sensor Intensity % (G35: 4095 = 0% dry, 1100 = 100% heavy downpour)
  bool isRaining = (rawRain < RAIN_THRESHOLD && rawRain > 20);
  int rainIntensity = 0;
  if (isRaining) {
    rainIntensity = map(rawRain, DRY_RAIN_ADC, WET_RAIN_ADC, 0, 100);
    rainIntensity = constrain(rainIntensity, 10, 100);
  }

  // 3. Red Water Level Sensor % (G32: 0 = dry, >1800 = submerged)
  int waterPct = map(rawWater, 80, 2000, 0, 100);
  waterPct = constrain(waterPct, 0, 100);

  // 4. Effective Farmland Moisture
  int effectiveMoisture = activeSoilPct;
  if (waterPct > effectiveMoisture) effectiveMoisture = waterPct;
  if (rainIntensity > effectiveMoisture) effectiveMoisture = rainIntensity;

  // 5. Fire sensor (G33): Active LOW -> 0 = Fire Detected, 1 = Clear/Safe
  bool isFire = (firePin == LOW);

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
  Serial.print(",\"rawSoil\":");
  Serial.print(activeRawSoil);
  Serial.print(",\"rawRain\":");
  Serial.print(rawRain);
  Serial.print(",\"rawWater\":");
  Serial.print(rawWater);
  Serial.print(",\"firePin\":");
  Serial.print(firePin);
  Serial.println(",\"device\":\"ESP-32D (COM3 Live)\"}");

  delay(400);
}
