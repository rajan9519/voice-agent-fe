import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "LinguaLive — Real-time Audio Translation",
  description:
    "Real-time voice translation for conversations, travel, and language learning. Speak and get instant translations in 20+ languages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-black">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
