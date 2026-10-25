'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { useTranslation } from '@/lib/useTranslation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Smartphone, Bell, History, Settings, UserCircle, LogOut, X, CreditCard, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, profile, fetchProfile } = useDashboardStore();
  const { t, isBn } = useTranslation();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isAdmin = profile?.role === 'ADMIN';

  const navItems = [
    { name: t.dashboard.sidebar.home, href: '/', icon: Home },
    { name: t.dashboard.sidebar.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.dashboard.sidebar.reportedDevices, href: '/dashboard/devices', icon: Smartphone },
    { name: t.dashboard.sidebar.alerts, href: '/dashboard/alerts', icon: Bell },
    { name: t.dashboard.sidebar.history, href: '/dashboard/history', icon: History },
    { name: t.dashboard.sidebar.quota, href: '/dashboard/quota', icon: CreditCard },
    { name: t.dashboard.sidebar.profile, href: '/dashboard/profile', icon: UserCircle },
    { name: t.dashboard.sidebar.settings, href: '/dashboard/settings', icon: Settings },
    ...(isAdmin ? [{ name: t.dashboard.sidebar.adminPanel, href: '/dashboard/admin', icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
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

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobile ? (sidebarOpen ? 0 : -300) : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 max-w-[85vw] bg-white/80 border-r border-slate-100 backdrop-blur-md z-50 flex flex-col`}
      >
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center py-1 group">
            <Image
              src="/logo.png"
              alt="PhoneKoi Logo"
              width={142}
              height={38}
              priority
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
          <div className="px-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.dashboard.sidebar.yourDashboard}
          </div>
          
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href);
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => typeof window !== 'undefined' && window.innerWidth < 1024 && toggleSidebar()}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50/65 font-bold shadow-sm border-l-4 border-indigo-600' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50/50'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600' : 'group-hover:scale-110'}`} />
                <span className="font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors group cursor-pointer"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">{t.dashboard.sidebar.logOut}</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
