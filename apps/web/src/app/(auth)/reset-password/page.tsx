"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!token) { setError("Invalid or expired reset link. Please request a new one."); return; }
    setError(""); setLoading(true);
    try {
      await authClient.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed. The link may have expired.");
    } finally { setLoading(false); }
  }

  if (done) return (
    <>
      <div style={{ fontSize: 32, textAlign: "center", marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 12px" }}>Password updated!</h1>
      <p style={{ fontSize: 14, color: "rgba(232,232,240,0.45)", textAlign: "center", lineHeight: 1.6 }}>Redirecting you to sign in…</p>
    </>
  );

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.035em", margin: "0 0 4px" }}>Set new password</h1>
      <p style={{ fontSize: 14, color: "rgba(232,232,240,0.4)", margin: "0 0 28px" }}>Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} noValidate>
        {(["New password", "Confirm password"] as const).map((lbl, i) => (
          <div key={lbl} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(232,232,240,0.7)", marginBottom: 6 }}>{lbl}</label>
            <input type="password" value={i === 0 ? password : confirm}
              onChange={e => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
              placeholder={i === 0 ? "Min. 8 characters" : "Repeat new password"}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", fontSize: 14, color: "#e8e8f0", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        ))}
        {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", backgroundColor: loading ? "rgba(245,158,11,0.5)" : "#f59e0b", color: "#0a0a0f", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Saving…" : "Update password →"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(232,232,240,0.4)" }}>
        <Link href="/login" style={{ color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(232,232,240,0.5)" }}>
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
