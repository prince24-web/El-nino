import { Type, type FunctionDeclaration } from "@google/genai";
import { getLiveTelemetry, getRecentAlerts } from "@/lib/telemetry-store";
import { findCropContext, findPestOrTreatment } from "@/lib/agronomy-data";

export const GEMINI_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "get_live_farm_sensors",
    description:
      "Reads real-time live readings from the physical ESP-32D farm IoT sensors: soil moisture percentage, flood water depth percentage, rain intensity and precipitation status, wildfire IR flame status, buzzer status, raw ADC readings, and online health status. Always call this when the user asks about current farm conditions, soil moisture, water level, flooding, rain, or fire safety.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_farm_alert_history",
    description:
      "Retrieves recent historical hazard alerts logged by the farm IoT system (WILDFIRE, FLOOD, RAIN, DROUGHT) with timestamps and sensor snapshots. Useful when the user asks whether it rained, flooded, or triggered an alarm earlier.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: "Maximum number of recent alert records to retrieve (1-20, default 5).",
        },
      },
    },
  },
  {
    name: "lookup_nigerian_agronomy",
    description:
      "Queries the grounded Nigerian agricultural database for specific crop profiles (local Yoruba/Hausa/Igbo names, planting windows, NPK/Urea fertilizer schedules), pest/disease knapsack treatments in Naira (₦), and regional market prices across Mile 12, Bodija, Dawanau, and Onitsha.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Crop name, local name, pest/disease name, or symptom keyword (e.g. 'maize', 'cassava', 'late blight', 'armyworm').",
        },
      },
      required: ["query"],
    },
  },
];

export interface ExecutedToolResult {
  response: Record<string, unknown>;
  badgeSummary: string;
}

export async function executeGeminiTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<ExecutedToolResult> {
  if (name === "get_live_farm_sensors") {
    const t = await getLiveTelemetry();

    let farmHealthStatus = "OPTIMAL";
    if (t.source === "awaiting" || t.soilMoisture === null) {
      farmHealthStatus = "AWAITING_HARDWARE";
    } else if (t.isFire) {
      farmHealthStatus = "WILDFIRE_EMERGENCY";
    } else if (t.soilMoisture >= 80 || t.waterLevel >= 70) {
      farmHealthStatus = "FLOOD_HAZARD";
    } else if (t.isRaining) {
      farmHealthStatus = "RAINFALL_ACTIVE";
    } else if (t.soilMoisture < 25) {
      farmHealthStatus = "DROUGHT_STRESS";
    }

    const badgeSummary =
      farmHealthStatus === "AWAITING_HARDWARE"
        ? "Awaiting first ESP-32D sensor packet"
        : `Soil ${t.soilMoisture}% • Water ${t.waterLevel}% • Rain: ${
            t.isRaining ? `Yes (${t.rainIntensity}%)` : "No"
          } • Fire: ${t.isFire ? "FIRE ALERT" : "Safe"} • ${
            t.isOnline ? "Live" : "Last Known"
          }`;

    return {
      response: {
        isOnline: t.isOnline,
        source: t.source,
        device: t.device,
        lastUpdated: t.lastUpdated,
        packetsReceived: t.packetsReceived,
        soilMoisturePercent: t.soilMoisture,
        soilProbePercent: t.soilProbePct,
        waterLevelPercent: t.waterLevel,
        rainIntensityPercent: t.rainIntensity,
        isRaining: t.isRaining,
        isFire: t.isFire,
        buzzerActive: t.buzzerActive,
        rawAdc: {
          soil: t.rawSoil,
          rain: t.rawRain,
          water: t.rawWater,
          firePin: t.firePin,
        },
        farmHealthStatus,
      },
      badgeSummary,
    };
  }

  if (name === "get_farm_alert_history") {
    const rawLimit = typeof args.limit === "number" ? args.limit : 5;
    const alerts = await getRecentAlerts(rawLimit);
    return {
      response: {
        count: alerts.length,
        alerts,
      },
      badgeSummary: `${alerts.length} recent farm alert(s) retrieved`,
    };
  }

  if (name === "lookup_nigerian_agronomy") {
    const query = typeof args.query === "string" ? args.query : "";
    const cropInfo = findCropContext(query);
    const pestInfo = findPestOrTreatment(query);
    const combined = [cropInfo, pestInfo].filter(Boolean).join("\n\n");

    return {
      response: {
        found: Boolean(combined),
        query,
        data:
          combined ||
          "No exact match in local Nigerian crop/pest DB; use grounded West African agronomy knowledge and state assumptions clearly.",
      },
      badgeSummary: `Nigerian Agronomy DB: "${query}"`,
    };
  }

  return {
    response: { error: `Unknown tool: ${name}` },
    badgeSummary: `Unknown tool: ${name}`,
  };
}
