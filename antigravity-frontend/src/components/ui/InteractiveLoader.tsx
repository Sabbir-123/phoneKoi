'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Smartphone, Sparkles, Activity, RefreshCw, Zap, Database, Lock } from 'lucide-react';

interface InteractiveLoaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'card' | 'inline' | 'fullscreen';
  showSkeleton?: boolean;
  skeletonType?: 'table' | 'cards' | 'simple';
  onRefresh?: () => void;
  stages?: string[];
}

const DEFAULT_STAGES = [
  'Connecting to Supabase PostgreSQL ledger...',
  'Authenticating cryptographic role credentials...',
  'Streaming verified device security records...',
  'Synthesizing real-time telemetry feed...',
];

export function InteractiveLoader({
  title = 'Querying Active Ledger Records',
  subtitle = 'Phone Koi High-Security Database Node',
  variant = 'card',
  showSkeleton = true,
  skeletonType = 'table',
  onRefresh,
  stages = DEFAULT_STAGES,
}: InteractiveLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [pingSpeed, setPingSpeed] = useState('38ms');

  // Elapsed timer ticker
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Stage rotation
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 1400);
    return () => clearInterval(stageTimer);
  }, [stages.length]);

  // Interactive Sonar Shockwave on Click
  const handleRadarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPulseCount((c) => c + 1);
    setPingSpeed(`${Math.floor(28 + Math.random() * 20)}ms`);

    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev.slice(-3), newRipple]);

    if (onRefresh) onRefresh();
  };

  const containerClasses = {
    card: 'py-12 px-6 sm:px-10 rounded-3xl bg-gradient-to-b from-white/95 via-indigo-50/20 to-white/95 border border-indigo-100/70 shadow-xl shadow-indigo-500/5 backdrop-blur-xl relative overflow-hidden',
    inline: 'py-8 px-4 text-center relative overflow-hidden',
    fullscreen: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6',
  }[variant];

  return (
    <div className={`w-full ${containerClasses}`}>
      {/* Background ambient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="flex flex-col items-center justify-center text-center relative z-10 select-none">
        {/* Interactive Holographic Radar Unit */}
        <div
          onClick={handleRadarClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center cursor-pointer group mb-6"
          title="Interactive Radar Scanner • Click to ping node"
        >
          {/* Sonar Shockwave Ripples */}
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-24 h-24 rounded-full border-2 border-indigo-500 bg-indigo-500/20 pointer-events-none"
              style={{ left: ripple.x - 48, top: ripple.y - 48 }}
            />
          ))}

          {/* Outer Rotating Cyber Grid Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: isHovered ? 4 : 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 rounded-full border border-dashed border-indigo-300/80 group-hover:border-indigo-500 transition-colors"
          />

          {/* Glowing Scanner Sweep Beam */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: isHovered ? 1.5 : 2.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-2 rounded-full pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(99, 102, 241, 0.15) 330deg, rgba(129, 140, 248, 0.7) 360deg)',
            }}
          />

          {/* Counter-Rotating Intermediate Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: isHovered ? 5 : 10,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-3 rounded-full border border-indigo-200/90 shadow-inner"
          >
            {/* Satellite Data Orbit Node */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/50 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </motion.div>

          {/* Center Holographic Core Shield */}
          <motion.div
            animate={{
              scale: isHovered ? 1.08 : [1, 1.03, 1],
              boxShadow: isHovered
                ? '0 0 25px rgba(99, 102, 241, 0.4)'
                : '0 0 15px rgba(99, 102, 241, 0.2)',
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-white via-indigo-50 to-white border border-indigo-200/90 flex flex-col items-center justify-center shadow-lg relative z-20 group-hover:border-indigo-400 transition-colors"
          >
            <div className="relative">
              <ShieldCheck className="w-8 h-8 text-indigo-600 transition-transform group-hover:scale-110" />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"
              />
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-900 mt-1">
              TLS 1.3
            </span>
          </motion.div>

          {/* Interactive Tooltip Hint on Hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                className="absolute -bottom-8 bg-slate-900/90 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-30 flex items-center gap-1.5 backdrop-blur-md"
              >
                <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Click radar to ping database node</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Header Title & Subtitle */}
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-indigo-950 flex items-center gap-2">
          <span>{title}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200/80">
            LIVE
          </span>
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-1 max-w-md">
          {subtitle}
        </p>

        {/* Dynamic Telemetry Stage Status */}
        <div className="mt-4 min-h-[28px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={stageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>{stages[stageIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live Metrics & Telemetry Control Chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60">
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Supabase Pooler: <strong className="text-indigo-950">Active</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Latency: <strong className="text-indigo-950">{pingSpeed}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Elapsed: <strong className="text-indigo-950">{elapsed.toFixed(1)}s</strong></span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Re-sync</span>
            </button>
          )}
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden mt-6 relative">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-1/2 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* Shimmer Skeleton Placeholder Below the Radar */}
      {showSkeleton && (
        <div className="mt-8 pt-6 border-t border-slate-100 w-full animate-pulse opacity-60">
          {skeletonType === 'table' ? (
            <div className="space-y-3">
              <div className="h-9 bg-slate-100 rounded-xl w-full" />
              <div className="h-12 bg-slate-50 border border-slate-100/80 rounded-xl w-full" />
              <div className="h-12 bg-slate-50 border border-slate-100/80 rounded-xl w-full" />
              <div className="h-12 bg-slate-50 border border-slate-100/80 rounded-xl w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl" />
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl" />
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl" />
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
