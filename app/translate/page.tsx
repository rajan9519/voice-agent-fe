"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, ArrowLeftRight, Trash2 } from "lucide-react";
import LanguageSelector from "@/app/components/LanguageSelector";
import Waveform from "@/app/components/Waveform";
import { LANGUAGES } from "@/lib/languages";
import clsx from "clsx";

// Convert language code ("en") → backend full name ("english")
function toBackendLang(code: string): string {
  return (LANGUAGES.find((l) => l.code === code)?.name ?? code).toLowerCase();
}

// Fixed defaults — no UI to change these
const DEFAULTS = {
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws",
  sttProvider: "sarvam",
  ttsProvider: "cartesia",
  ttsVoice: "default",
  ttsSampleRate: 22050,
  flushThreshold: 120,
  usePartials: false,
};

type MessageRole = "user" | "agent" | "system";

interface Message {
  id: number;
  role: MessageRole;
  text: string;
  partial: boolean;
  timestamp: Date;
}

let msgIdCounter = 0;

export default function VoiceAgentPage() {
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("hi");
  const [status, setStatus] = useState<"idle" | "connected" | "error">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for audio/WS — mutations here don't need re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const partialUserIdRef = useRef<number | null>(null);
  const partialAgentIdRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Stable delegate ref so ws.onmessage always calls the latest closure
  const onMessageRef = useRef<(evt: MessageEvent) => void>(() => {});

  const isActive = status === "connected";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Message helpers ───────────────────────────────────────────
  function addMessage(role: MessageRole, text: string, partial = false): number {
    const id = ++msgIdCounter;
    setMessages((prev) => [...prev, { id, role, text, partial, timestamp: new Date() }]);
    return id;
  }

  function updateMessage(id: number, text: string, partial: boolean) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text, partial } : m))
    );
  }

  function appendToMessage(id: number, chunk: string, partial: boolean) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + chunk, partial } : m))
    );
  }

  // ── Audio playback ────────────────────────────────────────────
  function playAudio(arrayBuffer: ArrayBuffer) {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const float32 = new Float32Array(arrayBuffer);
    if (float32.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32.length, ctx.sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  }

  // ── WebSocket message handler (always-fresh via ref delegate) ──
  onMessageRef.current = (evt: MessageEvent) => {
    if (evt.data instanceof ArrayBuffer) {
      playAudio(evt.data);
      return;
    }

    let msg: { type: string; text?: string; is_final?: boolean; message?: string };
    try { msg = JSON.parse(evt.data as string); } catch { return; }

    switch (msg.type) {
      case "session.started":
        addMessage("system", "Session started — speak now.");
        beginStreaming();
        break;

      case "transcript": {
        const text = msg.text ?? "";
        const isFinal = msg.is_final ?? false;
        if (!text) break;
        if (partialUserIdRef.current !== null && !isFinal) {
          updateMessage(partialUserIdRef.current, text, true);
        } else if (partialUserIdRef.current !== null && isFinal) {
          updateMessage(partialUserIdRef.current, text, false);
          partialUserIdRef.current = null;
        } else if (!isFinal) {
          partialUserIdRef.current = addMessage("user", text, true);
        } else {
          addMessage("user", text, false);
        }
        break;
      }

      case "reply": {
        const text = msg.text ?? "";
        const isFinal = msg.is_final ?? false;
        if (!text) break;
        if (partialAgentIdRef.current !== null && !isFinal) {
          appendToMessage(partialAgentIdRef.current, text, true);
        } else if (partialAgentIdRef.current !== null && isFinal) {
          appendToMessage(partialAgentIdRef.current, text, false);
          partialAgentIdRef.current = null;
        } else if (!isFinal) {
          partialAgentIdRef.current = addMessage("agent", text, true);
        } else {
          addMessage("agent", text, false);
        }
        break;
      }

      case "session.closed":
        addMessage("system", "Session closed: " + (msg.message ?? "connection closed by server"));
        if (wsRef.current) wsRef.current.close();
        teardown();
        break;

      case "error":
        addMessage("system", "⚠ " + (msg.message ?? "unknown error"));
        break;
    }
  };

  // ── Microphone init (inside click → user gesture) ─────────────
  async function initMicrophone() {
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    captureCtxRef.current = new AudioContext({ sampleRate: 16000 });
    if (captureCtxRef.current.state === "suspended") await captureCtxRef.current.resume();

    const processorCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0];
          if (input.length > 0 && input[0].length > 0) {
            const float32 = input[0];
            const int16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
              let s = float32[i];
              s = s < -1 ? -1 : s > 1 ? 1 : s;
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(int16.buffer, [int16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;
    const blob = new Blob([processorCode], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    await captureCtxRef.current.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);
  }

  // ── Begin streaming after session.started ──────────────────────
  function beginStreaming() {
    if (!captureCtxRef.current || !mediaStreamRef.current) return;
    const ctx = captureCtxRef.current;
    const source = ctx.createMediaStreamSource(mediaStreamRef.current);
    workletNodeRef.current = new AudioWorkletNode(ctx, "pcm-processor");

    workletNodeRef.current.port.onmessage = (e: MessageEvent) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(e.data as ArrayBuffer);
      }
    };

    source.connect(workletNodeRef.current);
    workletNodeRef.current.connect(ctx.destination);
    setIsListening(true);
  }

  // ── Teardown ──────────────────────────────────────────────────
  function teardown() {
    if (sessionTimerRef.current) { clearInterval(sessionTimerRef.current); sessionTimerRef.current = null; }
    setSessionSeconds(0);
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    captureCtxRef.current?.close();
    captureCtxRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    // Leave playbackCtxRef open — it gets reused on next session start
    wsRef.current = null;
    partialUserIdRef.current = null;
    partialAgentIdRef.current = null;
    nextPlayTimeRef.current = 0;
    setIsListening(false);
    setStatus("idle");
  }

  // ── Session start/stop ─────────────────────────────────────────
  const startSession = useCallback(async () => {
    setMessages([]);
    partialUserIdRef.current = null;
    partialAgentIdRef.current = null;
    nextPlayTimeRef.current = 0;
    try {
      // Create playback AudioContext here (user gesture) so the browser allows it
      if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
        playbackCtxRef.current = new AudioContext({ sampleRate: DEFAULTS.ttsSampleRate });
      }
      await playbackCtxRef.current.resume();

      await initMicrophone();

      const ws = new WebSocket(DEFAULTS.wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setSessionSeconds(0);
        sessionTimerRef.current = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
        setStatus("connected");
        const src = toBackendLang(fromLang);
        const tgt = toBackendLang(toLang);
        ws.send(JSON.stringify({
          type: "session.start",
          config: {
            mode: src === tgt ? "conversation" : "translation",
            source_language: src,
            target_language: tgt,
            stt_provider: DEFAULTS.sttProvider,
            tts_provider: DEFAULTS.ttsProvider,
            tts_voice: DEFAULTS.ttsVoice,
            tts_sample_rate: DEFAULTS.ttsSampleRate,
            flush_threshold: DEFAULTS.flushThreshold,
            use_partials: DEFAULTS.usePartials,
          },
        }));
      };

      // Delegate to ref so handler always has fresh closures
      ws.onmessage = (e) => onMessageRef.current(e);
      ws.onclose = () => { setStatus("idle"); teardown(); };
      ws.onerror = () => { setStatus("error"); teardown(); };
    } catch (e) {
      addMessage("system", "Error: " + (e instanceof Error ? e.message : String(e)));
      teardown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLang, toLang]);

  const stopSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "session.end" }));
      wsRef.current.close();
    }
    teardown();
  }, []);

  useEffect(() => () => teardown(), []);

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
  };

  const fromLangName = LANGUAGES.find((l) => l.code === fromLang)?.name ?? fromLang;
  const toLangName   = LANGUAGES.find((l) => l.code === toLang)?.name ?? toLang;

  const agentMessages = messages.filter((m) => m.role !== "system");
  const lastAgent = [...messages].reverse().find((m) => m.role === "agent" && !m.partial);

  return (
    <div className="min-h-screen pt-16" style={{ background: "#F6F4EE" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1C2B1E" }}>
            Voice Agent
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7C6D" }}>
            Speak into your microphone and get real-time responses
          </p>
        </div>

        {/* Language bar */}
        <div
          className="rounded-2xl p-5 mb-6 border"
          style={{ background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <LanguageSelector value={fromLang} onChange={setFromLang} label="Speak in" />
            <button
              onClick={swapLanguages}
              disabled={isActive}
              className="p-2.5 rounded-xl border transition-all mb-0.5 hover:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "#D6D1C4", background: "#F0EDE4", color: "#4A5C4E" }}
              title="Swap languages"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <LanguageSelector value={toLang} onChange={setToLang} label="Respond in" />
          </div>
        </div>

        {/* Main area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Chat transcript */}
          <div
            className="rounded-2xl overflow-hidden flex flex-col border"
            style={{ minHeight: 480, background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "#E3DFD4" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={clsx("w-2 h-2 rounded-full transition-colors", isListening && "animate-pulse")}
                  style={{ background: isListening ? "#3D6B4F" : isActive ? "#3D6B4F" : "#C5BFB0" }}
                />
                <span className="text-sm font-medium" style={{ color: "#1C2B1E" }}>
                  {isListening ? "Listening..." : isActive ? "Connected" : "Transcript"}
                </span>
                {agentMessages.length > 0 && (
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ color: "#6B7C6D", background: "#E3DFD4" }}>
                    {agentMessages.length}
                  </span>
                )}
              </div>
              {agentMessages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: "#6B7C6D" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#E3DFD4")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  title="Clear"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 py-16">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#E3DFD4" }}>
                    <span className="text-xl">💬</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7C6D" }}>
                    Press <strong>Start Session</strong> and speak — the agent will respond in real time.
                  </p>
                </div>
              )}

              {messages.map((m) => {
                if (m.role === "system") {
                  return (
                    <p key={m.id} className="text-xs text-center py-1" style={{ color: "#A0A89E" }}>
                      {m.text}
                    </p>
                  );
                }
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: isUser ? "#1C2B1E" : "#E8F0E9",
                        color: isUser ? "#D0E4D8" : "#1C2B1E",
                        borderBottomRightRadius: isUser ? 4 : undefined,
                        borderBottomLeftRadius: !isUser ? 4 : undefined,
                        opacity: m.partial ? 0.6 : 1,
                      }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-60">
                        {isUser ? fromLangName : toLangName}
                      </p>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Control panel */}
          <div className="space-y-4">

            {/* Mic control */}
            {isActive ? (
              /* ── Recording state ── */
              <div
                className="rounded-2xl p-6 flex flex-col items-center gap-5 border"
                style={{ background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full scale-110"
                    style={{ background: "rgba(61,107,79,0.15)", animation: "pulse 2s ease-in-out infinite" }}
                  />
                  <button
                    onClick={stopSession}
                    className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                    style={{ background: "#3D6B4F", boxShadow: "0 8px 24px rgba(61,107,79,0.35)" }}
                  >
                    <div className="w-6 h-6 rounded-md bg-white" />
                  </button>
                </div>

                <Waveform active bars={20} />

                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#1C2B1E" }}>Tap to stop</p>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: "#6B7C6D" }}>
                    {`${Math.floor(sessionSeconds / 60)}:${String(sessionSeconds % 60).padStart(2, "0")}`}
                  </p>
                </div>
              </div>
            ) : (
              /* ── Idle state ── */
              <div
                className="rounded-2xl p-6 flex flex-col items-center gap-5 border"
                style={{ background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}
              >
                <button
                  onClick={startSession}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{ background: "#1C2B1E", boxShadow: "0 8px 24px rgba(28,43,30,0.25)" }}
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>

                <div className="h-10" />

                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#1C2B1E" }}>Tap to speak</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7C6D" }}>Microphone is ready</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div
              className="rounded-2xl p-4 border"
              style={{ background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}
            >
              <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6B7C6D" }}>
                Session
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: "#EDE9DF" }}>
                  <p className="text-2xl font-bold" style={{ color: "#1C2B1E" }}>
                    {messages.filter((m) => m.role === "user").length}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7C6D" }}>You said</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "#EDE9DF" }}>
                  <p className="text-2xl font-bold" style={{ color: "#1C2B1E" }}>
                    {messages.filter((m) => m.role === "agent").length}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7C6D" }}>Responses</p>
                </div>
              </div>
            </div>

            {/* Last agent reply */}
            {lastAgent && (
              <div className="rounded-2xl p-4" style={{ background: "#152118" }}>
                <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#4A7A5A" }}>
                  Last Response
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#D0E4D8" }}>
                  {lastAgent.text}
                </p>
              </div>
            )}

            {/* Error state */}
            {status === "error" && (
              <div className="rounded-xl p-4 border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                <p className="text-xs text-red-600">Connection failed. Check the server is running.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
