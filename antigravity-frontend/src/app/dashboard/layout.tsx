'use client';
import { API_URL, authFetch } from '@/utils/api';

import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/dashboard/Sidebar';
import LanguageModal from '@/components/dashboard/LanguageModal';
import PromoModal from '@/components/dashboard/PromoModal';
import CompleteProfileModal from '@/components/dashboard/CompleteProfileModal';
import { useDashboardStore } from '@/store/useDashboardStore';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, fetchProfile, profile } = useDashboardStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const plan = profile?.plan || 'FREE';
  const isPro = Boolean(profile?.isPro || (profile?.plan && profile.plan.includes('Pro')));
  const isProMember = isPro || plan === 'PRO' || (typeof plan === 'string' && plan.includes('Pro'));

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
                className="lg:hidden p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 shrink-0"
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
                  <span className="truncate">Phone Koi <span className="text-indigo-600 font-extrabold">Dashboard</span></span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className={`h-8 sm:h-10 px-2.5 sm:px-4 rounded-full flex items-center justify-center border transition-all ${
                isProMember 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200/80 shadow-xs' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                  isProMember ? 'text-indigo-650 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent' : 'text-slate-500'
                }`}>
                  {plan === '6 Months Pro' ? (
                    <>
                      <span>6 Months Pro</span>
                      <span className="hidden sm:inline"> Member</span>
                    </>
                  ) : isProMember ? (
                    <>
                      <span>Pro</span>
                      <span className="hidden sm:inline"> Member</span>
                    </>
                  ) : (
                    <>
                      <span>Basic</span>
                      <span className="hidden sm:inline"> Member</span>
                    </>
                  )}
                </span>
              </div>
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
