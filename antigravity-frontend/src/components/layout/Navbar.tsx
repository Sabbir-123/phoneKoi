"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, ShieldAlert, ShieldCheck, Activity, User, LogOut, Sparkles, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase Init & Listener
    const getSupabaseUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSupabaseUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const navItems = [
    { name: "Check IMEI", href: "/check", icon: Search },
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
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 pointer-events-none"
      >
        <div
          className={`w-full max-w-5xl flex items-center justify-between pointer-events-auto rounded-2xl px-4 py-3 transition-all duration-300 ${
            scrolled || isOpen
              ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-indigo-100/50 border border-white/80"
              : "bg-transparent"
          }`}
        >
          {/* Logo */}
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
            </motion.div>
            <span className="font-bold tracking-widest uppercase text-sm text-indigo-700 group-hover:text-indigo-500 transition-colors">
              Phone Koi
            </span>
          </Link>

          {/* Nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur-md border border-white/80 rounded-full px-2 py-1.5 shadow-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors duration-200 flex items-center gap-2 rounded-full ${
                    isActive
                      ? "text-indigo-700 bg-indigo-50"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-indigo-100 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Auth area (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/70 border border-slate-100 px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline-block max-w-[120px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-sm btn-primary px-5 py-2 rounded-full font-semibold shadow-sm">
                  Sign Up
                </Link>
              </>
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
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="h-px bg-slate-100 w-full" />

            {/* Mobile Auth actions */}
            <div className="flex flex-col gap-3">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span className="truncate">{user.email}</span>
                  </div>
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
