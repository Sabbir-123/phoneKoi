"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User, AlertCircle, UserPlus } from "lucide-react";
import { auth, googleProvider, initAnalytics } from "@/utils/firebase/client";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { initAnalytics(); }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      window.location.href = "/dashboard?showProfileWarning=true";
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Sign up failed");
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "/dashboard?showProfileWarning=true";
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Google sign-up failed");
    }
    setGoogleLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full glass rounded-3xl p-10 shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-950 mb-3">
            Account Created!
          </h2>
          <p className="text-slate-500 mb-8 text-sm">
            Your Firebase account was created successfully.
          </p>
          <Link href="/login" className="btn-primary px-6 py-3 rounded-xl inline-block font-semibold text-sm">
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-20 relative">
      <div className="orb w-[400px] h-[400px] bg-purple-200 top-0 left-0 -z-10" />
      <div className="orb w-[300px] h-[300px] bg-sky-200 bottom-0 right-0 -z-10" style={{ animationDelay: "4s" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 shadow-xl shadow-purple-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-indigo-950 mb-1">Create Account</h1>
            <p className="text-slate-500 text-sm">Join the community to track verifications.</p>
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

          <form onSubmit={handleSignup} className="space-y-4">
            {[
              { label: "Full Name", type: "text", value: name, set: setName, placeholder: "John Doe", Icon: User },
              { label: "Email", type: "email", value: email, set: setEmail, placeholder: "you@example.com", Icon: Mail },
              { label: "Password", type: "password", value: password, set: setPassword, placeholder: "••••••••", Icon: Lock },
            ].map(({ label, type, value, set, placeholder, Icon }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                  <input
                    type={type} required value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                    className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 pl-10 pr-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all text-sm"
                  />
                </div>
              </div>
            ))}

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold mt-4 text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Create Account</>
              }
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or sign up with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={handleGoogleSignup}
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
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
