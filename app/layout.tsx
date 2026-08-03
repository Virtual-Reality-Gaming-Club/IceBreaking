import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { ToastProvider } from "@/contexts/ToastContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { EVENT_CONFIG } from "@/config/event";
import "./globals.css";

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
};

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.name} · ${EVENT_CONFIG.clubName}`,
  description: EVENT_CONFIG.defaultDescription,
  keywords: [
    EVENT_CONFIG.clubName,
    EVENT_CONFIG.name,
    "VIT Bhopal",
    "Leaderboard",
    "Gaming Club",
    "Live Events",
  ],
  authors: [{ name: `${EVENT_CONFIG.clubName} Tech Team` }],
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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased">
        <AudioProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
