'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Bell, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

const mockAlerts = [
  { id: 1, type: 'danger', title: 'Suspicious Activity', desc: 'Your reported device was searched in Dhaka.', time: '2 mins ago' },
  { id: 2, type: 'success', title: 'Report Verified', desc: 'Your stolen device report has been verified by the network.', time: '1 hour ago' },
  { id: 3, type: 'info', title: 'IMEI Searched', desc: 'Someone checked an IMEI you previously searched.', time: '3 hours ago' },
];

export default function AlertsPage() {
  const { language } = useDashboardStore();

  const getIcon = (type: string) => {
    switch(type) {
      case 'danger': return <ShieldAlert className="w-6 h-6 text-red-400" />;
      case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'info': return <Info className="w-6 h-6 text-indigo-400" />;
      default: return <Bell className="w-6 h-6 text-slate-400" />;
    }
  };

  const getGlow = (type: string) => {
    switch(type) {
      case 'danger': return 'rgba(248,113,113,0.15)';
      case 'success': return 'rgba(52,211,153,0.15)';
      case 'info': return 'rgba(99,102,241,0.15)';
      default: return 'transparent';
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {language === 'banglish' ? 'Alerts & Notifications' : 'Alerts & Notifications'}
        </h1>
        <p className="text-slate-400 mt-1">
          {language === 'banglish' ? 'Apnar account er sob gurutto-purno updates ekhane.' : 'Important updates about your account and reported devices.'}
        </p>
      </motion.div>

      <div className="space-y-4">
        {mockAlerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', bounce: 0.4 }}
          >
            <GlassCard glowColor={getGlow(alert.type)} className="p-5 flex gap-5 items-start">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${
                alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/20' :
                alert.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                'bg-indigo-500/10 border border-indigo-500/20'
              }`}>
                {getIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white text-lg">{alert.title}</h3>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-4">{alert.time}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{alert.desc}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
