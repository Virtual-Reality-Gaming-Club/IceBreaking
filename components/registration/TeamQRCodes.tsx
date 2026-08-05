"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, ExternalLink, ShieldAlert, Sparkles, Copy, Check } from "lucide-react";

export function TeamQRCodes() {
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [copiedTeam, setCopiedTeam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const teamAUrl = baseUrl ? `${baseUrl}/register?team=a` : "/register?team=a";
  const teamBUrl = baseUrl ? `${baseUrl}/register?team=b` : "/register?team=b";

  const handleCopy = (url: string, team: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTeam(team);
    setTimeout(() => setCopiedTeam(null), 2000);
  };

  return (
    <div style={{ marginTop: "24px", width: "100%", maxWidth: "800px" }}>
      <div
        style={{
          background: "rgba(10, 13, 24, 0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(124, 58, 237, 0.35)",
          borderRadius: "24px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
          <QrCode className="text-violet-400" size={20} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
            Team QR Code Entry Passes
          </h3>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 20px 0" }}>
          Scan to jump straight to registration with pre-locked team assignment.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* TEAM A QR CARD */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 20, 35, 0.95) 100%)",
              border: "1.5px solid rgba(167, 139, 250, 0.4)",
              borderRadius: "20px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>⚔️</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#e9d5ff" }}>Team A Registration</span>
            </div>

            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "16px", boxShadow: "0 0 20px rgba(167, 139, 250, 0.3)" }}>
              <QRCodeSVG value={teamAUrl} size={150} level="H" includeMargin={false} />
            </div>

            <div style={{ width: "100%", display: "flex", gap: "8px" }}>
              <a
                href={teamAUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(124, 58, 237, 0.25)",
                  border: "1px solid rgba(167, 139, 250, 0.5)",
                  color: "#e9d5ff",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ExternalLink size={13} /> Direct Link
              </a>
              <button
                type="button"
                onClick={() => handleCopy(teamAUrl, "A")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#cbd5e1",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {copiedTeam === "A" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedTeam === "A" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* TEAM B QR CARD */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 20, 35, 0.95) 100%)",
              border: "1.5px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "20px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>🛡️</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#bae6fd" }}>Team B Registration</span>
            </div>

            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "16px", boxShadow: "0 0 20px rgba(56, 189, 248, 0.3)" }}>
              <QRCodeSVG value={teamBUrl} size={150} level="H" includeMargin={false} />
            </div>

            <div style={{ width: "100%", display: "flex", gap: "8px" }}>
              <a
                href={teamBUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(14, 165, 233, 0.25)",
                  border: "1px solid rgba(56, 189, 248, 0.5)",
                  color: "#bae6fd",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ExternalLink size={13} /> Direct Link
              </a>
              <button
                type="button"
                onClick={() => handleCopy(teamBUrl, "B")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#cbd5e1",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {copiedTeam === "B" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedTeam === "B" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
