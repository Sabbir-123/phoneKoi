'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { useTranslation } from '@/lib/useTranslation';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Settings2, Globe, Cpu, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { language, setLanguage, aiMode, setAiMode } = useDashboardStore();
  const { t, isBn } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-indigo-600" />
          {t.settings.title}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {t.settings.subtitle}
        </p>
      </motion.div>

      <div className="grid gap-6">
        {/* Language Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100/50">
                  <Globe className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-indigo-950">{t.settings.languageTitle}</h2>
                  <p className="text-xs text-slate-400 font-semibold">{t.settings.languageSubtitle}</p>
                </div>
              </div>

              {/* Quick toggle pill */}
              <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLanguage('english')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                    !isBn ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bangla')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
                    isBn ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* English Card */}
              <button
                type="button"
                onClick={() => setLanguage('english')}
                className={`p-5 rounded-2xl border text-left transition-all relative group ${
                  !isBn
                    ? 'bg-indigo-50/60 border-indigo-500 text-indigo-950 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20' 
                    : 'bg-white/40 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇬🇧</span>
                    <span className="font-bold text-base text-slate-800">{t.settings.englishTitle}</span>
                  </div>
                  {!isBn && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  )}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.settings.englishDesc}
                </div>
              </button>
              
              {/* Bangla Card */}
              <button
                type="button"
                onClick={() => setLanguage('bangla')}
                className={`p-5 rounded-2xl border text-left transition-all relative group ${
                  isBn
                    ? 'bg-indigo-50/60 border-indigo-500 text-indigo-950 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20' 
                    : 'bg-white/40 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇧🇩</span>
                    <span className="font-bold text-base text-slate-800">{t.settings.banglaTitle}</span>
                  </div>
                  {isBn && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  )}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed font-medium">
                  {t.settings.banglaDesc}
                </div>
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
                <h2 className="text-lg font-bold text-indigo-950">{t.settings.aiModeTitle}</h2>
                <p className="text-xs text-slate-400 font-semibold">{t.settings.aiModeSubtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['simple', 'detailed', 'technical'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAiMode(mode)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    aiMode === mode 
                      ? 'bg-purple-50/50 border-purple-500 text-indigo-950 shadow-md shadow-purple-100 ring-2 ring-purple-500/20' 
                      : 'bg-white/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-sm mb-1 capitalize">
                    {mode === 'simple' ? t.settings.simpleMode : mode === 'detailed' ? t.settings.detailedMode : t.settings.technicalMode}
                  </div>
                  <div className="text-xs text-slate-400 leading-normal font-semibold">
                    {mode === 'simple' && t.settings.simpleModeDesc}
                    {mode === 'detailed' && t.settings.detailedModeDesc}
                    {mode === 'technical' && t.settings.technicalModeDesc}
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
