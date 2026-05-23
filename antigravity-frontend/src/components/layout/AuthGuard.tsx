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
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"
        />
      </div>
    );
  }

  return <>{children}</>;
}
