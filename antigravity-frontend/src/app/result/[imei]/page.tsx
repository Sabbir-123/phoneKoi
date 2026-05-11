"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertOctagon, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ResultPage(props: { params: Promise<{ imei: string }> }) {
  const params = use(props.params);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || "clean";

  const [score, setScore] = useState(0);
  const [backendData, setBackendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:4000/imei/check/${params.imei}?lang=english`);
        if (res.ok) setBackendData(await res.json());
      } catch {
        console.warn("Backend not running, using simulation.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.imei]);

  const activeStatus = (backendData?.status?.toLowerCase() || statusParam) as "clean" | "suspicious" | "stolen";
  const targetScore = backendData ? backendData.risk_score : (activeStatus === "clean" ? 98 : activeStatus === "suspicious" ? 45 : 5);

  const config = {
    clean: {
      cardBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      shadow: "shadow-emerald-100",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      scoreColor: "text-emerald-600",
      icon: ShieldCheck,
      title: "Device is Clean",
      desc: "No theft reports or suspicious activities found. Safe to proceed.",
      badge: "bg-emerald-100 text-emerald-700",
      badgeText: "✓ VERIFIED CLEAN",
    },
    suspicious: {
      cardBg: "bg-gradient-to-br from-amber-50 to-orange-50",
      border: "border-amber-200",
      shadow: "shadow-amber-100",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      scoreColor: "text-amber-600",
      icon: ShieldAlert,
      title: "Suspicious Activity",
      desc: "This device shows unusual patterns. Proceed with caution.",
      badge: "bg-amber-100 text-amber-700",
      badgeText: "⚠ CAUTION ADVISED",
    },
    stolen: {
      cardBg: "bg-gradient-to-br from-red-50 to-rose-50",
      border: "border-red-200",
      shadow: "shadow-red-100",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      scoreColor: "text-red-600",
      icon: AlertOctagon,
      title: "Reported Stolen",
      desc: "HIGH RISK: This device has been reported stolen. Do not purchase.",
      badge: "bg-red-100 text-red-700",
      badgeText: "✗ DO NOT PURCHASE",
    },
  }[activeStatus];

  useEffect(() => {
    if (loading) return;
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(2, -10 * p);
      setScore(Math.floor(targetScore * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [targetScore, loading]);

  const Icon = config.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Analyzing signals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col items-center justify-center min-h-[85vh] px-6 py-24">
      {/* Background orbs matching status */}
      <div className={`orb w-[500px] h-[500px] top-0 right-0 -z-10 ${activeStatus === "clean" ? "bg-emerald-100" : activeStatus === "suspicious" ? "bg-amber-100" : "bg-red-100"}`} />
      <div className="orb w-[300px] h-[300px] bg-indigo-100 bottom-0 left-0 -z-10" style={{ animationDelay: "4s" }} />

      <Link href="/check" className="absolute top-28 left-6 md:left-12 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors z-20">
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg space-y-5"
      >
        {/* Main Card */}
        <motion.div
          animate={activeStatus === "stolen" ? { x: [-1.5, 1.5, -1.5, 0], transition: { repeat: Infinity, duration: 0.6, repeatDelay: 2.5 } } : {}}
          className={`${config.cardBg} border ${config.border} rounded-3xl p-8 md:p-10 text-center shadow-xl ${config.shadow}`}
        >
          <div className="flex justify-center mb-6">
            <div className={`p-5 rounded-3xl ${config.iconBg}`}>
              <Icon className={`w-14 h-14 ${config.iconColor}`} />
            </div>
          </div>

          <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-5 ${config.badge}`}>
            {config.badgeText}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-indigo-950">{config.title}</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">{config.desc}</p>

          <div className="py-6 border-t border-black/5 flex flex-col items-center">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-[0.2em]">Trust Score</div>
            <div className={`text-8xl font-black font-mono tracking-tighter ${config.scoreColor}`}>{score}</div>
            <div className="text-xs text-slate-400 mt-1">out of 100</div>
          </div>

          <div className="mt-4 py-4 bg-white/60 rounded-2xl border border-white/80">
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-widest">IMEI</div>
            <div className="text-lg font-mono text-indigo-950 tracking-[0.15em] font-semibold">{params.imei}</div>
          </div>
        </motion.div>

        {/* AI Insight Card */}
        <AnimatePresence>
          {backendData?.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="glass rounded-2xl p-6 border border-indigo-100 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-purple-400 rounded-l-2xl" />
              <div className="flex items-start gap-4 pl-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
                    Phone Koi AI Insight
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{backendData.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          href="/check"
          className="block w-full btn-primary rounded-2xl py-4 text-center font-bold text-sm shadow-md"
        >
          Check Another Device
        </Link>
      </motion.div>
    </div>
  );
}
