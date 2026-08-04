"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Info, Menu, X, Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";

interface PublicNavbarProps {
  muted?: boolean;
  onToggleMute?: () => void;
}

export function PublicNavbar({ muted, onToggleMute }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const audio = useAudio();

  const isMuted = muted !== undefined ? muted : audio?.muted;
  const handleToggleMute = onToggleMute || audio?.toggleMute;
  const showVoiceToggle = muted !== undefined ? true : audio?.hasVideo;

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "transparent",
        padding: "16px 0",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand Logo & Name */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "transform 0.2s ease",
            }}
            className="hover:scale-[1.02]"
          >
            <Image
              src="/logo.png"
              alt="VRGC Logo"
              width={75}
              height={38}
              style={{ objectFit: "contain" }}
              priority
            />
          </Link>

          {/* Right Action Cluster (Desktop Nav, Voice Toggle, Mobile Menu) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Desktop Navigation — Completely Borderless & Boxless */}
            <nav
              className="desktop-nav"
              style={{ display: "flex", alignItems: "center", gap: "24px", marginRight: "8px" }}
            >
              <style>{`
                @media (max-width: 768px) {
                  .desktop-nav { display: none !important; }
                  .mobile-menu-btn { display: flex !important; }
                }
                @media (min-width: 769px) {
                  .mobile-menu-btn { display: none !important; }
                }
              `}</style>

              {/* About Link */}
              <Link
                href="/about"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#cbd5e1",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                className="hover:text-white"
              >
                <Info size={15} />
                About
              </Link>


              {/* Event Hub Link */}
              <Link
                href="/event"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#a78bfa",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                className="hover:text-white"
              >
                🎮 Event Hub
              </Link>


            </nav>

            {/* Voice Toggle Button — only shown on pages with the background video */}
            {showVoiceToggle && (
              <button
                onClick={handleToggleMute}
                title={isMuted ? "Turn Sound On" : "Turn Sound Off"}
                aria-label={isMuted ? "Turn Sound On" : "Turn Sound Off"}
                style={{
                  background: isMuted ? "rgba(255, 255, 255, 0.18)" : "rgba(124, 58, 237, 0.9)",
                  border: isMuted ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid rgba(167, 139, 250, 0.8)",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  transition: "all 0.2s ease",
                  boxShadow: isMuted ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 0 14px rgba(124, 58, 237, 0.6)",
                }}
                className="hover:scale-110 active:scale-95"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: "0",
                color: "#ffffff",
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: "rgba(10, 12, 18, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "18px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "10px",
          }}
        >
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#f8fafc",
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Info size={18} />
            About
          </Link>


        </div>
      )}
    </header>
  );
}
