'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { History, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';

const mockHistory = [
  { id: 1, imei: '359281093827164', result: 'Clean', score: 95, date: 'Oct 12, 2025 - 10:30 AM' },
  { id: 2, imei: '867291038475621', result: 'Suspicious', score: 45, date: 'Oct 10, 2025 - 02:15 PM' },
  { id: 3, imei: '990000862471854', result: 'Stolen', score: 10, date: 'Sep 28, 2025 - 08:45 AM' },
];

export default function HistoryPage() {
  const { language } = useDashboardStore();

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-indigo-400" />
          {language === 'banglish' ? 'IMEI Check History' : 'IMEI Check History'}
        </h1>
        <p className="text-slate-400 mt-2">
          {language === 'banglish' ? 'Apnar purber shob IMEI search er result ekhane paben.' : 'Review your past device verifications and risk scores.'}
        </p>
      </motion.div>

      <div className="space-y-4">
        {mockHistory.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-xl border ${
                  item.result === 'Clean' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  item.result === 'Stolen' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-amber-500/10 border-amber-500/20'
                }`}>
                  {item.result === 'Clean' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <ShieldAlert className="w-6 h-6 text-red-400" />}
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-white tracking-wider mb-1">{item.imei}</div>
                  <div className="text-sm text-slate-400">{item.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className="flex flex-col items-start md:items-end flex-1 md:flex-none">
                  <div className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold">Risk Score</div>
                  <div className={`text-xl font-bold ${
                    item.score > 80 ? 'text-emerald-400' :
                    item.score > 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {item.score}/100
                  </div>
                </div>
                
                <MotionButton variant="secondary" className="px-4 py-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'banglish' ? 'Abar Check Korun' : 'Search Again'}</span>
                </MotionButton>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
