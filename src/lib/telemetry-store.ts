export interface TelemetryState {
  soilMoisture: number | null; // 0 - 100%, null when awaiting first hardware reading
  soilProbePct: number;
  waterLevel: number;
  rainIntensity: number;
  isRaining: boolean;
  isFire: boolean;
  buzzerActive: boolean;
  rawSoil: number | null;
  rawRain: number | null;
  rawWater: number | null;
  firePin: number | null;
  lastUpdated: string | null;
  device: string | null;
  packetsReceived: number;
  source: "awaiting" | "esp32" | "simulation";
  isOnline: boolean;
}

export type AlertType = "WILDFIRE" | "FLOOD" | "RAIN" | "DROUGHT";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FarmAlertRecord {
  id?: number;
  device_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  sensor_snapshot: Record<string, unknown>;
  created_at: string;
}

const DEVICE_ID = "demo-farm-01";
const ALERT_COOLDOWN_MS = 20_000;

function createEmptyTelemetry(): TelemetryState {
  return {
    soilMoisture: null,
    soilProbePct: 0,
    waterLevel: 0,
    rainIntensity: 0,
    isRaining: false,
    isFire: false,
    buzzerActive: false,
    rawSoil: null,
    rawRain: null,
    rawWater: null,
    firePin: null,
    lastUpdated: null,
    device: null,
    packetsReceived: 0,
    source: "awaiting",
    isOnline: false,
  };
}

// In-memory fallback / local cache
let memoryTelemetry: TelemetryState = createEmptyTelemetry();
let memoryAlerts: FarmAlertRecord[] = [];
const lastAlertAt: Partial<Record<AlertType, number>> = {};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function buildSupabaseHeaders(
  key: string,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    ...extra,
  };
  // Only include Bearer auth for JWT keys; modern sb_publishable_ keys authenticate via apikey alone
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function computeIsOnline(source: string, lastUpdated: string | null): boolean {
  if (source === "awaiting" || !lastUpdated) return false;
  const age = Date.now() - new Date(lastUpdated).getTime();
  return age > -60_000 && age < 15_000;
}

function mapRowToTelemetry(row: any): TelemetryState {
  const source: TelemetryState["source"] =
    row.source === "esp32" || row.source === "simulation" ? row.source : "awaiting";
  const lastUpdated =
    source === "awaiting" ? null : row.updated_at ?? null;

  return {
    soilMoisture: typeof row.soil_moisture === "number" ? row.soil_moisture : null,
    soilProbePct: typeof row.soil_probe_pct === "number" ? row.soil_probe_pct : 0,
    waterLevel: typeof row.water_level === "number" ? row.water_level : 0,
    rainIntensity: typeof row.rain_intensity === "number" ? row.rain_intensity : 0,
    isRaining: Boolean(row.is_raining),
    isFire: Boolean(row.is_fire),
    buzzerActive: Boolean(row.buzzer_active),
    rawSoil: typeof row.raw_soil === "number" ? row.raw_soil : null,
    rawRain: typeof row.raw_rain === "number" ? row.raw_rain : null,
    rawWater: typeof row.raw_water === "number" ? row.raw_water : null,
    firePin: typeof row.fire_pin === "number" ? row.fire_pin : null,
    lastUpdated,
    device: row.device_name ?? null,
    packetsReceived: typeof row.packets_received === "number" ? row.packets_received : 0,
    source,
    isOnline: computeIsOnline(source, lastUpdated),
  };
}

export async function getLiveTelemetry(): Promise<TelemetryState> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return {
      ...memoryTelemetry,
      isOnline: computeIsOnline(memoryTelemetry.source, memoryTelemetry.lastUpdated),
    };
  }

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/farm_telemetry?device_id=eq.${DEVICE_ID}&select=*&limit=1`,
      {
        method: "GET",
        headers: buildSupabaseHeaders(cfg.key),
        cache: "no-store",
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const mapped = mapRowToTelemetry(rows[0]);
        memoryTelemetry = mapped;
        return mapped;
      }
      return createEmptyTelemetry();
    } else {
      console.error("Supabase GET farm_telemetry failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Supabase GET farm_telemetry error:", err);
  }

  return {
    ...memoryTelemetry,
    isOnline: computeIsOnline(memoryTelemetry.source, memoryTelemetry.lastUpdated),
  };
}

export async function getRecentAlerts(limit = 10): Promise<FarmAlertRecord[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.round(limit)));
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return memoryAlerts.slice(0, safeLimit);
  }

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/farm_alerts?device_id=eq.${DEVICE_ID}&select=*&order=created_at.desc&limit=${safeLimit}`,
      {
        method: "GET",
        headers: buildSupabaseHeaders(cfg.key),
        cache: "no-store",
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        memoryAlerts = rows;
        return rows;
      }
    } else {
      console.error("Supabase GET farm_alerts failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Supabase GET farm_alerts error:", err);
  }

  return memoryAlerts.slice(0, safeLimit);
}

async function recordAlert(alert: Omit<FarmAlertRecord, "id" | "created_at">) {
  const now = Date.now();
  const prevAt = lastAlertAt[alert.alert_type] ?? 0;
  if (now - prevAt < ALERT_COOLDOWN_MS) return;
  lastAlertAt[alert.alert_type] = now;

  const created_at = new Date().toISOString();
  const fullRecord: FarmAlertRecord = { ...alert, created_at };
  memoryAlerts = [fullRecord, ...memoryAlerts].slice(0, 50);

  const cfg = getSupabaseConfig();
  if (!cfg) return;

  try {
    const res = await fetch(`${cfg.url}/rest/v1/farm_alerts`, {
      method: "POST",
      headers: buildSupabaseHeaders(cfg.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        device_id: alert.device_id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        sensor_snapshot: alert.sensor_snapshot,
      }),
    });
    if (!res.ok) {
      console.error("Supabase POST farm_alerts failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Supabase POST farm_alerts error:", err);
  }
}

export async function saveTelemetry(data: Record<string, any>): Promise<TelemetryState> {
  const prev = await getLiveTelemetry();

  const clampPct = (val: unknown, fallback: number): number => {
    if (typeof val === "number" && !Number.isNaN(val)) {
      return Math.min(100, Math.max(0, Math.round(val)));
    }
    return fallback;
  };

  const soilMoisture =
    typeof data.soilMoisture === "number" && !Number.isNaN(data.soilMoisture)
      ? Math.min(100, Math.max(0, Math.round(data.soilMoisture)))
      : prev.soilMoisture ?? 50;

  const soilProbePct = clampPct(data.soilProbePct, prev.soilProbePct);
  const waterLevel = clampPct(data.waterLevel, prev.waterLevel);
  const rainIntensity =
    typeof data.rainIntensity === "number" && !Number.isNaN(data.rainIntensity)
      ? Math.min(100, Math.max(0, Math.round(data.rainIntensity)))
      : typeof data.isRaining === "boolean"
      ? data.isRaining
        ? 70
        : 0
      : prev.rainIntensity;

  const isRaining =
    typeof data.isRaining === "boolean" ? data.isRaining : prev.isRaining;
  const isFire = typeof data.isFire === "boolean" ? data.isFire : prev.isFire;
  const buzzerActive =
    typeof data.buzzerActive === "boolean" ? data.buzzerActive : isFire;

  const nowIso = new Date().toISOString();
  const nextSource: TelemetryState["source"] =
    data.source === "simulation" ? "simulation" : "esp32";

  const nextState: TelemetryState = {
    soilMoisture,
    soilProbePct,
    waterLevel,
    rainIntensity,
    isRaining,
    isFire,
    buzzerActive,
    rawSoil: typeof data.rawSoil === "number" ? data.rawSoil : prev.rawSoil,
    rawRain: typeof data.rawRain === "number" ? data.rawRain : prev.rawRain,
    rawWater: typeof data.rawWater === "number" ? data.rawWater : prev.rawWater,
    firePin: typeof data.firePin === "number" ? data.firePin : prev.firePin,
    lastUpdated: nowIso,
    device: typeof data.device === "string" && data.device.trim()
      ? data.device.trim()
      : prev.device || "ESP-32D-WiFi",
    packetsReceived: prev.packetsReceived + 1,
    source: nextSource,
    isOnline: true,
  };

  memoryTelemetry = nextState;

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/farm_telemetry?on_conflict=device_id`,
        {
          method: "POST",
          headers: buildSupabaseHeaders(cfg.key, {
            Prefer: "resolution=merge-duplicates,return=minimal",
          }),
          body: JSON.stringify({
            device_id: DEVICE_ID,
            soil_moisture: nextState.soilMoisture,
            soil_probe_pct: nextState.soilProbePct,
            water_level: nextState.waterLevel,
            rain_intensity: nextState.rainIntensity,
            is_raining: nextState.isRaining,
            is_fire: nextState.isFire,
            buzzer_active: nextState.buzzerActive,
            raw_soil: nextState.rawSoil,
            raw_rain: nextState.rawRain,
            raw_water: nextState.rawWater,
            fire_pin: nextState.firePin,
            packets_received: nextState.packetsReceived,
            source: nextState.source,
            device_name: nextState.device,
            updated_at: nextState.lastUpdated,
          }),
        }
      );
      if (!res.ok) {
        console.error("Supabase upsert farm_telemetry failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Supabase upsert farm_telemetry error:", err);
    }
  }

  // Record transition alerts into farm_alerts
  const snapshot = {
    soilMoisture: nextState.soilMoisture,
    soilProbePct: nextState.soilProbePct,
    waterLevel: nextState.waterLevel,
    rainIntensity: nextState.rainIntensity,
    isRaining: nextState.isRaining,
    isFire: nextState.isFire,
    source: nextState.source,
  };

  const alertPromises: Promise<void>[] = [];

  if (nextState.isFire && !prev.isFire) {
    alertPromises.push(
      recordAlert({
        device_id: DEVICE_ID,
        alert_type: "WILDFIRE",
        severity: "CRITICAL",
        message: "Wildfire / flame detected by IR sensor on GPIO 33! Buzzer & web siren activated.",
        sensor_snapshot: snapshot,
      })
    );
  }

  const enteredFlood =
    ((nextState.soilMoisture ?? 0) >= 80 && (prev.soilMoisture ?? 0) < 80) ||
    (nextState.waterLevel >= 70 && prev.waterLevel < 70);
  if (enteredFlood) {
    alertPromises.push(
      recordAlert({
        device_id: DEVICE_ID,
        alert_type: "FLOOD",
        severity: "HIGH",
        message: `Flood/waterlogging hazard: soil saturation ${nextState.soilMoisture}%, water depth ${nextState.waterLevel}%.`,
        sensor_snapshot: snapshot,
      })
    );
  }

  if (nextState.isRaining && !prev.isRaining) {
    alertPromises.push(
      recordAlert({
        device_id: DEVICE_ID,
        alert_type: "RAIN",
        severity: "MEDIUM",
        message: `Active rainfall detected on rain plate (${nextState.rainIntensity}% intensity).`,
        sensor_snapshot: snapshot,
      })
    );
  }

  const enteredDrought =
    nextState.soilMoisture !== null &&
    nextState.soilMoisture < 20 &&
    (prev.soilMoisture === null || prev.soilMoisture >= 20) &&
    nextState.source === "esp32" &&
    prev.packetsReceived > 0;
  if (enteredDrought) {
    alertPromises.push(
      recordAlert({
        device_id: DEVICE_ID,
        alert_type: "DROUGHT",
        severity: "MEDIUM",
        message: `Low soil moisture detected (${nextState.soilMoisture}%). Irrigation recommended.`,
        sensor_snapshot: snapshot,
      })
    );
  }

  if (alertPromises.length > 0) {
    await Promise.all(alertPromises);
  }

  return nextState;
}

export async function resetTelemetry(): Promise<TelemetryState> {
  const empty = createEmptyTelemetry();
  memoryTelemetry = empty;
  Object.keys(lastAlertAt).forEach((k) => {
    delete lastAlertAt[k as AlertType];
  });

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      await fetch(
        `${cfg.url}/rest/v1/farm_telemetry?on_conflict=device_id`,
        {
          method: "POST",
          headers: buildSupabaseHeaders(cfg.key, {
            Prefer: "resolution=merge-duplicates,return=minimal",
          }),
          body: JSON.stringify({
            device_id: DEVICE_ID,
            soil_moisture: null,
            soil_probe_pct: 0,
            water_level: 0,
            rain_intensity: 0,
            is_raining: false,
            is_fire: false,
            buzzer_active: false,
            raw_soil: null,
            raw_rain: null,
            raw_water: null,
            fire_pin: null,
            packets_received: 0,
            source: "awaiting",
            device_name: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } catch (err) {
      console.error("Supabase resetTelemetry error:", err);
    }
  }

  return empty;
}
