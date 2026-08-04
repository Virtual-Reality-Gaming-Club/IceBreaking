"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function RegisterPage() {
  // Backend state handled manually later
  const isLoading = false;
  const isRegistrationOpen = true;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PublicNavbar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", width: "100%", maxWidth: "896px", margin: "80px auto 80px" }}>
        <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3rem)", fontWeight: 800, color: "white", margin: "0 0 16px 0" }}>
            Event <span className="text-gradient-primary">Registration</span>
          </h1>
          <p style={{ color: "#f1f5f9", fontSize: "1.125rem", maxWidth: "672px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500 }}>
            Secure your spot for IceBreaking 2026.
          </p>
        </div>

        {/* Form placeholder for when backend is connected */}
        {isRegistrationOpen && (
          <div className="animate-fade-in-up" style={{ width: "100%", maxWidth: "448px", animationDelay: "100ms", background: "rgba(10, 13, 24, 0.9)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
            <p style={{ color: "#cbd5e1", textAlign: "center" }}>[ Registration form will go here ]</p>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
