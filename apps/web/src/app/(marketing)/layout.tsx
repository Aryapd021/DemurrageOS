import type { Metadata } from "next";
import Link from "next/link";
import FullPageVideoBackground from "@/components/marketing/full-page-video-background";

export const metadata: Metadata = {
  title: "DemurrageOS — Stop Demurrage Bleed Before the Clock Bills",
  description:
    "The CHA operating system for container demurrage tracking, two-clock financial exposure, and AI-powered compliance prevention.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        backgroundColor: "#060a12",
        color: "#f1f5f9",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Video Background Playing Throughout Landing Page from Top to Bottom */}
      <FullPageVideoBackground />
      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "rgba(6,10,18,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
          }}
        >
          {/* Logo */}
          <Link
            href="/landing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 900,
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
              }}
            >
              D
            </div>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              DemurrageOS
            </span>
          </Link>

          {/* Links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            <a
              href="#interactive-specs"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(226,232,240,0.75)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Specs &amp; Calculator
            </a>
            <a
              href="#two-clocks"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(226,232,240,0.75)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Two Clocks
            </a>
            <a
              href="#ports"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(226,232,240,0.75)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Port Coverage
            </a>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(226,232,240,0.9)",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ paddingTop: 60 }}>{children}</main>

      {/* Clean, Solid, High-Contrast Footer (100% Opaque - No Video Bleed) */}
      <footer
        style={{
          position: "relative",
          zIndex: 40,
          backgroundColor: "#060a14",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 -25px 50px rgba(0,0,0,0.95)",
          padding: "52px 24px 44px",
          isolation: "isolate",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            textAlign: "center",
          }}
        >
          {/* Brand Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
                color: "#0a0a0f",
                boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
              }}
            >
              D
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              DemurrageOS
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, display: "inline-block" }}>—</span>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
              Container Demurrage &amp; CFS Ground Rent Control for Indian Customs Brokers
            </span>
          </div>

          {/* High-Contrast Navigation Links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Link
              href="/terms"
              style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.15s" }}
            >
              Terms of Service
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <Link
              href="/privacy"
              style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.15s" }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <Link
              href="/login"
              style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.15s" }}
            >
              Sign In
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <Link
              href="/register"
              style={{ color: "#f59e0b", textDecoration: "none", fontWeight: 700 }}
            >
              Create Account →
            </Link>
          </div>

          {/* Port Coverage & Team Credits */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 22,
              width: "100%",
              maxWidth: 680,
            }}
          >
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              Built with ❤️ by{" "}
              <span style={{ color: "#ffffff", fontWeight: 700 }}>
                Ansh, Hari, Arya &amp; Dhyan
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              JNPT Nhava Sheva · Mundra APSEZ · Chennai CITPL · DemurrageOS © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
