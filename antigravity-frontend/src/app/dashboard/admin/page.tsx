'use client';
import { API_URL, authFetch } from '@/utils/api';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  XCircle, 
  Clock, 
  Smartphone, 
  ShieldAlert, 
  AlertTriangle, 
  FileText, 
  Check,
  Send,
  Mail,
  MessageSquare,
  PhoneCall,
  Bot,
  Save,
  Sparkles,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useDashboardStore } from '@/store/useDashboardStore';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';

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

interface GatewaySettings {
  telegram: {
    enabled: boolean;
    botToken: string;
    botUsername: string;
    adminChatId?: string;
  };
  email: {
    enabled: boolean;
    provider: 'RESEND' | 'EMAILJS' | 'SMTP';
    resendApiKey?: string;
    fromEmail?: string;
  };
  whatsapp: {
    enabled: boolean;
    provider: 'ULTRAMSG' | 'GREENAPI' | 'TWILIO' | 'META';
    instanceId?: string;
    token?: string;
    senderNumber?: string;
  };
  sms: {
    enabled: boolean;
    provider: 'GREENWEB' | 'SSL_WIRELESS' | 'BULKSMS_BD' | 'TWILIO';
    apiKey?: string;
    senderId?: string;
    clientSecret?: string;
  };
}

export default function AdminDashboard() {
  const { profile, fetchProfile } = useDashboardStore();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [deviceReports, setDeviceReports] = useState<DeviceReport[]>([]);
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'REPORTS' | 'GATEWAYS'>('SUBSCRIPTIONS');
  
  const [subFilter, setSubFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [reportFilter, setReportFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  
  const [gateways, setGateways] = useState<GatewaySettings>({
    telegram: { enabled: false, botToken: '', botUsername: 'PhoneKoiAlertBot', adminChatId: '' },
    email: { enabled: false, provider: 'RESEND', resendApiKey: '', fromEmail: 'PhoneKoi Alerts <onboarding@resend.dev>' },
    whatsapp: { enabled: false, provider: 'ULTRAMSG', instanceId: '', token: '', senderNumber: '' },
    sms: { enabled: false, provider: 'GREENWEB', apiKey: '', senderId: '', clientSecret: '' },
  });
  const [gatewaysLoading, setGatewaysLoading] = useState(false);
  const [gatewaysSaving, setGatewaysSaving] = useState(false);
  const [gatewaysSuccessMsg, setGatewaysSuccessMsg] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; message: string; isError?: boolean } | null>(null);
  const [testInputs, setTestInputs] = useState({
    telegramChatId: '',
    emailAddress: '',
    whatsappNumber: '',
    smsNumber: '',
  });

  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [viewingGdImage, setViewingGdImage] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    text: string;
    rect: DOMRect;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${API_URL}/admin/subscription-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Error fetching admin requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeviceReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const res = await authFetch(`${API_URL}/admin/reports`);
      if (res.ok) {
        const data = await res.json();
        setDeviceReports(data);
      }
    } catch (e) {
      console.error('Error fetching admin device reports:', e);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setReportsLoading(true);
      const [subRes, repRes] = await Promise.all([
        authFetch(`${API_URL}/admin/subscription-requests`),
        authFetch(`${API_URL}/admin/reports`),
      ]);
      if (subRes.ok) {
        setRequests(await subRes.json());
      }
      if (repRes.ok) {
        setDeviceReports(await repRes.json());
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
      setReportsLoading(false);
    }
  }, []);

  const fetchGateways = useCallback(async () => {
    try {
      setGatewaysLoading(true);
      const res = await authFetch(`${API_URL}/admin/settings/gateways`);
      if (res.ok) {
        const data = await res.json();
        setGateways(data);
      }
    } catch (e) {
      console.error('Error fetching gateways:', e);
    } finally {
      setGatewaysLoading(false);
    }
  }, []);

  const handleSaveGateways = async () => {
    try {
      setGatewaysSaving(true);
      setGatewaysSuccessMsg(null);
      const res = await authFetch(`${API_URL}/admin/settings/gateways`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateways),
      });
      if (res.ok) {
        const updated = await res.json();
        setGateways(updated);
        setGatewaysSuccessMsg('Notification Gateways successfully saved and updated!');
        setTimeout(() => setGatewaysSuccessMsg(null), 5000);
      } else {
        alert('Failed to save gateway settings');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving gateway settings');
    } finally {
      setGatewaysSaving(false);
    }
  };

  const handleTestChannel = async (channel: 'TELEGRAM' | 'EMAIL' | 'WHATSAPP' | 'SMS', recipient: string) => {
    if (!recipient.trim()) {
      alert('Please enter a recipient target to send the test alert.');
      return;
    }
    try {
      setTestingChannel(channel);
      setTestResult(null);
      const res = await authFetch(`${API_URL}/admin/settings/gateways/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          recipient: recipient.trim(),
          configOverride: gateways,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ channel, message: data.message });
      } else {
        setTestResult({ channel, message: data?.message || 'Test delivery failed', isError: true });
      }
    } catch (e: any) {
      setTestResult({ channel, message: e?.message || 'Network error during test', isError: true });
    } finally {
      setTestingChannel(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Fast path: check current store profile
      if (profile) {
        if (profile.role === 'ADMIN') {
          setAuthorized(true);
          loadAllData();
          return;
        } else {
          setAuthorized(false);
          setLoading(false);
          setReportsLoading(false);
          return;
        }
      }

      // 2. Fetch profile from store or server
      const p = await fetchProfile();
      if (p?.role === 'ADMIN') {
        setAuthorized(true);
        loadAllData();
      } else {
        setAuthorized(false);
        setLoading(false);
        setReportsLoading(false);
      }
    };
    init();
  }, [profile, fetchProfile, loadAllData]);

  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoadingId(id);
    try {
      const res = await authFetch(`${API_URL}/admin/subscription-requests/${id}/${action}`, {
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
      const res = await authFetch(`${API_URL}/admin/reports/${id}/${action}`, {
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
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 self-start shadow-inner flex-wrap gap-1">
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
          <button
            onClick={() => { setActiveTab('GATEWAYS'); fetchGateways(); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'GATEWAYS'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            Alert Gateways
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
                <InteractiveLoader
                  title="Querying Active Subscription Vault"
                  subtitle="Verifying payment tokens & synchronizing transaction signatures with Supabase"
                  skeletonType="table"
                  onRefresh={fetchRequests}
                  stages={[
                    'Connecting to Supabase PostgreSQL ledger...',
                    'Fetching pending subscription verification logs...',
                    'Validating bKash payment signatures...',
                    'Aggregating user quota entitlements...',
                  ]}
                />
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
                <InteractiveLoader
                  title="Scanning Real-Time Device Risk Vault"
                  subtitle="Verifying GD citations, police jurisdiction registries, and IMEI threat weights"
                  skeletonType="table"
                  onRefresh={fetchDeviceReports}
                  stages={[
                    'Scanning Supabase device incident tables...',
                    'Verifying Police GD documentation hashes...',
                    'Cross-referencing IMEI blacklist telemetry...',
                    'Generating admin authorization digest...',
                  ]}
                />
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

        {activeTab === 'GATEWAYS' && (
          <motion.div
            key="gateways"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Gateways Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Alert Gateways & Telemetry Dispatchers</h2>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    Live Triggers
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Configure multi-channel security dispatchers. When an IMEI reported as stolen is searched in PhoneKoi, these enabled gateways will immediately notify the device owner.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchGateways}
                  disabled={gatewaysLoading}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Reload settings"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gatewaysLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <MotionButton
                  onClick={handleSaveGateways}
                  disabled={gatewaysSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                >
                  {gatewaysSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save All Changes
                </MotionButton>
              </div>
            </div>

            {/* Notification Banner */}
            {gatewaysSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {gatewaysSuccessMsg}
              </motion.div>
            )}

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm ${
                  testResult.isError
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.isError ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                  <span>
                    <strong>[{testResult.channel}]</strong> {testResult.message}
                  </span>
                </div>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* 4 Gateway Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 1. Telegram Bot Card */}
              <GlassCard className="p-6 space-y-5 rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm">
                      <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">Telegram Bot Alert</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          100% Free
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Instant push alerts via Telegram Bot (Unlimited & Zero Cost)</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.telegram.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          telegram: { ...gateways.telegram, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Telegram Bot Token
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={gateways.telegram.botToken}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          telegram: { ...gateways.telegram, botToken: e.target.value },
                        })
                      }
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Obtain from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-600 underline">@BotFather</a> on Telegram in 30 seconds.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Bot Username
                      </label>
                      <input
                        type="text"
                        placeholder="@PhoneKoiAlertBot"
                        value={gateways.telegram.botUsername}
                        onChange={(e) =>
                          setGateways({
                            ...gateways,
                            telegram: { ...gateways.telegram, botUsername: e.target.value },
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Admin Broadcast Chat ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. -100123456789 or user ID"
                        value={gateways.telegram.adminChatId || ''}
                        onChange={(e) =>
                          setGateways({
                            ...gateways,
                            telegram: { ...gateways.telegram, adminChatId: e.target.value },
                          })
                        }
                        className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-sky-50/80 border border-sky-200/60 text-[10px] text-sky-800 leading-relaxed flex items-center justify-between gap-2">
                    <span>
                      💬 <strong>First-Time Requirement:</strong> Open{' '}
                      <a
                        href={`https://t.me/${gateways.telegram.botUsername || 'PhoneKoiAlertBot'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline"
                      >
                        @{gateways.telegram.botUsername || 'PhoneKoiAlertBot'}
                      </a>{' '}
                      and click <strong>Start (/start)</strong> so Telegram gives the bot permission to message you.
                    </span>
                    <a
                      href={`https://t.me/${gateways.telegram.botUsername || 'PhoneKoiAlertBot'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-sky-600 text-white font-bold text-[9px] shrink-0 hover:bg-sky-700"
                    >
                      Open Bot ↗
                    </a>
                  </div>
                </div>

                {/* Test Channel Form */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter Chat ID to test..."
                    value={testInputs.telegramChatId}
                    onChange={(e) => setTestInputs({ ...testInputs, telegramChatId: e.target.value })}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    onClick={() => handleTestChannel('TELEGRAM', testInputs.telegramChatId || gateways.telegram.adminChatId || '')}
                    disabled={testingChannel === 'TELEGRAM'}
                    className="px-3 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    {testingChannel === 'TELEGRAM' ? (
                      <div className="w-3 h-3 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Test Alert
                  </button>
                </div>
              </GlassCard>

              {/* 2. Resend Email Gateway Card */}
              <GlassCard className="p-6 space-y-5 rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">Email Gateway (Resend)</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                          3,000 Free / Mo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Delivers HTML security alerts directly to the device owner's email</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.email.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          email: { ...gateways.email, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Resend API Key
                    </label>
                    <input
                      type="text"
                      placeholder="re_123456789_abcdef..."
                      value={gateways.email.resendApiKey || ''}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          email: { ...gateways.email, resendApiKey: e.target.value },
                        })
                      }
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Free developer account at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">resend.com</a> (100 emails/day completely free).
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        From / Sender Address
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setGateways({
                            ...gateways,
                            email: { ...gateways.email, fromEmail: 'PhoneKoi Alerts <onboarding@resend.dev>' },
                          })
                        }
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Use Test Address (onboarding@resend.dev)
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="PhoneKoi Alerts <onboarding@resend.dev>"
                      value={gateways.email.fromEmail || ''}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          email: { ...gateways.email, fromEmail: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-800 leading-relaxed">
                      ⚠️ <strong>Domain Notice:</strong> Resend rejects <code>alerts@phonekoi.com</code> until the domain is verified at <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="underline font-bold">resend.com/domains</a>. For instant testing, use <code>PhoneKoi Alerts &lt;onboarding@resend.dev&gt;</code> and send to your Resend account email.
                    </div>
                  </div>
                </div>

                {/* Test Channel Form */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter email to test alert..."
                    value={testInputs.emailAddress}
                    onChange={(e) => setTestInputs({ ...testInputs, emailAddress: e.target.value })}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleTestChannel('EMAIL', testInputs.emailAddress)}
                    disabled={testingChannel === 'EMAIL'}
                    className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    {testingChannel === 'EMAIL' ? (
                      <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    Test Email
                  </button>
                </div>
              </GlassCard>

              {/* 3. WhatsApp Gateway Card */}
              <GlassCard className="p-6 space-y-5 rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">WhatsApp Alert Gateway</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {gateways.whatsapp.enabled ? 'Active' : 'Standby'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Automated WhatsApp messages sent to device owner upon search</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.whatsapp.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          whatsapp: { ...gateways.whatsapp, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Provider
                      </label>
                      <select
                        value={gateways.whatsapp.provider}
                        onChange={(e) =>
                          setGateways({
                            ...gateways,
                            whatsapp: { ...gateways.whatsapp, provider: e.target.value as any },
                          })
                        }
                        className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                      >
                        <option value="ULTRAMSG">UltraMsg (Instance API)</option>
                        <option value="GREENAPI">Green API</option>
                        <option value="TWILIO">Twilio WhatsApp</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Instance ID / Account SID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. instance12345"
                        value={gateways.whatsapp.instanceId || ''}
                        onChange={(e) =>
                          setGateways({
                            ...gateways,
                            whatsapp: { ...gateways.whatsapp, instanceId: e.target.value },
                          })
                        }
                        className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Token / API Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. token_secret_key"
                      value={gateways.whatsapp.token || ''}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          whatsapp: { ...gateways.whatsapp, token: e.target.value },
                        })
                      }
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Test Channel Form */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter phone to test (e.g. 017xxxxxxxx)..."
                    value={testInputs.whatsappNumber}
                    onChange={(e) => setTestInputs({ ...testInputs, whatsappNumber: e.target.value })}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleTestChannel('WHATSAPP', testInputs.whatsappNumber)}
                    disabled={testingChannel === 'WHATSAPP'}
                    className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    {testingChannel === 'WHATSAPP' ? (
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MessageSquare className="w-3 h-3" />
                    )}
                    Test WhatsApp
                  </button>
                </div>
              </GlassCard>

              {/* 4. Emergency SMS Gateway Card */}
              <GlassCard className="p-6 space-y-5 rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">Emergency SMS Gateway</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {gateways.sms.enabled ? 'Active' : 'Standby'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">BD Telco masking SMS alerts to owner upon unauthorized detection</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.sms.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          sms: { ...gateways.sms, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        SMS Provider
                      </label>
                      <select
                        value={gateways.sms.provider}
                        onChange={(e) =>
                          setGateways({
                            ...gateways,
                            sms: { ...gateways.sms, provider: e.target.value as any },
                          })
                        }
                        className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                      >
                        <option value="GREENWEB">Greenweb BD</option>
                        <option value="BULKSMS_BD">BulkSMS BD</option>
                        <option value="SSL_WIRELESS">SSL Wireless</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Sender ID / Masking
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PhoneKoi or Non-Masking"
                        value={gateways.sms.senderId || ''}
                        onChange={(e) =>
                          setGateways({
                            ...gateways,
                            sms: { ...gateways.sms, senderId: e.target.value },
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      API Key / Secret Token
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. gw_token_key..."
                      value={gateways.sms.apiKey || ''}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          sms: { ...gateways.sms, apiKey: e.target.value },
                        })
                      }
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Test Channel Form */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter BD phone (e.g. 018xxxxxxxx)..."
                    value={testInputs.smsNumber}
                    onChange={(e) => setTestInputs({ ...testInputs, smsNumber: e.target.value })}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={() => handleTestChannel('SMS', testInputs.smsNumber)}
                    disabled={testingChannel === 'SMS'}
                    className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    {testingChannel === 'SMS' ? (
                      <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PhoneCall className="w-3 h-3" />
                    )}
                    Test SMS
                  </button>
                </div>
              </GlassCard>

            </div>
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
                ) : viewingGdImage.startsWith("data:application/pdf;base64,") ? (
                  <div className="py-24 text-center space-y-2">
                    <FileText className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
                    <p className="text-sm font-bold text-slate-700">PDF Document Evidence</p>
                    <a 
                      href={viewingGdImage} 
                      download="police_gd_evidence.pdf" 
                      rel="noopener noreferrer"
                      className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all mt-2"
                    >
                      Download PDF File
                    </a>
                  </div>
                ) : viewingGdImage.startsWith("data:image/jpeg;base64,") ||
                    viewingGdImage.startsWith("data:image/png;base64,") ||
                    viewingGdImage.startsWith("data:image/webp;base64,") ? (
                  <img 
                    src={viewingGdImage} 
                    alt="Uploaded GD Copy Evidence" 
                    className="max-w-full h-auto object-contain rounded-xl shadow-lg border border-slate-100" 
                  />
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">Unsupported or Untrusted Evidence File</p>
                    <p className="text-xs text-slate-400">The uploaded file format does not match verified image or PDF specifications.</p>
                  </div>
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
