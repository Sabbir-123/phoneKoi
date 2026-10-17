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
  const { toggleSidebar } = useDashboardStore();
  const [plan, setPlan] = useState('FREE');
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const isAdminEmail = session.user.email.toLowerCase().trim() === 'ahmedsabbir2013@gmail.com';
          if (isAdminEmail) {
            setPlan('PRO');
            setIsPro(true);
          }
          const res = await authFetch(`${API_URL}/users/profile?email=${session.user.email}`);

          if (res.ok) {
            const data = await res.json();
            setPlan(data.plan || (isAdminEmail ? 'PRO' : 'FREE'));
            setIsPro(Boolean(data.isPro || isAdminEmail || (data.plan && data.plan.includes('Pro'))));
          }
        }
      } catch (err) {
        console.error('Error fetching plan for dashboard layout:', err);
      }
    };
    fetchPlan();
  }, []);

  const isProMember = isPro || plan === 'PRO' || (typeof plan === 'string' && plan.includes('Pro'));

  return (
    <AuthGuard>
      <LanguageModal />
      <div className="fixed inset-0 flex overflow-hidden bg-[#f8fafc] text-slate-700 selection:bg-indigo-100/80">
        <Sidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 lg:h-20 border-b border-slate-100 bg-[#f8fafc]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-30">
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="PhoneKoi"
                  width={112}
                  height={28}
                  className="h-7 w-auto object-contain block sm:hidden"
                />
                <h2 className="text-xl font-bold tracking-tight text-indigo-950 hidden sm:flex items-center gap-2">
                  <Image
                    src="/logo-icon.png"
                    alt="PhoneKoi Emblem"
                    width={26}
                    height={26}
                    className="w-6 h-6 object-contain"
                  />
                  <span>Phone Koi <span className="text-indigo-600 font-extrabold">Dashboard</span></span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`h-10 px-4 rounded-full flex items-center justify-center border transition-all ${
                isProMember 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200/80 shadow-sm' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-sm font-bold transition-colors ${
                  isProMember ? 'text-indigo-650 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent' : 'text-slate-500'
                }`}>
                  {plan === '6 Months Pro' ? '6 Months Pro Member' : (isProMember ? 'Pro Member' : 'Basic Member')}
                </span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-6 sm:p-8 lg:p-10">
            {children}
            <PromoModal />
            <CompleteProfileModal />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
