"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

function Field({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  hint,
  error,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(232,232,240,0.7)",
          marginBottom: 6,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.04)",
          border: error
            ? "1px solid rgba(239,68,68,0.6)"
            : "1px solid rgba(255,255,255,0.1)",
          borderRadius: 9,
          padding: "11px 14px",
          fontSize: 14,
          color: "#e8e8f0",
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
        onFocus={(e) =>
          !error && (e.target.style.borderColor = "rgba(245,158,11,0.5)")
        }
        onBlur={(e) =>
          !error && (e.target.style.borderColor = "rgba(255,255,255,0.1)")
        }
      />
      {hint && !error && (
        <p style={{ fontSize: 11, color: "rgba(232,232,240,0.3)", marginTop: 4, marginBottom: 0 }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function validate(fields: {
  name: string;
  orgName: string;
  email: string;
  password: string;
  confirm: string;
}) {
  const errs: Record<string, string> = {};
  if (!fields.name.trim()) errs.name = "Name is required.";
  if (!fields.orgName.trim()) errs.orgName = "Organisation name is required.";
  if (!fields.email.includes("@")) errs.email = "Enter a valid email address.";
  if (fields.password.length < 8)
    errs.password = "Password must be at least 8 characters.";
  if (fields.password !== fields.confirm)
    errs.confirm = "Passwords do not match.";
  return errs;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [modalTab, setModalTab] = useState<"terms" | "privacy" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate({ name, orgName, email, password, confirm });
    if (!agreed) {
      errs.agreed = "You must review and agree to the Terms & Privacy Policy.";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setGlobalError("");
    setLoading(true);
    try {
      await authClient.signUp({ name, email, password, orgName });
      // Direct entry to portal
      router.replace("/dashboard");
    } catch (err: unknown) {
      setGlobalError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.035em",
          margin: "0 0 4px",
        }}
      >
        Create your workspace
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "rgba(232,232,240,0.4)",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        One workspace = one CHA firm. Invite your team after signing up.
      </p>

      {globalError && (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            background: "rgba(239,68,68,0.06)",
            fontSize: 13,
            color: "#ef4444",
            marginBottom: 20,
          }}
        >
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Your name"
          id="name"
          type="text"
          value={name}
          onChange={setName}
          placeholder="Ansh Verma"
          error={errors.name}
        />
        <Field
          label="Organisation / CHA firm name"
          id="orgName"
          type="text"
          value={orgName}
          onChange={setOrgName}
          placeholder="Mehta Overseas Pvt Ltd"
          hint="This becomes your workspace name. You can change it later."
          error={errors.orgName}
        />
        <Field
          label="Work email"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@chacompany.in"
          error={errors.email}
        />
        <Field
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Min. 8 characters"
          error={errors.password}
        />
        <Field
          label="Confirm password"
          id="confirm"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat password"
          error={errors.confirm}
        />

        {/* Terms & Privacy Policy Checkbox & Modal triggers */}
        <div
          style={{
            border: errors.agreed
              ? "1px solid rgba(239,68,68,0.6)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.02)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input
              type="checkbox"
              id="agree-checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked && errors.agreed) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.agreed;
                    return next;
                  });
                }
              }}
              style={{
                marginTop: 2,
                width: 16,
                height: 16,
                accentColor: "#f59e0b",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="agree-checkbox"
              style={{
                fontSize: 12,
                color: "rgba(232,232,240,0.75)",
                lineHeight: 1.6,
                cursor: "pointer",
              }}
            >
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setModalTab("terms");
                }}
                style={{
                  color: "#f59e0b",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setModalTab("privacy");
                }}
                style={{
                  color: "#f59e0b",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>
          {errors.agreed && (
            <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6, marginBottom: 0 }}>
              {errors.agreed}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: !agreed ? "rgba(245,158,11,0.4)" : "#f59e0b",
            color: "#0a0a0f",
            border: "none",
            borderRadius: 10,
            padding: "13px 0",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
            transition: "all 0.15s ease",
          }}
        >
          {loading ? "Creating workspace…" : "Create workspace & Enter Portal →"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: 13,
          color: "rgba(232,232,240,0.4)",
        }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}
        >
          Sign in
        </Link>
      </p>

      {/* Interactive Modal for Terms of Service & Privacy Policy */}
      {modalTab && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setModalTab(null)}
        >
          <div
            style={{
              backgroundColor: "#0d0d14",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 680,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalTab("terms")}
                  style={{
                    background: modalTab === "terms" ? "rgba(245,158,11,0.15)" : "none",
                    border: modalTab === "terms" ? "1px solid rgba(245,158,11,0.4)" : "none",
                    color: modalTab === "terms" ? "#f59e0b" : "rgba(232,232,240,0.6)",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Terms of Service
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("privacy")}
                  style={{
                    background: modalTab === "privacy" ? "rgba(245,158,11,0.15)" : "none",
                    border: modalTab === "privacy" ? "1px solid rgba(245,158,11,0.4)" : "none",
                    color: modalTab === "privacy" ? "#f59e0b" : "rgba(232,232,240,0.6)",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Privacy Policy
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalTab(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(232,232,240,0.4)",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div
              style={{
                padding: "24px 28px",
                overflowY: "auto",
                fontSize: 14,
                color: "rgba(232,232,240,0.75)",
                lineHeight: 1.7,
              }}
            >
              {modalTab === "terms" ? (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                    DemurrageOS Terms of Service
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(232,232,240,0.35)", marginBottom: 20 }}>
                    Last updated: September 2024 · Developed by Ansh, Hari, Arya &amp; Dhyan
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    1. Who We Are
                  </h3>
                  <p>
                    DemurrageOS is a container demurrage and detention management platform built for Custom House Agents (CHAs), freight forwarders, and importers in India.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    2. Acceptance
                  </h3>
                  <p>
                    By creating an account or using the platform, you confirm that you are authorised to act on behalf of your organisation and agree to these Terms.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    3. Your Data Ownership
                  </h3>
                  <p>
                    All container data, client data, and operational data you upload remains your exclusive property. We do not sell or share your business data.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    4. Calculation Accuracy
                  </h3>
                  <p>
                    DemurrageOS provides demurrage and detention calculations for operational planning. Calculations rely on configured tariffs and timeline events.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    5. Demo Mode
                  </h3>
                  <p>
                    The platform includes a demo mode with synthetic container and client data for illustrative purposes.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    6. Acceptable Use
                  </h3>
                  <p>
                    You agree not to reverse-engineer, misuse the platform, or transmit unlawful content through the dispatch confirmation links.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                    DemurrageOS Privacy Policy
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(232,232,240,0.35)", marginBottom: 20 }}>
                    Last updated: September 2024 · Developed by Ansh, Hari, Arya &amp; Dhyan
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    1. Information We Collect
                  </h3>
                  <p>
                    We collect your name, business email, organisation name, and operational logistics records required to track container free days.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    2. What We Never Do
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li>We never sell your company data to third parties or shipping lines.</li>
                    <li>We never store plain-text passwords. All passwords are encrypted with bcrypt.</li>
                    <li>We do not train public AI models on your private container documents.</li>
                  </ul>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    3. Security &amp; Storage
                  </h3>
                  <p>
                    All communication is encrypted via TLS 1.2+. Multi-tenant data is isolated per CHA organization so firms never see each other's shipments.
                  </p>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18, marginBottom: 6 }}>
                    4. Cookies &amp; Session
                  </h3>
                  <p>
                    We use secure HTTP-only session cookies to authenticate your access to the operational dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <button
                type="button"
                onClick={() => setModalTab(null)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(232,232,240,0.7)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "9px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreed(true);
                  setModalTab(null);
                  if (errors.agreed) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.agreed;
                      return next;
                    });
                  }
                }}
                style={{
                  background: "#f59e0b",
                  border: "none",
                  color: "#0a0a0f",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "9px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✓ I Read &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
