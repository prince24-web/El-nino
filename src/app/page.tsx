"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Camera,
  Copy,
  Check,
  Menu,
  Leaf,
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
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize theme from system or preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("el-nino-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
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

  const parseDiagnosisHeader = (text: string) => {
    const match = text.match(/\[DIAGNOSIS:\s*([^|]+)\|\s*SEVERITY:\s*([^\]]+)\]/i);
    if (match) {
      return {
        disease: match[1].trim(),
        severity: match[2].trim(),
        cleanedText: text.replace(match[0], "").trim(),
      };
    }
    return {
      disease: null,
      severity: null,
      cleanedText: text,
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

        const { disease, severity, cleanedText } = parseDiagnosisHeader(accumulatedText);

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block">El-Nino</span>
              <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
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

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] px-4 py-2.5 font-medium text-sm transition-all hover:bg-[var(--bg-hover)] shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New conversation
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
            <span className="font-bold text-base">El-Nino</span>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </header>

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
                Snap or upload a diseased crop leaf for instant AI pathology diagnosis, or ask about fertilizer timing, pest management, and Nigerian market prices.
              </p>

              {/* Action Cards */}
              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
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
    </div>
  );
}
