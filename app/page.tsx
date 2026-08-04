"use client";

// ─── Home Page ─────────────────────────────────────────────────────────────────
// Official Glitch Fest Event Landing Page & Live Activity Hub.

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function HomePage() {
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
        <div>
          {/* Hero Section Container */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <p
              className="animate-fade-in-up"
              style={{ animationDelay: "0ms", fontSize: "0.82rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}
            >
              VRGC · VIT BHOPAL UNIVERSITY
            </p>

            <h1
              className="animate-fade-in-up"
              style={{ animationDelay: "50ms", fontSize: "clamp(2.5rem, 8vw, 4.2rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "18px", letterSpacing: "-0.02em" }}
            >
              <span style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Glitch Fest
              </span>
            </h1>

            <p
              className="animate-fade-in-up"
              style={{ animationDelay: "100ms", color: "#f1f5f9", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "560px", margin: "0 auto 24px", fontWeight: 500 }}
            >
              The ultimate gaming fest at VIT Bhopal.
            </p>

            {/* Action Buttons */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "200ms", display: "flex", gap: "14px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}
            >
              {regNumber ? (
                <Link href="/event" style={{ textDecoration: "none" }}>
                  <button
                    aria-label="Enter Event Hub"
                    style={{ padding: "14px 30px", fontSize: "0.95rem", background: "#7c3aed", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
                  >
                    🎮 Enter Event Hub →
                  </button>
                </Link>
              ) : (
                <div style={{ display: "inline-block", padding: "12px 24px", background: "rgba(10, 13, 24, 0.9)", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "12px" }}>
                  <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: 0, fontWeight: 600 }}>🔒 Registration is currently closed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
