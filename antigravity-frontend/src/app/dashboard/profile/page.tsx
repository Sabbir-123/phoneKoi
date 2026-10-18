'use client';
import { API_URL, authFetch } from '@/utils/api';


import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { UserCircle, ShieldCheck, Award, Mail, Smartphone, Search, Bell, ShieldAlert, BadgeCheck, AlertCircle, Check, Camera, UploadCloud, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
  const { language } = useDashboardStore();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [isSameAsPhone, setIsSameAsPhone] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneAvailable, setPhoneAvailable] = useState(false);
  const [plan, setPlan] = useState('FREE');
  const [isPro, setIsPro] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState(1);
  const [searchLimit, setSearchLimit] = useState(1);
  const [searchesCount, setSearchesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      let emailAddress = '';
      
      if (session?.user) {
        emailAddress = session.user.email || '';
        setEmail(session.user.email || '');
        const metaName = session.user.user_metadata?.displayName || session.user.user_metadata?.full_name || '';
        if (metaName) setDisplayName(metaName);
        const metaAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';
        if (metaAvatar) setAvatar(metaAvatar);
      }

      if (emailAddress) {
        try {
          const res = await authFetch(`${API_URL}/users/profile?email=${encodeURIComponent(emailAddress)}`);
          if (res.ok) {
            const data = await res.json();
            const isAdminRole = data.role === 'ADMIN';
            setPlan(data.plan || (isAdminRole ? 'PRO' : 'FREE'));
            setIsPro(Boolean(data.isPro || isAdminRole || (data.plan && data.plan.includes('Pro'))));
            setSearchesLeft(data.searchesLeft ?? 1);
            setSearchLimit(data.searchLimit ?? 1);
            if (data.phone) setPhone(data.phone);
            if (data.whatsapp) {
              setWhatsapp(data.whatsapp);
              setIsSameAsPhone(data.phone === data.whatsapp);
            }
            if (data.address) setAddress(data.address);
            if (data.displayName) setDisplayName(data.displayName);
            if (data.avatar) setAvatar(data.avatar);
          }

          // Fetch real dynamic alerts count from PostgreSQL
          const alertsRes = await authFetch(`${API_URL}/users/alerts?email=${encodeURIComponent(emailAddress)}`);
          if (alertsRes.ok) {
            const alertsData = await alertsRes.json();
            setAlertsCount(Array.isArray(alertsData) ? alertsData.length : 0);
          }

          // Fetch authoritative search history count from PostgreSQL
          const historyRes = await authFetch(`${API_URL}/users/me/search-history?email=${encodeURIComponent(emailAddress)}`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setSearchesCount(Array.isArray(historyData) ? historyData.length : 0);
          }
        } catch (e) {
          console.error('Error loading profile from database:', e);
        }
      }
    };
    loadProfile();
  }, []);

  // Handle avatar photo selection and conversion to base64 DataURL
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      setAvatarError(null);
      setSaveError(null);
    };
    reader.readAsDataURL(file);
  };

  // Live duplicate phone check with debouncing
  useEffect(() => {
    if (!phone || phone.trim().length < 10 || !email) {
      setPhoneError(null);
      setPhoneAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(
          `${API_URL}/users/check-phone?phone=${encodeURIComponent(phone.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!data.available) {
            setPhoneError(data.message || 'Duplicate number: another user has already used this phone number. Please use a different number.');
            setPhoneAvailable(false);
          } else {
            setPhoneError(null);
            setPhoneAvailable(true);
          }
        }
      } catch (err) {
        console.error('Phone check error:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [phone, email]);

  useEffect(() => {
    if (isSameAsPhone) {
      setWhatsapp(phone);
    }
  }, [phone, isSameAsPhone]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    setAvatarError(null);
    setPhoneError(null);

    if (!displayName.trim()) {
      setSaveError('Full Name is mandatory to complete your profile.');
      setSaveLoading(false);
      return;
    }

    if (!avatar.trim()) {
      setAvatarError('Profile picture is mandatory. Please upload your profile photo.');
      setSaveError('Profile picture is mandatory. Please upload your profile photo.');
      setSaveLoading(false);
      return;
    }

    if (!phone.trim()) {
      setPhoneError('Phone number is required.');
      setSaveLoading(false);
      return;
    }

    if (!address.trim()) {
      setSaveError('Physical address is mandatory to complete your profile.');
      setSaveLoading(false);
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName: displayName.trim(),
          avatar: avatar.trim(),
          phone: phone.trim(),
          whatsapp: (isSameAsPhone ? phone : whatsapp).trim(),
          address: address.trim(),
        }),
      });

      const data = await res.json();


      if (!res.ok) {
        if (data.message && (data.message.toLowerCase().includes('duplicate') || data.message.toLowerCase().includes('phone'))) {
          setPhoneError(data.message);
        } else {
          setSaveError(data.message || 'Failed to save profile');
        }
        setSaveLoading(false);
        return;
      }

      if (data.user) {
        if (data.user.displayName) setDisplayName(data.user.displayName);
        if (data.user.phone) setPhone(data.user.phone);
        if (data.user.whatsapp) setWhatsapp(data.user.whatsapp);
        if (data.user.address) setAddress(data.user.address);
        if (data.user.avatar || data.user.avatarUrl) setAvatar(data.user.avatar || data.user.avatarUrl);
      }

      // Dispatch event to automatically dismiss mandatory modal
      window.dispatchEvent(new Event('phonekoi_profile_completed'));

      setSaveSuccess(true);
      setPhoneAvailable(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to submit profile to server');
    } finally {
      setSaveLoading(false);
    }
  };

  // Query live reports count from backend
  const { data: reports } = useQuery({
    queryKey: ['user-reports', email],
    queryFn: async () => {
      const res = await authFetch(`${API_URL}/reports?email=${email}`);
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
            <div className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-4 overflow-hidden relative shadow-inner group">
              {avatar ? (
                <img src={avatar} alt={displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-indigo-600">
                  {(displayName || email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                title="Upload Profile Picture"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Upload</span>
              </button>
            </div>
            <h2 className="text-xl font-bold text-indigo-950 mb-1">{displayName || email?.split('@')[0] || 'Phone Koi User'}</h2>
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
                  isPro || plan === 'PRO' || (typeof plan === 'string' && plan.includes('Pro'))
                    ? 'text-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200/80 shadow-sm shadow-indigo-100/50' 
                    : 'text-slate-500 bg-slate-50 border-slate-200'
                }`}>
                  {isPro || plan === 'PRO' || (typeof plan === 'string' && plan.includes('Pro'))
                    ? (plan === '6 Months Pro' ? '6 Months Pro Member 🌟' : (plan === 'PRO' ? 'Pro Member 🌟' : `${plan} Member 🌟`))
                    : 'Free Plan'}
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
              
              <form id="complete-profile-form" onSubmit={handleSaveProfile} className="space-y-5">
                {saveError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Profile Picture Upload Section (Mandatory) */}
                <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-slate-50/80 rounded-2xl border border-indigo-100/80">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-full bg-white border-2 border-indigo-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative group hover:border-indigo-400 transition-all"
                    >
                      {avatar ? (
                        <img src={avatar} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-7 h-7 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                          Profile Picture <span className="text-rose-500">*</span>
                        </label>
                        {avatar && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3" /> Photo Uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Upload a clear avatar or photo. Required to verify your identity.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      <span>{avatar ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                  </div>

                  {avatarError && (
                    <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{avatarError}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setSaveError(null);
                      }}
                      placeholder="e.g. Sabbir Ahmed"
                      className="w-full bg-white/60 border border-indigo-100 rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium"
                      required
                    />
                  </div>

                  {/* Email address */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      Email Address <span className="text-slate-400 font-normal">(Account)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-4 text-slate-600 cursor-not-allowed text-sm font-semibold select-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      {phoneAvailable && !phoneError && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Unique & Available
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError(null);
                        setSaveError(null);
                      }}
                      placeholder="01XXXXXXXXX"
                      className={`w-full border rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all text-sm font-medium ${
                        phoneError
                          ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                          : 'bg-white/60 border-indigo-100 focus:ring-indigo-300'
                      }`}
                      required
                    />
                    {phoneError && (
                      <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs font-bold text-rose-600 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{phoneError}</span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp number with selection button */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        WhatsApp Number <span className="text-rose-500">*</span>
                      </label>
                      
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
                      placeholder="01XXXXXXXXX"
                      className={`w-full border rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium ${
                        isSameAsPhone 
                          ? 'bg-slate-50/60 border-slate-200/60 text-slate-400 cursor-not-allowed select-none' 
                          : 'bg-white/60 border-indigo-100'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Physical Address */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Physical Address <span className="text-rose-500">*</span>
                  </label>
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
                      <ShieldCheck className="w-3.5 h-3.5" /> Profile successfully verified & updated!
                    </span>
                  )}
                  
                  <button
                    type="submit"
                    disabled={saveLoading || Boolean(phoneError)}
                    className="ml-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveLoading ? 'Verifying & Saving...' : 'Save Profile Details'}
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
