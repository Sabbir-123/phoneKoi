'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { useTranslation } from '@/lib/useTranslation';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { History, Search, ShieldAlert, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL, authFetch } from '@/utils/api';
import { createClient } from '@/utils/supabase/client';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';

export default function HistoryPage() {
  const { t, isBn } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          const res = await authFetch(`${API_URL}/users/me/search-history?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error('Error loading search history from database:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-indigo-600" />
          {isBn ? 'IMEI যাচাইয়ের ইতিহাস' : 'IMEI Check History'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {isBn ? 'আপনার পূর্বের সকল ডিভাইস যাচাই ও রিস্ক স্কোরের তালিকা।' : 'Review your past device verifications and risk scores.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) - History List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <InteractiveLoader
              title={isBn ? 'অনুসন্ধানের লগ লোড হচ্ছে...' : 'Querying Search Ledger Audit Logs'}
              subtitle={isBn ? 'আপনার পূর্বের আইএমইআই সিকিউরিটি হিস্টোরি যাচাই হচ্ছে' : 'Verifying your previous IMEI security inquiries'}
              skeletonType="table"
            />
          ) : history.length === 0 ? (
            <GlassCard className="p-8 text-center bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] flex flex-col items-center justify-center min-h-[300px]">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl mb-4">
                <History className="w-10 h-10 text-indigo-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-indigo-950 mb-2">
                {isBn ? 'কোনো সার্চ ইতিহাস পাওয়া যায়নি' : 'No Search History'}
              </h3>
              <p className="text-slate-500 max-w-md mb-6 text-sm font-semibold">
                {isBn 
                  ? 'আপনি এখনও কোনো ডিভাইসের IMEI চেক করেননি। নিচে ক্লিক করে নতুন ফোন যাচাই শুরু করুন।' 
                  : 'You have not checked any device IMEIs yet. Start verifying devices to keep track of your search logs here.'}
              </p>
              <Link href="/check">
                <MotionButton variant="primary" className="shadow-md cursor-pointer">
                  <Search className="w-5 h-5" />
                  {isBn ? 'এখনই IMEI যাচাই করুন' : 'Check IMEI Now'}
                </MotionButton>
              </Link>
            </GlassCard>
          ) : (
            history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 bg-white/70 border border-slate-100 hover:border-indigo-100/50 hover:bg-white shadow-[0_4px_20px_rgba(99,102,241,0.02)] transition-colors">
                  <div className="flex items-center gap-3.5 sm:gap-5 min-w-0 w-full md:w-auto">
                    <div className={`p-2.5 sm:p-3.5 rounded-2xl border shrink-0 ${
                      item.result === 'Clean' ? 'bg-emerald-50 border-emerald-100' :
                      item.result === 'Stolen' ? 'bg-red-50 border-red-100' :
                      'bg-amber-50 border-amber-100'
                    }`}>
                      {item.result === 'Clean' ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-sm sm:text-lg font-bold text-indigo-950 tracking-wider mb-0.5 sm:mb-1 break-all">{item.imei}</div>
                      <div className="text-xs text-slate-400 font-semibold">{item.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex flex-col items-start md:items-end">
                      <div className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider font-bold">
                        {isBn ? 'রিস্ক স্কোর' : 'Risk Score'}
                      </div>
                      <div className={`text-lg font-extrabold ${
                        item.score > 80 ? 'text-red-600' :
                        item.score > 30 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {item.score}/100
                      </div>
                    </div>
                    
                    <Link href={`/result/${item.imei}`}>
                      <MotionButton variant="secondary" className="px-4 py-2 border-slate-100 text-indigo-600 shadow-none hover:bg-slate-50 font-bold text-xs gap-1.5 cursor-pointer">
                        <Search className="w-4 h-4" />
                        {isBn ? 'পুনরায় দেখুন' : 'Search Again'}
                      </MotionButton>
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column (1 Col) - Safety Checklist Panel */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-28"
          >
            <GlassCard className="p-6 space-y-6 bg-white/80 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100/50">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="font-bold text-indigo-950 text-base">
                  {isBn ? 'ব্যবহৃত ফোন কেনার চেকলিস্ট' : 'Used Phone Checklist'}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 mt-0.5">1</div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">
                      {isBn ? 'IMEI ফরম্যাট যাচাই করুন' : 'Check IMEI Structure'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {isBn ? 'লুহন অ্যালগরিদম চেকসাম দিয়ে হার্ডওয়্যারের সত্যতা নিশ্চিত হন।' : 'Use the Luhn validator to check format authenticity.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 mt-0.5">2</div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">
                      {isBn ? 'চুরি বা হারানোর রেকর্ড দেখুন' : 'Check Stolen Status'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {isBn ? 'কেনার আগে ফোনকই ডেটাবেজে থানার জিডি সার্চ করুন।' : 'Query PhoneKoi database for theft flags before buying.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 mt-0.5">3</div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">
                      {isBn ? 'বক্স ও ক্যাশমেমো মিলিয়ে নিন' : 'Request Police GD Copy'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {isBn ? 'বিক্রেতার দেওয়া তথ্যের সাথে ফোনের আসল হার্ডওয়্যার মিলিয়ে নিন।' : 'If the seller claims a phone is second-hand, request evidence.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex gap-2.5 items-start">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'সকল অনুসন্ধান সুরক্ষিত ও সম্পূর্ণ বেনামী। আপনার সার্চ রেকর্ড কখনো বিক্রেতাকে দেওয়া হয় না।'
                      : 'Checks are encrypted and anonymous. Your searches are never shared with sellers.'
                    }
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
