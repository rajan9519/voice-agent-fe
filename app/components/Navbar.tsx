"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Globe } from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/translate", label: "Live Translate" },
    { href: "/upload", label: "Upload & Translate" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: "rgba(246,244,238,0.92)", borderColor: "#D6D1C4" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-95 transition-transform" style={{ background: "#1C2B1E" }}>
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: "#1C2B1E" }}>
            LinguaLive
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === link.href
                  ? "text-white"
                  : "hover:text-[#1C2B1E]"
              )}
              style={pathname === link.href
                ? { background: "#1C2B1E", color: "#fff" }
                : { color: "#4A5C4E" }
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border" style={{ color: "#6B7C6D", borderColor: "#D6D1C4" }}>
            <Globe className="w-3.5 h-3.5" />
            <span>20 languages</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
