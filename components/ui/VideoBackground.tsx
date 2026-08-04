"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  muted?: boolean;
}

export function VideoBackground({ muted = true }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Directly sync muted state to HTML5 video element on every toggle change
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      video.play().catch(() => {});
    }
  }, [muted]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* HTML5 Native Video Background */}
      <video
        ref={videoRef}
        src="/hero-bg.mp4"
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "100vw",
          height: "56.25vw",
          minHeight: "100vh",
          minWidth: "177.77vh",
          transform: "translate(-50%, -50%) scale(1.05)",
          objectFit: "cover",
          filter: "blur(1px) brightness(0.82) contrast(1.1)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle Ambient Overlay Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(6, 7, 10, 0.15) 0%, rgba(6, 7, 10, 0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
