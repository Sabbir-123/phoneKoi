'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Smartphone, Sparkles, Plus, Calendar, Hash, ArrowRight } from 'lucide-react';
import { MotionButton } from '@/components/ui/MotionButton';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function ReportedDevicesPage() {
  const { language } = useDashboardStore();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };
    fetchSession();
  }, []);

  // Fetch real reports from backend
  const { data: reports, isLoading } = useQuery({
    queryKey: ['user-reports', email],
    queryFn: async () => {
      const res = await fetch(`http://localhost:4000/reports?email=${email}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: !!email
  });

  const devices = reports
    ? reports.map((r: any) => ({
        id: r.id,
        name: r.deviceName || 'Unknown Device',
        imei: r.imei,
        status: r.status === 'PENDING' ? 'Pending' : 'Verified',
        risk: r.extractedFromGd ? 'High' : 'Medium',
        lastActivity: new Date(r.createdAt).toLocaleDateString(),
        description: r.description || 'No description provided.',
        confidence: r.aiExtractionConfidence,
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight">
            {language === 'banglish' ? 'Amar Report Kora Devices' : 'My Reported Devices'}
          </h1>
          <p className="text-slate-500 mt-1">
            {language === 'banglish' ? 'Apnar harano device track korun.' : 'Manage and track your reported stolen devices.'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/report">
            <MotionButton variant="primary" className="shadow-md">
              <Plus className="w-5 h-5" />
              {language === 'banglish' ? 'Notun Device Add Korun' : 'Add New Device'}
            </MotionButton>
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {isLoading || !email ? (
            <div className="h-48 flex items-center justify-center bg-transparent">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
          ) : devices.length === 0 ? (
            <GlassCard className="p-8 text-center bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] flex flex-col items-center justify-center min-h-[300px]">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl mb-4">
                <Smartphone className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-indigo-950 mb-2">
                {language === 'banglish' ? 'Kono Device Report Kora Hoyni' : 'No Devices Reported'}
              </h3>
              <p className="text-slate-500 max-w-md mb-6 text-sm font-semibold">
                {language === 'banglish' 
                  ? 'Apnar kono harano ba churi kora device ekhono report kora hoyni. Churi kora device report korte nicher button e click korun.' 
                  : 'You have not reported any lost or stolen devices yet. Add your device to start tracking and receiving safety alerts.'}
              </p>
              <Link href="/report">
                <MotionButton variant="primary" className="shadow-md">
                  <Plus className="w-5 h-5" />
                  {language === 'banglish' ? 'Notun Device Add Korun' : 'Add New Device'}
                </MotionButton>
              </Link>
            </GlassCard>
          ) : (
            devices.map((device: any, i: number) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard 
                  className={`p-6 cursor-pointer transition-all bg-white/70 border hover:bg-white shadow-[0_4px_20px_rgba(99,102,241,0.02)] ${
                    selectedDevice?.id === device.id 
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-md' 
                      : 'border-slate-100 hover:border-indigo-100/50'
                  }`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
                        <Smartphone className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-indigo-950">{device.name}</h3>
                        <p className="text-sm font-mono text-slate-400 font-medium">{device.imei}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-1 ${
                        device.status === 'Pending' 
                          ? 'bg-amber-50 border-amber-100 text-amber-600' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {device.status}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{device.lastActivity}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>

        {/* AI Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDevice ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="sticky top-28"
            >
              <GlassCard className="p-6 space-y-6 bg-white/80 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                    </div>
                    <h3 className="font-bold text-indigo-950 text-base">
                      {language === 'banglish' ? 'AI Analysis' : 'AI Analysis'}
                    </h3>
                  </div>
                  {selectedDevice.confidence && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 font-bold font-mono">
                      Conf: {(selectedDevice.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Extraction Summary</h4>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 font-medium">
                      {selectedDevice.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 pt-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-500" />
                      <span>IMEI: {selectedDevice.imei}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span>Reported On: {selectedDevice.lastActivity}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Next Recovery Steps</h4>
                    <ul className="text-sm text-slate-500 space-y-2 font-medium">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Wait for further verification signals
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Keep your purchase receipt handy
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-white/30 backdrop-blur-sm">
              <p className="text-slate-400 text-sm text-center px-6 font-semibold">
                {language === 'banglish' ? 'Kono device select korun details dekhar jonno.' : 'Select a device to view detailed AI analysis.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
