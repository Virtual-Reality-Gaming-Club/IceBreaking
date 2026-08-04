"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className }: GlitchTextProps) {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 250);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={cn(
        "relative inline-block font-black text-black select-none cursor-default animate-flicker",
        glitchActive && "animate-glitch-shake",
        className
      )}
      data-text={text}
      style={{
        color: "#000000",
        WebkitTextStroke: "1.5px rgba(255, 255, 255, 0.8)",
        filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))",
      }}
    >
      {text}
    </span>
  );
}
