"use client";

import { useState } from "react";
import { seedFirestore } from "@/lib/seed";

export function SeedDatabaseButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);

    const result = await seedFirestore();

    setLoading(false);
    if (result.success) {
      setMessage("🎉 Database seeded successfully! Check your Firestore console.");
    } else {
      setMessage(`❌ Seeding failed: ${result.error}`);
    }
  };

  return (
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <button
        onClick={handleSeed}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "0.9rem",
          fontWeight: 600,
          background: loading ? "#4b5563" : "linear-gradient(135deg, #6366f1, #a855f7)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? "🌱 Seeding Database..." : "🚀 Seed Firestore Database"}
      </button>

      {message && (
        <p style={{ marginTop: "12px", fontSize: "0.85rem", color: message.startsWith("🎉") ? "#4ade80" : "#f87171" }}>
          {message}
        </p>
      )}
    </div>
  );
}
