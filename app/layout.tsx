import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import { AudioProvider } from "@/contexts/AudioContext";
import { FuturisticScrollbar } from "@/components/ui/FuturisticScrollbar";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#05070e",
};

export const metadata: Metadata = {
  title: "Glitch Fest 2026 | IceBreaking - VRGC VIT Bhopal",
  description: "Official interactive event arena, trivia quiz, live audience polls, and realtime standings for Glitch Fest 2026 by VRGC at VIT Bhopal University.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, outfit.variable, "font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[#05070e] text-slate-100 font-sans">
        <AudioProvider>
          {children}
          <FuturisticScrollbar />
        </AudioProvider>
      </body>
    </html>
  );
}
