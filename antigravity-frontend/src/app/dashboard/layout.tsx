'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/dashboard/Sidebar';
import LanguageModal from '@/components/dashboard/LanguageModal';
import { useDashboardStore } from '@/store/useDashboardStore';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useDashboardStore();

  return (
    <AuthGuard>
      <LanguageModal />
      <div className="fixed inset-0 flex overflow-hidden bg-[#f8fafc] text-slate-700 selection:bg-indigo-100/80">
        <Sidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 lg:h-20 border-b border-slate-100 bg-[#f8fafc]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-30">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold tracking-tight text-indigo-950 hidden sm:block">
                Phone Koi <span className="text-indigo-600 font-extrabold">Dashboard</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-10 px-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-600">Pro Member</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-6 sm:p-8 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
