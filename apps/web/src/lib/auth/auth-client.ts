/**
 * better-auth client
 *
 * Wraps all auth API calls in typed helpers.
 * Backend must expose:  POST /api/auth/sign-in/email
 *                       POST /api/auth/sign-up/email
 *                       POST /api/auth/sign-out
 *                       POST /api/auth/forget-password
 *                       POST /api/auth/reset-password
 *                       GET  /api/auth/verify-email
 *                       GET  /api/auth/get-session
 *
 * Until the real backend is ready, every call returns a mock
 * "demo" user so the UI remains fully navigable.
 */

import type { AuthSession, AuthUser } from "@demurrageos/shared-types";

// ── Config ────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const AUTH_BASE = `${API_BASE}/api/auth`;

// ── Mock session (used when backend is not available) ─────────────
export const DEMO_USER: AuthUser = {
  id: "usr_demo_ansh",
  email: "ansh@demurrageos.app",
  name: "Ansh (Demo)",
  role: "ADMIN",
  orgId: "org_demo_cha",
  orgName: "DemurrageOS Demo CHA",
  emailVerified: true,
};

const DEMO_SESSION: AuthSession = {
  user: DEMO_USER,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

// ── Helpers ───────────────────────────────────────────────────────
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive HTTP-only cookies
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Auth request failed");
  }
  return res.json();
}

// ── Auth API ──────────────────────────────────────────────────────

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  orgName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export const authClient = {
  /** Register a new CHA organization + owner user */
  signUp: async (input: SignUpInput): Promise<AuthSession> => {
    try {
      return await post<AuthSession>("/sign-up/email", input);
    } catch {
      if (typeof document !== "undefined") {
        document.cookie = "better-auth.session_token=demo_session_token; path=/; max-age=604800; SameSite=Lax";
        document.cookie = "demurrage_demo_session=true; path=/; max-age=604800; SameSite=Lax";
      }
      return {
        user: {
          ...DEMO_USER,
          name: input.name,
          email: input.email,
          orgName: input.orgName,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  },

  /** Email + password login */
  signIn: async (input: SignInInput): Promise<AuthSession> => {
    try {
      return await post<AuthSession>("/sign-in/email", input);
    } catch {
      if (typeof document !== "undefined") {
        document.cookie = "better-auth.session_token=demo_session_token; path=/; max-age=604800; SameSite=Lax";
        document.cookie = "demurrage_demo_session=true; path=/; max-age=604800; SameSite=Lax";
      }
      return {
        user: {
          ...DEMO_USER,
          email: input.email || DEMO_USER.email,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  },

  /** Clear session cookie */
  signOut: async () => {
    try {
      await post<{ success: boolean }>("/sign-out", {});
    } catch {}
    if (typeof document !== "undefined") {
      document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "demurrage_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    return { success: true };
  },

  /** Send password-reset email */
  forgotPassword: (email: string) =>
    post<{ success: boolean }>("/forget-password", { email }),

  /** Submit new password with reset token */
  resetPassword: (token: string, password: string) =>
    post<{ success: boolean }>("/reset-password", { token, newPassword: password }),

  /** Fetch current session (called on app boot) */
  getSession: async (): Promise<AuthSession | null> => {
    try {
      const res = await fetch(`${AUTH_BASE}/get-session`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      // Backend not running — return demo session so UI is still usable
      if (process.env.NODE_ENV === "development") return DEMO_SESSION;
      return null;
    }
  },
};
