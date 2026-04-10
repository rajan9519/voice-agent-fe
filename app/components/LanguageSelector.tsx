"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { LANGUAGES, Language } from "@/lib/languages";
import clsx from "clsx";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}

export default function LanguageSelector({
  value,
  onChange,
  label,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {label && (
        <p className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6B7C6D" }}>
          {label}
        </p>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all",
          open ? "ring-2" : ""
        )}
        style={{
          background: "#FDFCF8",
          borderColor: open ? "#3D6B4F" : "#D6D1C4",
          color: "#1C2B1E",
          boxShadow: open ? "0 0 0 3px rgba(61,107,79,0.12)" : undefined,
        }}
      >
        <span className="text-base">{selected.flag}</span>
        <span className="flex-1 text-left">{selected.name}</span>
        <ChevronDown
          className={clsx("w-4 h-4 transition-transform", open && "rotate-180")}
          style={{ color: "#6B7C6D" }}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 w-64 rounded-xl shadow-xl overflow-hidden animate-slide-up border" style={{ background: "#FDFCF8", borderColor: "#D6D1C4" }}>
          <div className="p-2 border-b" style={{ borderColor: "#E3DFD4" }}>
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "#F0EDE4" }}>
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#6B7C6D" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search language..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
                style={{ color: "#1C2B1E" }}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onChange(lang.code);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors text-left"
                style={lang.code === value
                  ? { background: "#1C2B1E", color: "#fff" }
                  : { color: "#1C2B1E" }
                }
                onMouseEnter={e => { if (lang.code !== value) (e.currentTarget as HTMLElement).style.background = "#EDE9DF"; }}
                onMouseLeave={e => { if (lang.code !== value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span>{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                <span
                  className="ml-auto text-xs"
                  style={{ color: lang.code === value ? "rgba(255,255,255,0.6)" : "#6B7C6D" }}
                >
                  {lang.nativeName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
