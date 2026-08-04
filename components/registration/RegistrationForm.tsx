"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { normalizeName, normalizeRegNumber, isValidName, isValidRegNumber } from "@/utils/validation";
import { Button, Input } from "@/components/ui/forms";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";

export function RegistrationForm() {
  const router = useRouter();
  const confettiRef = useRef<ConfettiRef>(null);
  const [fullName, setFullName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [regError, setRegError] = useState<string | undefined>(undefined);
  const [registeredUser, setRegisteredUser] = useState<{ fullName: string; registrationNumber: string; isExisting?: boolean } | null>(null);

  // Trigger confetti when registered for the first time
  useEffect(() => {
    if (registeredUser && !registeredUser.isExisting) {
      import("canvas-confetti").then((confettiModule) => {
        const fire = confettiModule.default;
        fire({ particleCount: 80, spread: 60, origin: { y: 0.6 }, zIndex: 99999 });
        setTimeout(() => {
          fire({ particleCount: 120, spread: 100, origin: { y: 0.5 }, zIndex: 99999 });
        }, 250);
      }).catch(err => console.error("Confetti import error:", err));
    }
  }, [registeredUser]);

  const regExample = "25BCY10001";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setNameError(undefined);
    setRegError(undefined);

    const normalizedName = normalizeName(fullName);
    const normalizedReg = normalizeRegNumber(regNumber);

    let hasError = false;
    if (!isValidName(normalizedName)) {
      setNameError("Invalid name. Must be 2–100 characters, letters only.");
      hasError = true;
    }
    if (!isValidRegNumber(normalizedReg)) {
      setRegError(`Invalid format. Must be like '${regExample}'.`);
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const participantRef = doc(db, "participants", normalizedReg);
      const docSnap = await getDoc(participantRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        setRegisteredUser({
          fullName: existingData.fullName || normalizedName,
          registrationNumber: normalizedReg,
          isExisting: true,
        });
      } else {
        await setDoc(participantRef, {
          registrationNumber: normalizedReg,
          fullName: normalizedName,
          totalScore: 0,
          registeredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setRegisteredUser({
          fullName: normalizedName,
          registrationNumber: normalizedReg,
          isExisting: false,
        });

        // Fire full screen confetti burst immediately on new registration
        try {
          const confettiModule = await import("canvas-confetti");
          confettiModule.default({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            zIndex: 99999,
          });
        } catch (confettiErr) {
          console.error("Confetti launch error:", confettiErr);
        }
      }

      // Save to local storage for quick retrieval
      if (typeof window !== "undefined") {
        localStorage.setItem("ib_reg_number", normalizedReg);
        localStorage.setItem("ib_full_name", normalizedName);
      }
    } catch (err: any) {
      console.error("Firestore Registration Error:", err);
      setError(err.message || "Failed to register. Please check your network connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredUser) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "448px",
          margin: "0 auto",
          backgroundColor: "rgba(10, 13, 24, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(124, 58, 237, 0.4)",
          borderRadius: "24px",
          padding: "40px 28px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(124, 58, 237, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Confetti
          ref={confettiRef}
          className="absolute inset-0 z-0 pointer-events-none size-full"
          manualstart={true}
        />
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "rgba(124, 58, 237, 0.25)",
            border: "1.5px solid rgba(167, 139, 250, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.2rem",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)",
          }}
        >
          🎉
        </div>

        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
            {registeredUser.isExisting ? "You're already registered!" : "Registration Successful!"}
          </h2>
          <p style={{ color: "#c4b5fd", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            {registeredUser.isExisting ? `Welcome back, ${registeredUser.fullName}.` : `Welcome, ${registeredUser.fullName}.`}
          </p>
        </div>

        <div
          style={{
            background: "rgba(15, 20, 35, 0.95)",
            border: "1.5px solid rgba(148, 163, 184, 0.35)",
            borderRadius: "14px",
            padding: "16px 24px",
            width: "100%",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 700 }}>
            Registration Number
          </span>
          <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#38bdf8", letterSpacing: "0.06em", fontFamily: "monospace" }}>
            {registeredUser.registrationNumber}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <Button
            type="button"
            variant="primary"
            onClick={() => router.push("/event")}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1.05rem",
              fontWeight: 800,
              borderRadius: "14px",
              boxShadow: "0 6px 20px rgba(124, 58, 237, 0.5)",
            }}
          >
            Continue to Event Hub →
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setRegisteredUser(null)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: "12px",
            }}
          >
            Register Another Participant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "448px", margin: "0 auto" }}>
      {error && (
        <div style={{ marginBottom: "24px", padding: "12px 16px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          backgroundColor: "rgba(10, 13, 24, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "36px clamp(20px, 6vw, 32px)",
          borderRadius: "24px",
          border: "1px solid rgba(124, 58, 237, 0.35)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.15)",
        }}
      >
        <div>
          <label htmlFor="fullName" style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px", letterSpacing: "0.01em" }}>
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
            error={nameError}
            maxLength={100}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="regNumber" style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px", letterSpacing: "0.01em" }}>
            Registration Number
          </label>
          <Input
            id="regNumber"
            type="text"
            placeholder={regExample}
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            disabled={isSubmitting}
            error={regError}
            maxLength={10}
            required
            autoCapitalize="characters"
            style={{ textTransform: "uppercase", width: "100%" }}
          />
          <p style={{ marginTop: "8px", fontSize: "0.82rem", color: "#94a3b8" }}>
            Your official VIT Bhopal Registration Number.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting || !fullName || !regNumber}
          style={{ width: "100%", padding: "14px", fontSize: "1rem", fontWeight: 700, borderRadius: "12px", marginTop: "4px" }}
        >
          {isSubmitting ? "Registering..." : "Register Now"}
        </Button>
      </form>
    </div>
  );
}
