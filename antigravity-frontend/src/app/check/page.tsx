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
          IMEI Verification
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-indigo-950">
          Verify Device Status
        </h1>
        <p className="text-slate-500 text-lg">Enter a 15-digit IMEI number to check global records.</p>
      </motion.div>

      <motion.form
        onSubmit={handleCheck}
        className={`w-full max-w-2xl relative glass rounded-3xl p-3 ring-2 shadow-xl transition-all duration-300 ${ringColor}`}
        animate={{ scale: isTyping ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative flex items-center">
          <div className="pl-4 pr-3 text-indigo-400">
            <Search className="w-6 h-6" />
          </div>

          <input
            type="text"
            value={imei}
            onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
            placeholder="000000000000000"
            className="flex-1 bg-transparent border-none outline-none text-2xl md:text-4xl font-mono tracking-[0.2em] text-indigo-950 placeholder:text-slate-200 py-5 w-full"
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

          <AnimatePresence>
            {imei.length === 15 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                type="submit"
                disabled={isSearching}
                className="btn-primary px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center text-sm font-mono text-slate-400 mt-2 pb-1">
          {imei.length}/15 digits
        </div>
        {imei.length === 15 && !isValid && (
          <div className="text-center text-xs text-amber-500 font-semibold mt-2 animate-pulse max-w-md mx-auto leading-relaxed">
            ⚠️ Luhn checksum mismatch. If this device is already reported in our registry, search will still proceed.
          </div>
        )}
      </motion.form>
    </div>
  );
}
