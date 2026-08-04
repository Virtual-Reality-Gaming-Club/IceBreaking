"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

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
        {/* Left: VRGC VIT Bhopal Animated Badge & Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src="/logo.png"
            alt="VRGC Logo"
            width={28}
            height={28}
            style={{ objectFit: "contain" }}
          />
          <div className="group relative flex items-center justify-center rounded-full px-3 py-1 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] border border-violet-500/30 bg-slate-950/60">
            <span
              className="animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
              style={{
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "destination-out",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "subtract",
                WebkitClipPath: "padding-box",
              }}
            />
            <AnimatedGradientText className="text-xs font-extrabold tracking-wide">
              VRGC · VIT Bhopal
            </AnimatedGradientText>
          </div>
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

