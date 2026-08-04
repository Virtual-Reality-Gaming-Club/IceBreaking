"use client";

import { useEffect, useRef, useState } from "react";

export function FuturisticScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  // Use a ref for dragging so state changes never trigger listener re-subscriptions
  const isDraggingRef = useRef(false);

  // Single stable listener setup — no setInterval polling, ResizeObserver instead
  useEffect(() => {
    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollable = scrollHeight > 5;
      setCanScroll(scrollable);
      if (!scrollable || isDraggingRef.current) return;
      setScrollPercent(Math.max(0, Math.min(window.scrollY / scrollHeight, 1)));
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    // ResizeObserver replaces the 500ms setInterval — only fires when content height changes
    const ro = new ResizeObserver(update);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []); // Mount once — isDraggingRef is a ref, no stale closure

  // Drag handlers — mounted once, never re-subscribed
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const progress = Math.max(
        0,
        Math.min((e.clientY - track.getBoundingClientRect().top) / track.clientHeight, 1)
      );
      setScrollPercent(progress);
      window.scrollTo(0, progress * (document.documentElement.scrollHeight - window.innerHeight));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []); // Mount once

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const track = trackRef.current;
    if (!track) return;
    const progress = Math.max(
      0,
      Math.min((e.clientY - track.getBoundingClientRect().top) / track.clientHeight, 1)
    );
    setScrollPercent(progress);
    window.scrollTo(0, progress * (document.documentElement.scrollHeight - window.innerHeight));
  };

  if (!canScroll) return null;

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 w-2.5 hover:w-3.5 h-64 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-xl cursor-pointer hover:bg-slate-900/90 hover:border-violet-500/50 transition-[width,background-color,border-color] duration-300 group overflow-hidden animate-liquid-pulse"
      style={{
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 10px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      {/* Liquid filling progress bar */}
      <div
        className="absolute top-0 left-0 right-0 rounded-full bg-gradient-to-b from-cyan-600/80 via-violet-700/85 to-purple-900/90 transition-[height] duration-100 ease-out overflow-hidden shadow-[0_0_10px_rgba(147,51,234,0.4)]"
        style={{ height: `${scrollPercent * 100}%` }}
      >
        {/* Animated Liquid Wave 1 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-[40%] bg-cyan-400/25 opacity-70 blur-[0.5px] animate-liquid-wave-1 pointer-events-none" />

        {/* Animated Liquid Wave 2 (counter-rotating) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-[42%] bg-violet-400/30 opacity-75 blur-[0.5px] animate-liquid-wave-2 pointer-events-none" />

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
