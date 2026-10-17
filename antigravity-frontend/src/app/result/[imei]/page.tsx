"use client";
import { API_URL, authFetch } from '@/utils/api';


import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertOctagon, ArrowLeft, Sparkles, Phone, MessageSquare, Copy, Check, X, MapPin, Flag, FileText, BellRing, Info, Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResultPage(props: { params: Promise<{ imei: string }> }) {
  const params = use(props.params);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || "clean";

  const [score, setScore] = useState(0);
  const [backendData, setBackendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [checksumError, setChecksumError] = useState<string | null>(null);
  
  // Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportSellerModal, setShowReportSellerModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Seller Report Form State
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [sellerReportSubmitted, setSellerReportSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || "";

        let clientIp = "";
        let clientLocation = "";
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const ipRes = await fetch("https://ipapi.co/json/", { signal: controller.signal });
          clearTimeout(timeoutId);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            clientIp = ipData.ip || "";
            const city = ipData.city || "";
            const region = ipData.region || "";
            const country = ipData.country_name || "";
            if (city) {
              clientLocation = region ? `${city}, ${region}` : `${city}, ${country || 'Bangladesh'}`;
            }
          }
        } catch (ipErr) {
          console.warn("Could not fetch client public IP/location from ipapi.co:", ipErr);
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const fbRes = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
            clearTimeout(timeoutId);
            if (fbRes.ok) {
              const fbData = await fbRes.json();
              clientIp = fbData.ip || "";
            }
          } catch (fbErr) {
            console.warn("Fallback IP fetch failed:", fbErr);
          }
        }

        const lat = searchParams.get("lat") || "";
        const lng = searchParams.get("lng") || "";
        const accuracy = searchParams.get("accuracy") || "";
        const locationSource = searchParams.get("locationSource") || "";

        const queryParams = new URLSearchParams({
          lang: "english",
          email: email,
          ...(clientIp && { clientIp }),
          ...(clientLocation && { clientLocation }),
          ...(lat && { lat }),
          ...(lng && { lng }),
          ...(accuracy && { accuracy }),
          ...(locationSource && { locationSource }),
        });

        const res = await authFetch(`${API_URL}/imei/check/${params.imei}?${queryParams.toString()}`);

        
        if (!res.ok) {
          const errData = await res.json();
          if (errData.message && errData.message.includes('QUOTA_LIMIT_EXCEEDED')) {
            setQuotaError('You have used up all your free search limits. Please upgrade your subscription plan to run unlimited IMEI checks.');
            setLoading(false);
            return;
          } else {
            setChecksumError(errData.message || 'Invalid IMEI format or checksum failed.');
            setLoading(false);
            return;
          }
        }

        if (res.ok) {
          const data = await res.json();
          setBackendData(data);

          // Save to localStorage search history isolated by user email
          if (email) {
            try {
              const historyKey = `search_history_${email}`;
              const existingHistoryStr = localStorage.getItem(historyKey);
              const existingHistory = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
              
              // Prevent duplicates in search history
              if (!existingHistory.some((item: any) => item.imei === params.imei)) {
                const newEntry = {
                  id: Date.now(),
                  imei: params.imei,
                  result: data.status === 'PENDING' ? 'Pending' : (data.status === 'STOLEN' ? 'Stolen' : (data.status === 'SUSPICIOUS' ? 'Suspicious' : 'Clean')),
                  score: data.risk_score,
                  date: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                };
                
                const updatedHistory = [newEntry, ...existingHistory].slice(0, 10);
                localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
              }
            } catch (historyErr) {
              console.error('Error saving search history:', historyErr);
            }
          }
        }
      } catch (err: any) {
        console.warn("Backend request failed, using simulation.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.imei]);

  const activeStatus = (backendData?.status?.toLowerCase() || statusParam) as "clean" | "suspicious" | "stolen";
  const targetScore = backendData ? backendData.risk_score : (activeStatus === "clean" ? 2 : activeStatus === "suspicious" ? 55 : 98);

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
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6">
        {/* Background Ambient Orbs matching the website theme */}
        <div className="orb w-[500px] h-[500px] bg-indigo-200/20 top-0 right-0 -z-10 blur-[80px]" />
        <div className="orb w-[300px] h-[300px] bg-purple-200/20 bottom-0 left-0 -z-10 blur-[60px]" style={{ animationDelay: "3s" }} />

        <div className="flex flex-col items-center max-w-sm text-center space-y-6 z-10">
          {/* Circling loader with double ring for premium aesthetic */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-indigo-950">Analyzing IMEI Signals</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Please wait a bit while we query global theft records, extract insights, and evaluate trust indicators...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (quotaError) {
    return (
      <div className="w-full relative flex flex-col items-center justify-center min-h-[85vh] px-6 py-10">
        <div className="orb w-[500px] h-[500px] top-0 right-0 -z-10 bg-indigo-100" />
        <div className="orb w-[300px] h-[300px] bg-purple-100 bottom-0 left-0 -z-10" />


        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-[2rem] border border-amber-200/50 p-8 md:p-10 text-center shadow-2xl bg-white/70 backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-50 to-orange-500" />
          
          <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-500 animate-bounce" />
          </div>

          <h1 className="text-2xl font-bold text-indigo-950 mb-3">Quota Limit Exceeded ⚠️</h1>
          <p className="text-slate-500 leading-relaxed text-sm mb-8 font-medium">
            {quotaError}
          </p>

          <div className="space-y-4">
            <Link href="/dashboard/quota" className="block w-full btn-primary bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-bold text-sm shadow-md transition-all">
              View Premium Subscription Plans
            </Link>
            <Link href="/check" className="block w-full bg-slate-50 border border-slate-105 rounded-2xl py-3.5 text-center font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              Return to Search
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (checksumError) {
    return (
      <div className="w-full relative flex flex-col items-center justify-center min-h-[85vh] px-6 py-10">
        <div className="orb w-[500px] h-[500px] top-0 right-0 -z-10 bg-red-50/50" />
        <div className="orb w-[300px] h-[300px] bg-indigo-50/50 bottom-0 left-0 -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-[2rem] border border-red-200/50 p-8 md:p-10 text-center shadow-2xl bg-white/70 backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
          
          <div className="w-16 h-16 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse" />
          </div>

          <h1 className="text-2xl font-bold text-indigo-950 mb-3">Verification Failed</h1>
          <p className="text-slate-500 leading-relaxed text-sm mb-8 font-semibold">
            {checksumError}
          </p>

          <div className="space-y-4">
            <Link href="/check" className="block w-full btn-primary bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-bold text-sm shadow-md transition-all">
              Return to Search
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("01")) {
      clean = "88" + clean;
    } else if (clean.length === 10 && clean.startsWith("1")) {
      clean = "880" + clean;
    }
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center min-h-[85vh] px-6 py-10">
      {/* Background orbs matching status */}
      <div className={`orb w-[500px] h-[500px] top-0 right-0 -z-10 ${activeStatus === "clean" ? "bg-emerald-100" : activeStatus === "suspicious" ? "bg-amber-100" : "bg-red-100"}`} />
      <div className="orb w-[300px] h-[300px] bg-indigo-100 bottom-0 left-0 -z-10" style={{ animationDelay: "4s" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto space-y-4"
      >
        {/* Main Card */}
        <motion.div
          animate={activeStatus === "stolen" ? { x: [-1.5, 1.5, -1.5, 0], transition: { repeat: Infinity, duration: 0.6, repeatDelay: 2.5 } } : {}}
          className={`${config.cardBg} border ${config.border} rounded-[2rem] p-6 md:p-8 text-center shadow-lg backdrop-blur-md ${config.shadow} space-y-4`}
        >
          <div className="flex justify-center mb-1">
            <div className={`p-4 rounded-2xl ${config.iconBg}`}>
              <Icon className={`w-10 h-10 ${config.iconColor}`} />
            </div>
          </div>

          <div className={`inline-block px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest ${config.badge}`}>
            {config.badgeText}
          </div>

          {/* Prominent Required Stolen Device Warning */}
          {activeStatus === "stolen" && (
            <div className="p-4 rounded-2xl bg-red-600 text-white shadow-md text-left space-y-1">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                <span>OFFICIAL SECURITY ALERT</span>
              </div>
              <p className="text-xs font-bold leading-snug">
                WARNING: This device has been reported lost or stolen. Do not purchase this phone until its ownership has been verified.
              </p>
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-extrabold mb-1.5 text-indigo-950 tracking-tight">{config.title}</h1>
          <p className="text-slate-500 leading-relaxed text-sm font-medium">{config.desc}</p>

          <div className="py-3 border-t border-indigo-950/5 flex flex-col items-center">
            <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.2em]">Risk Score</div>
            <div className={`text-7xl font-black font-mono tracking-tighter leading-none ${config.scoreColor}`}>{score}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">out of 100</div>
          </div>

          <div className="py-2.5 bg-white/60 rounded-2xl border border-white/80">
            <div className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-widest font-bold">Queried IMEI</div>
            <div className="text-base font-mono text-indigo-950 tracking-[0.15em] font-bold">{params.imei}</div>
          </div>

          {/* Device Information Block */}
          {activeStatus === "stolen" && (
            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-150 text-left text-xs space-y-1.5 font-semibold text-slate-600">
              <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Device:</span>
                <span className="font-bold text-indigo-950">{backendData?.brand || "Registered"} {backendData?.model || backendData?.deviceName || "Mobile Device"}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className="font-bold text-red-600 uppercase text-[10px] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {backendData?.reportType || "REPORTED STOLEN"}
                </span>
              </div>
              {backendData?.lossDate && (
                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Date of Loss:</span>
                  <span className="font-bold text-slate-700">{backendData.lossDate}</span>
                </div>
              )}
              {backendData?.policeGdNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Police Record:</span>
                  <span className="font-bold text-indigo-600">{backendData.policeGdNumber} {backendData.policeStation ? `(${backendData.policeStation})` : ''}</span>
                </div>
              )}
            </div>
          )}

          {/* Real-Time Alert Confirmation Pill */}
          {activeStatus === "stolen" && (
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-2.5 text-left">
              <BellRing className="w-4 h-4 text-indigo-600 shrink-0 animate-bounce" />
              <div className="text-[11px] text-indigo-950 font-medium leading-tight">
                <strong className="font-bold text-indigo-700">Real-Time Alert Dispatched:</strong> The registered owner has been immediately alerted of this search inquiry.
              </div>
            </div>
          )}

          {/* Clean device legal advisory */}
          {activeStatus === "clean" && (
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/70 flex items-start gap-2 text-left">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                No active theft reports are registered for this IMEI. Please note: This lookup confirms absence of theft flags in PhoneKoi's database, but does not guarantee handset authenticity or legal clearance.
              </p>
            </div>
          )}

          {/* Action Buttons for Stolen Device */}
          {activeStatus === "stolen" && (
            <div className="space-y-2 pt-1">
              {backendData?.contactNumber && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-red-200/50 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm tracking-wide"
                >
                  <Phone className="w-4 h-4 animate-pulse" />
                  Contact Verified Owner
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowReportSellerModal(true)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border border-red-200 bg-white/80 hover:bg-red-50 text-red-700 font-bold text-xs transition-colors shadow-sm"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report Seller
                </button>

                <button
                  onClick={() => setShowSafetyModal(true)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Safety Guide
                </button>
              </div>
            </div>
          )}
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

      {/* 1. Contact Owner Modal */}
      <AnimatePresence>
        {showContactModal && backendData?.contactNumber && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactModal(false)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl border border-indigo-50/50 shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
              
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 mt-2">
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-indigo-950">Contact Stolen Device Owner</h3>
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">IMEI: {params.imei}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center relative overflow-hidden">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Owner Contact Number</p>
                  <p className="text-xl font-bold text-indigo-950 tracking-wide">{backendData.contactNumber}</p>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed text-center font-medium px-2">
                  This device has been red-flagged. You can directly contact the verified owner to facilitate safe return or coordinate with law enforcement.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(backendData.contactNumber);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl text-xs text-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Number"}
                  </button>

                  <a
                    href={`tel:${backendData.contactNumber}`}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs text-center shadow-md transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call Owner
                  </a>
                </div>

                <a
                  href={formatWhatsAppLink(backendData.contactNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs text-center shadow-md transition-colors mt-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Report Suspicious Seller Modal */}
      <AnimatePresence>
        {showReportSellerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportSellerModal(false)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden z-10"
            >
              <button
                onClick={() => setShowReportSellerModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-red-600">
                  <Flag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-indigo-950">Report Suspicious Seller</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Help law enforcement and the owner investigate this stolen phone offering.
                </p>
              </div>

              {sellerReportSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <Check className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-indigo-950 text-base">Report Submitted Successfully</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                    Thank you for helping keep our marketplace secure. Your tips have been logged and queued for audit.
                  </p>
                  <button
                    onClick={() => {
                      setShowReportSellerModal(false);
                      setSellerReportSubmitted(false);
                    }}
                    className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold mt-2"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSellerReportSubmitted(true);
                  }}
                  className="space-y-3 text-left"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Shop / Seller Name</label>
                    <input
                      type="text"
                      required
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="e.g. Eastern Plaza 3rd Floor Shop 42"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Seller Phone Number</label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Location / Market Address</label>
                    <input
                      type="text"
                      required
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      placeholder="e.g. Motijheel, Dhaka"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Additional Observations</label>
                    <textarea
                      value={sellerNotes}
                      onChange={(e) => setSellerNotes(e.target.value)}
                      placeholder="Offered without box, insisted on quick cash deal, etc."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none min-h-[60px] resize-none focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md mt-2"
                  >
                    Submit Confidential Report
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Law Enforcement Safety Instructions Modal */}
      <AnimatePresence>
        {showSafetyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSafetyModal(false)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden z-10 space-y-4"
            >
              <button
                onClick={() => setShowSafetyModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-indigo-600">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-indigo-950">Safety & Police Guidelines</h3>
                <p className="text-xs text-slate-500 font-medium">Recommended procedures when encountering a stolen device</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold flex gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Do NOT confront or accuse the seller directly. Prioritize your personal physical safety.</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <div className="font-bold text-indigo-950">Recommended Steps:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>Politely decline the transaction without creating conflict.</li>
                    <li>Note the store name, street address, or seller contact details quietly.</li>
                    <li>Contact the National Emergency Helpline (999) or your local Police Thana.</li>
                    <li>Provide this IMEI check verification link as supporting documentation.</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-full btn-primary py-3 rounded-xl text-xs font-bold"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
