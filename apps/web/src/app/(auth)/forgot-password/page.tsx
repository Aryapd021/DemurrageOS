"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setError(""); setLoading(true);
    try {
      await authClient.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  if (sent) return (
    <>
      <div style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}>📬</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 12px" }}>Check your inbox</h1>
      <p style={{ fontSize: 14, color: "rgba(232,232,240,0.45)", textAlign: "center", lineHeight: 1.6, margin: "0 0 24px" }}>
        We've sent a password reset link to <strong style={{ color: "#f59e0b" }}>{email}</strong>. It expires in 1 hour.
      </p>
      <Link href="/login" style={{ display: "block", textAlign: "center", fontSize: 14, color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}>
        ← Back to sign in
      </Link>
    </>
  );

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.035em", margin: "0 0 4px" }}>Reset your password</h1>
      <p style={{ fontSize: 14, color: "rgba(232,232,240,0.4)", margin: "0 0 28px" }}>We'll send a reset link to your email.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(232,232,240,0.7)", marginBottom: 6 }}>Work email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@chacompany.in"
          style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: error ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", fontSize: 14, color: "#e8e8f0", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 8 }}
        />
        {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", backgroundColor: loading ? "rgba(245,158,11,0.5)" : "#f59e0b", color: "#0a0a0f", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 8 }}>
          {loading ? "Sending…" : "Send reset link →"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(232,232,240,0.4)" }}>
        Remembered it?{" "}<Link href="/login" style={{ color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
      </p>
    </>
  );
}
