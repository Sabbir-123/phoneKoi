'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Search, Smartphone, Bell, X, ArrowRight, Gift } from 'lucide-react';
import { MotionButton } from '@/components/ui/MotionButton';
import { API_URL, authFetch } from '@/utils/api';
import { createClient } from '@/utils/supabase/client';

export default function PromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkPromoEligibility = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        const email = session.user.email;
        setUserEmail(email);

        const storageKey = `phonekoi_promo_6m_seen_${email}`;
        const hasSeen = localStorage.getItem(storageKey);
        if (hasSeen === 'true') return;

        // Fetch user profile to verify promo qualification
        const res = await authFetch(`${API_URL}/users/profile?email=${encodeURIComponent(email)}`);

        if (res.ok) {
          const profile = await res.json();
          // Check if user is promoted to 6 Months Pro or promo rewarded
          const isEligible = 
            profile.promoRewarded === true || 
            profile.plan === '6 Months Pro' ||
            (profile.isPro && profile.plan?.includes('6 Month'));

          if (isEligible) {
            // Small timeout for smooth entrance after page loads
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 600);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        console.error('Failed to verify promo modal eligibility:', err);
      }
    };

    checkPromoEligibility();
  }, []);

  const handleDismiss = () => {
    if (userEmail) {
      localStorage.setItem(`phonekoi_promo_6m_seen_${userEmail}`, 'true');
    }
    setIsOpen(false);
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
            onClick={handleDismiss}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-indigo-100 z-10 my-4 sm:my-8"
          >
            {/* Top decorative gradient band */}
            <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full shrink-0 sticky top-0 z-20" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-30"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
              {/* Badge & Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 text-indigo-700 text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  <Gift className="w-4 h-4 text-indigo-600 animate-bounce" />
                  Limited Time Welcome Offer
                </motion.div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  🎉 You are Promoted to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">6 Months Pro</span> for Free!
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                  Welcome to Phone Koi! Every new user signing up until <strong className="text-indigo-900 font-bold">January 31, 2027</strong> receives a complete upgrade to our premium 6 Months Pro Package at <strong className="text-emerald-600 font-bold">৳0 cost</strong>.
                </p>
              </div>

              {/* Package Highlight Box */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50/90 rounded-2xl p-5 border border-indigo-100/80 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-sm text-indigo-950">6 Months Pro Package</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs line-through text-slate-400 font-bold">৳259</span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">FREE (৳0)</span>
                  </div>
                </div>

                {/* Features Included */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                    <Search className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">30 IMEI Searches</div>
                      <div className="text-[10px] text-slate-500">Full database queries</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                    <Smartphone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">10 Device Reports</div>
                      <div className="text-[10px] text-slate-500">Register lost or stolen phones</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                    <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Unlimited Alerts</div>
                      <div className="text-[10px] text-slate-500">Real-time theft notifications</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">6 Months Validity</div>
                      <div className="text-[10px] text-slate-500">Active until promotion ends</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <MotionButton
                  variant="primary"
                  onClick={handleDismiss}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-95"
                >
                  <span>Explore Your Pro Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </MotionButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
