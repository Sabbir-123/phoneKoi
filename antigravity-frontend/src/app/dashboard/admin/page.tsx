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
            Device Theft Reports
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'SUBSCRIPTIONS' ? (
          <motion.div
            key="subscriptions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Subscription Table Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Requests</span>
                <div className="flex border border-slate-100 bg-white rounded-xl p-1 shadow-sm">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSubFilter(status)}
                      className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg transition-all ${
                        subFilter === status
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchRequests}
                className="w-9 h-9 border border-slate-100 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            {/* Subscriptions Card Table */}
            <GlassCard className="bg-white/80 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] overflow-hidden">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading requests...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-indigo-950">No requests found</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                    There are currently no transaction requests matching this criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="px-6 py-4">User Email</th>
                        <th className="px-6 py-4">Requested Plan</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">bKash TrxID</th>
                        <th className="px-6 py-4">Last 4 Digits</th>
                        <th className="px-6 py-4">Submitted</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors text-sm"
                        >
                          <td className="px-6 py-4 font-bold text-indigo-950">{request.userEmail}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {request.planName}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-700">৳{request.price}</td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-950">{request.trxCode}</td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-950">{request.bkashLastFour}</td>
                          <td className="px-6 py-4 font-semibold text-xs text-slate-400">
                            {new Date(request.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                request.status === 'APPROVED'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                  : request.status === 'REJECTED'
                                  ? 'bg-red-50 border-red-100 text-red-600'
                                  : 'bg-amber-50 border-amber-100 text-amber-600'
                              }`}
                            >
                                {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {request.status === 'PENDING' ? (
                              <div className="flex gap-2 justify-end">
                                <MotionButton
                                  variant="primary"
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleRequestAction(request.id, 'approve')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm border-none flex items-center gap-1.5"
                                >
                                  {actionLoadingId === request.id ? (
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
                                  onClick={() => handleRequestAction(request.id, 'reject')}
                                  className="border-red-100 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs px-3 py-1.5 rounded-lg shadow-none flex items-center gap-1"
                                >
                                  Reject
                                </MotionButton>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 font-bold select-none cursor-default">Verified</span>
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
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Reports Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Reports</span>
                <div className="flex border border-slate-100 bg-white rounded-xl p-1 shadow-sm">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setReportFilter(status)}
                      className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg transition-all ${
                        reportFilter === status
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchDeviceReports}
                className="w-9 h-9 border border-slate-100 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${reportsLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            {/* Reports Card Table */}
            <GlassCard className="bg-white/80 border border-slate-100 shadow-[0_4px_20px_rgba(99,102,241,0.02)] overflow-hidden">
              {reportsLoading ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading device reports...</span>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-indigo-950">No device reports found</h3>
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
                              <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                <FileText className="w-3 h-3" /> Police GD Copy
                              </span>
                            ) : (
                              <span className="font-semibold text-xs text-slate-400">Manual Entry</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{report.contactNumber || 'N/A'}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate text-slate-500 font-semibold text-xs" title={report.description || ''}>
                            {report.description || 'N/A'}
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
    </div>
  );
}
