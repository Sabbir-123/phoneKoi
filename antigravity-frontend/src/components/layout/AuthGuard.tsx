'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLoading(false);
      } else {
        router.push('/login');
      }
    };
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#f8fafc] px-6">
        <div className="max-w-md w-full">
          <InteractiveLoader
            title="Securing Authenticated Session"
            subtitle="Validating Supabase cryptographic token & establishing encrypted dashboard tunnel"
            variant="card"
            showSkeleton={false}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
