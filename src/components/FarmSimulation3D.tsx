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
  X,
  Cpu,
  Activity,
  Terminal,
} from "lucide-react";

interface FarmSimulationProps {
  onAskAI?: (prompt: string) => void;
  onClose?: () => void;
}

export default function FarmSimulation3D({ onAskAI, onClose }: FarmSimulationProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Live sensor telemetry state (null moisture = awaiting first hardware reading)
  const [soilMoisture, setSoilMoisture] = useState<number | null>(null);
  const [rainIntensity, setRainIntensity] = useState<number>(0);
  const [isRaining, setIsRaining] = useState(false);
  const [isFire, setIsFire] = useState(false);
  const [rawSoil, setRawSoil] = useState<number | null>(null);
  const [rawRain, setRawRain] = useState<number | null>(null);
  const [device, setDevice] = useState<string | null>(null);
  const [packetsReceived, setPacketsReceived] = useState<number>(0);
  const [source, setSource] = useState<"awaiting" | "esp32" | "simulation">("awaiting");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showSimControls, setShowSimControls] = useState<boolean>(false);
  const [showEndpointHelp, setShowEndpointHelp] = useState<boolean>(false);

  // Refs for Three.js objects to mutate dynamically
  const sceneRef = useRef<THREE.Scene | null>(null);
  const soilMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const rainGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const rainPointsRef = useRef<THREE.Points | null>(null);
  const fireGroupRef = useRef<THREE.Group | null>(null);
  const fireLightRef = useRef<THREE.PointLight | null>(null);
  const espLedMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const fireLedMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cropGroupRef = useRef<THREE.Group | null>(null);
  const leafMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Interactive rotation state
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);
  const targetRotationYRef = useRef(0.45);

  // Poll real sensor telemetry from /api/telemetry every 1.2s
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/telemetry", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSoilMoisture(data.soilMoisture);
          setRainIntensity(data.rainIntensity || 0);
          setIsRaining(Boolean(data.isRaining));
          setIsFire(Boolean(data.isFire));
          setRawSoil(data.rawSoil);
          setRawRain(data.rawRain);
          setDevice(data.device);
          setPacketsReceived(data.packetsReceived || 0);
          setSource(data.source || "awaiting");
          setIsOnline(Boolean(data.isOnline));
          setLastSync(
            data.lastUpdated
              ? new Date(data.lastUpdated).toLocaleTimeString()
              : null
          );
        }
      } catch {
        setIsOnline(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 700);
    return () => clearInterval(interval);
  }, []);

  // Build 3D Digital Twin Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#e8f1f5");
    scene.fog = new THREE.FogExp2("#e8f1f5", 0.028);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 7.8, 12.2);
    camera.lookAt(0, 0.3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    // Master Farm Container (for smooth mouse-drag rotation)
    const farmRoot = new THREE.Group();
    scene.add(farmRoot);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.35);
    sunLight.position.set(7, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fireLight = new THREE.PointLight(0xff2200, 0, 12);
    fireLight.position.set(0, 2, 0);
    farmRoot.add(fireLight);
    fireLightRef.current = fireLight;

    // 3. Demo Farm Soil Plot & Raised Ridges
    const plotSize = 8;
    const groundGeo = new THREE.BoxGeometry(plotSize, 1.1, plotSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x6b4c35, // Default neutral dry loam while awaiting sensor
      roughness: 0.92,
      metalness: 0.05,
    });
    soilMaterialRef.current = groundMat;

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.55;
    groundMesh.receiveShadow = true;
    farmRoot.add(groundMesh);

    // Soil Furrow Ridges (4 agricultural rows)
    for (let z = -2.7; z <= 2.7; z += 1.8) {
      const ridgeGeo = new THREE.BoxGeometry(plotSize - 0.6, 0.18, 0.75);
      const ridge = new THREE.Mesh(ridgeGeo, groundMat);
      ridge.position.set(0, 0.05, z);
      ridge.receiveShadow = true;
      ridge.castShadow = true;
      farmRoot.add(ridge);
    }

    // Wooden Planter Box Frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x8c5828,
      roughness: 0.8,
    });
    const borderT = 0.32;
    const frameH = 1.35;

    const fFront = new THREE.Mesh(
      new THREE.BoxGeometry(plotSize + borderT * 2, frameH, borderT),
      frameMat
    );
    fFront.position.set(0, -0.35, plotSize / 2 + borderT / 2);
    const fBack = fFront.clone();
    fBack.position.set(0, -0.35, -(plotSize / 2 + borderT / 2));

    const fRight = new THREE.Mesh(
      new THREE.BoxGeometry(borderT, frameH, plotSize),
      frameMat
    );
    fRight.position.set(plotSize / 2 + borderT / 2, -0.35, 0);
    const fLeft = fRight.clone();
    fLeft.position.set(-(plotSize / 2 + borderT / 2), -0.35, 0);
    farmRoot.add(fFront, fBack, fRight, fLeft);

    // 4. Physical IoT Hardware Models inside the 3D Demo Box!
    // 4a. ESP32 Microcontroller Enclosure mounted on front border
    const espBox = new THREE.Group();
    espBox.position.set(-2.8, 0.35, plotSize / 2 + 0.2);
    const caseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.55, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    espBox.add(caseMesh);
    const espLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Amber awaiting
    espLedMaterialRef.current = espLedMat;
    const espLed = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), espLedMat);
    espLed.position.set(0.32, 0.15, 0.24);
    espBox.add(espLed);
    farmRoot.add(espBox);

    // 4b. Capacitive Soil Moisture Sensor Probe (inserted in soil center-left)
    const soilProbe = new THREE.Group();
    soilProbe.position.set(-1.5, 0.4, 1.0);
    const probeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.9, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
    );
    soilProbe.add(probeBoard);
    const probeHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.25, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    probeHead.position.y = 0.45;
    soilProbe.add(probeHead);
    farmRoot.add(soilProbe);

    // 4c. FC-37 Raindrop Detection Plate on Corner Stand (Front-Right)
    const rainSensor = new THREE.Group();
    rainSensor.position.set(3.2, 0.65, 3.1);
    const rainPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    rainSensor.add(rainPost);
    const rainPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.05, 0.65),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    rainPlate.position.set(0, 0.68, 0);
    rainPlate.rotation.x = 0.35; // Tilted to catch raindrops
    rainSensor.add(rainPlate);
    farmRoot.add(rainSensor);

    // 4d. IR Flame / Fire Detector Post (Back-Right)
    const fireSensor = new THREE.Group();
    fireSensor.position.set(3.2, 0.65, -3.1);
    const firePost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    fireSensor.add(firePost);
    const fireLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    fireLedMaterialRef.current = fireLedMat;
    const fireBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 14),
      fireLedMat
    );
    fireBeacon.position.set(0, 0.78, 0);
    fireSensor.add(fireBeacon);
    farmRoot.add(fireSensor);

    // 5. Dynamic Floodwater Plane
    const waterGeo = new THREE.PlaneGeometry(plotSize - 0.05, plotSize - 0.05, 24, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1d7dfa,
      transparent: true,
      opacity: 0.72,
      roughness: 0.12,
      metalness: 0.75,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.1;
    waterMesh.visible = false;
    farmRoot.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 6. Crops (16 Maize / Cassava Plants on the 4 Ridges)
    const cropGroup = new THREE.Group();
    cropGroupRef.current = cropGroup;
    const leafMats: THREE.MeshStandardMaterial[] = [];

    for (let x = -2.7; x <= 2.7; x += 1.8) {
      for (let z = -2.7; z <= 2.7; z += 1.8) {
        const plant = new THREE.Group();
        plant.position.set(x, 0.12, z);

        const plantMat = new THREE.MeshStandardMaterial({
          color: 0x2f855a,
          roughness: 0.55,
        });
        leafMats.push(plantMat);

        // Stalk
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.07, 1.35, 7),
          plantMat
        );
        stem.position.y = 0.65;
        stem.castShadow = true;
        plant.add(stem);

        // Leaves
        for (let l = 0; l < 4; l++) {
          const leafGeo = new THREE.BoxGeometry(0.62, 0.025, 0.18);
          const leaf = new THREE.Mesh(leafGeo, plantMat);
          leaf.position.set(0.22, 0.55 + l * 0.22, 0);
          leaf.rotation.z = -0.42 - l * 0.08;
          leaf.rotation.y = (l * Math.PI) / 2 + (x + z) * 0.2;
          leaf.castShadow = true;
          plant.add(leaf);
        }
        cropGroup.add(plant);
      }
    }
    leafMaterialsRef.current = leafMats;
    farmRoot.add(cropGroup);

    // 7. Rain Particle System (High-Visibility Raindrops)
    const rainCount = 2400;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 9.5;
      rainPositions[i + 1] = Math.random() * 8.5;
      rainPositions[i + 2] = (Math.random() - 0.5) * 9.5;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    rainGeoRef.current = rainGeo;

    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.95,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    farmRoot.add(rainPoints);
    rainPointsRef.current = rainPoints;

    // 8. Wildfire Particle Plumes
    const fireGroup = new THREE.Group();
    const fireParticles: THREE.Mesh[] = [];
    for (let i = 0; i < 45; i++) {
      const pGeo = new THREE.DodecahedronGeometry(0.14 + Math.random() * 0.16);
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff3b00 : 0xffaa00,
        transparent: true,
        opacity: 0.88,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 5.5,
        Math.random() * 1.8,
        (Math.random() - 0.5) * 5.5
      );
      fireParticles.push(p);
      fireGroup.add(p);
    }
    fireGroup.visible = false;
    farmRoot.add(fireGroup);
    fireGroupRef.current = fireGroup;

    // Mouse / Touch Drag Rotation Listeners
    const domElem = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMouseXRef.current;
      prevMouseXRef.current = e.clientX;
      targetRotationYRef.current += deltaX * 0.008;
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    domElem.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // 9. Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smoothly interpolate rotation or gentle idle sway
      if (!isDraggingRef.current) {
        targetRotationYRef.current += Math.sin(elapsed * 0.3) * 0.0008;
      }
      farmRoot.rotation.y += (targetRotationYRef.current - farmRoot.rotation.y) * 0.1;

      // Animate falling rain
      if (rainPointsRef.current && rainPointsRef.current.visible) {
        const positions = rainGeo.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 15 * delta;
          if (positions[i] < 0.1) {
            positions[i] = 9;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Gentle ripple on floodwater surface
      if (waterMeshRef.current && waterMeshRef.current.visible) {
        waterMeshRef.current.position.y += Math.sin(elapsed * 3) * 0.0012;
      }

      // Animate fire flames
      if (fireGroupRef.current && fireGroupRef.current.visible) {
        fireParticles.forEach((p, idx) => {
          p.position.y += (1.8 + (idx % 3)) * delta;
          p.scale.multiplyScalar(0.965);
          if (p.position.y > 2.6) {
            p.position.y = 0.15;
            p.scale.set(1, 1, 1);
            p.position.x = (Math.random() - 0.5) * 5.5;
            p.position.z = (Math.random() - 0.5) * 5.5;
          }
        });
        if (fireLightRef.current) {
          fireLightRef.current.intensity = 3.0 + Math.sin(elapsed * 14) * 1.5;
        }
      } else if (fireLightRef.current) {
        fireLightRef.current.intensity = 0;
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
      domElem.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D Scene whenever sensor telemetry updates
  useEffect(() => {
    if (!sceneRef.current) return;

    const effectiveMoisture = soilMoisture ?? 50;

    // 1. ESP32 Status LED Color (Amber = awaiting, Green = live online, Red = hazard)
    if (espLedMaterialRef.current) {
      if (isFire || effectiveMoisture >= 80) {
        espLedMaterialRef.current.color.setHex(0xef4444);
      } else if (soilMoisture !== null && isOnline) {
        espLedMaterialRef.current.color.setHex(0x10b981);
      } else {
        espLedMaterialRef.current.color.setHex(0xf59e0b);
      }
    }

    // 2. Fire Beacon LED
    if (fireLedMaterialRef.current) {
      fireLedMaterialRef.current.color.setHex(isFire ? 0xff0000 : 0x22c55e);
    }

    // 3. Soil Color & Crop Health based on Real Sensor Reading
    if (soilMaterialRef.current) {
      if (soilMoisture === null) {
        // Neutral soil while awaiting first sensor packet
        soilMaterialRef.current.color.setHex(0x6b4c35);
      } else if (soilMoisture < 30) {
        // Parched dry soil
        soilMaterialRef.current.color.setHex(0xc29b61);
      } else if (soilMoisture < 75) {
        // Rich moist dark loam
        soilMaterialRef.current.color.setHex(0x422d1d);
      } else {
        // Waterlogged dark mud
        soilMaterialRef.current.color.setHex(0x23170e);
      }
    }

    // Crop color & posture response
    leafMaterialsRef.current.forEach((mat) => {
      if (soilMoisture !== null && soilMoisture < 25) {
        mat.color.setHex(0xa3a847); // stressed yellowish-green
      } else if (soilMoisture !== null && soilMoisture >= 85) {
        mat.color.setHex(0x276749); // dark waterlogged green
      } else {
        mat.color.setHex(0x2f855a); // healthy lush green
      }
    });

    // 4. Rising Floodwater Plane (Rises visibly during active rain or when moisture > 45%)
    if (waterMeshRef.current) {
      const levelTrigger = Math.max(soilMoisture ?? 0, isRaining ? Math.max(rainIntensity, 55) : 0);
      if (levelTrigger > 45) {
        const ratio = (levelTrigger - 45) / 55; // 0.0 to 1.0
        waterMeshRef.current.position.y = 0.04 + ratio * 0.52;
        waterMeshRef.current.visible = true;
      } else {
        waterMeshRef.current.position.y = -0.1;
        waterMeshRef.current.visible = false;
      }
    }

    // 5. Rain Particles & Sky Overcast
    if (rainPointsRef.current) {
      rainPointsRef.current.visible = isRaining;
    }
    if (isRaining) {
      sceneRef.current.background = new THREE.Color("#334155");
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0x334155);
    } else {
      sceneRef.current.background = new THREE.Color("#e8f1f5");
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0xe8f1f5);
    }

    // 6. Wildfire Particles
    if (fireGroupRef.current) {
      fireGroupRef.current.visible = isFire;
    }
    if (fireLightRef.current) {
      fireLightRef.current.intensity = isFire ? 3.5 : 0;
    }
  }, [soilMoisture, rainIntensity, isRaining, isFire, isOnline]);

  // Helper to send simulated test readings or reset to awaiting hardware
  const sendTestTelemetry = async (payload: Record<string, any>) => {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "simulation" }),
    });
  };

  const resetToAwaitHardware = async () => {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    setSoilMoisture(null);
    setIsRaining(false);
    setIsFire(false);
    setPacketsReceived(0);
    setSource("awaiting");
    setIsOnline(false);
  };

  const awaitingHardware = source === "awaiting" || soilMoisture === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6">
      <div className="relative flex flex-col h-[92vh] w-full max-w-6xl bg-[var(--bg-app)] rounded-2xl overflow-hidden border border-[var(--border-medium)] shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] z-20">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs ${
                awaitingHardware
                  ? "bg-amber-500"
                  : isOnline
                  ? "bg-[var(--accent)]"
                  : "bg-slate-500"
              }`}
            >
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">
                  Demo Farm 3D Digital Twin
                </h2>

                {/* Live Hardware Connection Status Pill */}
                {awaitingHardware ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Awaiting ESP32 Hardware Feed…
                  </span>
                ) : source === "esp32" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    ESP32 Hardware Connected ({packetsReceived} pkts)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 border border-blue-500/30">
                    <Sliders className="h-3 w-3" />
                    Test Override Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Listening on <code className="font-mono">POST /api/telemetry</code> • Drag 3D plot to rotate 360°
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEndpointHelp(!showEndpointHelp)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Show ESP32 Webhook Setup"
            >
              <Terminal className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="hidden sm:inline">ESP32 Webhook Info</span>
            </button>

            <button
              onClick={() => setShowSimControls(!showSimControls)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                showSimControls
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{showSimControls ? "Hide Test Controls" : "Stage Backup Sliders"}</span>
            </button>

            {!awaitingHardware && (
              <button
                onClick={resetToAwaitHardware}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                title="Reset and wait for physical ESP32 hardware"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Await Hardware</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible ESP32 Connection Info Drawer */}
        {showEndpointHelp && (
          <div className="bg-slate-900 text-slate-100 px-4 py-3 text-xs border-b border-slate-700 z-20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                Hardware Ingestion Endpoint (Ready & Listening)
              </span>
              <p className="mt-0.5 text-slate-300">
                Point your ESP32 <code className="text-amber-300">serverUrl</code> to:{" "}
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white">
                  {typeof window !== "undefined" ? `${window.location.origin}/api/telemetry` : "/api/telemetry"}
                </code>
              </p>
            </div>
            <div className="font-mono text-[11px] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-300">
              {`POST { "soilMoisture": 88, "isRaining": true, "isFire": false }`}
            </div>
          </div>
        )}

        {/* Real-time Emergency Alert Banners */}
        {isFire && (
          <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold animate-pulse z-20 shadow-md">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 shrink-0" />
              <span>
                🔥 <strong>WILDFIRE EMERGENCY DETECTED!</strong> IR flame sensor triggered on demo farm plot.
              </span>
            </div>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(
                    "CRITICAL: Our farm ESP32 flame sensor just detected an active wildfire near the plot! Give me immediate emergency firebreak, crop protection, and containment steps."
                  )
                }
                className="bg-white text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shrink-0"
              >
                Ask AI for Fire Response
              </button>
            )}
          </div>
        )}

        {isRaining && !isFire && (
          <div className="bg-sky-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold z-20 shadow-md">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 shrink-0 animate-bounce" />
              <span>
                🌧️ <strong>ACTIVE RAINFALL DETECTED ON SENSOR PLATE!</strong> Rain Intensity:{" "}
                <strong>{rainIntensity}%</strong> (ADC: {rawRain}) • Surface water accumulating on plot!
              </span>
            </div>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(
                    `URGENT: Active rainfall (${rainIntensity}% intensity) and soil saturation (${soilMoisture}%) detected on our farm plot. What immediate furrow drainage and anti-fungal root treatments should we apply?`
                  )
                }
                className="bg-white text-sky-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-sky-50 transition-colors shrink-0"
              >
                Ask AI for Rain & Flood Plan
              </button>
            )}
          </div>
        )}

        {soilMoisture !== null && soilMoisture >= 80 && !isRaining && !isFire && (
          <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold z-20 shadow-md">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 shrink-0 animate-bounce" />
              <span>
                🌊 <strong>WATERLOGGING / FLOOD ALERT:</strong> Soil saturation has reached{" "}
                <strong>{soilMoisture}%</strong>. High danger of root asphyxiation!
              </span>
            </div>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(
                    `URGENT: Our farm sensor reports ${soilMoisture}% soil saturation and active flooding. What immediate furrow drainage and anti-fungal root treatments should we apply?`
                  )
                }
                className="bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shrink-0"
              >
                Ask AI for Drainage Plan
              </button>
            )}
          </div>
        )}

        {soilMoisture !== null && soilMoisture < 25 && !isFire && (
          <div className="bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold z-20 shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                ☀️ <strong>DROUGHT STRESS ALERT:</strong> Soil moisture critically low at{" "}
                <strong>{soilMoisture}%</strong>. Immediate irrigation needed.
              </span>
            </div>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(
                    `ALERT: Our soil moisture sensor reads ${soilMoisture}% (severe drought). How should we mulch and irrigate to save the crops?`
                  )
                }
                className="bg-white text-amber-800 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shrink-0"
              >
                Ask AI for Drought Plan
              </button>
            )}
          </div>
        )}

        {/* 3D WebGL Viewport */}
        <div className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing" ref={mountRef}>
          {/* Live Telemetry HUD Cards (Left Overlay) */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2.5 w-60 pointer-events-none">
            {/* Sensor 1: Soil Moisture Probe */}
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-3 shadow-sm">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  soilMoisture === null
                    ? "bg-slate-200 text-slate-500"
                    : soilMoisture > 75
                    ? "bg-blue-500/15 text-blue-600"
                    : soilMoisture < 30
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-emerald-500/15 text-emerald-600"
                }`}
              >
                <Droplets className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                  Soil Moisture (GPIO 34)
                </span>
                {soilMoisture === null ? (
                  <span className="text-xs font-semibold text-amber-600">
                    Awaiting sensor…
                  </span>
                ) : (
                  <span className="text-sm font-bold truncate">
                    {soilMoisture}%{" "}
                    <span className="text-xs font-normal text-[var(--text-secondary)]">
                      ({soilMoisture > 75 ? "Flooded" : soilMoisture < 30 ? "Dry" : "Optimal"})
                    </span>
                  </span>
                )}
                {rawSoil !== null && (
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Raw ADC: {rawSoil}
                  </span>
                )}
              </div>
            </div>

            {/* Sensor 2: Raindrop Sensor Plate */}
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-3 shadow-sm">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  awaitingHardware
                    ? "bg-slate-200 text-slate-500"
                    : isRaining
                    ? "bg-sky-500/20 text-sky-600 animate-pulse"
                    : "bg-emerald-500/15 text-emerald-600"
                }`}
              >
                <CloudRain className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                  Rain Sensor (GPIO 35)
                </span>
                {awaitingHardware ? (
                  <span className="text-xs font-semibold text-amber-600">
                    Awaiting sensor…
                  </span>
                ) : (
                  <span className={`text-xs font-bold ${isRaining ? "text-sky-600" : ""}`}>
                    {isRaining ? `🌧️ Raining (${rainIntensity}% Intensity)` : "☀️ Clear / Dry Plate"}
                  </span>
                )}
                {isRaining && (
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${rainIntensity}%` }}
                    />
                  </div>
                )}
                {rawRain !== null && (
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
                    Raw ADC: {rawRain}
                  </span>
                )}
              </div>
            </div>

            {/* Sensor 3: IR Flame / Fire Detector */}
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-3 shadow-sm">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  awaitingHardware
                    ? "bg-slate-200 text-slate-500"
                    : isFire
                    ? "bg-red-500/20 text-red-600 animate-bounce"
                    : "bg-emerald-500/15 text-emerald-600"
                }`}
              >
                <Flame className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                  Fire Sensor (GPIO 33)
                </span>
                {awaitingHardware ? (
                  <span className="text-xs font-semibold text-amber-600">
                    Awaiting sensor…
                  </span>
                ) : (
                  <span className={`text-xs font-bold ${isFire ? "text-red-600" : ""}`}>
                    {isFire ? "🔥 WILDFIRE ALARM!" : "🛡️ Safe / No Flame"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Overlay: Hardware Node Metadata */}
          <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-3.5 py-2.5 text-right shadow-xs pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Hardware Telemetry Node
            </span>
            <span className="text-xs font-semibold">
              {device || "ESP32-WROOM-32 (Pending)"}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {lastSync ? `Last packet: ${lastSync}` : "Waiting for first HTTP POST…"}
            </span>
          </div>

          {/* 3D Hardware Legend */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="text-[11px] font-medium text-slate-700 bg-white/85 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              🌱 <strong>3D Digital Twin:</strong> Front-Left = ESP32 Box • Center-Left = Soil Probe • Front-Right = Rain Plate • Back-Right = Fire Beacon
            </div>
          </div>
        </div>

        {/* Optional Stage Backup Controls (Hidden by default so app strictly awaits real hardware) */}
        {showSimControls && (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 z-20">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Droplets className="h-4 w-4 text-[var(--accent)] shrink-0" />
                <span className="font-semibold whitespace-nowrap">Test Soil Moisture:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soilMoisture ?? 50}
                  onChange={(e) =>
                    sendTestTelemetry({ soilMoisture: Number(e.target.value) })
                  }
                  className="flex-1 accent-[var(--accent)] cursor-pointer"
                />
                <span className="font-mono font-bold w-10 text-right">
                  {soilMoisture ?? 50}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => sendTestTelemetry({ isRaining: !isRaining })}
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
                  onClick={() => sendTestTelemetry({ isFire: !isFire })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                    isFire
                      ? "bg-red-600 text-white border-red-700 animate-pulse"
                      : "bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]"
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  {isFire ? "Clear Flame" : "Trigger Flame"}
                </button>

                <button
                  onClick={() =>
                    sendTestTelemetry({ soilMoisture: 92, isRaining: true })
                  }
                  className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 font-semibold"
                >
                  Test Flash Flood (92%)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
