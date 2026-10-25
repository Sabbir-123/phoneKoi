'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Settings2, Globe, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const { language, setLanguage, aiMode, setAiMode } = useDashboardStore();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-indigo-600" />
          {language === 'banglish' ? 'Settings' : 'Settings'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {language === 'banglish' ? 'Apnar dashboard er bhasha ebong AI preferences thik korun.' : 'Manage your language preferences and AI explanation modes.'}
        </p>
      </motion.div>

      <div className="grid gap-6">
        {/* Language Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100/50">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-950">Language Settings</h2>
                <p className="text-xs text-slate-400 font-semibold">Choose your preferred dashboard language.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setLanguage('english')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  language === 'english' 
                    ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 shadow-md shadow-indigo-100' 
                    : 'bg-white/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold text-sm mb-1">English</div>
                <div className="text-xs text-slate-400 leading-normal font-semibold">Standard English interface and AI explanations.</div>
              </button>
              
              <button
                onClick={() => setLanguage('banglish')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  language === 'banglish' 
                    ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 shadow-md shadow-indigo-100' 
                    : 'bg-white/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold text-sm mb-1">Banglish</div>
                <div className="text-xs text-slate-400 leading-normal font-semibold">Bangla written in English alphabet for familiarity.</div>
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-6 md:p-8 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100/50">
                <Cpu className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-950">AI Explanation Mode</h2>
                <p className="text-xs text-slate-400 font-semibold">How should the AI explain risk signals to you?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['simple', 'detailed', 'technical'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAiMode(mode)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    aiMode === mode 
                      ? 'bg-purple-50/50 border-purple-500 text-indigo-950 shadow-md shadow-purple-100' 
                      : 'bg-white/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-sm mb-1 capitalize">{mode} Mode</div>
                  <div className="text-xs text-slate-400 leading-normal font-semibold">
                    {mode === 'simple' && 'Brief, easy explanations without technical jargon.'}
                    {mode === 'detailed' && 'Comprehensive breakdown of all risk signals and context.'}
                    {mode === 'technical' && 'Raw data points and advanced metrics for tech users.'}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
