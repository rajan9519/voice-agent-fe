"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface TranscriptEntry {
  id: string;
  original: string;
  translated: string;
  timestamp: Date;
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  fromLang: string;
  toLang: string;
  isListening: boolean;
  interimText?: string;
}

export default function TranscriptPanel({
  entries,
  fromLang,
  toLang,
  isListening,
  interimText,
}: TranscriptPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (entries.length === 0 && !isListening) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#E3DFD4" }}>
          <span className="text-xl">💬</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#6B7C6D" }}>
          Start speaking to see your real-time transcription and translation appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="group rounded-xl overflow-hidden animate-slide-up transition-colors border"
          style={{ background: "#FDFCF8", borderColor: "#DDD9CE" }}
        >
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: "#E3DFD4" }}>
            <div className="p-3.5">
              <p className="text-[10px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "#6B7C6D" }}>
                {fromLang.toUpperCase()}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#2A3B2C" }}>{entry.original}</p>
            </div>
            <div className="p-3.5" style={{ background: "#F0EDE4" }}>
              <p className="text-[10px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "#6B7C6D" }}>
                {toLang.toUpperCase()}
              </p>
              <p className="text-sm leading-relaxed font-medium" style={{ color: "#1C2B1E" }}>
                {entry.translated}
              </p>
            </div>
          </div>
          <div className="px-3.5 pb-2.5 flex items-center justify-between" style={{ borderTop: "1px solid #E3DFD4" }}>
            <span className="text-[10px]" style={{ color: "#6B7C6D" }}>{formatTime(entry.timestamp)}</span>
            <button
              onClick={() => handleCopy(entry.translated, entry.id)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all opacity-0 group-hover:opacity-100"
              style={copiedId === entry.id
                ? { background: "#1C2B1E", color: "#fff" }
                : { color: "#6B7C6D" }
              }
            >
              {copiedId === entry.id ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      ))}

      {isListening && interimText && (
        <div className="rounded-xl border border-dashed p-4 animate-pulse" style={{ borderColor: "#B8B3A5", background: "#F0EDE4" }}>
          <p className="text-[10px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "#6B7C6D" }}>
            Listening...
          </p>
          <p className="text-sm italic" style={{ color: "#6B7C6D" }}>{interimText}</p>
        </div>
      )}

      {isListening && !interimText && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#3D6B4F",
                  animation: `waveform 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: "#6B7C6D" }}>Waiting for speech...</p>
        </div>
      )}
    </div>
  );
}
