'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { History, Search, ShieldAlert, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HistoryPage() {
  const { language } = useDashboardStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { createClient } = require("@/utils/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          const historyKey = `search_history_${session.user.email}`;
          const savedHistory = localStorage.getItem(historyKey);
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          }
        }
      } catch (err) {
        console.error('Error loading search history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-indigo-600" />
          {language === 'banglish' ? 'IMEI Check History' : 'IMEI Check History'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {language === 'banglish' ? 'Apnar purber shob IMEI search er result ekhane paben.' : 'Review your past device verifications and risk scores.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) - History List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center bg-transparent">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <GlassCard className="p-8 text-center bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] flex flex-col items-center justify-center min-h-[300px]">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl mb-4">
                <History className="w-10 h-10 text-indigo-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-indigo-950 mb-2">
                {language === 'banglish' ? 'Kono Search History Nai' : 'No Search History'}
              </h3>
              <p className="text-slate-500 max-w-md mb-6 text-sm font-semibold">
                {language === 'banglish' 
                  ? 'Apnar ekhono kono IMEI search history nai. Ekta device verify korte nicher button e click korun.' 
                  : 'You have not checked any device IMEIs yet. Start verifying devices to keep track of your search logs here.'}
              </p>
              <Link href="/check">
                <MotionButton variant="primary" className="shadow-md">
                  <Search className="w-5 h-5" />
                  {language === 'banglish' ? 'IMEI Check Korun' : 'Check IMEI Now'}
                </MotionButton>
              </Link>
            </GlassCard>
          ) : (
            history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white/70 border border-slate-100 hover:border-indigo-100/50 hover:bg-white shadow-[0_4px_20px_rgba(99,102,241,0.02)] transition-colors">
                  <div className="flex items-center gap-5">
                    <div className={`p-3.5 rounded-2xl border ${
                      item.result === 'Clean' ? 'bg-emerald-50 border-emerald-100' :
                      item.result === 'Stolen' ? 'bg-red-50 border-red-100' :
                      'bg-amber-50 border-amber-100'
                    }`}>
                      {item.result === 'Clean' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <ShieldAlert className="w-6 h-6 text-red-600" />}
                    </div>
                    <div>
                      <div className="font-mono text-lg font-bold text-indigo-950 tracking-wider mb-1">{item.imei}</div>
                      <div className="text-xs text-slate-400 font-semibold">{item.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex flex-col items-start md:items-end">
                      <div className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider font-bold">Safety Index</div>
                      <div className={`text-lg font-extrabold ${
                        item.score > 80 ? 'text-emerald-600' :
                        item.score > 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {item.score}/100
                      </div>
                    </div>
                    
                    <Link href={`/result/${item.imei}`}>
                      <MotionButton variant="secondary" className="px-4 py-2 border-slate-100 text-indigo-600 shadow-none hover:bg-slate-50 font-bold text-xs gap-1.5">
                        <Search className="w-4 h-4" />
                        {language === 'banglish' ? 'Abar Check Korun' : 'Search Again'}
                      </MotionButton>
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column (1 Col) - Safety Checklist Panel */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-28"
          >
            <GlassCard className="p-6 space-y-6 bg-white/80 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100/50">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="font-bold text-indigo-950 text-base">
                  Used Phone Checklist
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 mt-0.5">1</div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Check IMEI Structure</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Use the Luhn validator to check format authenticity.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 mt-0.5">2</div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Check Stolen Status</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Query Phone Koi database for theft flags before buying.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 mt-0.5">3</div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Request Police GD Copy</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">If the seller claims a phone is second-hand, request evidence.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex gap-2.5 items-start">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    Checks are encrypted and anonymous. Your searches are never shared with sellers.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
