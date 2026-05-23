'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Bell, ShieldAlert, CheckCircle2, Info, Eye, Sliders, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

const mockAlerts = [
  { id: 1, type: 'danger', title: 'Suspicious Activity', desc: 'Your reported device was searched in Dhaka.', time: '2 mins ago' },
  { id: 2, type: 'success', title: 'Report Verified', desc: 'Your stolen device report has been verified by the network.', time: '1 hour ago' },
  { id: 3, type: 'info', title: 'IMEI Searched', desc: 'Someone checked an IMEI you previously searched.', time: '3 hours ago' },
];

export default function AlertsPage() {
  const { language } = useDashboardStore();
  const [globalAlerts, setGlobalAlerts] = useState(true);
  const [areaAlerts, setAreaAlerts] = useState(true);

  const getIcon = (type: string) => {
    switch(type) {
      case 'danger': return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'info': return <Info className="w-5 h-5 text-indigo-600" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getGlow = (type: string) => {
    switch(type) {
      case 'danger': return 'rgba(239,68,68,0.02)';
      case 'success': return 'rgba(16,185,129,0.02)';
      case 'info': return 'rgba(99,102,241,0.02)';
      default: return 'transparent';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
          <Bell className="w-8 h-8 text-indigo-600" />
          {language === 'banglish' ? 'Alerts & Notifications' : 'Alerts & Notifications'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {language === 'banglish' ? 'Apnar account er sob gurutto-purno updates ekhane.' : 'Important updates about your account and reported devices.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) - Alerts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {mockAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', bounce: 0.4 }}
            >
              <GlassCard glowColor={getGlow(alert.type)} className="p-5 flex gap-5 items-start bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] hover:bg-white transition-all">
                <div className={`p-3 rounded-2xl flex-shrink-0 border ${
                  alert.type === 'danger' ? 'bg-red-50 border-red-100' :
                  alert.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                  'bg-indigo-50 border-indigo-100'
                }`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-indigo-950 text-base">{alert.title}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap ml-4 mt-0.5">{alert.time}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed font-semibold">{alert.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Right Column (1 Col) - Alert Settings Control Panel */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-28"
          >
            <GlassCard className="p-6 space-y-6 bg-white/80 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100/50">
                  <Sliders className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="font-bold text-indigo-950 text-base">
                  Alert Settings
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Global Queries</p>
                    <p className="text-[10px] text-slate-400 leading-tight font-medium">When reported device is searched.</p>
                  </div>
                  <button onClick={() => setGlobalAlerts(!globalAlerts)} className="text-indigo-600">
                    {globalAlerts ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Area Specific</p>
                    <p className="text-[10px] text-slate-400 leading-tight font-medium">Flag matches in my district.</p>
                  </div>
                  <button onClick={() => setAreaAlerts(!areaAlerts)} className="text-indigo-600">
                    {areaAlerts ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">System Broadcasts</p>
                    <p className="text-[10px] text-slate-400 leading-tight font-medium">Security engine notifications.</p>
                  </div>
                  <ToggleRight className="w-8 h-8 text-indigo-600/40 cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex gap-2.5 items-start">
                  <Eye className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    Watchlists are active. High-trust reports trigger real-time WhatsApp signals if configured.
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
