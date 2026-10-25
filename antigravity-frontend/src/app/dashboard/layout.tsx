'use client';
import { API_URL, authFetch } from '@/utils/api';

import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/dashboard/Sidebar';
import LanguageModal from '@/components/dashboard/LanguageModal';
import PromoModal from '@/components/dashboard/PromoModal';
import CompleteProfileModal from '@/components/dashboard/CompleteProfileModal';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useTranslation } from '@/lib/useTranslation';
import { Menu, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, fetchProfile, profile } = useDashboardStore();
  const { t, isBn, toggleLanguage } = useTranslation();

  useEffect(() => {
    fetchProfile(true);
  }, [fetchProfile]);

  const plan = profile?.plan || 'FREE';
  const isPro = Boolean(profile?.isPro || (profile?.plan && profile.plan.includes('Pro')));
  const isProMember = isPro || plan === 'PRO' || (typeof plan === 'string' && plan.includes('Pro'));

  const displayName = profile?.displayName || profile?.email?.split('@')[0] || (isBn ? 'আমার অ্যাকাউন্ট' : 'My Account');
  const avatarUrl = profile?.avatar || profile?.avatarUrl || null;
  const resolvedAvatar = avatarUrl 
    ? (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:image/'))
      ? avatarUrl
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kguumjcsdevprwevgpcq.supabase.co'}/storage/v1/object/public/${avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl}`
    : null;

  const initials = displayName
    ? displayName
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((part: string) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <AuthGuard>
      <LanguageModal />
      <div className="fixed inset-0 flex overflow-hidden bg-[#f8fafc] text-slate-700 selection:bg-indigo-100/80">
        <Sidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 lg:h-20 border-b border-slate-100 bg-[#f8fafc]/80 backdrop-blur-xl flex items-center justify-between px-3.5 sm:px-6 lg:px-8 shrink-0 z-30 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 shrink-0 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src="/logo.png"
                  alt="PhoneKoi"
                  width={112}
                  height={28}
                  className="h-6 sm:h-7 w-auto object-contain block sm:hidden"
                />
                <h2 className="text-lg lg:text-xl font-bold tracking-tight text-indigo-950 hidden sm:flex items-center gap-2 truncate">
                  <Image
                    src="/logo-icon.png"
                    alt="PhoneKoi Emblem"
                    width={26}
                    height={26}
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                  />
                  <span className="truncate">
                    PhoneKoi <span className="text-indigo-600 font-extrabold">{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                  </span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Quick Language Toggle Pill */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-700 shadow-xs transition-all duration-200 cursor-pointer"
                title={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{isBn ? 'EN' : 'বাংলা'}</span>
              </button>

              <div className={`h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full flex items-center justify-center border transition-all ${
                isProMember 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200/80 shadow-xs' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                  isProMember ? 'text-indigo-650 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent' : 'text-slate-500'
                }`}>
                  {plan === '6 Months Pro' ? (
                    <>
                      <span>{isBn ? '৬ মাসের প্রো' : '6 Months Pro'}</span>
                      <span className="hidden sm:inline"> {isBn ? 'মেম্বার' : 'Member'}</span>
                    </>
                  ) : isProMember ? (
                    <>
                      <span>{isBn ? 'প্রো' : 'Pro'}</span>
                      <span className="hidden sm:inline"> {isBn ? 'মেম্বার' : 'Member'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isBn ? 'বেসিক' : 'Basic'}</span>
                      <span className="hidden sm:inline"> {isBn ? 'মেম্বার' : 'Member'}</span>
                    </>
                  )}
                </span>
              </div>

              {/* User Avatar + Display Name pill */}
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 bg-white/90 hover:bg-white border border-slate-200/80 hover:border-indigo-200 pl-1.5 pr-3 py-1 rounded-full shadow-xs transition-all duration-200 group"
                title="Manage Profile"
              >
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={displayName}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-indigo-200/80 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white">
                    {initials}
                  </div>
                )}
                <span className="font-semibold text-xs sm:text-sm text-slate-700 group-hover:text-indigo-950 max-w-[80px] sm:max-w-[120px] truncate tracking-tight">
                  {displayName}
                </span>
              </Link>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-3.5 sm:p-6 lg:p-8">
            {children}
            <PromoModal />
            <CompleteProfileModal />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
