"use client";

import { useState } from "react";
import { seedFirestore } from "@/lib/seed";

const SEED_COLLECTIONS = [
  "events", "participants", "scoringRules",
  "scoreEntries", "polls", "quizzes", "activityLogs",
];

export function SeedDatabaseButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [seededCollections, setSeededCollections] = useState<string[]>([]);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);
    setSeededCollections([]);

    const result = await seedFirestore();

    setLoading(false);
    if (result.success) {
      setMessage("🎉 Database seeded successfully! Check your Firestore console.");
      setSeededCollections((result as any).collections || SEED_COLLECTIONS);
    } else {
      setMessage(`❌ Seeding failed: ${result.error}`);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {/* Collection Preview */}
      <div
        style={{
          marginBottom: "20px",
          padding: "16px",
          background: "rgba(124, 58, 237, 0.07)",
          border: "1px solid rgba(124, 58, 237, 0.2)",
          borderRadius: "10px",
        }}
      >
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "10px", fontWeight: 600 }}>
          📦 Collections to be seeded:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {SEED_COLLECTIONS.map((col) => (
            <span
              key={col}
              style={{
                padding: "3px 10px",
                background: seededCollections.includes(col)
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(124, 58, 237, 0.15)",
                border: `1px solid ${seededCollections.includes(col) ? "rgba(34, 197, 94, 0.3)" : "rgba(124, 58, 237, 0.3)"}`,
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: seededCollections.includes(col) ? "#4ade80" : "#c4b5fd",
                fontWeight: 600,
                fontFamily: "monospace",
                transition: "all 0.3s",
              }}
            >
              {seededCollections.includes(col) ? "✓ " : ""}{col}
            </span>
          ))}
        </div>
      </div>

      {/* Seed Button */}
      <button
        onClick={handleSeed}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 24px",
          fontSize: "0.9rem",
          fontWeight: 700,
          background: loading
            ? "rgba(75, 85, 99, 0.5)"
            : "linear-gradient(135deg, #6366f1, #a855f7)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 14px rgba(99, 102, 241, 0.4)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
            Seeding 6 Collections...
          </>
        ) : (
          "🚀 Seed All Firestore Collections"
        )}
      </button>

      {/* Result Message */}
      {message && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: message.startsWith("🎉")
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${message.startsWith("🎉") ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: message.startsWith("🎉") ? "#4ade80" : "#f87171",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
