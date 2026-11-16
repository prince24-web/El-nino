import { NextRequest, NextResponse } from "next/server";

export interface TelemetryState {
  soilMoisture: number | null; // 0 - 100%, null when awaiting first hardware reading
  isRaining: boolean;
  isFire: boolean;
  rawSoil: number | null;
  rawRain: number | null;
  lastUpdated: string | null;
  device: string | null;
  packetsReceived: number;
  source: "awaiting" | "esp32" | "simulation";
}

// In-memory telemetry state awaiting real ESP32 hardware feed
let latestTelemetry: TelemetryState = {
  soilMoisture: null,
  isRaining: false,
  isFire: false,
  rawSoil: null,
  rawRain: null,
  lastUpdated: null,
  device: null,
  packetsReceived: 0,
  source: "awaiting",
};

export async function GET() {
  // Check if hardware signal is still fresh (received within last 15 seconds)
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

    // Support reset back to "awaiting hardware" mode
    if (data.reset === true) {
      latestTelemetry = {
        soilMoisture: null,
        isRaining: false,
        isFire: false,
        rawSoil: null,
        rawRain: null,
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
