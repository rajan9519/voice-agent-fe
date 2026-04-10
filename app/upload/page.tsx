"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileAudio,
  ArrowLeftRight,
  Play,
  Pause,
  Trash2,
  Download,
  CheckCircle,
  Loader,
  X,
} from "lucide-react";
import LanguageSelector from "@/app/components/LanguageSelector";
import { LANGUAGES } from "@/lib/languages";
import clsx from "clsx";

interface AudioFile {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  originalText?: string;
  translatedText?: string;
  duration?: number;
  objectUrl: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Simulate transcription + translation
function simulateTranscription(
  _file: File,
  toLang: string
): Promise<{ original: string; translated: string }> {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const samples = [
          {
            original:
              "Welcome to LinguaLive. This is a demonstration of our audio translation service. We support over twenty languages with high accuracy.",
            translations: {
              es: "Bienvenido a LinguaLive. Esta es una demostración de nuestro servicio de traducción de audio. Apoyamos más de veinte idiomas con alta precisión.",
              fr: "Bienvenue sur LinguaLive. Ceci est une démonstration de notre service de traduction audio. Nous prenons en charge plus de vingt langues avec une grande précision.",
              de: "Willkommen bei LinguaLive. Dies ist eine Demonstration unseres Audio-Übersetzungsdienstes. Wir unterstützen über zwanzig Sprachen mit hoher Genauigkeit.",
              ja: "LinguaLiveへようこそ。これは私たちの音声翻訳サービスのデモンストレーションです。高精度で20以上の言語をサポートしています。",
              zh: "欢迎使用LinguaLive。这是我们音频翻译服务的演示。我们以高精度支持超过二十种语言。",
              it: "Benvenuto su LinguaLive. Questa è una dimostrazione del nostro servizio di traduzione audio. Supportiamo più di venti lingue con alta precisione.",
              pt: "Bem-vindo ao LinguaLive. Esta é uma demonstração do nosso serviço de tradução de áudio. Suportamos mais de vinte idiomas com alta precisão.",
              ru: "Добро пожаловать в LinguaLive. Это демонстрация нашего сервиса аудиоперевода. Мы поддерживаем более двадцати языков с высокой точностью.",
              ko: "LinguaLive에 오신 것을 환영합니다. 이것은 오디오 번역 서비스의 데모입니다. 높은 정확도로 20개 이상의 언어를 지원합니다.",
              ar: "مرحباً بك في LinguaLive. هذا عرض توضيحي لخدمة الترجمة الصوتية. ندعم أكثر من عشرين لغة بدقة عالية.",
              hi: "LinguaLive में आपका स्वागत है। यह हमारी ऑडियो अनुवाद सेवा का प्रदर्शन है। हम उच्च सटीकता के साथ बीस से अधिक भाषाओं का समर्थन करते हैं।",
            },
          },
        ];
        const sample = samples[0];
        const translated =
          sample.translations[toLang as keyof typeof sample.translations] ||
          `[${toLang.toUpperCase()}] ${sample.original}`;
        resolve({ original: sample.original, translated });
      },
      2000 + Math.random() * 2000
    );
  });
}

export default function UploadPage() {
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("es");
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fromLangName = LANGUAGES.find((l) => l.code === fromLang)?.name ?? fromLang;
  const toLangName = LANGUAGES.find((l) => l.code === toLang)?.name ?? toLang;

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
  };

  const processFile = useCallback(
    async (audioFile: AudioFile) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === audioFile.id ? { ...f, status: "processing" } : f
        )
      );
      try {
        const { original, translated } = await simulateTranscription(
          audioFile.file,
          toLang
        );
        setFiles((prev) =>
          prev.map((f) =>
            f.id === audioFile.id
              ? { ...f, status: "done", originalText: original, translatedText: translated }
              : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === audioFile.id ? { ...f, status: "error" } : f
          )
        );
      }
    },
    [toLang]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const audioFiles: AudioFile[] = newFiles
        .filter((f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i))
        .map((file) => ({
          id: `file-${Date.now()}-${Math.random()}`,
          file,
          status: "pending" as const,
          objectUrl: URL.createObjectURL(file),
        }));

      setFiles((prev) => [...prev, ...audioFiles]);
      audioFiles.forEach(processFile);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.objectUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const togglePlay = (file: AudioFile) => {
    if (playingId === file.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(file.objectUrl);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(file.id);
    }
  };

  const downloadResult = (file: AudioFile) => {
    if (!file.originalText || !file.translatedText) return;
    const text = `File: ${file.file.name}\n\n${fromLangName} (Original):\n${file.originalText}\n\n${toLangName} (Translation):\n${file.translatedText}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.file.name.replace(/\.[^/.]+$/, "")}-translation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusIcon = (status: AudioFile["status"]) => {
    switch (status) {
      case "processing":
        return <Loader className="w-4 h-4 animate-spin" style={{ color: "#6B7C6D" }} />;
      case "done":
        return <CheckCircle className="w-4 h-4" style={{ color: "#3D6B4F" }} />;
      case "error":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <FileAudio className="w-4 h-4" style={{ color: "#6B7C6D" }} />;
    }
  };

  return (
    <div className="min-h-screen pt-16" style={{ background: "#F6F4EE" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1C2B1E" }}>
            Upload & Translate
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7C6D" }}>
            Upload audio files to transcribe and translate them into any language
          </p>
        </div>

        {/* Language selector */}
        <div className="rounded-2xl p-5 mb-6 border" style={{ background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <LanguageSelector value={fromLang} onChange={setFromLang} label="Audio language" />
            <button
              onClick={swapLanguages}
              className="p-2.5 rounded-xl border transition-all mb-0.5 hover:scale-95"
              style={{ borderColor: "#D6D1C4", background: "#F0EDE4", color: "#4A5C4E" }}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <LanguageSelector value={toLang} onChange={setToLang} label="Translate to" />
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6"
          style={{
            borderColor: isDragging ? "#3D6B4F" : "#C5BFB0",
            background: isDragging ? "#E8F0E9" : "#FDFCF8",
            transform: isDragging ? "scale(1.01)" : "scale(1)",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.opus"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-colors"
              style={{ background: isDragging ? "#1C2B1E" : "#E3DFD4" }}
            >
              <Upload
                className="w-7 h-7 transition-colors"
                style={{ color: isDragging ? "#D0E4D8" : "#6B7C6D" }}
              />
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: "#1C2B1E" }}>
                {isDragging ? "Drop files here" : "Drop audio files or click to browse"}
              </p>
              <p className="text-sm mt-1" style={{ color: "#6B7C6D" }}>
                MP3, WAV, OGG, M4A, FLAC, AAC, OPUS — up to 100 MB each
              </p>
            </div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold" style={{ color: "#1C2B1E" }}>
                {files.length} {files.length === 1 ? "File" : "Files"}
              </h2>
              <button
                onClick={() => setFiles([])}
                className="text-xs transition-colors"
                style={{ color: "#6B7C6D" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1C2B1E")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7C6D")}
              >
                Clear all
              </button>
            </div>

            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl overflow-hidden border"
                style={{ background: "#FDFCF8", borderColor: "#D6D1C4", boxShadow: "0 1px 4px rgba(28,43,30,0.06)" }}
              >
                {/* File header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex-shrink-0">{statusIcon(file.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1C2B1E" }}>
                      {file.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "#6B7C6D" }}>
                        {formatFileSize(file.file.size)}
                      </span>
                      <span className="text-xs" style={{ color: "#C5BFB0" }}>·</span>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: file.status === "processing" ? "#6B7C6D"
                            : file.status === "done" ? "#3D6B4F"
                            : file.status === "error" ? "#ef4444"
                            : "#6B7C6D"
                        }}
                      >
                        {file.status === "processing"
                          ? "Transcribing & translating..."
                          : file.status === "done"
                          ? "Translation complete"
                          : file.status === "error"
                          ? "Failed to process"
                          : "Queued"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {[
                      { show: true, onClick: () => togglePlay(file), icon: playingId === file.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" /> },
                      { show: file.status === "done", onClick: () => downloadResult(file), icon: <Download className="w-4 h-4" /> },
                      { show: true, onClick: () => removeFile(file.id), icon: <Trash2 className="w-4 h-4" /> },
                    ].filter(b => b.show).map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.onClick}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "#6B7C6D" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#E3DFD4")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                {file.status === "processing" && (
                  <div className="px-5 pb-3">
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "#E3DFD4" }}>
                      <div className="h-full rounded-full" style={{ width: "60%", background: "#3D6B4F", animation: "pulse 1.5s ease-in-out infinite" }} />
                    </div>
                  </div>
                )}

                {/* Translation result */}
                {file.status === "done" && file.originalText && file.translatedText && (
                  <div className="border-t grid grid-cols-2 divide-x" style={{ borderColor: "#E3DFD4" }}>
                    <div className="p-5">
                      <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: "#6B7C6D" }}>
                        {fromLangName}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "#2A3B2C" }}>
                        {file.originalText}
                      </p>
                    </div>
                    <div className="p-5" style={{ background: "#F0EDE4" }}>
                      <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: "#6B7C6D" }}>
                        {toLangName}
                      </p>
                      <p className="text-sm leading-relaxed font-medium" style={{ color: "#1C2B1E" }}>
                        {file.translatedText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: "🎙️", label: "Speech Recognition", desc: "Industry-leading accuracy for 20+ languages" },
              { icon: "⚡", label: "Fast Processing", desc: "Results in seconds for most audio files" },
              { icon: "📥", label: "Export Results", desc: "Download transcripts as text files" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-5 text-center border"
                style={{ borderColor: "#DDD9CE", background: "#FDFCF8" }}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className="text-sm font-semibold" style={{ color: "#1C2B1E" }}>{item.label}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B7C6D" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
