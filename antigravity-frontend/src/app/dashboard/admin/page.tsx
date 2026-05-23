'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MotionButton } from '@/components/ui/MotionButton';
import { ShieldCheck, UserCheck, Search, Filter, RefreshCw, XCircle, Clock } from 'lucide-react';
import { auth } from '@/utils/firebase/client';
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

export default function AdminDashboard() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = async (email: string) => {
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

  useEffect(() => {
    const authorize = async () => {
      const firebaseUser = auth.currentUser;
      let email = firebaseUser?.email;
      if (!email) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        email = session?.user?.email;
      }

      if (email) {
        try {
          const res = await fetch(`http://localhost:4000/users/profile?email=${email}`);
          if (res.ok) {
            const profile = await res.json();
            if (profile?.role === 'ADMIN') {
              setAuthorized(true);
              fetchRequests(email);
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
        // Refresh requests
        const firebaseUser = auth.currentUser;
        let email = firebaseUser?.email || '';
        if (!email) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          email = session?.user?.email || '';
        }
        await fetchRequests(email);
      }
    } catch (e) {
      console.error(`Error performing ${action} action:`, e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Admin Verification Control
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Verify bKash transaction codes and activate Pro subscriptions for users.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex border border-slate-100 bg-white rounded-xl p-1 shadow-sm">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg transition-all ${
                  filter === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const firebaseUser = auth.currentUser;
              fetchRequests(firebaseUser?.email || '');
            }}
            className="w-9 h-9 border border-slate-100 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Requests Content */}
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
              There are currently no transaction requests matching this criteria in the safety registry.
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
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
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
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
