'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/utils/firebase/client';
import { motion } from 'framer-motion';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { createClient } = require("@/utils/supabase/client");
    const supabase = createClient();
    let firebaseChecked = false;
    let supabaseChecked = false;
    let firebaseUser: any = null;
    let supabaseUser: any = null;

    const checkAuthStatus = () => {
      if (firebaseChecked && supabaseChecked) {
        if (firebaseUser || supabaseUser) {
          setLoading(false);
        } else {
          router.push('/login');
        }
      }
    };

    // 1. Firebase Listener
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      firebaseUser = user;
      firebaseChecked = true;
      checkAuthStatus();
    });

    // 2. Supabase Listener
    const getSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      supabaseUser = session?.user || null;
      supabaseChecked = true;
      checkAuthStatus();
    };
    getSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      supabaseUser = session?.user || null;
      supabaseChecked = true;
      checkAuthStatus();
    });

    return () => {
      unsubscribeFirebase();
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#f8fafc] px-6">
        {/* Dynamic Website Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[90px] pointer-events-none -z-10" />

        <div className="flex flex-col items-center max-w-sm text-center space-y-6 z-10">
          {/* Double ring circling loader */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-indigo-950">Securing Session</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Please wait a bit while we verify your identity and connect securely to the Phone Koi dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
