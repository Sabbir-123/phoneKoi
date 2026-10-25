"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Building,
  PhoneCall,
  Search,
  Sparkles,
  Zap,
  ArrowRight,
  Radar,
  Radio,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { TiltCard } from "@/components/ui/TiltCard";
import { BorderBeam } from "@/components/ui/BorderBeam";

const districtSamples: Record<string, { thana: string; unit: string; phone: string }> = {
  Dhaka: { thana: "Dhanmondi Model Thana", unit: "DMP", phone: "01320037888" },
  Chittagong: { thana: "Kotwali Model Thana", unit: "CMP", phone: "01320052488" },
  Sylhet: { thana: "Kotwali Model Thana", unit: "SMP", phone: "01320065088" },
  Rajshahi: { thana: "Boalia Model Thana", unit: "RMP", phone: "01320061488" },
  Khulna: { thana: "Khulna Sadar Thana", unit: "KMP", phone: "01320078888" },
  Barishal: { thana: "Kotwali Model Thana", unit: "BMP", phone: "01320084488" },
  Rangpur: { thana: "Kotwali Thana", unit: "RPMP", phone: "01320088888" },
  Mymensingh: { thana: "Kotwali Model Thana", unit: "District Police", phone: "01320092488" },
  "Cox's Bazar": { thana: "Cox's Bazar Model Thana", unit: "District Police", phone: "01320108888" },
};

export function InteractiveBentoGrid() {
  const [selectedDistrict, setSelectedDistrict] = useState("Dhaka");
  const [activeLuhnStep, setActiveLuhnStep] = useState(1);
  const thanaInfo = districtSamples[selectedDistrict] || districtSamples["Dhaka"];

  return (
    <section className="py-24 px-6 relative max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span>Interactive 2026 Security Engine</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-indigo-950 tracking-tight leading-tight">
          Cutting-Edge Architecture <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            Built for National Device Safety
          </span>
        </h2>
        <p className="text-slate-500 text-base sm:text-lg mt-4 leading-relaxed">
          Explore the real-time systems powering Bangladesh’s leading IMEI verification and police recovery infrastructure.
        </p>
      </div>

      {/* ─── Bento Grid Matrix ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Cell 1: 360° Live Threat Radar (Col Span 7) ─── */}
        <div className="lg:col-span-7">
          <TiltCard
            maxTilt={6}
            className="h-full bg-white/80 backdrop-blur-xl border border-indigo-100/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative group"
          >
            <BorderBeam size={250} duration={10} colorFrom="#8b5cf6" colorTo="#06b6d4" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-indigo-950">
                      Live National Threat Radar
                    </h3>
                    <p className="text-xs text-slate-500">Real-time incident detection &amp; recovery pings</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ACTIVE
                </span>
              </div>

              {/* Radar Visualizer Container */}
              <div className="relative w-full h-56 rounded-2xl bg-slate-950 overflow-hidden my-4 border border-slate-800 flex items-center justify-center">
                {/* Radar Grid Circles */}
                <div className="absolute w-48 h-48 rounded-full border border-indigo-500/20" />
                <div className="absolute w-36 h-36 rounded-full border border-indigo-500/25" />
                <div className="absolute w-20 h-20 rounded-full border border-cyan-400/30" />
                <div className="absolute w-full h-[1px] bg-indigo-500/20" />
                <div className="absolute h-full w-[1px] bg-indigo-500/20" />

                {/* Sweeping Cone */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 origin-center bg-gradient-to-tr from-cyan-500/15 via-indigo-500/5 to-transparent pointer-events-none"
                  style={{
                    clipPath: "polygon(50% 50%, 100% 0, 100% 50%)",
                  }}
                />

                {/* Animated Location Pins */}
                <div className="absolute top-16 left-28 flex items-center gap-1.5 z-10">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Dhaka DMP: 117 Devices
                  </span>
                </div>

                <div className="absolute bottom-12 right-24 flex items-center gap-1.5 z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    CMP Kotwali
                  </span>
                </div>

                <div className="absolute top-10 right-20 flex items-center gap-1.5 z-10">
                  <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                  <span className="text-[10px] font-mono font-bold text-violet-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-violet-500/30">
                    SMP Sylhet
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Automatic cross-referencing against GD records &amp; community blacklists</span>
              <Link
                href="/check"
                className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0"
              >
                <span>Launch Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </TiltCard>
        </div>

        {/* ─── Cell 2: Luhn Checksum Mathematical Engine (Col Span 5) ─── */}
        <div className="lg:col-span-5">
          <TiltCard
            maxTilt={6}
            className="h-full bg-white/80 backdrop-blur-xl border border-indigo-100/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative group"
          >
            <BorderBeam size={220} duration={14} colorFrom="#a855f7" colorTo="#6366f1" delay={3} />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-950">Luhn Integrity Math</h3>
                  <p className="text-xs text-slate-500">ISO/IEC 7812 checksum validation</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 my-3 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Interactive Algorithm Demo:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((step) => (
                      <button
                        key={step}
                        onClick={() => setActiveLuhnStep(step)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          activeLuhnStep === step
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        Step {step}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-indigo-100 font-mono text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                    {activeLuhnStep === 1
                      ? "Hardware IMEI Sequence"
                      : activeLuhnStep === 2
                      ? "Even-positioned Digit Doubling"
                      : "Mod 10 Checksum Result"}
                  </div>
                  <div className="text-base font-bold text-indigo-950 tracking-wider">
                    {activeLuhnStep === 1 && "3 5 5 2 3 5 0 4 8 7 4 4 3 2 3"}
                    {activeLuhnStep === 2 && "3 (10) 5 (4) 3 (10) 0 (8) 8 (14) 4 (8) 3 (4) 3"}
                    {activeLuhnStep === 3 && "Sum = 60 | 60 mod 10 = 0 (100% Valid)"}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {activeLuhnStep === 1 &&
                    "Authentic phone motherboards produce strict mathematical 15-digit signatures."}
                  {activeLuhnStep === 2 &&
                    "Every second digit is doubled and reduced according to international telecom standards."}
                  {activeLuhnStep === 3 &&
                    "A valid sum ending in zero confirms genuine hardware format and flags counterfeit cloned chips."}
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Instant sub-second mathematical verification</span>
            </div>
          </TiltCard>
        </div>

        {/* ─── Cell 3: 64 Districts Thana Directory Widget (Col Span 6) ─── */}
        <div className="lg:col-span-6">
          <TiltCard
            maxTilt={6}
            className="h-full bg-white/80 backdrop-blur-xl border border-indigo-100/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative group"
          >
            <BorderBeam size={220} duration={12} colorFrom="#06b6d4" colorTo="#8b5cf6" delay={6} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-indigo-950">
                      64 Districts Police Thana Sync
                    </h3>
                    <p className="text-xs text-slate-500">Official CUG duty officer phone directory</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  All 8 Divisions
                </span>
              </div>

              <div className="space-y-3 my-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500 shrink-0">Select District:</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-950 outline-none focus:border-indigo-500"
                  >
                    {Object.keys(districtSamples).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Police Station Display Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-indigo-950">
                      {thanaInfo.thana}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                      {thanaInfo.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-mono font-bold text-indigo-900">{thanaInfo.phone}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Emergency 999 Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Includes DMP, CMP, GMP, SMP, RMP, KMP, BMP, RPMP</span>
              <Link href="/recovered" className="font-bold text-indigo-600 hover:underline">
                View Recovered Portal &rarr;
              </Link>
            </div>
          </TiltCard>
        </div>

        {/* ─── Cell 4: Recovered Handset Registry & Custody Matcher (Col Span 6) ─── */}
        <div className="lg:col-span-6">
          <TiltCard
            maxTilt={6}
            className="h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative group overflow-hidden border border-indigo-500/40"
          >
            <BorderBeam size={260} duration={8} colorFrom="#38bdf8" colorTo="#a855f7" delay={2} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Recovered Handset Custody Registry
                    </h3>
                    <p className="text-xs text-indigo-300">Police press drives cross-matching engine</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  DMP 117+
                </span>
              </div>

              <div className="my-3 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Lost your phone in Bangladesh? Law enforcement agencies regularly recover batches of mobile phones through specialized operations. PhoneKoi allows you to cross-verify your IMEI against all official custody releases.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                    DB Cyber
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                    CID Special Unit
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                    RAB Operations
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                    District Model Thanas
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Search police drives instantly</span>
              <Link
                href="/recovered"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Search Police Drives</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
