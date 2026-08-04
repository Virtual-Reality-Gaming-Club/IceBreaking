"use client";

// ─── Home Page ─────────────────────────────────────────────────────────────────
// Official Glitch Fest Event Landing Page & Live Activity Hub.

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AuroraText } from "@/components/ui/aurora-text";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function HomePage() {
  const [regNumber, setRegNumber] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(false);

  // Check localStorage session & realtime registration status
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegNumber(localStorage.getItem("ib_reg_number"));
    } catch {
      // ignore
    }

    const unsub = onSnapshot(doc(db, "settings", "registration"), (docSnap) => {
      if (docSnap.exists()) {
        setRegistrationOpen(Boolean(docSnap.data()?.isOpen));
      } else {
        setRegistrationOpen(false);
      }
    });

    return () => unsub();
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
              className="animate-fade-in-up text-5xl font-black tracking-tight md:text-7xl lg:text-8xl flex items-center justify-center gap-3"
              style={{ animationDelay: "50ms", lineHeight: 1.1, marginBottom: "18px" }}
            >
              <span className="font-black text-white" style={{ color: "#ffffff", letterSpacing: "-0.03em" }}>
                Glitch
              </span>
              <AuroraText>Fest</AuroraText>
            </h1>

            {/* Action Buttons */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "200ms", display: "flex", gap: "14px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}
            >
              {regNumber ? (
                <Link href="/event" style={{ textDecoration: "none" }}>
                  <button
                    aria-label="Enter Event Hub"
                    style={{ padding: "14px 30px", fontSize: "0.95rem", background: "#7c3aed", color: "white", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 700 }}
                  >
                    🎮 Enter Event Hub →
                  </button>
                </Link>
              ) : registrationOpen ? (
                <Link href="/register" style={{ textDecoration: "none" }}>
                  <button
                    aria-label="Register Now"
                    style={{
                      padding: "14px 30px",
                      fontSize: "0.95rem",
                      background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                      color: "white",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 800,
                      boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
                    }}
                  >
                    📝 Register Now →
                  </button>
                </Link>
              ) : (
                <div
                  onClick={() => {
                    alert("🔒 Registration is currently closed by the event admin. Please check back later!");
                  }}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 28px",
                    background: "rgba(10, 13, 24, 0.85)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "14px",
                    cursor: "not-allowed",
                    boxShadow: "0 0 25px rgba(239, 68, 68, 0.25), inset 0 0 15px rgba(239, 68, 68, 0.1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#ef4444",
                      display: "inline-block",
                      boxShadow: "0 0 10px #ef4444",
                    }}
                  />
                  <p style={{ color: "#fca5a5", fontSize: "0.92rem", margin: 0, fontWeight: 700, letterSpacing: "0.02em" }}>
                    🔒 Registration is currently closed.
                  </p>
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
