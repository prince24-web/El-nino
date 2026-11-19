"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FarmAlertRecord, TelemetryState } from "@/lib/telemetry-store";
import {
  unlockAudio,
  startFireSiren,
  stopFireSiren,
  playTestSiren,
} from "@/lib/alarm-audio";

const INITIAL_TELEMETRY: TelemetryState = {
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

export function useFarmTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryState>(INITIAL_TELEMETRY);
  const [alerts, setAlerts] = useState<FarmAlertRecord[]>([]);
  const [soundArmed, setSoundArmed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);

  const testSirenActiveRef = useRef(false);

  const refreshTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/telemetry?includeHistory=true", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const { alerts: fetchedAlerts, ...rest } = data;
        setTelemetry((prev) => ({ ...prev, ...rest }));
        if (Array.isArray(fetchedAlerts)) {
          setAlerts(fetchedAlerts);
        }
      }
    } catch {
      // Preserve last known state on transient network hiccup
    }
  }, []);

  // Global polling every 1000ms across the entire app
  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 1000);
    return () => clearInterval(interval);
  }, [refreshTelemetry]);

  // Passive first-interaction audio unlock (mobile Safari/Chrome compatible)
  useEffect(() => {
    const handleFirstGesture = async () => {
      const ok = await unlockAudio(false);
      if (ok) {
        setSoundArmed(true);
        window.removeEventListener("pointerdown", handleFirstGesture);
        window.removeEventListener("keydown", handleFirstGesture);
      }
    };

    window.addEventListener("pointerdown", handleFirstGesture, { passive: true });
    window.addEventListener("keydown", handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  // Explicit button handler for judges to arm phone alarm with confirmation chirp
  const armAudio = useCallback(async () => {
    const ok = await unlockAudio(true);
    setSoundArmed(ok);
    return ok;
  }, []);

  const testAlarm = useCallback(async () => {
    testSirenActiveRef.current = true;
    setSirenPlaying(true);
    const ok = await playTestSiren(1800);
    setSoundArmed(ok);
    setTimeout(() => {
      testSirenActiveRef.current = false;
      setSirenPlaying(false);
    }, 1850);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopFireSiren();
        setSirenPlaying(false);
      }
      return next;
    });
  }, []);

  // Sync live fire alarm state -> Web Audio siren
  useEffect(() => {
    if (telemetry.isFire && !isMuted && soundArmed) {
      const started = startFireSiren();
      setSirenPlaying(started);
    } else if (!telemetry.isFire) {
      if (!testSirenActiveRef.current) {
        stopFireSiren();
        setSirenPlaying(false);
      }
      // Auto-reset mute when fire clears so subsequent fire triggers alarm fresh
      setIsMuted(false);
    } else if (isMuted) {
      stopFireSiren();
      setSirenPlaying(false);
    }
  }, [telemetry.isFire, isMuted, soundArmed]);

  // Stop any playing audio on unmount
  useEffect(() => {
    return () => {
      stopFireSiren();
    };
  }, []);

  return {
    telemetry,
    alerts,
    soundArmed,
    isMuted,
    sirenPlaying,
    armAudio,
    testAlarm,
    toggleMute,
    refreshTelemetry,
  };
}
