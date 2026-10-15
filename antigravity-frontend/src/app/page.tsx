"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  FileText,
  BadgeCheck,
  Database,
  Fingerprint,
  ChevronRight,
  ExternalLink,
  Info,
  Check,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";

// Luhn check algorithm
const validateLuhn = (imei: string): boolean => {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 14; i >= 0; i--) {
    let digit = parseInt(imei.charAt(i), 10);
    if (i % 2 !== 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
};

export default function Home() {
  const router = useRouter();
  const [heroImei, setHeroImei] = useState("");
  const [heroLuhnValid, setHeroLuhnValid] = useState<boolean | null>(null);

  // Interactive Live Demo State (Default to authentic valid 15-digit IMEI)
  const [demoImei, setDemoImei] = useState("354892110283746");
  const [demoValid, setDemoValid] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Handle hero input changes
  useEffect(() => {
    if (!heroImei || heroImei.length < 15) {
      setHeroLuhnValid(null);
    } else if (heroImei.length === 15) {
      setHeroLuhnValid(validateLuhn(heroImei));
    }
  }, [heroImei]);

  // Handle demo input changes
  useEffect(() => {
    if (demoImei.length === 15) {
      setDemoValid(validateLuhn(demoImei));
    } else {
      setDemoValid(false);
    }
  }, [demoImei]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroImei.trim();
    if (clean.length === 15) {
      router.push(`/result/${clean}`);
    } else {
      router.push("/check");
    }
  };

  const setSampleImei = (val: string) => {
    setDemoImei(val);
  };

  return (
    <div className="w-full relative overflow-hidden bg-[#f8fafc] text-slate-800">
      
      {/* ─── Ambient Glows & Background Canvas ────────────────── */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-200/50 via-purple-100/30 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[400px] left-[-200px] w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[1200px] right-[-200px] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* ─── SECTION 1: CINEMATIC HERO WITH SMARTPHONE VIDEO ─── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center px-6 max-w-7xl mx-auto pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Trust Signals, Quick Action Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start space-y-7 z-10"
          >
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-100 shadow-sm text-xs font-bold text-indigo-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Bangladesh&apos;s #1 Community IMEI Verification &amp; Stolen Phone Registry</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-indigo-950">
              Know the{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
                truth
              </span>
              <br />before you buy.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-500 max-w-xl leading-relaxed font-normal">
              Real-time IMEI risk scoring powered by verified Police GD records and community reports. Never buy a stolen, cloned, or blacklisted phone in Bangladesh again.
            </p>

            {/* Quick Live IMEI Search Form */}
            <div className="w-full max-w-xl">
              <form 
                onSubmit={handleHeroSearch}
                className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-indigo-100/60 flex flex-col sm:flex-row gap-2 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100"
              >
                <div className="relative flex-1 flex items-center px-3">
                  <Search className="w-5 h-5 text-indigo-500 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    maxLength={15}
                    value={heroImei}
                    onChange={(e) => setHeroImei(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 15-digit IMEI (dial *#06#)"
                    className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-mono tracking-wider font-semibold"
                  />
                  {heroLuhnValid === true && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                  {heroLuhnValid === false && (
                    <span className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5" /> Invalid
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/25 transition-all shrink-0 cursor-pointer"
                >
                  <span>Verify Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Secondary CTA links */}
              <div className="flex items-center gap-4 mt-3 px-1 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" /> 100% Free Format Check
                </span>
                <span>•</span>
                <Link href="/report" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors flex items-center gap-1 underline underline-offset-4">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Report a Stolen Phone
                </Link>
                <span>•</span>
                <Link href="/check" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Advanced Check Engine
                </Link>
              </div>
            </div>

            {/* Supported Brands Bar */}
            <div className="pt-2 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Instant Verification Supported For:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🍎</span> Apple iPhone (11 – 18 Pro Max)
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>📱</span> Samsung Galaxy (S26 ultra, S26, A-series, all series)
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>⚡</span> Xiaomi, Redmi &amp; Poco
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Luxury Smartphone Mockup with YouTube Video */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center items-center relative"
          >
            {/* Ambient Refraction Glows */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-sky-400/20 rounded-full blur-[100px] -z-10" />

            {/* Phone Device Frame */}
            <div className="relative w-full max-w-[325px] aspect-[9/18.5] bg-slate-950 rounded-[48px] p-3 shadow-2xl shadow-indigo-900/30 border-[6px] border-slate-800 ring-1 ring-slate-700/60 overflow-hidden">
              
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
              </div>

              {/* Status Bar simulation */}
              <div className="absolute top-4 left-7 z-30 text-[10px] font-bold text-white/90">
                12:45
              </div>
              <div className="absolute top-4 right-7 z-30 text-[10px] font-bold text-white/90 flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>

              {/* Video Screen Container */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black">
                {!videoError ? (
                  <video
                    src="/hero-video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoError(true)}
                    className="w-full h-full object-cover scale-105"
                  />
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/RzTucEPowrg?autoplay=1&mute=1&loop=1&playlist=RzTucEPowrg&controls=0&rel=0&modestbranding=1"
                    title="Phone Koi Preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full object-cover scale-105"
                  />
                )}

                {/* Floating In-App Glass Badge Overlay */}
                <div className="absolute bottom-5 left-3 right-3 bg-slate-950/80 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-left text-white shadow-xl pointer-events-none z-20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                      Live Risk Engine Active
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Cross-checking Police GD &amp; Community Theft Database
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Trust Metric Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-6 -left-4 sm:-left-8 bg-white/95 backdrop-blur-xl border border-indigo-100 p-4 rounded-2xl shadow-xl shadow-indigo-100/80 hidden sm:flex items-center gap-3.5 z-20"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Engine</div>
                <div className="text-sm font-extrabold text-indigo-950">Luhn + Police GD Match</div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ─── SECTION 2: INTRODUCTORY INTERACTIVE IMEI LAB ─────────── */}
      <section className="py-20 px-6 relative max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" /> Interactive Demonstration
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight">
            How IMEI Mathematical Integrity Works
          </h2>
          <p className="text-slate-500 text-base sm:text-lg mt-3 leading-relaxed">
            Every authentic phone worldwide carries a 15-digit IMEI structured with the Luhn checksum algorithm. Try sample identifiers below or type your own to see how PhoneKoi verifies format validity.
          </p>
        </div>

        {/* Interactive Lab Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-indigo-100/40 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Input & Preset Selector */}
            <div className="lg:col-span-7 space-y-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Test 15-Digit IMEI String:
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  value={demoImei}
                  onChange={(e) => setDemoImei(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 font-mono text-lg font-bold text-indigo-950 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all tracking-widest"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {demoImei.length}/15 digits
                </span>
              </div>

              {/* Sample Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-400">Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => setSampleImei("354892110283746")}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-100"
                >
                  Valid iPhone 15 Pro
                </button>
                <button
                  type="button"
                  onClick={() => setSampleImei("867543051294818")}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-100"
                >
                  Valid Samsung S24
                </button>
                <button
                  type="button"
                  onClick={() => setSampleImei("123456789012345")}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors border border-red-100"
                >
                  Invalid Cloned IMEI
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                💡 <em>Note:</em> The Luhn check verifies <strong>mathematical hardware format</strong>. To check if a phone is <strong>reported lost or in Police GD</strong>, run the query below.
              </div>
            </div>

            {/* Live Output Analysis Box */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-6 text-white shadow-inner space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Format Integrity</span>
                {demoValid ? (
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Luhn Verified
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Checksum Failed
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Type Allocation Code (TAC):</span>
                  <span className="font-mono text-slate-200">{demoImei.slice(0, 8) || "--------"}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Serial Number (SNR):</span>
                  <span className="font-mono text-slate-200">{demoImei.slice(8, 14) || "------"}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Luhn Check Digit (CD):</span>
                  <span className="font-mono font-bold text-indigo-400">{demoImei.slice(14, 15) || "-"}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/result/${demoImei}`}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Query Police GD &amp; Stolen Registry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                  Checks PhoneKoi nationwide database for active theft reports
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 3: 3-STEP VERIFICATION PROCESS ────────────────── */}
      <section className="py-24 px-6 relative max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> Simple Protocol
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-indigo-950 tracking-tight">
            How PhoneKoi Protects Buyers
          </h2>
          <p className="text-slate-500 text-base sm:text-lg mt-3">
            Follow three straightforward steps before exchanging cash or signing used mobile deals in Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg shadow-indigo-100/30 relative flex flex-col justify-between group hover:border-indigo-300 transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 font-black text-xl shadow-xs group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-xl font-bold text-indigo-950 mb-3">Dial *#06# on Phone</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Retrieve the hardware IMEI directly from the dialer. Compare it with the SIM tray print and original packaging to detect cloned motherboards.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600 flex items-center gap-1">
              <span>Always verify on-device</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg shadow-indigo-100/30 relative flex flex-col justify-between group hover:border-indigo-300 transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6 font-black text-xl shadow-xs group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-xl font-bold text-indigo-950 mb-3">Run Live PhoneKoi Query</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Our engine executes real-time checks across active Police GD (General Diary) records, community theft flags, and algorithmic integrity parameters.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <span>Instant sub-second results</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg shadow-indigo-100/30 relative flex flex-col justify-between group hover:border-indigo-300 transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 font-black text-xl shadow-xs group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-xl font-bold text-indigo-950 mb-3">Review Safety Verdict</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Receive an actionable risk score (Clean, Caution, or Stolen). Review whether a police report exists before finalizing your purchase securely.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Complete transaction peace of mind</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 4: THE PHONEKOI ENGINE (6 CORE PILLARS) ───────── */}
      <section className="py-24 px-6 relative max-w-7xl mx-auto bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200/80 my-8 shadow-sm">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
            <Database className="w-3.5 h-3.5" /> Technical Infrastructure
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-indigo-950 tracking-tight">
            The PhoneKoi Verification Engine
          </h2>
          <p className="text-slate-500 text-base sm:text-lg mt-3">
            Multi-layered security protocols built to combat mobile theft, device fencing, and fraudulent secondary market reselling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1: Luhn Algorithm Check */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950 mb-2.5">Luhn Algorithm Check</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Instant mathematical checksum verification ensuring the 15-digit IMEI complies with official GSMA device format standards.
            </p>
          </div>

          {/* Feature 2: Real-time Risk Engine */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950 mb-2.5">Real-time Risk Engine</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Dynamic risk calculation continuously evaluating theft incident reports, query patterns, and geographic suspicion indicators.
            </p>
          </div>

          {/* Feature 3: Community Driven Registry */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950 mb-2.5">Community Driven Database</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              A decentralized registry of lost and stolen smartphones submitted by verified owners across all districts in Bangladesh.
            </p>
          </div>

          {/* Feature 4: Police GD Cross-Referencing */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950 mb-2.5">Police GD Cross-Reference</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Direct verification with Thana General Diary records to legally flag stolen items and prevent criminals from reselling property.
            </p>
          </div>

          {/* Feature 5: 1-Number Identity Anti-Fraud */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
              <Fingerprint className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950 mb-2.5">1-Number Identity Policy</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Every reporter must link a unique verified phone number. Prevents fake reports, retaliatory harassment, and duplicate spam accounts.
            </p>
          </div>

          {/* Feature 6: Marketplace Blacklist Broadcast */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950 mb-2.5">Instant Theft Broadcast</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              As soon as a device is reported with verified GD evidence, it is instantly blacklisted across our lookup engine to alert potential buyers.
            </p>
          </div>

        </div>
      </section>

      {/* ─── SECTION 5: ECOSYSTEM & POPULAR DEVICES SHOWCASE ────── */}
      <section className="py-20 px-6 relative max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Device Coverage
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight">
            Protection Across Major Smartphone Brands
          </h2>
          <p className="text-slate-500 text-base mt-2">
            PhoneKoi indexes hardware identifiers across iOS and Android ecosystems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Apple Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
              🍎
            </div>
            <h3 className="text-xl font-bold text-indigo-950">Apple iPhone Series</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify models from iPhone 11 up to iPhone 16 Pro Max. Check against IMEI blacklists and stolen serials before buying used devices on social groups.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">iPhone 16 Pro Max</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">iPhone 15 Pro</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">iPhone 14 / 13</span>
            </div>
          </div>

          {/* Samsung Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              📱
            </div>
            <h3 className="text-xl font-bold text-indigo-950">Samsung Galaxy Series</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify Galaxy S-series, A-series, and Z Fold/Flip models. Protect against Knox bypasses, carrier locks, and blacklisted second-hand imports.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Galaxy S24 Ultra</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Galaxy S23 / S22</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Galaxy A54 / A34</span>
            </div>
          </div>

          {/* Xiaomi Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-bold">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-indigo-950">Xiaomi &amp; Redmi Lineup</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify Redmi Note series and Poco smartphones. Prevent buying devices with swapped motherboards or unauthorized serial modifications.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Redmi Note 13 Pro</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Poco X / F Series</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Xiaomi 14 / 13</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 6: SUPPORTING PROOF & POLICE GD PROTOCOL ─────── */}
      <section className="py-20 px-6 relative max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/80 border border-indigo-700 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Lawful Verification Standards
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Why Police GD Integration Makes PhoneKoi Uniquely Reliable
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Unlike unverified forums or arbitrary social media posts, PhoneKoi requires reporters to submit legitimate Thana GD (General Diary) records and physical device proofs. This maintains absolute legal integrity and ensures legitimate buyers can verify hardware authenticity with genuine peace of mind.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white mb-0.5">Lawful Documentation</div>
                  <div className="text-slate-300">Requires GD number and police station filing details.</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white mb-0.5">Strict Identity Protection</div>
                  <div className="text-slate-300">1-number-per-account policy prevents abusive duplicate flags.</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg cursor-pointer"
              >
                <span>Report Lost Phone with Police GD</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Decorative Shield Emblem in Background */}
          <div className="absolute -right-10 -bottom-10 w-96 h-96 opacity-10 pointer-events-none">
            <ShieldCheck className="w-full h-full text-white" />
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: PROMOTIONAL MEMBERSHIP & TIERS ─────────────── */}
      <section className="py-20 px-6 relative max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Transparent Membership
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight">
            Protection Plans For Every Buyer
          </h2>
          <p className="text-slate-500 text-base mt-2">
            Start completely free or enjoy our launch promotion with full Pro benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Tier */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Access</span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">Standard</span>
              </div>
              <h3 className="text-2xl font-black text-indigo-950 mb-2">Free Plan</h3>
              <div className="text-3xl font-extrabold text-slate-900 mb-6">৳0 <span className="text-xs font-medium text-slate-400">/ forever</span></div>
              
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Standard 15-Digit Format Validation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Basic Luhn Checksum Verification</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>1 Free Community Database Query</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* 6 Months Pro Promotional Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between relative overflow-hidden border border-indigo-500/30">
            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Special Launch Offer
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Early Adopter Promotion</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">6 Months Pro Member</h3>
              <div className="text-3xl font-extrabold text-white mb-6">Free Promo <span className="text-xs font-normal text-indigo-300">(until Jan 2027)</span></div>

              <ul className="space-y-3 text-sm text-indigo-100">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-300" />
                  <span><strong>30 Verified Queries</strong> Included</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-300" />
                  <span><strong>10 Stolen Phone Report</strong> Quotas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>Full Risk Breakdown &amp; GD Matches</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>Priority Community Trust Badge</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Claim 6 Months Free Pro Now
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 8: FINAL CINEMATIC CALL-TO-ACTION ───────────── */}
      <section className="py-24 px-6 relative max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-indigo-950 tracking-tight">
              Ready to verify a phone in Bangladesh?
            </h2>

            <p className="text-slate-500 text-base sm:text-lg">
              Don&apos;t risk purchasing stolen goods or dealing with police seizures. Enter any IMEI number now to verify authenticity before you pay.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
              <Link
                href="/check"
                className="btn-primary py-4 px-8 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl hover:shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <span>Check IMEI Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/report"
                className="py-4 px-8 rounded-2xl font-bold text-sm sm:text-base text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Report Stolen Phone
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
