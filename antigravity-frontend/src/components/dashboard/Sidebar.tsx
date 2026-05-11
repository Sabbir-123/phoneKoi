'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, Bell, History, Settings, UserCircle, LogOut, X } from 'lucide-react';
import { auth } from '@/utils/firebase/client';
import { signOut } from 'firebase/auth';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reported Devices', href: '/dashboard/devices', icon: Smartphone },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, language } = useDashboardStore();
  const pathname = usePathname();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 0 : -300) }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#030712] border-r border-white/5 z-50 flex flex-col`}
      >
        <div className="h-20 lg:h-24 flex items-center justify-between px-8 border-b border-white/5">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
          <div className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {language === 'banglish' ? 'Apanar Dashboard' : 'Your Dashboard'}
          </div>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => typeof window !== 'undefined' && window.innerWidth < 1024 && toggleSidebar()}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-400' : 'group-hover:scale-110'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{language === 'banglish' ? 'Log Out Korun' : 'Log Out'}</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
