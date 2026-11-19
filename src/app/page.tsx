"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FarmSimulation3D from "@/components/FarmSimulation3D";
import { useFarmTelemetry } from "@/hooks/useFarmTelemetry";
import {
  Sprout,
  Plus,
  Send,
  Paperclip,
  X,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Camera,
  Copy,
  Check,
  Menu,
  Leaf,
  Activity,
  Bell,
  BellOff,
  Flame,
  Radio,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  diagnostic?: {
    disease: string;
    severity: string;
  };
  toolCalls?: Array<{
    name: string;
    summary: string;
  }>;
}

export default function Home() {
  const {
    telemetry,
    alerts,
    soundArmed,
    isMuted,
    sirenPlaying,
    armAudio,
    testAlarm,
    toggleMute,
    refreshTelemetry,
  } = useFarmTelemetry();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize theme from system or preference (defaults to light)
  useEffect(() => {
    const savedTheme = localStorage.getItem("el-nino-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("el-nino-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseStreamMetadata = (text: string) => {
    let cleaned = text;
    let disease: string | null = null;
    let severity: string | null = null;
    const toolCalls: Array<{ name: string; summary: string }> = [];

    const diagMatch = cleaned.match(
      /\[DIAGNOSIS:\s*([^|]+)\|\s*SEVERITY:\s*([^\]]+)\]/i
    );
    if (diagMatch) {
      disease = diagMatch[1].trim();
      severity = diagMatch[2].trim();
      cleaned = cleaned.replace(diagMatch[0], "");
    }

    const toolRegex = /\[TOOL_CALL:\s*([^|]+)\|\s*SUMMARY:\s*([^\]]+)\]/gi;
    let toolMatch: RegExpExecArray | null;
    while ((toolMatch = toolRegex.exec(text)) !== null) {
      toolCalls.push({
        name: toolMatch[1].trim(),
        summary: toolMatch[2].trim(),
      });
    }
    cleaned = cleaned.replace(toolRegex, "");

    return {
      disease,
      severity,
      toolCalls,
      cleanedText: cleaned.trim(),
    };
  };

  const handleSubmit = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input.trim();
    if ((!textToSend && !selectedImage) || isStreaming) return;

    const currentImage = selectedImage;
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: textToSend,
        image: currentImage || undefined,
      },
    ];

    setMessages(newMessages);
    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsStreaming(true);

    // Placeholder message for streaming response
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          image: currentImage,
          history: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate response.");
      }

      if (!response.body) throw new Error("No readable stream received.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        accumulatedText += decoder.decode(value, { stream: true });

        const { disease, severity, toolCalls, cleanedText } =
          parseStreamMetadata(accumulatedText);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: cleanedText,
                  diagnostic:
                    disease && severity
                      ? { disease, severity }
                      : m.diagnostic,
                  toolCalls: toolCalls.length > 0 ? toolCalls : m.toolCalls,
                }
              : m
          )
        );
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content:
                  `⚠️ **Error connecting to El-Nino AI:**\n${err.message || "Please check your network and Gemini API configuration."}`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="El Niño emblem" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-serif font-bold text-xl tracking-tight block">El Niño</span>
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
                Agro AI & Pathology
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 flex flex-col gap-2">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] px-4 py-2.5 font-medium text-sm transition-all hover:bg-[var(--bg-hover)] shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <button
            onClick={() => {
              setShowSimulation(true);
              setSidebarOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-white px-4 py-2.5 font-medium text-sm transition-all hover:bg-[var(--accent-strong)] shadow-xs"
          >
            <Activity className="h-4 w-4" />
            3D Farm Twin (Live IoT)
          </button>
        </div>

        {/* Status Section */}
        <div className="px-5 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            System Intelligence
          </span>
          <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-online)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--status-online)]"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Gemini 3.1 Flash AI</span>
              <span className="text-[10px] text-[var(--text-secondary)]">Multimodal Vision & Streaming</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 shadow-xs text-xs">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)] shrink-0" />
            <span className="text-[11px] text-[var(--text-secondary)]">
              Grounded with Nigerian Agro DB (20 Crops, ₦ Prices)
            </span>
          </div>
        </div>

        {/* Quick Advisories */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Quick Advisories
          </span>
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => {
                handleSubmit("Check my live ESP32 farm sensors right now — how are soil moisture, water level, rain, and fire safety?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--accent-soft-border)] bg-[var(--accent-soft)]/70 p-2.5 text-left text-xs font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent-soft)]"
            >
              📡 Check live farm sensor status
            </button>
            <button
              onClick={() => {
                handleSubmit("My tomato leaves have dark water-soaked spots with gray fuzz. What disease is this and how do I cure it?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-left text-xs font-medium transition-colors hover:border-[var(--accent-soft-border)] hover:bg-[var(--bg-hover)]"
            >
              🌿 Diagnose leaf blight
            </button>
            <button
              onClick={() => {
                handleSubmit("What are the current market prices for Cassava and Maize in Mile 12, Bodija, and Dawanau?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-left text-xs font-medium transition-colors hover:border-[var(--accent-soft-border)] hover:bg-[var(--bg-hover)]"
            >
              📊 Check regional market prices (₦)
            </button>
            <button
              onClick={() => {
                handleSubmit("When should I apply NPK 15-15-15 and Urea to my maize field, and what is the cost per bag?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-left text-xs font-medium transition-colors hover:border-[var(--accent-soft-border)] hover:bg-[var(--bg-hover)]"
            >
              🌽 Maize fertilizer schedule
            </button>
            <button
              onClick={() => {
                handleSubmit("Fall Armyworm is destroying my corn whorls. What pesticide and dosage should I use in Nigeria?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-left text-xs font-medium transition-colors hover:border-[var(--accent-soft-border)] hover:bg-[var(--bg-hover)]"
            >
              🐛 Fall Armyworm treatment
            </button>
            <button
              onClick={() => {
                handleSubmit("With irregular rainfall and dry spells this season, what irrigation, drainage, and soil practices should I adopt?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-left text-xs font-medium transition-colors hover:border-[var(--accent-soft-border)] hover:bg-[var(--bg-hover)]"
            >
              🌦️ Unpredictable weather & dry spell advice
            </button>
            <button
              onClick={() => {
                handleSubmit("A bushfire has broken out near my farmland during this dry season. What emergency steps and firebreaks should I create immediately?");
                setSidebarOpen(false);
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-left text-xs font-medium transition-colors hover:border-[var(--accent-soft-border)] hover:bg-[var(--bg-hover)]"
            >
              🔥 Wildfire defense & firebreak advice
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-subtle)] p-4">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
              {theme}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Chat Canvas */}
      <main className="flex flex-1 flex-col h-full overflow-hidden bg-[var(--bg-app)]">
        {/* Top Navbar for Mobile */}
        <header className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <img src="/logo-mark.svg" alt="El Niño" className="h-6 w-6 object-contain" />
            <span className="font-serif font-bold text-base">El Niño</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSimulation(true)}
              className="flex items-center gap-1 rounded-lg bg-[var(--accent)] text-white px-2.5 py-1 text-xs font-medium shadow-2xs"
            >
              <Activity className="h-3.5 w-3.5" />
              3D Twin
            </button>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
        </header>

        {/* Global Live Farm Status & Judge Alarm Bar (Visible on Phone & Desktop) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs">
          <button
            onClick={() => setShowSimulation(true)}
            className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-1 font-medium hover:border-[var(--accent)] transition-colors"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                telemetry.isFire
                  ? "bg-red-600 animate-ping"
                  : telemetry.source === "awaiting" || telemetry.soilMoisture === null
                  ? "bg-amber-500 animate-pulse"
                  : telemetry.isOnline
                  ? "bg-emerald-500"
                  : "bg-slate-400"
              }`}
            />
            {telemetry.source === "awaiting" || telemetry.soilMoisture === null ? (
              <span>Awaiting ESP32 Sensors • Open 3D Twin</span>
            ) : (
              <span>
                {telemetry.isFire ? "🔥 FIRE ALERT" : telemetry.isOnline ? "ESP32 Live" : "ESP32 Cached"} • Soil{" "}
                <strong>{telemetry.soilMoisture}%</strong> • Water{" "}
                <strong>{telemetry.waterLevel}%</strong>
                {telemetry.isRaining ? " • 🌧️ Raining" : ""}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={armAudio}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold border transition-all ${
                soundArmed
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                  : "border-amber-500/40 bg-amber-500 text-white animate-pulse shadow-xs"
              }`}
              title="Unlock browser speaker for live wildfire alarms"
            >
              {soundArmed ? (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>Phone Alarm Armed</span>
                </>
              ) : (
                <>
                  <BellOff className="h-3.5 w-3.5" />
                  <span>Tap to Arm Phone Fire Siren</span>
                </>
              )}
            </button>

            <button
              onClick={testAlarm}
              className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1 text-[11px] font-medium hover:bg-[var(--bg-hover)] transition-colors"
              title="Test Web Audio Fire Siren (1.8s)"
            >
              <Volume2 className={`h-3.5 w-3.5 ${sirenPlaying ? "text-red-600 animate-bounce" : "text-[var(--text-secondary)]"}`} />
              <span className="hidden sm:inline">Test Siren</span>
            </button>
          </div>
        </div>

        {/* Global Wildfire Emergency Banner (Flashes on ALL screens including Judges' Phones) */}
        {telemetry.isFire && (
          <div className="bg-red-600 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold animate-pulse shadow-md z-30">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 shrink-0" />
              <span>
                🔥 <strong>WILDFIRE EMERGENCY DETECTED!</strong> IR Flame Sensor triggered on demo farm — physical buzzer &amp; alert active!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="flex items-center gap-1 rounded-lg border border-white/40 bg-red-700 px-2.5 py-1 text-xs font-bold hover:bg-red-800"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {isMuted ? "Unmute" : "Mute Siren"}
              </button>
              <button
                onClick={() => setShowSimulation(true)}
                className="rounded-lg border border-white/40 bg-red-700 px-2.5 py-1 text-xs font-bold hover:bg-red-800"
              >
                View 3D Twin
              </button>
              <button
                onClick={() =>
                  handleSubmit(
                    "CRITICAL: Our farm ESP32 flame sensor just triggered a WILDFIRE ALARM! Give me immediate emergency firebreak, crop protection, and containment steps."
                  )
                }
                className="rounded-lg bg-white text-red-700 px-3 py-1 text-xs font-bold hover:bg-red-50 shadow-xs"
              >
                Emergency Fire Protocol
              </button>
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 lg:px-24">
          {messages.length === 0 ? (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-soft-border)] shadow-sm mb-4">
                <Sprout className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Ask about your farm
              </h1>
              <p className="mt-2 max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
                Snap or upload a diseased crop leaf for instant AI pathology diagnosis, monitor your live 3D IoT farm twin, or ask about fertilizer timing and Nigerian market prices.
              </p>

              {/* Action Cards */}
              <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setShowSimulation(true)}
                  className="cursor-pointer group flex flex-col items-center text-center rounded-2xl border border-[var(--accent-soft-border)] bg-[var(--accent-soft)]/50 p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-md"
                >
                  <Activity className="h-6 w-6 text-[var(--accent)] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-xs text-[var(--accent-strong)]">3D Farm Digital Twin</span>
                  <span className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    Live ESP32 soil, rain & wildfire sensor stream
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer group flex flex-col items-center text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-md"
                >
                  <Camera className="h-6 w-6 text-[var(--accent)] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-xs">Scan Plant Leaf</span>
                  <span className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                    Upload photo for instant disease diagnosis
                  </span>
                </div>

                <div
                  onClick={() => handleSubmit("What are current cassava and maize prices across Nigerian markets?")}
                  className="cursor-pointer group flex flex-col items-center text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-md"
                >
                  <TrendingUp className="h-6 w-6 text-[var(--accent)] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-xs">Market Prices</span>
                  <span className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                    Real-time ₦/kg rates at Mile 12 & Bodija
                  </span>
                </div>

                <div
                  onClick={() => handleSubmit("Give me a comprehensive pest treatment guide for tomatoes in rainy season")}
                  className="cursor-pointer group flex flex-col items-center text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-md"
                >
                  <AlertTriangle className="h-6 w-6 text-[var(--accent)] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-xs">Pest & Blight Fix</span>
                  <span className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                    Organic remedies and local agrochemicals
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-xs mt-1">
                      <Leaf className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[85%] rounded-2xl p-4 shadow-xs transition-all ${
                      msg.role === "user"
                        ? "bg-[var(--user-bubble-bg)] text-[var(--user-bubble-text)] rounded-tr-xs"
                        : "bg-[var(--ai-bubble-bg)] border border-[var(--ai-bubble-border)] rounded-tl-xs"
                    }`}
                  >
                    {/* User Image Attachment */}
                    {msg.image && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-white/20 max-w-xs">
                        <img
                          src={msg.image}
                          alt="Crop scan"
                          className="h-auto w-full object-cover max-h-60"
                        />
                      </div>
                    )}

                    {/* Gemini Live IoT Tool-Call Badges */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mb-3 flex flex-col gap-1.5">
                        {msg.toolCalls.map((tc, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
                          >
                            <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>
                              AI Read Live Tool ({tc.name}):{" "}
                              <span className="font-normal">{tc.summary}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Plant Pathology Diagnostic Badge */}
                    {msg.diagnostic && (
                      <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--accent-soft-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)]">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                        <span>
                          {msg.diagnostic.disease} • Severity: {msg.diagnostic.severity}
                        </span>
                      </div>
                    )}

                    {/* Message Text */}
                    {msg.role === "assistant" ? (
                      <div className="markdown-body">
                        {msg.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-2 py-1 text-xs text-[var(--text-tertiary)]">
                            <Sparkles className="h-4 w-4 animate-spin text-[var(--accent)]" />
                            <span>El-Nino is diagnosing your query…</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    )}

                    {/* Copy Button for Assistant */}
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-app)] p-4 md:px-12 lg:px-24">
          <div className="mx-auto max-w-3xl">
            {/* Image Preview Pill */}
            {selectedImage && (
              <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-xs w-fit">
                <img
                  src={selectedImage}
                  alt="Selected leaf"
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Crop leaf attached</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Ready for Gemini pathology analysis
                  </span>
                </div>
                <button
                  onClick={removeImage}
                  className="rounded-full p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input Form */}
            <div className="relative flex items-end gap-2 rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] p-2.5 shadow-sm focus-within:border-[var(--accent)] transition-all">
              {/* File Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                title="Attach plant leaf photo"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about crop diseases, planting timing, fertilizers, or prices…"
                rows={1}
                className="flex-1 resize-none bg-transparent py-1.5 text-sm placeholder-[var(--text-tertiary)] focus:outline-hidden max-h-36"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && !selectedImage) || isStreaming}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-strong)]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-[var(--text-tertiary)]">
              El-Nino connects Google Gemini Multimodal Vision with Nigerian agricultural field data.
            </p>
          </div>
        </div>
      </main>

      {/* 3D Farmland Digital Twin Simulation Modal */}
      {showSimulation && (
        <FarmSimulation3D
          externalTelemetry={telemetry}
          externalAlerts={alerts}
          soundArmed={soundArmed}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onArmAudio={armAudio}
          onRefreshTelemetry={refreshTelemetry}
          onAskAI={(prompt) => {
            setShowSimulation(false);
            handleSubmit(prompt);
          }}
          onClose={() => setShowSimulation(false)}
        />
      )}
    </div>
  );
}
