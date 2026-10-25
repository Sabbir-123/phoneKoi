"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Scan,
  Zap,
  Sparkles,
  Lock,
  Play,
  RotateCcw,
} from "lucide-react";

interface HolographicScannerProps {
  onSelectSample?: (imei: string) => void;
}

export function HolographicScanner({ onSelectSample }: HolographicScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"scanner" | "video">("scanner");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);

  // 3D Perspective Mouse Tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 22, stiffness: 180, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [14, -14]);
  const rotateY = useTransform(smoothX, [0, 1], [-14, 14]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const triggerScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1200px" }}
      className="relative w-full max-w-[360px] mx-auto select-none"
    >
      {/* ─── Ambient Glow Backdrop ─── */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-violet-500/25 to-sky-400/20 rounded-full blur-[100px] -z-10 animate-pulse" />

      {/* ─── Mode Switcher Bar ─── */}
      <div className="flex justify-center items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "scanner"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-white/80 text-slate-600 hover:bg-white border border-slate-200"
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Hologram Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "video"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-white/80 text-slate-600 hover:bg-white border border-slate-200"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Video Demo</span>
        </button>
      </div>

      {/* ─── 3D Tilted Smartphone Chassis ─── */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[9/18.5] bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 rounded-[50px] p-3.5 shadow-2xl shadow-indigo-950/40 border-[7px] border-slate-800 ring-1 ring-white/20 overflow-hidden"
      >
        {/* Dynamic Island Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Status Bar */}
        <div className="absolute top-4 left-7 z-30 text-[10px] font-bold text-white/80 font-mono">
          12:45
        </div>
        <div className="absolute top-4 right-7 z-30 text-[10px] font-bold text-white/80 font-mono flex items-center gap-1">
          <span>5G</span>
          <span>100%</span>
        </div>

        {/* ─── Screen Content ─── */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-slate-950 text-white flex flex-col justify-between p-5 pt-12">
          {activeTab === "scanner" ? (
            <>
              {/* Hologram Mesh Grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Sweeping Laser Line */}
              <motion.div
                animate={{
                  top: ["8%", "88%", "8%"],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
              />

              {/* Rotating Radar Scanner Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                  className="w-56 h-56 rounded-full border border-violet-500/20 border-dashed"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                  className="w-40 h-40 rounded-full border border-indigo-400/25 border-t-cyan-400"
                />
                <div className="w-24 h-24 rounded-full bg-violet-600/10 backdrop-blur-xs flex items-center justify-center">
                  <Scan className="w-8 h-8 text-cyan-300 animate-pulse" />
                </div>
              </div>

              {/* Top Security Badge */}
              <div className="relative z-30 flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-[10px] font-bold text-violet-300 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>POLICE GD ENGINE</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              {/* Center Device Visualizer */}
              <div className="relative z-30 my-auto text-center space-y-2">
                <div className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Target IMEI Identifier
                  </div>
                  <div className="font-mono font-bold text-sm text-cyan-300 tracking-wider">
                    354892110283746
                  </div>
                </div>

                <div className="flex justify-center gap-2 pt-1">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Luhn: Verified
                  </span>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Theft: Clean
                  </span>
                </div>
              </div>

              {/* Bottom Interactive HUD Card */}
              <div className="relative z-30 bg-slate-900/90 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Security Score</span>
                  <span className="font-mono font-extrabold text-emerald-400">99.8 / 100</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full shadow-[0_0_8px_#818cf8]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={triggerScan}
                    disabled={isScanning}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    {isScanning ? (
                      <>
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        Scanning Databases...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        Run Simulation Scan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Video Screen Container */
            <div className="relative w-full h-full -m-5 overflow-hidden">
              <video
                src="/hero-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-105"
              />
              <div className="absolute bottom-4 left-3 right-3 bg-slate-950/85 backdrop-blur-md border border-white/20 p-2.5 rounded-xl text-left text-white shadow-xl pointer-events-none">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Live Video Engine
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-200">
                  Cross-referencing Police GD & Theft DB
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── 3D Parallax Floating Badge (Bottom Left) ─── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ transform: "translateZ(40px)" }}
        className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-xl border border-indigo-100 p-3.5 rounded-2xl shadow-xl shadow-indigo-950/10 hidden sm:flex items-center gap-3 z-30"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Verified Legitimacy
          </div>
          <div className="text-xs font-black text-indigo-950">Luhn + 64 Districts Sync</div>
        </div>
      </motion.div>
    </div>
  );
}
