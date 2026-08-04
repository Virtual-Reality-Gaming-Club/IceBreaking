"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const RegistrationForm = dynamic(
  () => import("@/components/registration/RegistrationForm").then((mod) => mod.RegistrationForm),
  {
    loading: () => (
      <div className="w-full max-w-[448px] mx-auto p-8 rounded-3xl bg-[#0a0d18]/90 border border-violet-500/30 text-center backdrop-blur-2xl">
        <Sparkles className="mx-auto text-violet-400 mb-3 animate-spin" size={28} />
        <p className="text-slate-400 text-xs font-bold">Loading Registration Form...</p>
      </div>
    ),
    ssr: false,
  }
);

export default function RegisterPage() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "registration"), (docSnap) => {
      if (docSnap.exists()) {
        setIsRegistrationOpen(Boolean(docSnap.data()?.isOpen));
      } else {
        setIsRegistrationOpen(true);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <PublicNavbar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", width: "100%", maxWidth: "896px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", margin: "0 0 8px 0" }}>
            Event <span className="text-gradient-primary">Registration</span>
          </h1>
          <p style={{ color: "#f1f5f9", fontSize: "1rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.5, fontWeight: 500 }}>
            Secure your spot for IceBreaking 2026.
          </p>
        </div>

        {!loading && (
          <>
            {isRegistrationOpen ? (
              <div className="animate-fade-in-up" style={{ width: "100%", animationDelay: "100ms" }}>
                <RegistrationForm />
              </div>
            ) : (
              <div
                className="animate-fade-in-up"
                style={{
                  maxWidth: "520px",
                  width: "100%",
                  padding: "48px 32px",
                  background: "rgba(10, 13, 24, 0.92)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px dashed rgba(239, 68, 68, 0.4)",
                  borderRadius: "24px",
                  textAlign: "center",
                  boxShadow: "0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15)",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fca5a5", marginBottom: "12px" }}>
                  Registration Currently Closed
                </h2>
                <p style={{ color: "#cbd5e1", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: "28px" }}>
                  The event admin has temporarily paused new participant registrations. If you are already registered, you can proceed directly to the Event Activity Hub!
                </p>
                <Link href="/event" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      padding: "14px 28px",
                      background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
                    }}
                  >
                    🎮 Go to Event Hub →
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
