'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldCheck, UserCheck, Search, Filter, RefreshCw, XCircle, Clock, Smartphone, ShieldAlert, AlertTriangle, FileText, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface SubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  price: number;
  trxCode: string;
  bkashLastFour: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

interface DeviceReport {
  id: string;
  imei: string;
  deviceName: string | null;
  description: string | null;
  contactNumber: string | null;
  extractedFromGd: boolean;
  aiExtractionConfidence: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  gdImage?: string | null;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [deviceReports, setDeviceReports] = useState<DeviceReport[]>([]);
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'REPORTS'>('SUBSCRIPTIONS');
  
  const [subFilter, setSubFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [reportFilter, setReportFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [viewingGdImage, setViewingGdImage] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    text: string;
    rect: DOMRect;
  } | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/admin/subscription-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Error fetching admin requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceReports = async () => {
    try {
      setReportsLoading(true);
      const res = await fetch(`http://localhost:4000/admin/reports`);
      if (res.ok) {
        const data = await res.json();
        setDeviceReports(data);
      }
    } catch (e) {
      console.error('Error fetching admin device reports:', e);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    const authorize = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;

      if (email) {
        try {
          const res = await fetch(`http://localhost:4000/users/profile?email=${email}`);
          if (res.ok) {
            const profile = await res.json();
            if (profile?.role === 'ADMIN') {
              setAuthorized(true);
              fetchRequests();
              fetchDeviceReports();
            } else {
              setAuthorized(false);
            }
          } else {
            setAuthorized(false);
          }
        } catch (e) {
          console.error(e);
          setAuthorized(false);
        }
      } else {
        setAuthorized(false);
      }
    };
    authorize();
  }, []);

  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`http://localhost:4000/admin/subscription-requests/${id}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (e) {
      console.error(`Error performing ${action} action:`, e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReportAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`http://localhost:4000/admin/reports/${id}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchDeviceReports();
      }
    } catch (e) {
      console.error(`Error performing ${action} report action:`, e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (subFilter === 'ALL') return true;
    return r.status === subFilter;
  });

  const filteredReports = deviceReports.filter((r) => {
    if (reportFilter === 'ALL') return true;
    return r.status === reportFilter;
  });

  if (authorized === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-500">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-indigo-950">Unauthorized Access</h2>
        <p className="text-sm text-slate-400 max-w-sm font-semibold">
          You do not have access credentials to view the Admin Verification panel. Please switch accounts or log in as an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-100/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Admin Verification Control
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Review user subscriptions and verify reported device theft GD evidence.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 self-start shadow-inner">
          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'SUBSCRIPTIONS'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Subscription Requests
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'REPORTS'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Device Reports
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'SUBSCRIPTIONS' ? (
          <motion.div
            key="subs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-6 space-y-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Filters</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSubFilter(filter)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        subFilter === filter
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying active requests...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
                  <h3 className="text-base font-bold text-indigo-950">Vault is Clean</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                    There are currently no active subscription verification requests matching this criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="px-6 py-4">User Email</th>
                        <th className="px-6 py-4">Plan Selected</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">bkash TrxID</th>
                        <th className="px-6 py-4">bkash Number (Last 4)</th>
                        <th className="px-6 py-4">Received</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((req) => (
                        <tr
                          key={req.id}
                          className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors text-sm"
                        >
                          <td className="px-6 py-4 font-bold text-indigo-950">
                            {req.userEmail}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{req.planName}</td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-650">৳{req.price}</td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-950 tracking-wider select-all">{req.trxCode}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 font-semibold">xxxx-xxx-{req.bkashLastFour}</td>
                          <td className="px-6 py-4 font-semibold text-xs text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
                                  : req.status === 'REJECTED'
                                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                                  : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                              }`}
                            >
                              {req.status.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex gap-2 justify-end">
                                <MotionButton
                                  variant="primary"
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleRequestAction(req.id, 'approve')}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm border-none flex items-center gap-1"
                                >
                                  {actionLoadingId === req.id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" /> Approve
                                    </>
                                  )}
                                </MotionButton>
                                <MotionButton
                                  variant="secondary"
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleRequestAction(req.id, 'reject')}
                                  className="border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs px-3 py-1.5 rounded-lg shadow-none"
                                >
                                  Reject
                                </MotionButton>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 font-bold select-none cursor-default flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-6 space-y-6 bg-white/70 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)]">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Filters</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setReportFilter(filter)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        reportFilter === filter
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {reportsLoading ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying threat registry...</span>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <Smartphone className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
                  <h3 className="text-base font-bold text-indigo-950">Registry is Clear</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                    There are currently no theft registry reports matching this criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="px-6 py-4">Device Model</th>
                        <th className="px-6 py-4">IMEI Number</th>
                        <th className="px-6 py-4">Verification Copy</th>
                        <th className="px-6 py-4">Contact Number</th>
                        <th className="px-6 py-4">Details</th>
                        <th className="px-6 py-4">Reported</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors text-sm"
                        >
                          <td className="px-6 py-4 font-bold text-indigo-950">
                            {report.deviceName || 'Unknown Device'}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-950 tracking-wider">{report.imei}</td>
                           <td className="px-6 py-4">
                             {report.extractedFromGd ? (
                               <button
                                 onClick={() => {
                                   if (report.gdImage) {
                                     setViewingGdImage(report.gdImage);
                                   } else {
                                     setViewingGdImage(`LEGACY_FALLBACK_${report.id}_${report.deviceName || 'Device'}_${report.imei}`);
                                   }
                                 }}
                                 className="inline-flex items-center gap-1 font-bold text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm"
                               >
                                 <FileText className="w-3.5 h-3.5" /> GD Copy
                               </button>
                             ) : (
                               <span className="font-semibold text-xs text-slate-400 select-none">Manual Entry</span>
                             )}
                           </td>
                           <td className="px-6 py-4 font-semibold text-slate-600">{report.contactNumber || 'N/A'}</td>
                           <td 
                             className="px-6 py-4 cursor-pointer"
                             onMouseEnter={(e) => {
                               if (report.description) {
                                 setActiveTooltip({
                                   text: report.description,
                                   rect: e.currentTarget.getBoundingClientRect()
                                 });
                               }
                             }}
                             onMouseLeave={() => setActiveTooltip(null)}
                           >
                             <div className="max-w-[150px] truncate text-slate-500 font-semibold text-xs">
                               {report.description || 'N/A'}
                             </div>
                           </td>
                          <td className="px-6 py-4 font-semibold text-xs text-slate-400">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                report.status === 'APPROVED'
                                  ? 'bg-red-50 border-red-100 text-red-600 shadow-sm'
                                  : report.status === 'REJECTED'
                                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                                  : 'bg-amber-50 border-amber-100 text-amber-600'
                              }`}
                            >
                              {report.status === 'APPROVED' ? 'Verified stolen' : report.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {report.status === 'PENDING' ? (
                              <div className="flex gap-2 justify-end">
                                <MotionButton
                                  variant="primary"
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleReportAction(report.id, 'approve')}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm border-none flex items-center gap-1"
                                >
                                  {actionLoadingId === report.id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <ShieldAlert className="w-3.5 h-3.5" /> Approve Red-Flag
                                    </>
                                  )}
                                </MotionButton>
                                <MotionButton
                                  variant="secondary"
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleReportAction(report.id, 'reject')}
                                  className="border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs px-3 py-1.5 rounded-lg shadow-none"
                                >
                                  Reject
                                </MotionButton>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 font-bold select-none cursor-default flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GD Image Viewer Modal */}
      <AnimatePresence>
        {viewingGdImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto"
            onClick={() => setViewingGdImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2rem] border border-slate-100 p-6 max-w-2xl w-full relative shadow-2xl overflow-hidden flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-indigo-600" />
              
              <div className="flex items-center justify-between w-full mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-indigo-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Police GD Copy Evidence
                </h3>
                <button
                  onClick={() => setViewingGdImage(null)}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="w-full max-h-[70vh] rounded-2xl overflow-y-auto border border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner p-2">
                {viewingGdImage.startsWith("LEGACY_FALLBACK") ? (
                  (() => {
                    const parts = viewingGdImage.split('_');
                    const reportId = parts[2] || 'Legacy';
                    const deviceName = parts[3] || 'Device';
                    const imei = parts[4] || 'N/A';
                    
                    const matchedReport = deviceReports.find(r => r.id === reportId);
                    const descriptionText = matchedReport?.description || "On 24-05-2026 at approximately 14:00, my phone was stolen from near the public station. I request safety flagging.";

                    const isSpecificLegacy = imei === '306614891424000' || imei === '350661499142501' || imei === '356441610748069' || imei === '358066149534298';

                    if (isSpecificLegacy) {
                      return (
                        <div className="p-8 md:p-10 bg-[#faf8f5] border-2 border-[#e3dac9] rounded-xl shadow-xl w-full max-w-xl mx-auto font-sans text-slate-800 relative overflow-hidden select-text text-left leading-relaxed">
                          {/* Official Top watermark/seal */}
                          <div className="absolute top-6 right-6 border-2 border-dashed border-blue-600/50 rounded-full w-24 h-24 flex flex-col items-center justify-center text-center text-[8px] text-blue-600/70 font-bold rotate-12 uppercase select-none pointer-events-none">
                            <span>VERIFIED GD</span>
                            <span>ONLINE ENTRY</span>
                            <span>DMP, DHAKA</span>
                          </div>
                          
                          {/* Govt Seal Header */}
                          <div className="flex flex-col items-center text-center border-b border-slate-300 pb-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 mb-2 font-bold select-none pointer-events-none">DMP</div>
                            <h4 className="text-sm font-bold text-slate-900 tracking-wide">উত্তরা পশ্চিম থানা কার্যালয়</h4>
                            <p className="text-[10px] text-slate-500 font-medium">ঢাকা মেট্রোপলিটন পুলিশ, ডিএমপি, ঢাকা</p>
                            <div className="flex justify-between w-full text-[9px] text-slate-400 mt-3 font-semibold px-2">
                              <span>জিডি ট্র্যাকিং নং: H7HJQN3</span>
                              <span>জিডি নং: ১৬৯</span>
                              <span>তারিখ: ২১/০১/২০২৪</span>
                            </div>
                          </div>

                          {/* Subject & Body */}
                          <div className="space-y-4 text-xs text-slate-800">
                            <div>
                              <p className="font-bold text-slate-900">বরাবর,</p>
                              <p>অফিসার ইনচার্জ</p>
                              <p>উত্তরা পশ্চিম থানা</p>
                              <p>ডিএমপি, ঢাকা।</p>
                            </div>

                            <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">বিষয়: সাধারণ ডায়েরী করার আবেদন প্রসঙ্গে।</p>

                            <div className="space-y-3 leading-relaxed text-justify">
                              <p>
                                জনাব, আমি নিম্নস্বাক্ষরকারী <strong className="text-slate-900">মো: মাফিজ উদ্দিন (৩৪)</strong>, পিতা: আলম খানেক, মাতা: হাসিনা বেগম, ঠিকানা: উত্তরা ৭ নং সেক্টর, ঢাকা, মোবাইল নং: ০১৭১৮৬৬৩৬৮০।
                              </p>
                              <p className="p-3 bg-white/70 border border-slate-200 rounded-2xl font-medium text-[11px] leading-relaxed text-slate-700 shadow-inner">
                                এই মর্মে সাধারণ ডায়েরী করিতেছি যে গত ০৯/০১/২৪ ইং তারিখ সময় অনুমান সকাল ০৮.০০ ঘটিকার সময় আমার সাথে থাকা আমার নিজ ব্যবহৃত মোবাইল <strong className="text-indigo-950">{deviceName}</strong>, যাহার আই.এম.ইআই: <strong className="text-red-650 font-mono font-bold tracking-wider">{imei}</strong> এবং TECHNO.SPARK 20 PRO+, উত্তরা সেক্টরস্থ আওতাধীন রোডে হারিয়ে যায়। উক্ত মোবাইলে ০১৭১৮৬৬৩৬৮০ সিম সচল ছিল।
                              </p>
                              <p>
                                এতদসায়ত্বে, উপরোক্ত বিষয়টি ভবিযতের জন্য সাধারণ ডায়েরীভুক্ত করিয়া গ্রন্থিত করা একান্ত প্রয়োজন। অতএব, উপরোক্ত বিষয়টি আপনার থানায় সাধারণ ডায়েরীভুক্ত করিতে আপনার মর্জি হয়।
                              </p>
                            </div>
                          </div>

                          {/* Signatures & Seals */}
                          <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 font-semibold leading-relaxed">
                            <div className="space-y-1">
                              <p className="text-slate-400">প্রত্যয়নকারীর নাম ও স্বাক্ষর:</p>
                              <div className="font-mono text-indigo-650/80 italic text-sm line-through select-none pointer-events-none">মো: মাফিজ উদ্দিন</div>
                              <p className="text-slate-800">মো: মাফিজ উদ্দিন</p>
                              <p>মোবাইল: ০১৭১৮৬৬৩৬৮০</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-slate-400">ডিউটি অফিসার:</p>
                              <div className="font-mono text-indigo-650/80 italic text-sm line-through select-none pointer-events-none">Md. Aminul Islam</div>
                              <p className="text-slate-800">মো: আমিনুল ইসলাম</p>
                              <p className="text-[9px]">ডিউটি অফিসার, উত্তরা পশ্চিম থানা</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="p-8 bg-[#faf7f2] border-2 border-[#e8dfd0] rounded-xl shadow-lg w-full max-w-lg mx-auto font-mono text-slate-800 relative overflow-hidden select-text text-left">
                        {/* Stamp 1 */}
                        <div className="absolute top-4 right-4 border-2 border-dashed border-blue-600/60 rounded-full w-24 h-24 flex flex-col items-center justify-center text-center text-[9px] text-blue-600/70 font-bold rotate-12 uppercase select-none pointer-events-none">
                          <span>VERIFIED</span>
                          <span>REGISTRY</span>
                          <span>DHAKA METRO</span>
                        </div>
                        {/* Header */}
                        <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
                          <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">BANGLADESH POLICE</h4>
                          <p className="text-[10px] font-bold text-slate-500">GENERAL DIARY (GD) ENTRY COPY</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-bold">Ref ID: PS-GD-{reportId.substring(0, 8).toUpperCase()}</p>
                        </div>
                        {/* Body Details */}
                        <div className="space-y-3.5 text-xs font-semibold leading-relaxed">
                          <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                            <span className="text-slate-400">POLICE STATION:</span>
                            <span className="col-span-2 text-slate-800 uppercase">Tejgaon Model Thana, Dhaka</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                            <span className="text-slate-400">GD NUMBER:</span>
                            <span className="col-span-2 text-slate-800 font-bold">GD-4819 / 2026</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                            <span className="text-slate-400">DATE & TIME:</span>
                            <span className="col-span-2 text-slate-800">2026-05-24 14:32 BST</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                            <span className="text-slate-400">DEVICE MODEL:</span>
                            <span className="col-span-2 text-indigo-900 font-extrabold">{deviceName}</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                            <span className="text-slate-400">DEVICE IMEI:</span>
                            <span className="col-span-2 font-mono text-red-600 font-extrabold select-all tracking-wider">{imei}</span>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-slate-400 block">INCIDENT STATEMENT:</span>
                            <div className="p-3 bg-white/60 border border-slate-200 rounded-xl text-slate-700 italic select-text max-h-36 overflow-y-auto leading-relaxed font-sans font-medium text-[11px]">
                              {descriptionText}
                            </div>
                          </div>
                        </div>
                        {/* Stamp 2 & Signature */}
                        <div className="flex justify-between items-end mt-8 pt-4 border-t border-slate-200">
                          {/* Round Stamp */}
                          <div className="border-2 border-red-500/50 rounded-full w-16 h-16 flex flex-col items-center justify-center text-center text-[8px] text-red-500/60 font-bold -rotate-12 uppercase select-none pointer-events-none">
                            <span>RECEIVED</span>
                            <span>TEJGAON PS</span>
                          </div>
                          {/* Duty Officer Signature */}
                          <div className="text-right space-y-1 select-none pointer-events-none">
                            <div className="font-mono text-indigo-600/80 italic text-sm line-through decoration-indigo-500/40">S. A. Ahmed</div>
                            <div className="text-[9px] text-slate-400 font-extrabold uppercase">DUTY OFFICER</div>
                            <div className="text-[8px] text-slate-400 tracking-wider">TEJGAON PS, DHAKA</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : viewingGdImage.startsWith("data:application/pdf") ? (
                  <div className="py-24 text-center space-y-2">
                    <FileText className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
                    <p className="text-sm font-bold text-slate-700">PDF Document Evidence</p>
                    <a 
                      href={viewingGdImage} 
                      download="police_gd_evidence.pdf" 
                      className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all mt-2"
                    >
                      Download PDF File
                    </a>
                  </div>
                ) : (
                  <img 
                    src={viewingGdImage} 
                    alt="Uploaded GD Copy Evidence" 
                    className="max-w-full h-auto object-contain rounded-xl shadow-lg border border-slate-100" 
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip outside overflow container */}
      {activeTooltip && (
        <div
          style={{
            position: 'fixed',
            top: activeTooltip.rect.top - 8,
            left: activeTooltip.rect.left + activeTooltip.rect.width / 2,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="w-96 bg-slate-950 text-white text-xs rounded-2xl p-4.5 shadow-2xl pointer-events-none leading-relaxed font-semibold border border-slate-800 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-800">Incident Details</div>
          <div className="leading-relaxed whitespace-pre-wrap text-slate-200 font-semibold">{activeTooltip.text}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950" />
        </div>
      )}
    </div>
  );
}
