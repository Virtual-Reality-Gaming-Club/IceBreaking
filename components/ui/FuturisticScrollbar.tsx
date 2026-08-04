"use client";

import { useEffect, useRef, useState } from "react";

export function FuturisticScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update scroll percentage based on window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isDragging) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setScrollPercent(0);
        return;
      }
      const progress = window.scrollY / scrollHeight;
      setScrollPercent(Math.max(0, Math.min(progress, 1)));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDragging]);

  // Handle click-and-drag anywhere on the track
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const trackHeight = track.clientHeight;
      const progress = Math.max(0, Math.min(clickY / trackHeight, 1));

      setScrollPercent(progress);

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, progress * scrollHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackHeight = track.clientHeight;
    const progress = Math.max(0, Math.min(clickY / trackHeight, 1));
    setScrollPercent(progress);

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, progress * scrollHeight);
  };

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 w-2.5 hover:w-3.5 h-64 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-xl cursor-pointer hover:bg-slate-900/90 hover:border-violet-500/50 transition-all duration-300 group overflow-hidden animate-liquid-pulse"
      style={{
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 10px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      {/* Liquid filling progress bar */}
      <div
        className="absolute top-0 left-0 right-0 rounded-full bg-gradient-to-b from-cyan-600/80 via-violet-700/85 to-purple-900/90 transition-all duration-100 ease-out overflow-hidden shadow-[0_0_10px_rgba(147,51,234,0.4)]"
        style={{
          height: `${scrollPercent * 100}%`,
        }}
      >
        {/* Animated Liquid Wave 1 */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-[40%] bg-cyan-400/25 opacity-70 blur-[0.5px] animate-liquid-wave-1 pointer-events-none"
        />

        {/* Animated Liquid Wave 2 (counter-rotating) */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-[42%] bg-violet-400/30 opacity-75 blur-[0.5px] animate-liquid-wave-2 pointer-events-none"
        />

        {/* Shimmering liquid shine overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-liquid-shine pointer-events-none"
          style={{ height: "100%" }}
        />

        {/* Soft liquid surface crest line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-200/60 shadow-[0_0_6px_rgba(103,232,249,0.5)]" />
      </div>

      {/* Inner Glass Highlight Line */}
      <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
    </div>
  );
}
