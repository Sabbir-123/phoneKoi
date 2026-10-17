'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldAlert, Smartphone, MapPin, ArrowRight, Camera, User } from 'lucide-react';
import { MotionButton } from '@/components/ui/MotionButton';
import { API_URL, authFetch } from '@/utils/api';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function CompleteProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        const email = session.user.email;
        setUserEmail(email);

        // Fetch user profile from backend
        const res = await authFetch(`${API_URL}/users/profile?email=${encodeURIComponent(email)}`);

        if (res.ok) {
          const profile = await res.json();
          const localCompleted = localStorage.getItem(`profile_completed_${email}`) === 'true';
          const isComplete = Boolean(
            profile.isProfileComplete || 
            (profile.phone && profile.address && profile.displayName && profile.avatar) || 
            localCompleted
          );

          // If profile is not complete, show the mandatory complete profile modal
          if (!isComplete) {
            // Delay slightly for smooth page entrance
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 500);
            return () => clearTimeout(timer);
          } else {
            setIsOpen(false);
          }
        }
      } catch (err) {
        console.error('Error checking profile status in CompleteProfileModal:', err);
      }
    };

    checkProfileStatus();

    // Listen for custom profile completed event
    const handleProfileUpdated = () => {
      setIsOpen(false);
    };
    window.addEventListener('phonekoi_profile_completed', handleProfileUpdated);
    return () => {
      window.removeEventListener('phonekoi_profile_completed', handleProfileUpdated);
    };
  }, [pathname]);

  const handleGoToProfile = () => {
    setIsOpen(false);
    if (pathname !== '/dashboard/profile') {
      router.push('/dashboard/profile');
    } else {
      const formEl = document.getElementById('complete-profile-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden z-10 my-8"
          >
            {/* Top decorative gradient bar */}
            <div className="h-3 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 w-full" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Badge & Title */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Mandatory Action Required
                </motion.div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Complete Your Profile
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                  Welcome to Phone Koi! Completing your profile is <strong className="text-indigo-900">mandatory</strong> to activate IMEI verification and device safety protections.
                </p>
              </div>

              {/* Requirement Highlights */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Mandatory Profile Photo & Full Name</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Upload your real profile picture and enter your full name to verify community identity.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">1 Number per Account Policy</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Each user must provide their own unique phone number. Duplicate numbers used by other accounts will be strictly rejected.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Physical Address Required</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Required for lawful database reporting and verified Police GD tracking.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <MotionButton
                  variant="primary"
                  onClick={handleGoToProfile}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-95"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Complete Your Profile Now</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </MotionButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
