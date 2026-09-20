"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, DEMO_USER } from "@/lib/auth/auth-client";
import { Building, ArrowRight, Lock, Mail, AlertCircle, Shield } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("rohit.mehta@mehtaoverseas.in");
  const [password, setPassword] = useState("••••••••••••");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authClient.signIn({
        email: email || DEMO_USER.email,
        password: password || "demopassword123",
      });
      router.replace(callbackUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError("");
    try {
      await authClient.signIn({
        email: DEMO_USER.email,
        password: "demopassword",
      });
      router.replace(callbackUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Demo sign in failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">CHA Portal Sign In</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Access your customs workspace, container clocks, and DPD fallback alerts.
        </p>
      </div>

      {/* One-click Demo Access */}
      <div className="mb-6 p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" /> Instant Evaluation
          </span>
          <span className="text-[10px] bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded font-mono">
            CHA Admin Mode
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          Pre-loaded with 27 real-world JNPT &amp; Mundra container consignments across 4 client importers.
        </p>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#b45309] hover:bg-[#d97706] text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? "Authenticating..." : "Launch Demo Workspace (Rohit Mehta)"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-[#1e293b]"></div>
        <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-widest font-mono">or enter credentials</span>
        <div className="flex-grow border-t border-[#1e293b]"></div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Authorized CHA Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@customs-agency.in"
              required
              className="w-full bg-[#0b1324] border border-[#1e293b] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Password
            </label>
            <Link href="/forgot-password" className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-[#0b1324] border border-[#1e293b] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-[#334155] bg-[#0b1324] text-amber-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Remember this session</span>
          </label>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" /> 256-bit SSL
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 mt-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white rounded-lg text-xs font-bold transition-colors shadow cursor-pointer disabled:opacity-50"
        >
          {loading ? "Authenticating Session..." : "Sign In to Operations"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        New CHA Agency?{" "}
        <Link href="/register" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
          Create Agency Workspace
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-10 text-xs text-slate-400">
          Loading sign in portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
