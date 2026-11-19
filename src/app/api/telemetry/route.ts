import { NextRequest, NextResponse } from "next/server";
import {
  getLiveTelemetry,
  getRecentAlerts,
  resetTelemetry,
  saveTelemetry,
} from "@/lib/telemetry-store";

export async function GET(req: NextRequest) {
  const includeHistory =
    req.nextUrl.searchParams.get("includeHistory") === "true";

  const telemetry = await getLiveTelemetry();
  const payload = includeHistory
    ? { ...telemetry, alerts: await getRecentAlerts(10) }
    : telemetry;

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (data.reset === true) {
      const telemetry = await resetTelemetry();
      return NextResponse.json(
        { success: true, telemetry },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const telemetry = await saveTelemetry(data);

    return NextResponse.json(
      { success: true, telemetry },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
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
