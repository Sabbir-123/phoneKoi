'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Bell, ShieldAlert, CheckCircle2, Info, Eye, Sliders, ToggleLeft, ToggleRight, RefreshCw, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '@/utils/firebase/client';
import { createClient } from '@/utils/supabase/client';

export default function AlertsPage() {
  const { language } = useDashboardStore();
  const [globalAlerts, setGlobalAlerts] = useState(true);
  const [areaAlerts, setAreaAlerts] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/users/alerts?email=${email}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error('Error fetching dynamic alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAlerts = async () => {
      const fUser = auth.currentUser;
      let emailAddress = '';
      if (fUser?.email) {
        emailAddress = fUser.email;
      } else {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          emailAddress = session.user.email;
        }
      }

      if (emailAddress) {
        fetchAlerts(emailAddress);
      } else {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

  const handleRefresh = async () => {
    const fUser = auth.currentUser;
    let emailAddress = fUser?.email || '';
    if (!emailAddress) {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      emailAddress = session?.user?.email || '';
    }
    if (emailAddress) {
      await fetchAlerts(emailAddress);
    }
  };

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

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-600" />
            {language === 'banglish' ? 'Alerts & Notifications' : 'Alerts & Notifications'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {language === 'banglish' ? 'Apnar account er sob gurutto-purno updates ekhane.' : 'Important updates about your account and reported devices.'}
          </p>
        </motion.div>

        <button
          onClick={handleRefresh}
          className="w-10 h-10 border border-slate-100 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) - Live Alerts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying Safety watchlist...</span>
            </div>
          ) : alerts.length === 0 ? (
            <GlassCard className="py-24 text-center space-y-3 bg-white/70 border border-slate-100">
              <Bell className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-indigo-950">Watchlist is clean</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                No alerts trigger registered for your watchlisted IMEIs or device updates.
              </p>
            </GlassCard>
          ) : (
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05, type: 'spring', bounce: 0.4 }}
                >
                  <GlassCard glowColor={getGlow(alert.type)} className="p-5 flex gap-5 items-start bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] hover:bg-white transition-all">
                    <div className={`p-3 rounded-2xl flex-shrink-0 border ${
                      alert.type === 'danger' ? 'bg-red-50 border-red-100 animate-pulse' :
                      alert.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                      'bg-indigo-50 border-indigo-100'
                    }`}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-indigo-950 text-base">{alert.title}</h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap ml-4 mt-0.5">{formatTime(alert.time)}</span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed font-semibold">{alert.desc}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
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
