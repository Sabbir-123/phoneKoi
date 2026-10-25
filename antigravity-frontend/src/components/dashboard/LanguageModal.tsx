'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LanguageModal() {
  const { hasSelectedLanguage, setLanguage, setHasSelectedLanguage } = useDashboardStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || hasSelectedLanguage) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="relative w-full max-w-md bg-[#0a0f1c] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-indigo-500/20 blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Globe className="w-8 h-8 text-indigo-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Phone Koi</h2>
            <p className="text-slate-400 mb-8">Please select your preferred dashboard language. You can change this later in settings.</p>

            <div className="w-full flex flex-col gap-4">
              <button 
                onClick={() => {
                  setLanguage('english');
                  setHasSelectedLanguage(true);
                }}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">English</div>
                  <div className="text-xs text-slate-500">Continue with standard English</div>
                </div>
                <div className="text-xl">🇺🇸</div>
              </button>

              <button 
                onClick={() => {
                  setLanguage('banglish');
                  setHasSelectedLanguage(true);
                }}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">Banglish</div>
                  <div className="text-xs text-slate-500">Dashboard er vasha Banglish e hobe</div>
                </div>
                <div className="text-xl">🇧🇩</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
