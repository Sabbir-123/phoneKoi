'use client';
import { API_URL, authFetch } from '@/utils/api';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldCheck, Sparkles, AlertCircle, Copy, Check, Send } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/store/useDashboardStore';

export interface SubscriptionPlan {
  name: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  features: string[];
  popular: boolean;
  isPromoFree: boolean;
  promoBadge?: string;
  glow: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: '1 Month Pro',
    price: 49,
    originalPrice: null,
    duration: '1 Month',
    features: [
      'Report up to 2 mobile devices',
      '3 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: false,
    isPromoFree: false,
    glow: 'rgba(99,102,241,0.02)',
  },
  {
    name: '3 Months Pro',
    price: 99,
    originalPrice: null,
    duration: '3 Months',
    features: [
      'Report up to 4 mobile devices',
      '15 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: false,
    isPromoFree: false,
    glow: 'rgba(139,92,246,0.05)',
  },
  {
    name: '6 Months Pro',
    price: 0,
    originalPrice: 259,
    duration: '6 Months',
    features: [
      'Report up to 10 mobile devices',
      '30 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Full Risk Breakdown & Police GD Matches',
      'Priority Community Trust Badge',
      '24/7 dedicated device recovery support',
    ],
    popular: true,
    isPromoFree: true,
    promoBadge: 'Special Launch Offer (Free)',
    glow: 'rgba(6,182,212,0.08)',
  },
  {
    name: '12 Months Pro',
    price: 999,
    originalPrice: null,
    duration: '12 Months',
    features: [
      'Report up to 50 mobile devices',
      '99 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: false,
    isPromoFree: false,
    glow: 'rgba(236,72,153,0.02)',
  },
];

export default function PricingPage() {
  const [email, setEmail] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('6 Months Pro');
  const [hoveredPlanName, setHoveredPlanName] = useState<string | null>(null);
  const [trxCode, setTrxCode] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [promoClaimedModal, setPromoClaimedModal] = useState(false);
  const router = useRouter();

  const { profile, fetchProfile } = useDashboardStore();

  useEffect(() => {
    fetchProfile();
    const fetchEmail = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };
    fetchEmail();
  }, [fetchProfile]);

  const hasClaimed = Boolean(profile?.hasClaimedPromo || profile?.plan === '6 Months Pro');

  const computedPlans = subscriptionPlans.map((plan) => {
    if (plan.name === '6 Months Pro' && hasClaimed) {
      return {
        ...plan,
        price: 259,
        originalPrice: null,
        isPromoFree: false,
        promoBadge: 'Regular Package (Promo Claimed)',
      };
    }
    return plan;
  });

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01626693505');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChoosePlan = (plan: SubscriptionPlan) => {
    setSelectedPlanName(plan.name);

    // If it's the 6-Month Free Pro Launch Offer and not yet claimed
    if (plan.isPromoFree && !hasClaimed) {
      if (!email) {
        router.push('/signup?redirectTo=/dashboard?claimed=true');
        return;
      }
      setPromoClaimedModal(true);
      return;
    }

    if (!email) {
      router.push(`/login?redirectTo=/pricing`);
      return;
    }
    setCheckoutPlan(plan);
    setSuccess(false);
    setError(null);
  };


  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_URL}/users/subscription-request?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: checkoutPlan.name,
          price: checkoutPlan.price,
          trxCode,
          bkashLastFour: lastFour,
        }),
      });


      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }

      setSuccess(true);
      setTrxCode('');
      setLastFour('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your TrxID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 relative px-6 py-20 min-h-[85vh]">
      {/* Background ambient lighting */}
      <div className="orb w-[500px] h-[500px] bg-indigo-200/20 top-0 right-0 -z-10 blur-[80px]" />
      <div className="orb w-[300px] h-[300px] bg-purple-200/20 bottom-0 left-0 -z-10 blur-[60px]" style={{ animationDelay: '3s' }} />

      {/* Pricing Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles className="w-3.5 h-3.5" /> Pricing & Plans
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-indigo-950 tracking-tight leading-tight"
        >
          Unlock <span className="text-indigo-600">Pro Watcher</span> Standing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-slate-500 text-base font-medium leading-relaxed"
        >
          Upgrade your plan to run queries, protect purchases in real-time, and get unlimited device track alerts.
        </motion.p>

        {/* Promo announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            🎉 <strong>Early Adopter Special:</strong> Sign up until <strong>January 31, 2027</strong> to receive the <strong>6 Months Pro Package for FREE</strong>!
          </span>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {computedPlans.map((plan, idx) => {
          const isHighlighted = hoveredPlanName ? (hoveredPlanName === plan.name) : (selectedPlanName === plan.name);
          const isSelected = selectedPlanName === plan.name;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
              className="flex"
            >
              <GlassCard
                glowColor={plan.glow}
                onMouseEnter={() => setHoveredPlanName(plan.name)}
                onMouseLeave={() => setHoveredPlanName(null)}
                onClick={() => setSelectedPlanName(plan.name)}
                className={`p-5 sm:p-7 flex flex-col justify-between w-full relative transition-all duration-300 cursor-pointer ${
                  isHighlighted
                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 shadow-2xl shadow-indigo-500/20 bg-white scale-[1.03] z-10'
                    : 'border-slate-100 hover:border-indigo-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] bg-white/70 scale-100'
                }`}
              >
                <div className="space-y-6">
                  <div>
                    <div className="min-h-[26px] mb-3 flex items-center">
                      {plan.isPromoFree ? (
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
                          {plan.promoBadge || 'Launch Special'}
                        </span>
                      ) : plan.popular ? (
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-md">
                          Popular
                        </span>
                      ) : isHighlighted ? (
                        <span className="bg-indigo-600 text-white text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-md animate-in fade-in duration-200">
                          {isSelected ? 'Selected' : 'Active Choice'}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-bold text-indigo-950">{plan.name}</h3>
                    <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                      <span className="text-3xl font-extrabold text-indigo-950">৳{plan.price}</span>
                      {plan.originalPrice && (
                        <span className="text-base font-semibold text-slate-400 line-through">
                          ৳{plan.originalPrice}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-400">/ {plan.duration}</span>
                      {plan.isPromoFree && (
                        <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                          100% Free
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <MotionButton
                    variant={isHighlighted || plan.isPromoFree ? 'primary' : 'secondary'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoosePlan(plan);
                    }}
                    className={`w-full font-bold py-3 rounded-xl transition-all whitespace-nowrap ${
                      plan.isPromoFree
                        ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-105 border-transparent'
                        : isHighlighted
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border-transparent'
                        : 'border border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {plan.isPromoFree ? 'Claim 6 Months Free Pro' : 'Choose Plan'}
                  </MotionButton>
                </div>

              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Payment Modals */}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-6 z-50 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] border border-slate-100 p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-indigo-600" />
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950">bKash Subscription Payment</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Plan: {checkoutPlan.name} • ৳{checkoutPlan.price}</p>
                </div>
                <button
                  onClick={() => setCheckoutPlan(null)}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {!success ? (
                <div className="space-y-6">
                  {/* Step 1: Send Money Instructions */}
                  <div className="p-4 bg-pink-50/50 border border-pink-100/50 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#e2125d] flex items-center justify-center text-white text-[10px] font-extrabold">b</div>
                      <span className="text-xs font-bold text-[#e2125d] uppercase tracking-wider">bKash Send Money</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      Please send exactly <strong className="text-indigo-950">৳{checkoutPlan.price}</strong> from your bKash app to the personal number below:
                    </p>
                    <div className="flex items-center justify-between bg-white border border-pink-100 rounded-xl p-3 shadow-inner">
                      <span className="text-sm font-extrabold text-indigo-950">01626693505</span>
                      <button
                        onClick={handleCopyNumber}
                        className="text-xs font-bold flex items-center gap-1 text-[#e2125d] hover:underline"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Form Submission */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Transaction Code (TrxID)</label>
                      <input
                        type="text"
                        required
                        value={trxCode}
                        onChange={(e) => setTrxCode(e.target.value)}
                        placeholder="e.g. A29BC178"
                        className="w-full bg-slate-50/65 border border-slate-200 rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">bKash Mobile Number Last 4 Digits</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        pattern="\d{4}"
                        value={lastFour}
                        onChange={(e) => setLastFour(e.target.value)}
                        placeholder="e.g. 5432"
                        className="w-full bg-slate-50/65 border border-slate-200 rounded-xl py-3 px-4 text-indigo-950 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm font-medium"
                      />
                    </div>

                    <div className="pt-2">
                      <MotionButton
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Submit Payment Verification
                          </>
                        )}
                      </MotionButton>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-indigo-950">Transaction Submitted!</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold mt-2">
                      Your bKash transaction was successfully recorded. The system administrator will verify the payment and initialize your **{checkoutPlan.name}** active plan shortly!
                    </p>
                  </div>
                  <div className="pt-4">
                    <MotionButton
                      variant="primary"
                      onClick={() => setCheckoutPlan(null)}
                      className="px-8 py-2.5 rounded-xl text-white font-bold"
                    >
                      Awesome, thank you!
                    </MotionButton>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* 6 Months Free Pro Claim Confirmation Modal */}
        {promoClaimedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-indigo-100 text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500" />
              
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-emerald-100 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
              </div>

              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                  Launch Special Promo Active
                </span>
                <h3 className="text-2xl font-black text-indigo-950 mt-3">
                  6 Months Free Pro Claimed!
                </h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Congratulations! As an early adopter, your account is immediately enrolled in the <strong>6 Months Pro Plan (100% Free)</strong>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>30 Verified Queries</strong> loaded in your balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>10 Stolen Phone Report</strong> quotas active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited real-time theft alerts &amp; tracking</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <MotionButton
                  variant="primary"
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25"
                >
                  Go to Dashboard
                </MotionButton>
                <button
                  type="button"
                  onClick={() => setPromoClaimedModal(false)}
                  className="w-full py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}
