import { NextRequest, NextResponse } from "next/server";

export interface TelemetryState {
  soilMoisture: number | null;
  rainIntensity: number;
  waterLevel: number;
  isRaining: boolean;
  isFire: boolean;
  rawSoil: number | null;
  rawRain: number | null;
  rawWater: number | null;
  firePin?: number | null;
  lastUpdated: string | null;
  device: string | null;
  packetsReceived: number;
  source: "awaiting" | "esp32" | "simulation";
}

let latestTelemetry: TelemetryState = {
  soilMoisture: null,
  rainIntensity: 0,
  waterLevel: 0,
  isRaining: false,
  isFire: false,
  rawSoil: null,
  rawRain: null,
  rawWater: null,
  lastUpdated: null,
  device: null,
  packetsReceived: 0,
  source: "awaiting",
};

export async function GET() {
  const now = Date.now();
  const lastTime = latestTelemetry.lastUpdated
    ? new Date(latestTelemetry.lastUpdated).getTime()
    : 0;
  const isOnline =
    latestTelemetry.lastUpdated !== null && now - lastTime < 15000;

  return NextResponse.json(
    {
      ...latestTelemetry,
      isOnline,
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (data.reset === true) {
      latestTelemetry = {
        soilMoisture: null,
        rainIntensity: 0,
        waterLevel: 0,
        isRaining: false,
        isFire: false,
        rawSoil: null,
        rawRain: null,
        rawWater: null,
        lastUpdated: null,
        device: null,
        packetsReceived: 0,
        source: "awaiting",
      };
      return NextResponse.json({ success: true, telemetry: latestTelemetry });
    }

    const currentMoisture =
      typeof data.soilMoisture === "number"
        ? Math.min(100, Math.max(0, Math.round(data.soilMoisture)))
        : latestTelemetry.soilMoisture ?? 50;

    latestTelemetry = {
      soilMoisture: currentMoisture,
      rainIntensity:
        typeof data.rainIntensity === "number"
          ? Math.min(100, Math.max(0, Math.round(data.rainIntensity)))
          : data.isRaining
          ? 70
          : 0,
      waterLevel:
        typeof data.waterLevel === "number"
          ? Math.min(100, Math.max(0, Math.round(data.waterLevel)))
          : latestTelemetry.waterLevel,
      isRaining:
        typeof data.isRaining === "boolean"
          ? data.isRaining
          : latestTelemetry.isRaining,
      isFire:
        typeof data.isFire === "boolean"
          ? data.isFire
          : latestTelemetry.isFire,
      rawSoil: data.rawSoil ?? latestTelemetry.rawSoil,
      rawRain: data.rawRain ?? latestTelemetry.rawRain,
      rawWater: data.rawWater ?? latestTelemetry.rawWater,
      firePin: data.firePin ?? latestTelemetry.firePin,
      lastUpdated: new Date().toISOString(),
      device: data.device || "ESP32-AgroNode-01",
      packetsReceived: latestTelemetry.packetsReceived + 1,
      source: data.source === "simulation" ? "simulation" : "esp32",
    };

    return NextResponse.json(
      { success: true, telemetry: latestTelemetry },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
