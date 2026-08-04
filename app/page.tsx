"use client";

// ─── Home Page ─────────────────────────────────────────────────────────────────
// Official Glitch Fest User Landing Page & Live Activity Hub.

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AuroraText } from "@/components/ui/aurora-text";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Gamepad2, ChevronRight, Zap } from "lucide-react";

export default function HomePage() {
  const [regNumber, setRegNumber] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(false);

  // Check localStorage session & realtime registration status
  useEffect(() => {
    try {
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
    <div className="relative min-h-screen flex flex-col bg-transparent text-slate-100 overflow-x-hidden">
      <PublicNavbar />

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-16 max-w-6xl mx-auto w-full">

        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto mb-16 pt-8">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-400 mb-6">
            VRGC · VIT BHOPAL UNIVERSITY
          </p>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-8 leading-none flex flex-wrap items-center justify-center gap-3">
            <span className="text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              Glitch
            </span>
            <AuroraText>Fest</AuroraText>
          </h1>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {regNumber ? (
              <Link href="/event">
                <button className="group relative px-7 py-3 rounded-2xl bg-white/5 border border-violet-400/50 font-bold text-base backdrop-blur-xl hover:bg-violet-500/15 hover:border-violet-400 transition-[background-color,border-color] duration-300 flex items-center gap-2.5 cursor-pointer shadow-[0_0_18px_rgba(139,92,246,0.35)] hover:shadow-[0_0_32px_rgba(139,92,246,0.65)]">
                  <Gamepad2 size={17} className="text-violet-400 group-hover:text-white transition-colors" />
                  <AuroraText>Enter Event Arena</AuroraText>
                  <ChevronRight size={15} className="text-violet-400 group-hover:translate-x-0.5 group-hover:text-white transition-[transform,color]" />
                </button>
              </Link>
            ) : registrationOpen ? (
              <Link href="/register">
                <button className="group relative px-7 py-3 rounded-2xl bg-white/5 border border-violet-400/50 font-bold text-base backdrop-blur-xl hover:bg-violet-500/15 hover:border-violet-400 transition-[background-color,border-color] duration-300 flex items-center gap-2.5 cursor-pointer shadow-[0_0_18px_rgba(139,92,246,0.35)] hover:shadow-[0_0_32px_rgba(139,92,246,0.65)]">
                  <Zap size={17} className="text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                  <AuroraText>Register Now</AuroraText>
                  <ChevronRight size={15} className="text-violet-400 group-hover:translate-x-0.5 group-hover:text-white transition-[transform,color]" />
                </button>
              </Link>
            ) : (
              <button disabled className="group relative px-7 py-3 rounded-2xl bg-slate-900/40 border border-red-500/30 font-bold text-base backdrop-blur-xl opacity-60 cursor-not-allowed flex items-center gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <div className="text-red-400">🔒</div>
                <span className="text-red-300">Registration Closed</span>
              </button>
            )}
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
