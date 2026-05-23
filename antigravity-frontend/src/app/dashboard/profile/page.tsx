'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { UserCircle, ShieldCheck, Award, Mail, Smartphone, Search, Bell, ShieldAlert, BadgeCheck } from 'lucide-react';
import { auth } from '@/utils/firebase/client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
  const { language } = useDashboardStore();
  const [email, setEmail] = useState('No email attached');
  const [displayName, setDisplayName] = useState('Phone Koi User');

  useEffect(() => {
    const fUser = auth.currentUser;
    if (fUser) {
      setEmail(fUser.email || 'No email attached');
      setDisplayName(fUser.displayName || 'Phone Koi User');
    } else {
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user) {
          setEmail(session.user.email || 'No email attached');
          setDisplayName(session.user.user_metadata?.full_name || 'Phone Koi User');
        }
      });
    }
  }, []);

  // Query live reports count from backend
  const { data: reports } = useQuery({
    queryKey: ['user-reports'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  const reportsCount = reports ? reports.length : 2;

  const trustBadges = [
    { name: 'Early Adopter', desc: 'Registered in the initial network launch phase.', icon: Award, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { name: 'Trusted Reporter', desc: 'Maintains reports that have been verified by police GD records.', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { name: 'Active Watcher', desc: 'Regularly queries the safety engine to protect device purchase flows.', icon: BadgeCheck, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-indigo-600" />
          {language === 'banglish' ? 'Account & Trust Profile' : 'Account & Trust Profile'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {language === 'banglish' ? 'Apnar account details ebong trust score ekhane dekhun.' : 'Manage your identity, view your community trust standing, and review active badges.'}
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (1 Col) - Profile Summary */}
        <motion.div 
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 flex flex-col items-center text-center bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
            <div className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-4 overflow-hidden relative shadow-inner">
              <span className="text-4xl font-extrabold text-indigo-600">{displayName.charAt(0)}</span>
            </div>
            <h2 className="text-xl font-bold text-indigo-950 mb-1">{displayName}</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 font-semibold mb-6">
              <Mail className="w-4 h-4 text-indigo-500" />
              {email}
            </div>
            
            <div className="w-full pt-6 border-t border-slate-100 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Account Status</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Security Role</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-xs">Pro Reporter</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Phone Verification</span>
                <span className="text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs">Pending</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right Column (2 Cols) - Trust Standings & Badges Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Trust Standing Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              <h3 className="text-lg font-bold text-indigo-950 mb-6">Trust Standing</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Community Trust Score</span>
                    <span className="text-sm font-extrabold text-emerald-600">92/100</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)] rounded-full"
                    />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-3.5">
                    {language === 'banglish' ? 'High trust score apnake community te credible banay.' : 'A high trust score increases the credibility and prioritization of your device reports across law enforcement networks.'}
                  </p>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100/50 shadow-sm shadow-emerald-100">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-emerald-600 tracking-tighter">92</div>
                    <div className="text-[9px] text-emerald-500/80 uppercase font-extrabold tracking-widest">Score</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Sub-grid: Security Stats & Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] h-full space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Security Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/20 text-center">
                    <Smartphone className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <div className="text-xl font-extrabold text-indigo-950">{reportsCount}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Reported</div>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/20 text-center">
                    <Search className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-xl font-extrabold text-indigo-950">15</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Searches</div>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/20 text-center col-span-2">
                    <Bell className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <div className="text-xl font-extrabold text-indigo-950">3 Active</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Device Alerts</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Badges Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] h-full space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Earned Badges</h3>
                <div className="flex flex-col gap-3">
                  {trustBadges.map((badge, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className={`p-1.5 rounded-lg border ${badge.color} shrink-0 mt-0.5`}>
                        <badge.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-indigo-950">{badge.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold leading-normal">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
