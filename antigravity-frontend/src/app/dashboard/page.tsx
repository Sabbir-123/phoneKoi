'use client';
import { API_URL, authFetch } from '@/utils/api';

import { useDashboardStore } from '@/store/useDashboardStore';
import { useTranslation } from '@/lib/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldAlert, CheckCircle2, Activity, Smartphone, Search, AlertTriangle, Bell, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function DashboardHomeContent() {
  const { profile, fetchProfile } = useDashboardStore();
  const { t, isBn } = useTranslation();
  const [name, setName] = useState(profile?.displayName || (isBn ? 'গ্রাহক' : 'User'));
  const [email, setEmail] = useState('');
  const [profileWarning, setProfileWarning] = useState(false);
  const searchParams = useSearchParams();
  const reportSuccess = searchParams.get('reportSuccess') === 'true';

  const [searchesCount, setSearchesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [dangerAlertsCount, setDangerAlertsCount] = useState(0);
  const [realAlerts, setRealAlerts] = useState<any[]>([]);
  const [realSearchHistory, setRealSearchHistory] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.displayName) {
      setName(profile.displayName);
    }
  }, [profile?.displayName]);

  useEffect(() => {
    fetchProfile(true);
    // Check Supabase to get the user's name and email
    const { createClient } = require("@/utils/supabase/client");
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (session?.user?.email) {
        const userEmail = session.user.email;
        setEmail(userEmail);
        
        // Initial fallback
        if (profile?.displayName) {
          setName(profile.displayName);
        } else {
          setName(session.user.user_metadata?.displayName || session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split('@')[0]);
        }

        try {
          // Fetch real searches count
          const searchesRes = await authFetch(`${API_URL}/devices/searches/count?email=${encodeURIComponent(userEmail)}`);
          if (searchesRes.ok) {
            const data = await searchesRes.json();
            setSearchesCount(data.count || 0);
          }

          // Fetch real search history list
          const historyRes = await authFetch(`${API_URL}/devices/searches/history?email=${encodeURIComponent(userEmail)}&limit=5`);
          if (historyRes.ok) {
            const histData = await historyRes.json();
            setRealSearchHistory(histData.history || []);
          }

          // Fetch real notifications/alerts for this user
          const alertsRes = await authFetch(`${API_URL}/notifications?email=${encodeURIComponent(userEmail)}`);
          if (alertsRes.ok) {
            const alertsData = await alertsRes.json();
            setRealAlerts(alertsData || []);
            setAlertsCount(alertsData.length || 0);
            
            // Count high risk / danger alerts
            const dangerCount = (alertsData || []).filter((a: any) => a.type === 'danger' || a.priority === 'HIGH' || a.title?.toLowerCase().includes('risk') || a.title?.toLowerCase().includes('alert')).length;
            setDangerAlertsCount(dangerCount);
          }
        } catch (e) {
          console.error("Failed to load dashboard metrics", e);
        }
      }
    });

    // Check for showProfileWarning in query params
    if (searchParams.get('showProfileWarning') === 'true') {
      setProfileWarning(true);
    }
  }, [searchParams, profile?.displayName, fetchProfile]);

  // Fetch registered devices count
  const { data: reports } = useQuery({
    queryKey: ['myReports', email],
    queryFn: async () => {
      if (!email) return [];
      const res = await authFetch(`${API_URL}/reports/my-reports?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to fetch devices');
      return res.json();
    },
    enabled: !!email
  });

  const greeting = isBn ? 'স্বাগতম 👋' : 'Welcome back 👋';
  const devicesCount = reports ? reports.length : 0;

  const statCards = [
    { label: isBn ? 'রিপোর্টকৃত ডিভাইস' : 'Devices Reported', value: devicesCount, icon: Smartphone, color: 'text-indigo-600 bg-indigo-50 border border-indigo-100/50', glow: 'rgba(99,102,241,0.02)' },
    { label: isBn ? 'সাম্প্রতিক যাচাই' : 'Recent Checks', value: searchesCount, icon: Search, color: 'text-emerald-600 bg-emerald-50 border border-emerald-100/50', glow: 'rgba(52,211,153,0.02)' },
    { label: isBn ? 'প্রাপ্ত সিকিউরিটি অ্যালার্ট' : 'Alerts Received', value: alertsCount, icon: ShieldAlert, color: 'text-amber-600 bg-amber-50 border border-amber-100/50', glow: 'rgba(251,191,36,0.02)' },
    { label: isBn ? 'সন্দেহজনক তৎপরতা' : 'Suspicious Activities', value: dangerAlertsCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50 border border-red-100/50', glow: 'rgba(248,113,113,0.02)' },
  ];

  // Combine real user activities chronologically
  const reportEvents = reports ? reports.map((r: any) => ({
    text: isBn 
      ? `আপনার রিপোর্টকৃত ফোন (${r.deviceName || 'ডিভাইস'}) সফলভাবে যুক্ত হয়েছে। IMEI: ${r.imei}`
      : `Your reported device (${r.deviceName || 'Unknown'}) was successfully added. IMEI: ${r.imei}`,
    time: new Date(r.createdAt).toLocaleDateString(),
    status: 'success',
    timestamp: new Date(r.createdAt).getTime()
  })) : [];

  const searchEvents = realSearchHistory.map((h: any) => ({
    text: isBn
      ? `IMEI যাচাই সম্পন্ন: ${h.imei} (ফলাফল: ${h.result})`
      : `Checked device IMEI: ${h.imei} (Status: ${h.result})`,
    time: h.date,
    status: h.result === 'Stolen' ? 'danger' : 'success',
    timestamp: new Date(h.date).getTime() || 0
  }));

  const alertEvents = realAlerts.map((a: any) => ({
    text: `${a.title}: ${a.desc}`,
    time: new Date(a.time).toLocaleDateString(),
    status: a.type === 'danger' ? 'danger' : a.type === 'success' ? 'success' : 'warning',
    timestamp: new Date(a.time).getTime()
  }));

  const recentActivity = [...reportEvents, ...searchEvents, ...alertEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Profile Incomplete Warning Banner */}
      <AnimatePresence>
        {profileWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="p-1 rounded-2xl sm:rounded-[1.8rem] bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 relative z-20 shadow-xl"
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-xl sm:rounded-[1.7rem] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl border border-amber-500/20 flex-shrink-0">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-950 mb-1">
                    {isBn ? 'প্রোফাইল অসম্পূর্ণ! ⚠️' : 'Complete Your Profile! ⚠️'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isBn
                      ? 'হারানো ফোন সার্চ হলে দ্রুত এসএমএস ও সতর্কবার্তা পেতে মোবাইল নম্বর, হোয়াটসঅ্যাপ ও ঠিকানা যুক্ত করুন।'
                      : 'Please fill up and complete your profile sections (Phone Number, WhatsApp Number, and Physical Address) to activate full verification trust.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/dashboard/profile">
                  <MotionButton
                    variant="primary"
                    className="px-6 py-2.5 rounded-xl text-white bg-amber-500 hover:bg-amber-600 border border-transparent font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    {isBn ? 'প্রোফাইলে যান' : 'Go to Profile'}
                  </MotionButton>
                </Link>
                <MotionButton
                  variant="secondary"
                  onClick={() => {
                    setProfileWarning(false);
                    const url = new URL(window.location.href);
                    url.searchParams.delete('showProfileWarning');
                    window.history.replaceState({}, document.title, url.pathname + url.search);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold transition-all cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Dismiss'}
                </MotionButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    {isBn ? 'হারানো ফোনের রিপোর্ট জমা হয়েছে! 🎉' : 'Stolen Report Submitted! 🎉'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isBn
                      ? 'আপনার ডিভাইসটি জাতীয় চুরি ডেটাবেজে যুক্ত হয়েছে। কোনো সার্চ হলে স্বয়ংক্রিয়ভাবে ট্র্যাকিং অ্যালার্ট চালু হবে।'
                      : 'Your device theft report has been successfully recorded and distributed to the safety registry. Tracking is active.'}
                  </p>
                </div>
              </div>
              <MotionButton
                variant="secondary"
                onClick={() => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="px-6 py-2.5 rounded-xl border border-emerald-200/50 text-emerald-600 bg-emerald-50/60 font-semibold hover:bg-emerald-50 transition-all shadow-sm cursor-pointer"
              >
                {isBn ? 'ঠিক আছে' : 'Got it!'}
              </MotionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">
          {greeting}, <span className="text-indigo-600 font-extrabold">{name}</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          {isBn
            ? 'আপনার ডিভাইস সিকিউরিটি ও আইএমইআই ভেরিফিকেশন নেটওয়ার্কের সামগ্রিক তথ্য।'
            : 'Here is your security status and IMEI verification metrics across PhoneKoi.'}
        </p>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard glowColor={stat.glow} className="p-4 sm:p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">{stat.value}</div>
                </div>
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${stat.color} shadow-sm`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Content Split: Real Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Real Activity Timeline */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              {isBn ? 'সাম্প্রতিক অ্যাক্টিভিটি' : 'Recent Activity'}
            </h2>
          </div>
          
          <GlassCard className="p-4 sm:p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <div className="space-y-8">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-semibold text-sm">
                  {isBn 
                    ? 'কোনো সাম্প্রতিক অ্যাক্টিভিটি নেই। সবকিছু নিরাপদ রয়েছে।'
                    : 'No recent activity. All systems are quiet.'}
                </div>
              ) : (
                recentActivity.map((activity, i) => (
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
                ))
              )}
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
            {isBn ? 'কুইক অ্যাকশন' : 'Quick Actions'}
          </h2>
          <GlassCard className="p-4 sm:p-6 flex flex-col gap-3.5 sm:gap-4 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <Link href="/report">
              <MotionButton variant="primary" className="w-full justify-between group cursor-pointer">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  {isBn ? 'হারানো ফোন রিপোর্ট করুন' : 'Report Stolen Device'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MotionButton>
            </Link>
            <Link href="/check">
              <MotionButton variant="secondary" className="w-full justify-start gap-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none text-slate-700 cursor-pointer">
                <Search className="w-4 h-4 text-indigo-600" />
                {isBn ? 'IMEI স্ট্যাটাস যাচাই' : 'Check IMEI Status'}
              </MotionButton>
            </Link>
            <Link href="/dashboard/alerts">
              <MotionButton variant="secondary" className="w-full justify-start gap-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none text-slate-700 cursor-pointer">
                <Bell className="w-4 h-4 text-indigo-600" />
                {isBn ? 'নিরাপত্তা অ্যালার্ট দেখুন' : 'View Safety Alerts'}
              </MotionButton>
            </Link>
            <Link href="/recovered">
              <MotionButton variant="secondary" className="w-full justify-start gap-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none text-slate-700 cursor-pointer">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {isBn ? 'উদ্ধারকৃত ফোন ডাটাবেজ' : 'View Recovered Devices'}
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
