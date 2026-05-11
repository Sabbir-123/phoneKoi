"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, AlertCircle, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { auth, googleProvider, initAnalytics } from "@/utils/firebase/client";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";

// Auth mode toggle: "supabase" | "firebase"
type AuthMode = "supabase" | "firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("supabase");

  const supabase = createClient();

  // Boot Firebase Analytics on mount
  useEffect(() => { initAnalytics(); }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "supabase") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/dashboard";
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "/dashboard";
      } catch (err: any) {
        setError(err.message?.replace("Firebase: ", "") || "Sign in failed");
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    if (mode === "firebase") {
      try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = "/dashboard";
      } catch (err: any) {
        setError(err.message?.replace("Firebase: ", "") || "Google sign-in failed");
      }
    } else {
      // Supabase OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-20 relative">
      <div className="orb w-[400px] h-[400px] bg-indigo-200 top-0 right-0 -z-10" />
      <div className="orb w-[300px] h-[300px] bg-purple-200 bottom-0 left-0 -z-10" style={{ animationDelay: "3s" }} />

      <Link href="/" className="absolute top-28 left-6 md:left-12 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors z-20">
        <ArrowLeft className="w-4 h-4" /> Back Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-indigo-950 mb-1">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Sign in to access the Phone Koi Network.</p>
          </div>

          {/* Auth Provider Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6 gap-1">
            {(["supabase", "firebase"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 text-xs font-bold py-2 rounded-lg capitalize transition-all duration-200 ${
                  mode === m
                    ? "bg-white shadow text-indigo-700"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {m === "supabase" ? "🔷 Supabase" : "🔶 Firebase"}
              </button>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-5 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 pl-10 pr-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <Link href="#" className="text-xs text-indigo-500 hover:text-indigo-700">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 pl-10 pr-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full btn-primary rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold mt-4 text-sm"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn className="w-4 h-4" /> Sign In</>
              }
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or continue with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600 shadow-sm disabled:opacity-60"
          >
            {googleLoading
              ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.8 15.72 17.58V20.35H19.28C21.36 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.35L15.72 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.08H2.16V16.92C3.98 20.52 7.69 23 12 23Z" fill="#34A853"/>
                  <path d="M5.84 14.08C5.62 13.42 5.5 12.72 5.5 12C5.5 11.28 5.62 10.58 5.84 9.92V7.08H2.16C1.41 8.58 1 10.24 1 12C1 13.76 1.41 15.42 2.16 16.92L5.84 14.08Z" fill="#FBBC05"/>
                  <path d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7.02L19.36 3.86C17.46 2.1 14.97 1 12 1C7.69 1 3.98 3.48 2.16 7.08L5.84 9.92C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            }
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
