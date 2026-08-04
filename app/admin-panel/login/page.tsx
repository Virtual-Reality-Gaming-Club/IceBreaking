"use client";

// ─── Admin Login Page ─────────────────────────────────────────────────────────
// Accessible at /admin-panel/login

import Link from "next/link";
import Image from "next/image";

export default function AdminLoginPage() {
  // Backend state handled manually later
  const isLoading = false;
  const user = null;
  const isAdmin = false;
  const error = null;

  const signInWithGoogle = () => {
    console.log("Sign in with Google clicked - Backend not implemented yet");
  };

  const signOut = () => {
    console.log("Sign out clicked - Backend not implemented yet");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#06070a",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(124, 58, 237, 0.12) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(17, 20, 32, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(124, 58, 237, 0.35)",
          borderRadius: "20px",
          padding: "48px 36px",
          boxShadow: "0 0 40px rgba(124, 58, 237, 0.2)",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "rgba(124, 58, 237, 0.12)",
            border: "1px solid rgba(124, 58, 237, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 30px rgba(124, 58, 237, 0.35)",
            padding: "8px",
          }}
        >
          <Image
            src="/logo.png"
            alt="VRGC Logo"
            width={64}
            height={64}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#f8fafc",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          Admin Portal
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "36px" }}>
          VRGC Event Management Platform
          <br />
          <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
            VIT Bhopal University
          </span>
        </p>

        {/* Non-Admin Access Denied Banner */}
        {user && !isAdmin && !isLoading && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "0.85rem",
              marginBottom: "24px",
              textAlign: "left",
              lineHeight: 1.5,
            }}
          >
            <strong>⛔ Access Denied</strong>
            <br />
            Account <code>{(user as any).email}</code> is not authorized.
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={signOut}
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign out & try another account
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "0.875rem",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={signInWithGoogle}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: isLoading
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            color: "#f8fafc",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            marginBottom: "24px",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {/* Google Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>

        {/* Security Note */}
        <p style={{ color: "#475569", fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "24px" }}>
          🔒 Access restricted to authorized administrators only.
          <br />
          Unauthorized access attempts are logged.
        </p>

        {/* Back Link */}
        <Link
          href="/"
          style={{
            color: "#a78bfa",
            fontSize: "0.85rem",
            textDecoration: "none",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#c4b5fd")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#a78bfa")}
        >
          ← Go back to Website
        </Link>
      </div>
    </div>
  );
}
