'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { UserCircle, ShieldCheck, Award, Mail, Phone } from 'lucide-react';
import { auth } from '@/utils/firebase/client';

export default function ProfilePage() {
  const { language } = useDashboardStore();
  const user = auth.currentUser;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-indigo-400" />
          {language === 'banglish' ? 'Account & Trust Profile' : 'Account & Trust Profile'}
        </h1>
        <p className="text-slate-400 mt-2">
          {language === 'banglish' ? 'Apnar account details ebong trust score ekhane dekhun.' : 'Manage your identity and view your community trust standing.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div 
          className="md:col-span-1"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center mb-4 overflow-hidden relative group">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-indigo-400">{user?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{user?.displayName || 'Phone Koi User'}</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
              <Mail className="w-4 h-4" />
              {user?.email || 'No email attached'}
            </div>
            
            <div className="w-full pt-6 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Account Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Phone Verification</span>
                <span className="text-amber-400 font-medium">Pending</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Trust & Badges */}
        <motion.div 
          className="md:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white">Trust Standing</h2>
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
              <div className="flex-1 w-full">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-400">Trust Score</span>
                  <span className="text-sm font-bold text-emerald-400">92/100</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {language === 'banglish' ? 'High trust score apnake community te credible banay.' : 'A high trust score increases the credibility of your reports.'}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 tracking-tighter">92</div>
                  <div className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-widest">Score</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Earned Badges</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-300">Early Adopter</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Trusted Reporter</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
