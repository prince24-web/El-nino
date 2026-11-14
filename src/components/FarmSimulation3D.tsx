"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Flame,
  CloudRain,
  Droplets,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Wifi,
  Radio,
  CheckCircle2,
  X,
} from "lucide-react";

interface FarmSimulationProps {
  onAskAI?: (prompt: string) => void;
  onClose?: () => void;
}

export default function FarmSimulation3D({ onAskAI, onClose }: FarmSimulationProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Live state
  const [soilMoisture, setSoilMoisture] = useState(55); // 0 - 100%
  const [isRaining, setIsRaining] = useState(false);
  const [isFire, setIsFire] = useState(false);
  const [isLiveIoT, setIsLiveIoT] = useState(true);
  const [lastSync, setLastSync] = useState<string>("Connecting...");

  // Refs for Three.js objects to mutate in animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const soilMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const rainGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const rainPointsRef = useRef<THREE.Points | null>(null);
  const fireGroupRef = useRef<THREE.Group | null>(null);
  const fireLightRef = useRef<THREE.PointLight | null>(null);

  // Poll telemetry from ESP32 backend route
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveIoT) {
      const fetchTelemetry = async () => {
        try {
          const res = await fetch("/api/telemetry");
          if (res.ok) {
            const data = await res.json();
            setSoilMoisture(data.soilMoisture);
            setIsRaining(data.isRaining);
            setIsFire(data.isFire);
            setLastSync(new Date(data.lastUpdated).toLocaleTimeString());
          }
        } catch {
          // Keep prior values if offline
        }
      };

      fetchTelemetry();
      interval = setInterval(fetchTelemetry, 1500);
    }
    return () => clearInterval(interval);
  }, [isLiveIoT]);

  // Set up Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#dbeafe"); // Sky blue default
    scene.fog = new THREE.FogExp2("#dbeafe", 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7, 11);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sunLight.position.set(6, 12, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Fire alarm point light (pulsing red)
    const fireLight = new THREE.PointLight(0xff3300, 0, 10);
    fireLight.position.set(0, 1.5, 0);
    scene.add(fireLight);
    fireLightRef.current = fireLight;

    // 3. Farmland Plot (Ground)
    const plotSize = 8;
    const groundGeo = new THREE.BoxGeometry(plotSize, 1, plotSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.9,
      metalness: 0.1,
    });
    soilMaterialRef.current = groundMat;

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.5;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Wooden bed frame borders
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const borderThickness = 0.3;
    const frameH = 1.2;

    const f1 = new THREE.Mesh(new THREE.BoxGeometry(plotSize + borderThickness * 2, frameH, borderThickness), frameMat);
    f1.position.set(0, -0.4, plotSize / 2 + borderThickness / 2);
    const f2 = f1.clone();
    f2.position.set(0, -0.4, -(plotSize / 2 + borderThickness / 2));
    const f3 = new THREE.Mesh(new THREE.BoxGeometry(borderThickness, frameH, plotSize), frameMat);
    f3.position.set(plotSize / 2 + borderThickness / 2, -0.4, 0);
    const f4 = f3.clone();
    f4.position.set(-(plotSize / 2 + borderThickness / 2), -0.4, 0);
    scene.add(f1, f2, f3, f4);

    // 4. Floodwater Layer
    const waterGeo = new THREE.PlaneGeometry(plotSize, plotSize);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2b7fff,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.8,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.05; // Slightly submerged by default
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 5. Crops (Row of healthy stylized Maize / Cassava stalks)
    const cropGroup = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.6 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x48bb78, roughness: 0.5 });

    for (let x = -2.6; x <= 2.6; x += 1.3) {
      for (let z = -2.6; z <= 2.6; z += 1.3) {
        const plant = new THREE.Group();
        plant.position.set(x + (Math.random() - 0.5) * 0.2, 0, z + (Math.random() - 0.5) * 0.2);

        // Stalk
        const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.4, 6);
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.7;
        stem.castShadow = true;
        plant.add(stem);

        // Arching leaves
        for (let l = 0; l < 4; l++) {
          const leafGeo = new THREE.BoxGeometry(0.5, 0.02, 0.15);
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.set(0.2, 0.6 + l * 0.2, 0);
          leaf.rotation.z = -0.5 - l * 0.1;
          leaf.rotation.y = (l * Math.PI) / 2;
          leaf.castShadow = true;
          plant.add(leaf);
        }
        cropGroup.add(plant);
      }
    }
    scene.add(cropGroup);

    // 6. Rain Particle System
    const rainCount = 1200;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 12;
      rainPositions[i + 1] = Math.random() * 10;
      rainPositions[i + 2] = (Math.random() - 0.5) * 12;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    rainGeoRef.current = rainGeo;

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    scene.add(rainPoints);
    rainPointsRef.current = rainPoints;

    // 7. Wildfire / Fire Particle System
    const fireGroup = new THREE.Group();
    const fireCount = 40;
    const fireParticles: THREE.Mesh[] = [];

    for (let i = 0; i < fireCount; i++) {
      const pGeo = new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.15);
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff4500 : 0xffa500,
        transparent: true,
        opacity: 0.85,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 4
      );
      fireParticles.push(p);
      fireGroup.add(p);
    }
    fireGroup.visible = false;
    scene.add(fireGroup);
    fireGroupRef.current = fireGroup;

    // 8. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle orbital sway
      scene.rotation.y = Math.sin(elapsed * 0.25) * 0.15;

      // Animate Rain
      if (rainPointsRef.current && rainPointsRef.current.visible) {
        const positions = rainGeo.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 14 * delta;
          if (positions[i] < 0) {
            positions[i] = 10;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Animate Fire Particles
      if (fireGroupRef.current && fireGroupRef.current.visible) {
        fireParticles.forEach((p, idx) => {
          p.position.y += (1.5 + (idx % 3)) * delta;
          p.scale.multiplyScalar(0.97);
          if (p.position.y > 2.5) {
            p.position.y = 0.1;
            p.scale.set(1, 1, 1);
            p.position.x = (Math.random() - 0.5) * 4;
            p.position.z = (Math.random() - 0.5) * 4;
          }
        });

        // Pulsing emergency red light
        if (fireLightRef.current) {
          fireLightRef.current.intensity = 2.5 + Math.sin(elapsed * 12) * 1.5;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync sensor values to 3D simulation visuals
  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Dynamic Soil Color based on moisture (Parched Tan -> Moist Rich Loam -> Dark Mud)
    if (soilMaterialRef.current) {
      if (soilMoisture < 30) {
        // Drought / Dry cracked tan
        soilMaterialRef.current.color.setHex(0xb89770);
      } else if (soilMoisture < 75) {
        // Healthy rich fertile soil
        soilMaterialRef.current.color.setHex(0x4a3525);
      } else {
        // Waterlogged / Saturated mud
        soilMaterialRef.current.color.setHex(0x241810);
      }
    }

    // 2. Rising Floodwater Layer (rises above ground level when soil > 75%)
    if (waterMeshRef.current) {
      if (soilMoisture > 75) {
        const floodHeight = ((soilMoisture - 75) / 25) * 0.45; // up to 0.45 units high
        waterMeshRef.current.position.y = floodHeight;
        waterMeshRef.current.visible = true;
      } else {
        waterMeshRef.current.position.y = -0.05;
        waterMeshRef.current.visible = false;
      }
    }

    // 3. Rain Particle Visibility & Sky Overcast
    if (rainPointsRef.current) {
      rainPointsRef.current.visible = isRaining;
    }
    if (isRaining) {
      sceneRef.current.background = new THREE.Color("#64748b"); // Overcast storm sky
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0x64748b);
    } else {
      sceneRef.current.background = new THREE.Color("#dbeafe"); // Clear sunny sky
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0xdbeafe);
    }

    // 4. Wildfire & Fire Alarm Activation
    if (fireGroupRef.current) {
      fireGroupRef.current.visible = isFire;
    }
    if (fireLightRef.current) {
      fireLightRef.current.intensity = isFire ? 3.0 : 0;
    }
  }, [soilMoisture, isRaining, isFire]);

  // Push manual simulation changes back to the API for synchronization
  const handleManualMoistureChange = (val: number) => {
    setSoilMoisture(val);
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soilMoisture: val }),
    });
  };

  const handleManualRainToggle = (val: boolean) => {
    setIsRaining(val);
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRaining: val }),
    });
  };

  const handleManualFireToggle = (val: boolean) => {
    setIsFire(val);
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFire: val }),
    });
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[var(--bg-app)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-md">
      {/* Top Banner / HUD */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-xs">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              Farmland 3D Digital Twin
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent-soft-border)]">
                {isLiveIoT ? "ESP32 Live IoT Node" : "Interactive Simulation Mode"}
              </span>
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Real-time cyber-physical sensor telemetry for flood, drought, and wildfire prevention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setIsLiveIoT(!isLiveIoT)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isLiveIoT
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isLiveIoT ? <Wifi className="h-3.5 w-3.5" /> : <Sliders className="h-3.5 w-3.5" />}
            {isLiveIoT ? "Live IoT Sync" : "Manual Sliders"}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Emergency Alert Banners */}
      {isFire && (
        <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold animate-pulse z-20 shadow-md">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 shrink-0" />
            <span>
              🔥 <strong>WILDFIRE EMERGENCY DETECTED!</strong> Thermal infrared radiation spike on plot. Immediate containment required!
            </span>
          </div>
          {onAskAI && (
            <button
              onClick={() =>
                onAskAI(
                  "CRITICAL: Wildfire/bushfire has been detected on my farmland! What immediate emergency firebreak, ditch, and evacuation steps should I take to save my crops?"
                )
              }
              className="bg-white text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-xs"
            >
              Emergency Fire Advice
            </button>
          )}
        </div>
      )}

      {soilMoisture >= 80 && !isFire && (
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold z-20 shadow-md">
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 shrink-0 animate-bounce" />
            <span>
              🌊 <strong>FLOOD HAZARD:</strong> Soil saturation at <strong>{soilMoisture}%</strong>. Danger of root rot and crop lodging!
            </span>
          </div>
          {onAskAI && (
            <button
              onClick={() =>
                onAskAI(
                  `URGENT: My farmland soil is severely flooded with a moisture level of ${soilMoisture}%. What emergency trenching, furrow drainage, and post-rain fungal controls should I apply right now?`
                )
              }
              className="bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs"
            >
              Drainage Plan
            </button>
          )}
        </div>
      )}

      {soilMoisture < 25 && !isFire && (
        <div className="bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold z-20 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              ☀️ <strong>DROUGHT ALERT:</strong> Soil moisture critically low at <strong>{soilMoisture}%</strong>. Crop wilting imminent.
            </span>
          </div>
          {onAskAI && (
            <button
              onClick={() =>
                onAskAI(
                  `ALERT: My farmland soil is experiencing severe drought stress with soil moisture at ${soilMoisture}%. What moisture-conserving organic mulching, drip irrigation, or shade techniques should I use?`
                )
              }
              className="bg-white text-amber-800 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shadow-xs"
            >
              Drought Rescue
            </button>
          )}
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div className="relative flex-1 w-full min-h-[380px]" ref={mountRef}>
        {/* Floating Telemetry Stats Widget */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {/* Soil Moisture Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-3 py-2 shadow-xs">
            <Droplets className={`h-4 w-4 ${soilMoisture > 75 ? "text-blue-500" : soilMoisture < 30 ? "text-amber-500" : "text-emerald-500"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Soil Moisture</span>
              <span className="text-xs font-bold">
                {soilMoisture}% • {soilMoisture > 75 ? "Flooded / Saturated" : soilMoisture < 30 ? "Parched Drought" : "Optimal"}
              </span>
            </div>
          </div>

          {/* Rain Sensor Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-3 py-2 shadow-xs">
            <CloudRain className={`h-4 w-4 ${isRaining ? "text-blue-500 animate-pulse" : "text-slate-400"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Precipitation</span>
              <span className="text-xs font-bold">
                {isRaining ? "Active Rainfall Detected" : "No Rain (Dry Plate)"}
              </span>
            </div>
          </div>

          {/* Fire / Flame Detector Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-3 py-2 shadow-xs">
            <Flame className={`h-4 w-4 ${isFire ? "text-red-500 animate-bounce" : "text-slate-400"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Wildfire / Heat</span>
              <span className={`text-xs font-bold ${isFire ? "text-red-600" : ""}`}>
                {isFire ? "🔥 FLAME DETECTED!" : "Clear / Normal"}
              </span>
            </div>
          </div>
        </div>

        {/* Floating 3D Legend Hint */}
        <div className="absolute bottom-4 left-4 z-10 text-[10px] text-slate-600 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200">
          💡 Drag to inspect 3D crops • Blue plane = floodwater line • Particles = active precipitation / flame
        </div>
      </div>

      {/* Manual Interactive Demonstration Controls ("Judges Insurance") */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Soil Moisture Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Droplets className="h-4 w-4 text-[var(--accent)] shrink-0" />
            <span className="font-semibold text-xs whitespace-nowrap">Soil Moisture:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={soilMoisture}
              onChange={(e) => handleManualMoistureChange(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)] cursor-pointer"
            />
            <span className="font-mono font-bold w-10 text-right">{soilMoisture}%</span>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleManualRainToggle(!isRaining)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                isRaining
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]"
              }`}
            >
              <CloudRain className="h-3.5 w-3.5" />
              {isRaining ? "Stop Rain" : "Pour Rain"}
            </button>

            <button
              onClick={() => handleManualFireToggle(!isFire)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                isFire
                  ? "bg-red-600 text-white border-red-700 animate-pulse"
                  : "bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              {isFire ? "Extinguish" : "Simulate Flame"}
            </button>

            <button
              onClick={() => {
                handleManualMoistureChange(92);
                handleManualRainToggle(true);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 font-semibold text-[11px]"
              title="Instantly simulate heavy flash flood"
            >
              Simulate Flash Flood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
