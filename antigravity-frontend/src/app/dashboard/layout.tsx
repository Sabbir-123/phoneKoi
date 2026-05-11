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
      <div className="flex min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-20 lg:h-24 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-300" />
              </button>
              <h2 className="text-xl font-medium tracking-tight text-white hidden sm:block">
                Phone Koi <span className="text-indigo-400 font-bold">Dashboard</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-10 px-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-400">Pro Member</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
