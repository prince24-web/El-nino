import { NextRequest, NextResponse } from "next/server";

// In-memory telemetry cache (shared during runtime)
let latestTelemetry = {
  soilMoisture: 55, // 0 - 100%
  isRaining: false,
  isFire: false,
  rawSoil: 2200,
  rawRain: 3200,
  lastUpdated: new Date().toISOString(),
  device: "ESP32-AgroNode-01",
};

export async function GET() {
  return NextResponse.json(latestTelemetry, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    latestTelemetry = {
      soilMoisture: typeof data.soilMoisture === "number" ? Math.min(100, Math.max(0, data.soilMoisture)) : latestTelemetry.soilMoisture,
      isRaining: typeof data.isRaining === "boolean" ? data.isRaining : latestTelemetry.isRaining,
      isFire: typeof data.isFire === "boolean" ? data.isFire : latestTelemetry.isFire,
      rawSoil: data.rawSoil ?? latestTelemetry.rawSoil,
      rawRain: data.rawRain ?? latestTelemetry.rawRain,
      lastUpdated: new Date().toISOString(),
      device: data.device || "ESP32-AgroNode-01",
    };

    return NextResponse.json({ success: true, telemetry: latestTelemetry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
