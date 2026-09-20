"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) { setError("Enter the verification code from your email."); return; }
    setError(""); setLoading(true);
    try {
      // TODO: call authClient.verifyEmail(code) when backend ready
      await new Promise(r => setTimeout(r, 800)); // mock
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setResent(true);
    setTimeout(() => setResent(false), 60000);
    // TODO: call authClient.resendVerification() when backend ready
  }

  return (
    <>
      <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>📧</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.035em", textAlign: "center", margin: "0 0 8px" }}>Verify your email</h1>
      <p style={{ fontSize: 14, color: "rgba(232,232,240,0.45)", textAlign: "center", lineHeight: 1.6, margin: "0 0 28px" }}>
        We sent a verification code to your email address. Enter it below to activate your workspace.
      </p>

      <form onSubmit={handleVerify} noValidate>
        <label htmlFor="code" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(232,232,240,0.7)", marginBottom: 6 }}>Verification code</label>
        <input id="code" type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456" maxLength={8}
          style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: error ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", fontSize: 20, color: "#e8e8f0", outline: "none", boxSizing: "border-box", fontFamily: "monospace", letterSpacing: "0.2em", textAlign: "center", marginBottom: 8 }}
        />
        {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", backgroundColor: loading ? "rgba(245,158,11,0.5)" : "#f59e0b", color: "#0a0a0f", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 8 }}>
          {loading ? "Verifying…" : "Verify email →"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button onClick={handleResend} disabled={resent}
          style={{ background: "none", border: "none", fontSize: 13, color: resent ? "rgba(232,232,240,0.25)" : "rgba(232,232,240,0.45)", cursor: resent ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {resent ? "Code sent! Check your inbox." : "Didn't get it? Resend code"}
        </button>
      </div>
      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(232,232,240,0.3)" }}>
        <Link href="/login" style={{ color: "rgba(232,232,240,0.45)", textDecoration: "none" }}>← Back to sign in</Link>
      </p>
    </>
  );
}
