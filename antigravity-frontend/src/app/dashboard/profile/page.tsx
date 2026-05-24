'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { UserCircle, ShieldCheck, Award, Mail, Smartphone, Search, Bell, ShieldAlert, BadgeCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
  const { language } = useDashboardStore();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('Phone Koi User');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [isSameAsPhone, setIsSameAsPhone] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [plan, setPlan] = useState('FREE');
  const [searchesLeft, setSearchesLeft] = useState(1);
  const [searchLimit, setSearchLimit] = useState(1);
  const [searchesCount, setSearchesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      let emailAddress = '';
      
      if (session?.user) {
        emailAddress = session.user.email || '';
        setEmail(session.user.email || localStorage.getItem('profile_email') || '');
        setDisplayName(session.user.user_metadata?.displayName || session.user.user_metadata?.full_name || 'Phone Koi User');
      }

      if (emailAddress) {
        // Load user-specific profile details from localStorage
        const savedPhone = localStorage.getItem(`profile_phone_${emailAddress}`) || '';
        const savedWhatsapp = localStorage.getItem(`profile_whatsapp_${emailAddress}`) || '';
        const savedAddress = localStorage.getItem(`profile_address_${emailAddress}`) || '';
        const savedIsSame = localStorage.getItem(`profile_whatsapp_same_as_phone_${emailAddress}`) === 'true';

        setPhone(savedPhone);
        setAddress(savedAddress);
        setIsSameAsPhone(savedIsSame);
        if (savedIsSame) {
          setWhatsapp(savedPhone);
        } else {
          setWhatsapp(savedWhatsapp);
        }

        try {
          const res = await fetch(`http://localhost:4000/users/profile?email=${emailAddress}`);
          if (res.ok) {
            const data = await res.json();
            setPlan(data.plan || 'FREE');
            setSearchesLeft(data.searchesLeft ?? 1);
            setSearchLimit(data.searchLimit ?? 1);
          }

          // Fetch real dynamic alerts count
          const alertsRes = await fetch(`http://localhost:4000/users/alerts?email=${emailAddress}`);
          if (alertsRes.ok) {
            const alertsData = await alertsRes.json();
            setAlertsCount(alertsData.length);
          }
        } catch (e) {
          console.error(e);
        }

        // Fetch local search history count
        try {
          const historyKey = `search_history_${emailAddress}`;
          const savedHistory = localStorage.getItem(historyKey);
          if (savedHistory) {
            setSearchesCount(JSON.parse(savedHistory).length);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (isSameAsPhone) {
      setWhatsapp(phone);
    }
  }, [phone, isSameAsPhone]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    if (email) {
      localStorage.setItem(`profile_phone_${email}`, phone);
      localStorage.setItem(`profile_whatsapp_${email}`, isSameAsPhone ? phone : whatsapp);
      localStorage.setItem(`profile_whatsapp_same_as_phone_${email}`, String(isSameAsPhone));
      localStorage.setItem(`profile_address_${email}`, address);
      localStorage.setItem(`profile_completed_${email}`, 'true');
    }

    localStorage.setItem('profile_email', email);
    localStorage.setItem('profile_phone', phone);
    localStorage.setItem('profile_whatsapp', isSameAsPhone ? phone : whatsapp);
    localStorage.setItem('profile_whatsapp_same_as_phone', String(isSameAsPhone));
    localStorage.setItem('profile_address', address);
    localStorage.setItem('profile_completed', 'true');

    setTimeout(() => {
      setSaveLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  // Query live reports count from backend
  const { data: reports } = useQuery({
    queryKey: ['user-reports', email],
    queryFn: async () => {
      const res = await fetch(`http://localhost:4000/reports?email=${email}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: !!email
  });

  const reportsCount = reports ? reports.length : 0;

  // Calculate Community Trust Score dynamically in real-time
  const getCalculatedTrustScore = () => {
    let score = 50; // base starting score for newly registered users (50%)
    
    const hasPhone = phone.trim() !== '';
    const hasWhatsapp = (isSameAsPhone ? phone : whatsapp).trim() !== '';
    const hasAddress = address.trim() !== '';

    if (hasPhone && hasWhatsapp) {
      if (hasAddress) {
        score = 100;
      } else {
        score = 80;
      }
    }

    const approvedReportsCount = reports ? reports.filter((r: any) => r.status === 'APPROVED').length : 0;
    const rejectedReportsCount = reports ? reports.filter((r: any) => r.status === 'REJECTED').length : 0;

    score += approvedReportsCount * 15;
    score -= rejectedReportsCount * 25;

    return Math.max(10, Math.min(100, score));
  };

  const calculatedTrustScore = getCalculatedTrustScore();

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
            
            <div className="w-full pt-6 border-t border-slate-100 flex flex-col gap-3.5 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Account Status</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Subscription</span>
                <span className={`font-bold flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-xs ${
                  plan === 'PRO' 
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-100/50' 
                    : 'text-slate-500 bg-slate-50 border-slate-200'
                }`}>
                  {plan === 'PRO' ? 'Pro Member 🌟' : 'Free Plan'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Queries Left</span>
                <span className="text-indigo-950 font-bold bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs">
                  {searchesLeft} / {searchLimit}
                </span>
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
                    <span className="text-sm font-extrabold text-emerald-600">{calculatedTrustScore}/100</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${calculatedTrustScore}%` }}
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
                    <div className="text-3xl font-extrabold text-emerald-600 tracking-tighter">{calculatedTrustScore}</div>
                    <div className="text-[9px] text-emerald-500/80 uppercase font-extrabold tracking-widest">Score</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Edit Profile Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25 }}
          >
            <GlassCard className="p-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              <h3 className="text-lg font-bold text-indigo-950 mb-4 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-indigo-600" />
                Complete Your Profile
              </h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email address */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium"
                      required
                    />
                  </div>

                  {/* Phone number */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp number with selection button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Number</label>
                    
                    {/* Selection button / Switch style */}
                    <button
                      type="button"
                      onClick={() => setIsSameAsPhone(!isSameAsPhone)}
                      className={`text-xs flex items-center gap-1.5 font-bold px-3 py-1 rounded-full transition-all ${
                        isSameAsPhone 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isSameAsPhone ? '✓ Same as Phone' : 'Same as Phone?'}
                    </button>
                  </div>
                  
                  <input
                    type="tel"
                    value={isSameAsPhone ? phone : whatsapp}
                    onChange={(e) => {
                      if (!isSameAsPhone) {
                        setWhatsapp(e.target.value);
                      }
                    }}
                    disabled={isSameAsPhone}
                    placeholder="+8801XXXXXXXXX"
                    className={`w-full border rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium ${
                      isSameAsPhone 
                        ? 'bg-slate-50/60 border-slate-200/60 text-slate-400 cursor-not-allowed select-none' 
                        : 'bg-white/60 border-indigo-100'
                    }`}
                    required
                  />
                </div>

                {/* Physical Address */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House 12, Road 4, Uttara, Dhaka"
                    className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Profile successfully updated!
                    </span>
                  )}
                  
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="ml-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
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
                    <div className="text-xl font-extrabold text-indigo-950">{searchesCount}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Searches</div>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/20 text-center col-span-2">
                    <Bell className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <div className="text-xl font-extrabold text-indigo-950">{alertsCount} Active</div>
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
