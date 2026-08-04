"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { VideoBackground } from "@/components/ui/VideoBackground";

interface AudioContextType {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  hasVideo: boolean;
}

const AudioContext = createContext<AudioContextType>({
  muted: true,
  setMuted: () => {},
  toggleMute: () => {},
  hasVideo: false,
});

// Pages that display the background video
const VIDEO_PAGES = ["/", "/register", "/about", "/event"];

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(true);
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith("/admin-panel");
  const hasVideo = !isAdminPage && VIDEO_PAGES.some((p) => pathname === p || pathname?.startsWith(p + "/"));

  const toggleMute = () => {
    setMuted((prev) => !prev);
  };

  return (
    <AudioContext.Provider value={{ muted, setMuted, toggleMute, hasVideo }}>
      {hasVideo && <VideoBackground muted={muted} />}
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
