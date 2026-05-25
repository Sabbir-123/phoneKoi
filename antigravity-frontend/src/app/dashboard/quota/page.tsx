'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldCheck, Sparkles, Smartphone, Search, AlertCircle, Copy, Check, Send } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const subscriptionPlans = [
  {
    name: '1 Month Pro',
    price: 49,
    duration: '1 Month',
    features: [
      'Report up to 2 mobile devices',
      '3 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: false,
    glow: 'rgba(99,102,241,0.02)',
  },
  {
    name: '3 Months Pro',
    price: 99,
    duration: '3 Months',
    features: [
      'Report up to 4 mobile devices',
      '15 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: true,
    glow: 'rgba(139,92,246,0.05)',
  },
  {
    name: '6 Months Pro',
    price: 259,
    duration: '6 Months',
    features: [
      'Report up to 10 mobile devices',
      '30 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: false,
    glow: 'rgba(6,182,212,0.02)',
  },
  {
    name: '12 Months Pro',
    price: 999,
    duration: '12 Months',
    features: [
      'Report up to 50 mobile devices',
      '99 IMEI searches total',
      'Unlimited real-time theft alerts',
      'Priority safety reporting database access',
      '24/7 dedicated device recovery support',
    ],
    popular: false,
    glow: 'rgba(236,72,153,0.02)',
  },
];

export default function PricingPage() {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<typeof subscriptionPlans[0] | null>(null);
  const [trxCode, setTrxCode] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);
  const [searchLimit, setSearchLimit] = useState<number | null>(null);
  const [reportsLeft, setReportsLeft] = useState<number | null>(null);
  const [reportLimit, setReportLimit] = useState<number | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
        try {
          const res = await fetch(`${API_URL}/users/profile?email=${session.user.email}`);
          if (res.ok) {
            const data = await res.json();
            setSearchesLeft(data.searchesLeft);
            setSearchLimit(data.searchLimit);
            setReportsLeft(data.reportsLeft);
            setReportLimit(data.reportLimit);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchEmail();
  }, []);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01626693505');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/users/subscription-request?email=${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.name,
          price: selectedPlan.price,
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
    <div className="max-w-7xl mx-auto space-y-12 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-200/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-purple-200/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Pricing Header */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5" /> Check Quota & Balance
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-indigo-950 tracking-tight"
          >
            Your Active Quota & Balance
          </motion.h1>
        </div>

        {/* Quota Balance Banners */}
        {searchesLeft !== null && searchLimit !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Search Quota Balance */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-1 rounded-[1.8rem] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-100/20 shadow-lg text-left"
            >
              <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[1.7rem] text-center space-y-2 h-full flex flex-col justify-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Active Search Quota Balance</h3>
                <div className="text-4xl font-black text-indigo-950 my-1">
                  {searchesLeft} <span className="text-sm font-bold text-slate-400">/ {searchLimit} left</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Each IMEI check dynamically deducts 1 search token. Purchase a package below to add more search checks.
                </p>
              </div>
            </motion.div>

            {/* Stolen Report Quota Balance */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-1 rounded-[1.8rem] bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-100/20 shadow-lg text-left"
            >
              <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[1.7rem] text-center space-y-2 h-full flex flex-col justify-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-pink-650">Stolen Report Quota Balance</h3>
                <div className="text-4xl font-black text-indigo-950 my-1">
                  {reportsLeft ?? 0} <span className="text-sm font-bold text-slate-400">/ {reportLimit ?? 0} left</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Required to register mobile theft reports in the database. Exhausted quotas require a package upgrade.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {subscriptionPlans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.08 }}
            className="flex"
          >
            <GlassCard
              glowColor={plan.glow}
              className={`p-7 flex flex-col justify-between w-full relative bg-white/70 border transition-all ${
                plan.popular
                  ? 'border-indigo-500/35 ring-4 ring-indigo-500/5 shadow-md shadow-indigo-100/35 bg-white/90 scale-[1.02]'
                  : 'border-slate-100 hover:border-indigo-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]'
              }`}
            >
              <div className="space-y-6">
                <div>
                  {plan.popular && (
                    <div className="mb-3">
                      <span className="bg-indigo-600 text-white text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                        Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-indigo-950">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-indigo-950">৳{plan.price}</span>
                    <span className="text-xs font-bold text-slate-400">/ {plan.duration}</span>
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
                  variant={plan.popular ? 'primary' : 'secondary'}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setSuccess(false);
                    setError(null);
                  }}
                  className="w-full font-bold py-3 rounded-xl border border-indigo-500/10 whitespace-nowrap"
                >
                  Choose Plan
                </MotionButton>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Payment Modals / Panels */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] border border-slate-100 p-8 max-w-lg w-full relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-indigo-600" />
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950">bKash Subscription Payment</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Plan: {selectedPlan.name} • ৳{selectedPlan.price}</p>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
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
                      Please send exactly <strong className="text-indigo-950">৳{selectedPlan.price}</strong> from your bKash app to the personal number below:
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
                      Your bKash transaction was successfully recorded. The system administrator will verify the payment and initialize your **{selectedPlan.name}** active plan shortly!
                    </p>
                  </div>
                  <div className="pt-4">
                    <MotionButton
                      variant="primary"
                      onClick={() => setSelectedPlan(null)}
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
      </AnimatePresence>
    </div>
  );
}
