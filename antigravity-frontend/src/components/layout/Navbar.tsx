"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Search, ShieldAlert, ShieldCheck, Activity, User, LogOut, Sparkles, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { profile, fetchProfile } = useDashboardStore();

  useEffect(() => {
    const supabase = createClient();

    // Supabase Init & Listener
    const getSupabaseUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile();
      }
    };
    getSupabaseUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile();
      }
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName = profile?.displayName || 
    user?.user_metadata?.displayName || 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    (user?.email ? user.email.split('@')[0] : 'My Account');

  const avatarUrl = profile?.avatar || 
    profile?.avatarUrl || 
    user?.user_metadata?.avatar_url || 
    user?.user_metadata?.avatar || 
    null;

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

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const navItems = [
    { name: "Check IMEI", href: "/check", icon: Search },
    { name: "Recovered", href: "/recovered", icon: ShieldCheck, badge: "DMP" },
    { name: "Report Stolen", href: "/report", icon: ShieldAlert },
    { name: "Pricing", href: "/pricing", icon: Sparkles },
    { name: "Dashboard", href: "/dashboard", icon: Activity },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 py-3 sm:py-4 pointer-events-none"
      >
        <div
          className={`w-full max-w-6xl flex items-center justify-between pointer-events-auto rounded-2xl px-3 sm:px-5 py-2.5 transition-all duration-300 ${
            scrolled || isOpen
              ? "bg-white/85 backdrop-blur-xl shadow-lg shadow-indigo-100/50 border border-white/80"
              : "bg-transparent"
          }`}
        >
          {/* Official PhoneKoi Logo */}
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center group py-0.5 shrink-0">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center"
            >
              <Image
                src="/logo.png"
                alt="PhoneKoi - IMEI Verification Network"
                width={136}
                height={36}
                priority
                className="h-7 sm:h-8 md:h-9 w-auto object-contain transition-transform"
              />
            </motion.div>
          </Link>

          {/* Nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-1.5 py-1 shadow-sm shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 rounded-full whitespace-nowrap select-none shrink-0 ${
                    isActive
                      ? "text-indigo-700 bg-indigo-50"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-indigo-100 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60 leading-tight">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Auth area (Desktop) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
            {user ? (
              <div className="flex items-center gap-1.5 lg:gap-2">
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 text-xs lg:text-[13px] text-slate-700 hover:text-indigo-950 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 pl-1.5 pr-3 py-1 rounded-full shadow-xs transition-all duration-200"
                  title={`Signed in as ${displayName} (${user.email})`}
                >
                  {/* Round Profile Picture / Avatar */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-6 h-6 rounded-full object-cover border border-indigo-200/80 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white">
                      {initials}
                    </div>
                  )}
                  {/* User Name in small, clean text */}
                  <span className="font-semibold max-w-[90px] lg:max-w-[130px] truncate tracking-tight">
                    {displayName}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs lg:text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-xs lg:text-sm btn-primary px-4 lg:px-5 py-1.5 lg:py-2 rounded-full font-semibold shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-white/60 backdrop-blur-md border border-slate-100/50 hover:bg-slate-50 text-slate-600 transition-colors pointer-events-auto shadow-sm"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 left-4 right-4 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-3xl p-6 shadow-2xl z-50 flex flex-col gap-6 md:hidden pointer-events-auto"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                      isActive
                        ? "text-indigo-700 bg-indigo-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span className="flex-1 flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="h-px bg-slate-100 w-full" />

            {/* Mobile Auth actions */}
            <div className="flex flex-col gap-3">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl hover:bg-slate-100/70 transition-colors"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-200 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-slate-800 truncate">{displayName}</span>
                      <span className="text-xs text-slate-400 truncate">{user.email}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-600 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-md transition-all flex items-center justify-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
