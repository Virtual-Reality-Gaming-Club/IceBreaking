"use client";

// ─── Home Page ─────────────────────────────────────────────────────────────────
// Official Glitch Fest Event Landing Page & Live Activity Hub.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEvent } from "@/hooks/useEvent";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SkeletonLoader } from "@/components/ui/loaders";
import { EVENT_CONFIG } from "@/config/event";
import { ShimmerButton, BorderBeam } from "@/components/magicui";

export default function HomePage() {
  const { event, isLoading } = useEvent();
  const [regNumber, setRegNumber] = useState<string | null>(null);

  // Check localStorage session for navigation CTA
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegNumber(localStorage.getItem("ib_reg_number"));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      <PublicNavbar />

      <main style={{ flex: 1, padding: "100px 20px 50px", maxWidth: "780px", margin: "0 auto", width: "100%", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "20px" }}>
            <SkeletonLoader style={{ height: "60px", borderRadius: "12px" }} />
            <SkeletonLoader style={{ height: "160px", borderRadius: "12px" }} />
          </div>
        )}

        {!isLoading && (
          <div>
            {/* Hero Section Container */}
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <p
                className="animate-fade-in-up"
                style={{ animationDelay: "0ms", fontSize: "0.82rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}
              >
                {EVENT_CONFIG.tagline}
              </p>

              <h1
                className="animate-fade-in-up"
                style={{ animationDelay: "50ms", fontSize: "clamp(2.4rem, 7vw, 3.8rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "14px", color: "#f8fafc", letterSpacing: "-0.02em" }}
              >
                <span className="text-gradient-primary">{event?.name || EVENT_CONFIG.name}</span>
              </h1>

              {event?.description && (
                <p
                  className="animate-fade-in-up"
                  style={{ animationDelay: "100ms", color: "#f1f5f9", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "560px", margin: "0 auto 24px", fontWeight: 500 }}
                >
                  {event.description}
                </p>
              )}

              {(event?.date || event?.venue) && (
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "150ms", display: "flex", gap: "12px", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: "28px" }}
                >
                  {event.date && (
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ffffff", background: "rgba(10, 13, 24, 0.85)", border: "1px solid rgba(148, 163, 184, 0.35)", borderRadius: "12px", padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
                      📅 {event.date}{event.time ? ` · ${event.time}` : ""}
                    </span>
                  )}
                  {event.venue && (
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ffffff", background: "rgba(10, 13, 24, 0.85)", border: "1px solid rgba(148, 163, 184, 0.35)", borderRadius: "12px", padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
                      📍 {event.venue}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "200ms", display: "flex", gap: "14px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}
              >
                {regNumber ? (
                  <Link href="/event" style={{ textDecoration: "none" }}>
                    <ShimmerButton
                      aria-label="Enter Event Hub"
                      style={{ padding: "14px 30px", fontSize: "0.95rem" }}
                    >
                      🎮 Enter Event Hub →
                    </ShimmerButton>
                  </Link>
                ) : event?.features?.registration === true ? (
                  <Link href="/register" style={{ textDecoration: "none" }}>
                    <ShimmerButton
                      aria-label="Register for the event"
                      style={{ padding: "14px 30px", fontSize: "0.95rem" }}
                    >
                      Register Now
                    </ShimmerButton>
                  </Link>
                ) : (
                  <div style={{ display: "inline-block", padding: "12px 24px", background: "rgba(10, 13, 24, 0.9)", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "12px" }}>
                    <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: 0, fontWeight: 600 }}>🔒 Registration is currently closed.</p>
                  </div>
                )}

              </div>
            </div>

            {/* Event Rules Box Card with Border Beam */}
            {event?.rules && event.rules.length > 0 && (
              <div style={{ position: "relative", marginTop: "24px", padding: "28px", borderRadius: "20px", background: "rgba(10, 13, 24, 0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(124, 58, 237, 0.35)", boxShadow: "0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.15)" }}>
                <BorderBeam size={250} duration={14} colorFrom="#7c3aed" colorTo="#06b6d4" />
                <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#c4b5fd", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Event Rules & Guidelines
                </h2>
                <ol style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "20px" }}>
                  {event.rules.map((rule, i) => (
                    <li key={i} style={{ color: "#f1f5f9", fontSize: "0.95rem", lineHeight: 1.6, fontWeight: 500 }}>{rule}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  );
}
