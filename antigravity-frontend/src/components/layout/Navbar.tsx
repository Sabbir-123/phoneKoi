"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, ShieldAlert, ShieldCheck, Activity, User, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();

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
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { name: "Check IMEI", href: "/check", icon: Search },
    { name: "Report Stolen", href: "/report", icon: ShieldAlert },
    { name: "Dashboard", href: "/dashboard", icon: Activity },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 pointer-events-none"
    >
      <div
        className={`w-full max-w-5xl flex items-center justify-between pointer-events-auto rounded-2xl px-4 py-3 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-indigo-100/50 border border-white/80"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
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

        {/* Nav links */}
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

        {/* Auth area */}
        <div className="flex items-center gap-3">
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
      </div>
    </motion.header>
  );
}
