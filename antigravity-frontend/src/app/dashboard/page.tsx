'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldAlert, CheckCircle2, Activity, Smartphone, Search, AlertTriangle, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { auth } from '@/utils/firebase/client';

export default function DashboardHome() {
  const { language } = useDashboardStore();
  const user = auth.currentUser;

  // Placeholder for real API call (would use NestJS backend)
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 800));
      return {
        devicesReported: 2,
        recentChecks: 15,
        alertsReceived: 3,
        suspiciousActivities: 1
      };
    }
  });

  const greeting = language === 'banglish' ? 'Welcome back 👋' : 'Welcome back 👋';
  const name = user?.displayName?.split(' ')[0] || 'User';

  const statCards = [
    { label: language === 'banglish' ? 'Report Kora Device' : 'Devices Reported', value: stats?.devicesReported || 0, icon: Smartphone, color: 'text-indigo-400', glow: 'rgba(99,102,241,0.15)' },
    { label: language === 'banglish' ? 'Recent IMEI Check' : 'Recent Checks', value: stats?.recentChecks || 0, icon: Search, color: 'text-emerald-400', glow: 'rgba(52,211,153,0.15)' },
    { label: language === 'banglish' ? 'Notun Alert' : 'Alerts Received', value: stats?.alertsReceived || 0, icon: ShieldAlert, color: 'text-amber-400', glow: 'rgba(251,191,36,0.15)' },
    { label: language === 'banglish' ? 'Sondehojonok Activity' : 'Suspicious Activities', value: stats?.suspiciousActivities || 0, icon: AlertTriangle, color: 'text-red-400', glow: 'rgba(248,113,113,0.15)' },
  ];

  const recentActivity = [
    { text: language === 'banglish' ? 'Apnar reported IMEI 2 ghonta age search hoise' : 'Your reported IMEI was searched 2 hours ago', time: '2h ago', status: 'warning' },
    { text: language === 'banglish' ? 'Dhaka theke sondehojonok activity detect hoise' : 'Suspicious activity detected in Dhaka', time: '5h ago', status: 'danger' },
    { text: language === 'banglish' ? 'Apnar report verify kora hoyese' : 'Your report has been verified', time: '1d ago', status: 'success' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 relative">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Greeting */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
          {greeting}, <span className="text-indigo-400">{name}</span>
        </h1>
        <p className="text-slate-400 text-lg">
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
            <GlassCard glowColor={stat.glow} className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-400">{stat.label}</div>
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
          <h2 className="text-xl font-bold text-white">
            {language === 'banglish' ? 'Recent Activity' : 'Recent Activity'}
          </h2>
          <GlassCard className="p-6">
            <div className="space-y-8">
              {recentActivity.map((activity, i) => (
                <div key={i} className="relative flex gap-4">
                  {i !== recentActivity.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-px bg-white/10" />
                  )}
                  <div className={`relative z-10 w-6 h-6 rounded-full border-4 border-[#030712] flex-shrink-0 ${
                    activity.status === 'success' ? 'bg-emerald-500' :
                    activity.status === 'warning' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                  }`} />
                  <div>
                    <p className="text-slate-200 font-medium leading-tight mb-1">{activity.text}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
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
          <h2 className="text-xl font-bold text-white">
            {language === 'banglish' ? 'Quick Actions' : 'Quick Actions'}
          </h2>
          <GlassCard className="p-6 flex flex-col gap-4">
            <MotionButton variant="primary" className="w-full justify-start">
              <Smartphone className="w-5 h-5" />
              {language === 'banglish' ? 'Device Report Korun' : 'Report Device'}
            </MotionButton>
            <MotionButton variant="secondary" className="w-full justify-start">
              <Search className="w-5 h-5" />
              {language === 'banglish' ? 'IMEI Check Korun' : 'Check IMEI'}
            </MotionButton>
            <MotionButton variant="secondary" className="w-full justify-start">
              <Bell className="w-5 h-5" />
              {language === 'banglish' ? 'Alerts Dekhun' : 'View Alerts'}
            </MotionButton>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
