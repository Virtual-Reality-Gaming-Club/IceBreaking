"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function PublicFooter() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "16px 24px 20px",
        marginTop: "auto",
        position: "relative",
        zIndex: 20,
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Left: VRGC VIT Bhopal Text & Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src="/logo.png"
            alt="VRGC Logo"
            width={28}
            height={28}
            style={{ objectFit: "contain" }}
          />
          <span style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 500 }}>
            <strong style={{ color: "#f8fafc" }}>VRGC</strong> · VIT Bhopal
          </span>
        </div>

        {/* Right: Admin Login & Copyright */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Small Subtle Admin Login Link */}
          <Link
            href="/admin-panel"
            style={{
              fontSize: "0.78rem",
              color: "#94a3b8",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 500,
              transition: "color 0.2s ease",
            }}
            className="hover:text-purple-400"
          >
            <ShieldCheck size={13} />
            Admin Login
          </Link>

          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            © {new Date().getFullYear()} IceBreaking · All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

