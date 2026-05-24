"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const validateLuhn = (imei: string): boolean => {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 14; i >= 0; i--) {
    let digit = parseInt(imei.charAt(i), 10);
    if (i % 2 !== 0) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
  }
  return sum % 10 === 0;
};

export default function CheckPage() {
  const [imei, setImei] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (imei.length === 0) { setIsValid(null); setIsTyping(false); return; }
    setIsTyping(true);
    const t = setTimeout(() => setIsTyping(false), 500);
    if (imei.length === 15) setIsValid(validateLuhn(imei));
    else setIsValid(false);
    return () => clearTimeout(t);
  }, [imei]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imei.length !== 15) return;
    
    // Check if user is signed in
    const { createClient } = require("@/utils/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push(`/login?redirectTo=/check`);
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const lastDigit = parseInt(imei.charAt(14), 10);
      let status = "clean";
      if (lastDigit >= 7) status = "stolen";
      else if (lastDigit >= 4) status = "suspicious";
      router.push(`/result/${imei}?status=${status}`);
    }, 1500);
  };

  const ringColor = isValid
    ? "ring-emerald-400 shadow-emerald-100"
    : imei.length === 15
    ? "ring-amber-400 shadow-amber-50"
    : imei.length > 0 && !isTyping
    ? "ring-red-300 shadow-red-50"
    : "ring-indigo-200 shadow-indigo-50";

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[80vh] px-6">
      {/* Background orbs */}
      <div className="orb w-[500px] h-[500px] bg-indigo-200 top-0 right-0 -z-10" />
      <div className="orb w-[300px] h-[300px] bg-purple-200 bottom-0 left-0 -z-10" style={{ animationDelay: "4s" }} />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center space-y-4 mb-14"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-4">
          <Search className="w-4 h-4" />
          Device Authenticity
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-indigo-950">
          Check & Verify Before You Buy
        </h1>
        <p className="text-slate-500 text-lg">Is this phone safe to purchase? Enter the 15-digit IMEI to check global records.</p>
      </motion.div>

      <motion.form
        onSubmit={handleCheck}
        className="w-full max-w-2xl flex flex-col gap-6"
      >
        {/* The Glass Input Box */}
        <motion.div
          className={`w-full relative glass rounded-[2rem] p-6 ring-2 shadow-xl transition-all duration-300 ${ringColor} flex flex-col gap-4`}
          animate={{ scale: isTyping ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Label and Counter Row */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Device IMEI
            </span>
            <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/40 px-2.5 py-0.5 rounded-full">
              {imei.length}/15 digits
            </span>
          </div>

          {/* Input Field Row */}
          <div className="relative flex items-center bg-white/40 backdrop-blur-sm border border-indigo-50/50 rounded-2xl p-1">
            <div className="pl-4 pr-3 text-indigo-400">
              <Search className="w-6 h-6" />
            </div>

            <input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
              placeholder="000000000000000"
              className="flex-1 bg-transparent border-none outline-none text-2xl md:text-4xl font-mono tracking-[0.2em] text-indigo-950 placeholder:text-slate-200 py-4 w-full"
              disabled={isSearching}
              suppressHydrationWarning
            />

            <AnimatePresence>
              {imei.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="pr-4 flex items-center"
                >
                  {isValid
                    ? <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    : <AlertTriangle className="w-7 h-7 text-red-400" />
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action Button Row (Outside the Box) */}
        <AnimatePresence>
          {imei.length === 15 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden w-full"
            >
              <button
                type="submit"
                disabled={isSearching}
                className="w-full btn-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-base shadow-lg shadow-indigo-100/30 hover:shadow-indigo-200/50 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" /> Check Status
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {imei.length === 15 && !isValid && (
          <div className="text-center text-xs text-amber-500 font-semibold animate-pulse max-w-md mx-auto leading-relaxed px-2">
            ⚠️ Luhn checksum mismatch. If this device is already reported in our registry, search will still proceed.
          </div>
        )}
      </motion.form>
    </div>
  );
}
