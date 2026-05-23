'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldAlert, CheckCircle2, Activity, Smartphone, Search, AlertTriangle, Bell, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { auth } from '@/utils/firebase/client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function DashboardHomeContent() {
  const { language } = useDashboardStore();
  const [name, setName] = useState('User');
  const searchParams = useSearchParams();
  const reportSuccess = searchParams.get('reportSuccess') === 'true';

  useEffect(() => {
    // Check both Firebase and Supabase to get the user's name
    const firebaseUser = auth.currentUser;
    if (firebaseUser?.displayName) {
      setName(firebaseUser.displayName.split(' ')[0]);
    } else {
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user?.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name.split(' ')[0]);
        } else if (session?.user?.email) {
          setName(session.user.email.split('@')[0]);
        }
      });
    }
  }, []);

  // Fetch real reported devices from NestJS backend
  const { data: reports } = useQuery({
    queryKey: ['user-reports'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 600));
      return {
        recentChecks: 15,
        alertsReceived: 3,
        suspiciousActivities: 1
      };
    }
  });

  const greeting = language === 'banglish' ? 'Welcome back 👋' : 'Welcome back 👋';
  const devicesCount = reports ? reports.length : 2;

  const statCards = [
    { label: language === 'banglish' ? 'Report Kora Device' : 'Devices Reported', value: devicesCount, icon: Smartphone, color: 'text-indigo-600 bg-indigo-50 border border-indigo-100/50', glow: 'rgba(99,102,241,0.02)' },
    { label: language === 'banglish' ? 'Recent IMEI Check' : 'Recent Checks', value: stats?.recentChecks || 15, icon: Search, color: 'text-emerald-600 bg-emerald-50 border border-emerald-100/50', glow: 'rgba(52,211,153,0.02)' },
    { label: language === 'banglish' ? 'Notun Alert' : 'Alerts Received', value: stats?.alertsReceived || 3, icon: ShieldAlert, color: 'text-amber-600 bg-amber-50 border border-amber-100/50', glow: 'rgba(251,191,36,0.02)' },
    { label: language === 'banglish' ? 'Sondehojonok Activity' : 'Suspicious Activities', value: stats?.suspiciousActivities || 1, icon: AlertTriangle, color: 'text-red-600 bg-red-50 border border-red-100/50', glow: 'rgba(248,113,113,0.02)' },
  ];

  const recentActivity = [
    ...(reports ? reports.map((r: any) => ({
      text: language === 'banglish' 
        ? `Apnar reported device (${r.deviceName || 'Unknown'}) list e successfully jog hoyeche. IMEI: ${r.imei}` 
        : `Your reported device (${r.deviceName || 'Unknown'}) was successfully added. IMEI: ${r.imei}`,
      time: new Date(r.createdAt).toLocaleDateString(),
      status: 'success'
    })) : []),
    { text: language === 'banglish' ? 'Apnar reported IMEI 2 ghonta age search hoise' : 'Your reported IMEI was searched 2 hours ago', time: '2h ago', status: 'warning' },
    { text: language === 'banglish' ? 'Dhaka theke sondehojonok activity detect hoise' : 'Suspicious activity detected in Dhaka', time: '5h ago', status: 'danger' },
    { text: language === 'banglish' ? 'Apnar report verify kora hoyese' : 'Your report has been verified', time: '1d ago', status: 'success' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Success Banner */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="p-1 rounded-[1.8rem] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 relative z-20 shadow-xl"
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-[1.7rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-950 mb-1">
                    {language === 'banglish' ? 'Stolen Report Submitted! 🎉' : 'Stolen Report Submitted! 🎉'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {language === 'banglish'
                      ? 'Tomar report system e verified and distribute hoye gese. Ekhon eita active track kora hobe.'
                      : 'Your device theft report has been successfully recorded and distributed to the safety registry. Tracking is active.'}
                  </p>
                </div>
              </div>
              <MotionButton
                variant="secondary"
                onClick={() => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="px-6 py-2.5 rounded-xl border border-emerald-200/50 text-emerald-600 bg-emerald-50/60 font-semibold hover:bg-emerald-50 transition-all shadow-sm"
              >
                Got it!
              </MotionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-1.5">
          {greeting}, <span className="text-indigo-600">{name}</span>
        </h1>
        <p className="text-slate-500 text-base">
          {language === 'banglish' 
            ? 'Apnar account er current obostha dekhe nin.' 
            : "Here's what's happening with your account today."}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard glowColor={stat.glow} className="p-6 flex flex-col gap-4 bg-white/70 border border-slate-100 hover:border-indigo-100/50 hover:bg-white shadow-[0_4px_20px_rgba(99,102,241,0.02)] transition-all">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-indigo-950 mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <h2 className="text-xl font-bold text-indigo-950">
            {language === 'banglish' ? 'Recent Activity' : 'Recent Activity'}
          </h2>
          <GlassCard className="p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <div className="space-y-8">
              {recentActivity.map((activity, i) => (
                <div key={i} className="relative flex gap-4">
                  {i !== recentActivity.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-px bg-slate-100" />
                  )}
                  <div className={`relative z-10 w-6 h-6 rounded-full border-4 border-white flex-shrink-0 ${
                    activity.status === 'success' ? 'bg-emerald-500' :
                    activity.status === 'warning' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                  }`} />
                  <div>
                    <p className="text-slate-700 font-semibold leading-tight mb-1 text-sm">{activity.text}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-indigo-950">
            {language === 'banglish' ? 'Quick Actions' : 'Quick Actions'}
          </h2>
          <GlassCard className="p-6 flex flex-col gap-4 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <Link href="/report">
              <MotionButton variant="primary" className="w-full justify-between group">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  {language === 'banglish' ? 'Device Report Korun' : 'Report Stolen Device'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MotionButton>
            </Link>
            <Link href="/check">
              <MotionButton variant="secondary" className="w-full justify-start gap-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none text-slate-700">
                <Search className="w-4 h-4 text-indigo-600" />
                {language === 'banglish' ? 'IMEI Check Korun' : 'Check IMEI Status'}
              </MotionButton>
            </Link>
            <Link href="/dashboard/alerts">
              <MotionButton variant="secondary" className="w-full justify-start gap-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none text-slate-700">
                <Bell className="w-4 h-4 text-indigo-600" />
                {language === 'banglish' ? 'Alerts Dekhun' : 'View Safety Alerts'}
              </MotionButton>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardHomeContent />
    </Suspense>
  );
}
