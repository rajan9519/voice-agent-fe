"use client";

import Link from "next/link";
import {
  Mic,
  Upload,
  ArrowRight,
  Globe,
  Zap,
  Volume2,
  BookOpen,
  Users,
  ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Real-time Voice Translation",
    description:
      "Speak naturally into your microphone and watch your words transform into any language instantly — no delays, no waiting.",
    href: "/translate",
    cta: "Start Speaking",
  },
  {
    icon: Upload,
    title: "Audio File Translation",
    description:
      "Upload existing recordings in MP3, WAV, M4A, and more. Our AI transcribes and translates them within seconds.",
    href: "/upload",
    cta: "Upload Files",
  },
  {
    icon: BookOpen,
    title: "Language Learning Companion",
    description:
      "Practice a new language with real-time corrections and translations. Learn by doing, not by studying.",
    href: "/translate",
    cta: "Start Learning",
  },
];

const STATS = [
  { value: "20+", label: "Languages" },
  { value: "<1s", label: "Latency" },
  { value: "99%", label: "Accuracy" },
  { value: "Free", label: "To try" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose your languages",
    description: "Select the language you'll speak in and the language you want to translate to.",
  },
  {
    step: "02",
    title: "Start speaking",
    description: "Press the microphone button and speak naturally. Our AI listens in real time.",
  },
  {
    step: "03",
    title: "See instant translation",
    description: "Every phrase is transcribed and translated as you speak, side by side.",
  },
];

export default function HomePage() {

  return (
    <div className="min-h-screen" style={{ background: "#F6F4EE" }}>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border" style={{ background: "#E8F0E9", borderColor: "#C5D9CA" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3D6B4F" }} />
            <span className="text-xs font-medium" style={{ color: "#2A3B2C" }}>
              Real-time translation · No signup needed
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-6" style={{ color: "#1C2B1E" }}>
            Speak any language.
            <br />
            <span style={{ color: "#7A8C7E" }}>Understood everywhere.</span>
          </h1>

          <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: "#4A5C4E" }}>
            Real-time voice translation for conversations, travel, and language learning.
            Just speak — we handle the rest.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/translate"
              className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#1C2B1E", color: "#F6F4EE", boxShadow: "0 8px 24px rgba(28,43,30,0.22)" }}
            >
              <Mic className="w-4 h-4" />
              Start Translating
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold border transition-all hover:opacity-80"
              style={{ background: "#FDFCF8", color: "#1C2B1E", borderColor: "#D6D1C4" }}
            >
              <Upload className="w-4 h-4" />
              Upload Audio
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-4 gap-6 max-w-xl">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold" style={{ color: "#1C2B1E" }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "#7A8C7E" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7A8C7E" }}>
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#1C2B1E" }}>
            Everything you need to communicate
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl p-6 transition-all border hover:shadow-lg"
                style={{ background: "#FDFCF8", borderColor: "#D6D1C4" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3D6B4F"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#D6D1C4"; }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-95 transition-transform" style={{ background: "#1C2B1E" }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#1C2B1E" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#4A5C4E" }}>
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-all hover:gap-2.5"
                  style={{ color: "#3D6B4F" }}
                >
                  {feature.cta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6" style={{ background: "#131C14" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A7A5A" }}>
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#D0E4D8" }}>
              Three steps to fluency
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%+1rem)] w-8 h-px" style={{ background: "#2E4231" }} />
                )}
                <div className="text-5xl font-bold mb-4 font-mono" style={{ color: "#2E4231" }}>
                  {step.step}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#D0E4D8" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B9E7A" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7A8C7E" }}>
            Use cases
          </p>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#1C2B1E" }}>
            Built for every conversation
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: Globe,
              title: "Travel & Tourism",
              description: "Navigate foreign cities, order food, and ask for directions without a language barrier.",
              style: { background: "#131C14" },
              titleColor: "#D0E4D8",
              descColor: "#6B9E7A",
              iconStyle: { background: "#1C2B1E" },
            },
            {
              icon: Users,
              title: "Business Meetings",
              description: "Conduct international meetings with real-time translation for all participants.",
              style: { background: "#FDFCF8", border: "1px solid #D6D1C4" },
              titleColor: "#1C2B1E",
              descColor: "#4A5C4E",
              iconStyle: { background: "#1C2B1E" },
            },
            {
              icon: BookOpen,
              title: "Language Learning",
              description: "Practice speaking with a companion that corrects and translates your phrases instantly.",
              style: { background: "#FDFCF8", border: "1px solid #D6D1C4" },
              titleColor: "#1C2B1E",
              descColor: "#4A5C4E",
              iconStyle: { background: "#1C2B1E" },
            },
            {
              icon: Volume2,
              title: "Media & Podcasts",
              description: "Upload recordings and get accurate transcriptions with translations in multiple languages.",
              style: { background: "#EDEAE0" },
              titleColor: "#1C2B1E",
              descColor: "#4A5C4E",
              iconStyle: { background: "#3D6B4F" },
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl p-7" style={item.style}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={item.iconStyle}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: item.titleColor }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: item.descColor }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl p-12" style={{ background: "#1C2B1E" }}>
            <h2 className="text-3xl font-bold mb-4 tracking-tight" style={{ color: "#D0E4D8" }}>
              Ready to break the language barrier?
            </h2>
            <p className="mb-8 text-sm leading-relaxed" style={{ color: "#6B9E7A" }}>
              Start translating in seconds. No account, no credit card, no hassle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/translate"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors hover:opacity-90"
                style={{ background: "#F6F4EE", color: "#1C2B1E" }}
              >
                <Mic className="w-4 h-4" />
                Start Speaking Now
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold border transition-colors hover:opacity-80"
                style={{ background: "#2E4231", color: "#D0E4D8", borderColor: "#3D6B4F" }}
              >
                <Upload className="w-4 h-4" />
                Upload Audio File
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6" style={{ borderColor: "#D6D1C4" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "#1C2B1E" }}>
              <Mic className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#1C2B1E" }}>LinguaLive</span>
          </div>
          <p className="text-xs" style={{ color: "#7A8C7E" }}>
            Real-time audio translation for everyone.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/translate" className="text-xs transition-colors" style={{ color: "#7A8C7E" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1C2B1E")}
              onMouseLeave={e => (e.currentTarget.style.color = "#7A8C7E")}
            >
              Live Translate
            </Link>
            <Link href="/upload" className="text-xs transition-colors" style={{ color: "#7A8C7E" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1C2B1E")}
              onMouseLeave={e => (e.currentTarget.style.color = "#7A8C7E")}
            >
              Upload Files
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
