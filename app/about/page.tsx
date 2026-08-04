"use client";

import { useEffect, useState } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Globe, X } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <PublicNavbar />

      <main style={{
        flex: 1,
        padding: "60px 20px 60px",
        maxWidth: "820px",
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        position: "relative",
        zIndex: 10
      }}>

        <div className="animate-fade-in-up" style={{
          background: "rgba(10, 13, 24, 0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: "24px",
          padding: "clamp(28px, 4vh, 44px) clamp(20px, 4vw, 36px)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6), 0 0 30px rgba(124, 58, 237, 0.15)",
          textAlign: "center",
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "10px",
          marginBottom: "30px",
        }}>


          {/* Top-Right Close (X) Button */}
          <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 20 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button
                aria-label="Close page and return to home"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "#cbd5e1";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                }}
              >
                <X size={20} />
              </button>
            </Link>
          </div>

          <div style={{ marginTop: "10px" }} />

          <h1 style={{
            fontSize: "clamp(1.6rem, 5vw, 2.3rem)",
            fontWeight: 900,
            color: "#f8fafc",
            marginBottom: "clamp(12px, 2vh, 20px)",
            letterSpacing: "0.02em",
            textAlign: "center",
          }}>
            Mission Statement
          </h1>

          <p style={{
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            color: "#cbd5e1",
            lineHeight: 1.6,
            fontWeight: 400,
            marginBottom: "clamp(16px, 3vh, 32px)",
            maxWidth: "700px",
            margin: "0 auto clamp(16px, 3vh, 32px)"
          }}>
            <strong style={{ color: "#f8fafc" }}>VRGC (Virtual Reality and Gaming Club)</strong> brings together students passionate about gaming, esports, innovation, and virtual reality. Through flagship events like Gamers Asylum, Glitch Fest, tournaments, and interactive experiences, the club creates an exciting environment where students compete, collaborate, learn, and build lasting memories while celebrating gaming culture on campus.
          </p>

          <h2 style={{
            fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)",
            fontWeight: 800,
            color: "#f8fafc",
            marginBottom: "clamp(10px, 2vh, 16px)",
            lineHeight: 1.3
          }}>
            Ready to Join the Adventure?
          </h2>

          <p style={{
            fontSize: "clamp(0.85rem, 2vw, 1rem)",
            color: "#94a3b8",
            marginBottom: "clamp(12px, 2vh, 24px)",
            lineHeight: 1.5,
            maxWidth: "600px",
            margin: "0 auto clamp(12px, 2vh, 24px)"
          }}>
            Every great journey starts with a single step. <br />
            Whether you dream of becoming an esports champion, exploring virtual reality, organizing unforgettable events, or simply finding your tribe, VRGC welcomes you.
          </p>

          <div style={{
            fontSize: "clamp(1rem, 3vw, 1.3rem)",
            fontWeight: 800,
            background: "linear-gradient(90deg, #3b82f6 0%, #a78bfa 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "clamp(12px, 2vh, 16px)",
          }}>
            PLAY TOGETHER.WIN TOGETHER.BUILD TOGETHER
          </div>

          <p style={{ color: "#e2e8f0", fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)", fontWeight: 700, marginBottom: "clamp(20px, 4vh, 32px)" }}>
            Catch you at the next event! 🎮💜 <br />
            Technical Team <br />
            VRGC👾
          </p>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "clamp(8px, 2vw, 12px)" }}>
            {[
              {
                url: "https://vrgc.vercel.app/",
                icon: <Globe size={18} />,
                color: "#3b82f6",
                bg: "rgba(59, 130, 246, 0.15)"
              },
              {
                url: "https://www.instagram.com/vrgc.vitb",
                icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>,
                color: "#ec4899",
                bg: "rgba(236, 72, 153, 0.15)"
              },
              {
                url: "https://www.linkedin.com/company/vrgc-vitb",
                icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
                color: "#0ea5e9",
                bg: "rgba(14, 165, 233, 0.15)"
              },
              {
                url: "https://www.youtube.com/@vrgcvitb",
                icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
                color: "#ef4444",
                bg: "rgba(239, 68, 68, 0.15)"
              }
            ].map((social, i) => (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit our ${social.url}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "clamp(40px, 10vw, 48px)",
                  height: "clamp(40px, 10vw, 48px)",
                  borderRadius: "12px",
                  background: social.bg,
                  color: social.color,
                  border: `1px solid ${social.color}40`,
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 8px 15px ${social.color}40`;
                  e.currentTarget.style.background = social.color;
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = social.bg;
                  e.currentTarget.style.color = social.color;
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
