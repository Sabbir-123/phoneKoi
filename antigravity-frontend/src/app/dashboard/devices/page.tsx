'use client';
import { API_URL, authFetch } from '@/utils/api';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Smartphone, Sparkles, Plus, Calendar, Hash, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { MotionButton } from '@/components/ui/MotionButton';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';

export default function ReportedDevicesPage() {
  const { language } = useDashboardStore();
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [isSubmittingRecovered, setIsSubmittingRecovered] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

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
      const res = await authFetch(`${API_URL}/reports?email=${email}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },

    enabled: !!email
  });

  const handleMarkAsRecovered = async (reportId: string) => {
    setIsSubmittingRecovered(true);
    try {
      const res = await authFetch(`${API_URL}/reports/${reportId}/mark-recovered`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to mark device as recovered');
      }

      await queryClient.invalidateQueries({ queryKey: ['user-reports', email] });
      setConfirmModal(null);
      setRecoverySuccessMsg('Device marked as recovered! The stolen flag has been cleared.');
      if (selectedDevice?.id === reportId) {
        setSelectedDevice((prev: any) => prev ? { ...prev, rawStatus: 'RECOVERED', status: 'Recovered', risk: 'Low' } : null);
      }
      setTimeout(() => setRecoverySuccessMsg(null), 5000);
    } catch (e: any) {
      alert(e.message || 'An error occurred');
    } finally {
      setIsSubmittingRecovered(false);
    }
  };

  const devices = reports
    ? reports.map((r: any) => ({
        id: r.id,
        name: r.deviceName || 'Unknown Device',
        imei: r.imei,
        rawStatus: r.status,
        status:
          r.status === 'RECOVERED'
            ? 'Recovered'
            : r.status === 'APPROVED'
            ? 'Verified Stolen'
            : r.status === 'REJECTED'
            ? 'Rejected'
            : 'Pending Verification',
        risk: r.status === 'RECOVERED' ? 'Low' : r.extractedFromGd ? 'High' : 'Medium',
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

      {recoverySuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-semibold shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{recoverySuccessMsg}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {isLoading || !email ? (
            <InteractiveLoader
              title="Scanning Reported Devices"
              subtitle="Querying device theft records & police GD documentation"
              skeletonType="cards"
            />
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
                  className={`p-4 sm:p-6 cursor-pointer transition-all bg-white/70 border hover:bg-white shadow-[0_4px_20px_rgba(99,102,241,0.02)] ${
                    selectedDevice?.id === device.id 
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-md' 
                      : 'border-slate-100 hover:border-indigo-100/50'
                  }`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="p-2.5 sm:p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl shrink-0">
                        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-indigo-950 truncate">{device.name}</h3>
                        <p className="text-xs sm:text-sm font-mono text-slate-400 font-medium break-all">{device.imei}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-0 sm:mb-1 ${
                        device.rawStatus === 'RECOVERED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : device.rawStatus === 'APPROVED'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {device.rawStatus === 'RECOVERED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {device.status}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium">{device.lastActivity}</p>
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

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {/* Mark as Recovered Action Button */}
                    {selectedDevice.rawStatus === 'RECOVERED' ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {language === 'banglish' 
                            ? 'Device phire peyechi hishebe mark kora hoyeche. Stolen flag tule dewa hoyeche.' 
                            : 'Marked as recovered. Stolen flags and public search alerts have been cleared.'}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmModal(selectedDevice)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'banglish' ? 'Device Phire Peyechi (Mark as Found)' : 'Mark Device as Found / Recovered'}
                      </button>
                    )}

                    <Link
                      href="/dashboard/alerts"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                      View Live Search Alerts
                    </Link>

                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Safety &amp; Recovery</h4>
                    <ul className="text-sm text-slate-500 space-y-2 font-medium">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Real-time alerts active across WhatsApp & In-App
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Report credible search logs directly to police
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

      {/* Confirmation Modal for Marking Device as Recovered */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'banglish' ? 'Device ki phire peyechen?' : 'Confirm Device Recovery'}
                  </h3>
                  <p className="text-xs text-slate-500">IMEI: {confirmModal.imei}</p>
                </div>
              </div>

              <div className="text-sm text-slate-600 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                <p>
                  {language === 'banglish'
                    ? 'Apni ki nishchit je apnar ei device-ti phire peyechen? Eti mark korle:'
                    : 'Are you sure you have recovered this device? Marking it as recovered will:'}
                </p>
                <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-700">
                  <li>Clear the public stolen blacklist warning for this IMEI</li>
                  <li>Restore device safety status to <strong>CLEAN</strong> in Phone Koi searches</li>
                  <li>Disable active alert pings for future search attempts</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingRecovered}
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  {language === 'banglish' ? 'Cancel' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRecovered}
                  onClick={() => handleMarkAsRecovered(confirmModal.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingRecovered ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'banglish' ? 'Haa, Phire Peyechi' : 'Yes, Mark as Found'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

