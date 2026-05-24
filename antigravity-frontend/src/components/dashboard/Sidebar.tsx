'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, Bell, History, Settings, UserCircle, LogOut, X, CreditCard, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, language } = useDashboardStore();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);

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
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      
      if (email) {
        try {
          const res = await fetch(`http://localhost:4000/users/profile?email=${email}`);
          if (res.ok) {
            const profile = await res.json();
            if (profile?.role === 'ADMIN') {
              setIsAdmin(true);
            }
            if (profile?.searchesLeft !== undefined) {
              setSearchesLeft(profile.searchesLeft);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkRole();
    const interval = setInterval(checkRole, 6000);
    return () => clearInterval(interval);
  }, []);

  const pricingLabel = searchesLeft !== null 
    ? (language === 'banglish' ? `Check Quota (${searchesLeft} Search Baki)` : `Check Quota (${searchesLeft} Left)`)
    : (language === 'banglish' ? 'Check Quota' : 'Check Quota');

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Reported Devices', href: '/dashboard/devices', icon: Smartphone },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: pricingLabel, href: '/dashboard/pricing', icon: CreditCard },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ...(isAdmin ? [{ name: 'Admin panel', href: '/dashboard/admin', icon: ShieldCheck }] : []),
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

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobile ? (sidebarOpen ? 0 : -300) : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white/80 border-r border-slate-100 backdrop-blur-md z-50 flex flex-col`}
      >
        <div className="h-16 lg:h-20 flex items-center justify-between px-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-extrabold text-xl">P</span>
            </div>
            <span className="font-extrabold tracking-widest text-indigo-950 uppercase text-sm">
              Phone Koi
            </span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
          <div className="px-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
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
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">{language === 'banglish' ? 'Log Out Korun' : 'Log Out'}</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
