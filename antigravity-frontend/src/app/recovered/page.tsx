"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Phone,
  FileText,
  Building,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { API_URL } from "@/utils/api";
import Link from "next/link";

interface DriveSummary {
  id: string;
  title: string;
  agency: string;
  policeStation?: string;
  caseNumber?: string;
  officerName?: string;
  officerContact?: string;
  mediaContact?: string;
  claimInstructions?: string;
  sourceUrl?: string;
  driveDate: string;
  deviceCount: number;
}

interface RecoveredSearchResult {
  found: boolean;
  message?: string;
  device?: {
    id: string;
    brand?: string;
    model?: string;
    imei1?: string;
    imei2?: string;
    status: string;
  };
  drive?: DriveSummary;
}

export default function RecoveredPhonesPortal() {
  const [searchImei, setSearchImei] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<RecoveredSearchResult | null>(null);
  const [drives, setDrives] = useState<DriveSummary[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState("");

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setDrivesLoading(true);
      const res = await fetch(`${API_URL}/police-recovery/drives?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setDrives(data.drives || []);
      }
    } catch (e) {
      console.error("Failed to fetch recovery drives", e);
    } finally {
      setDrivesLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchImei.replace(/\D/g, "");
    if (clean.length < 14) return;

    try {
      setSearching(true);
      setSearchResult(null);
      const res = await fetch(`${API_URL}/police-recovery/search?imei=${clean}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchResult({ found: false, message: "সার্ভার থেকে তথ্য পাওয়া যায়নি।" });
      }
    } catch (e) {
      setSearchResult({ found: false, message: "সার্চ করতে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।" });
    } finally {
      setSearching(false);
    }
  };

  const openDriveModal = async (id: string) => {
    try {
      setModalLoading(true);
      setSelectedDrive(null);
      const res = await fetch(`${API_URL}/police-recovery/drives/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDrive(data);
      }
    } catch (e) {
      console.error("Failed to load drive details", e);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 max-w-6xl mx-auto flex flex-col items-center">
      {/* Background Orbs */}
      <div className="orb w-[500px] h-[500px] bg-emerald-200/50 top-20 right-10 -z-10" />
      <div className="orb w-[400px] h-[400px] bg-cyan-200/40 bottom-20 left-10 -z-10" />

      {/* Header Badge & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-10 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          বাংলাদেশ পুলিশ উদ্ধারকৃত হ্যান্ডসেট রেজিস্ট্রি
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-950 tracking-tight leading-tight">
          পুলিশের উদ্ধারকৃত ফোনে <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
            আপনার ফোনটি আছে কি না খুঁজুন
          </span>
        </h1>

        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          ডিবি (DB Cyber), সিআইডি, র‍্যাব ও ঢাকা মেট্রোপলিটন পুলিশ (DMP) সহ দেশের বিভিন্ন থানার বিশেষ অভিযানে উদ্ধারকৃত শত শত মোবাইল ফোনের আইএমইআই নম্বর সহজেই মিলিয়ে দেখুন।
        </p>
      </motion.div>

      {/* Hero Search Box */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-4 md:p-6 shadow-xl shadow-emerald-950/5 mb-12"
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ডিভাইসের ১৫ সংখ্যার IMEI নম্বর লিখুন
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {searchImei.length}/15 digits
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex-1">
              <input
                type="text"
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="যেমন: 355235048744323"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-4 py-3.5 text-lg font-mono tracking-widest text-indigo-950 placeholder:text-slate-300 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={searching || searchImei.length < 14}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  অনুসন্ধান হচ্ছে...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  অনুসন্ধান করুন
                </>
              )}
            </button>
          </div>
        </div>
      </motion.form>

      {/* Search Result Display */}
      <AnimatePresence>
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-2xl mb-14"
          >
            {searchResult.found && searchResult.drive ? (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-500/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-48 h-48 text-emerald-400" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                      সফল শনাক্তকরণ (FOUND IN POLICE CUSTODY)
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      🎉 আপনার ফোনটি পুলিশ হেফাজতে রয়েছে!
                    </h3>
                  </div>
                </div>

                {/* Device Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div>
                    <span className="text-xs text-slate-400">ডিভাইস মডেল</span>
                    <p className="font-bold text-slate-100 text-base">
                      {searchResult.device?.brand || ""} {searchResult.device?.model || "হ্যান্ডসেট"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">আইএমইআই (IMEI)</span>
                    <p className="font-mono font-semibold text-emerald-400 text-sm">
                      {searchResult.device?.imei1 || searchResult.device?.imei2}
                    </p>
                  </div>
                </div>

                {/* Recovery Drive Details */}
                <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <Building className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>সংস্থা / থানা:</strong> {searchResult.drive.agency}{" "}
                      {searchResult.drive.policeStation ? `(${searchResult.drive.policeStation})` : ""}
                    </span>
                  </div>

                  {searchResult.drive.caseNumber && (
                    <div className="flex items-start gap-2.5 text-slate-300">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>জিডি / মামলা নম্বর:</strong> {searchResult.drive.caseNumber}
                      </span>
                    </div>
                  )}

                  {searchResult.drive.officerName && (
                    <div className="flex items-start gap-2.5 text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>তদন্তকারী কর্মকর্তা:</strong> {searchResult.drive.officerName}
                      </span>
                    </div>
                  )}

                  {searchResult.drive.officerContact && (
                    <div className="flex items-center gap-2.5 text-emerald-300 pt-1">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold">যোগাযোগ নম্বর:</span>
                      <a
                        href={`tel:${searchResult.drive.officerContact}`}
                        className="font-mono font-bold underline bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30"
                      >
                        {searchResult.drive.officerContact}
                      </a>
                    </div>
                  )}
                </div>

                {/* Claim Instructions */}
                <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> ফোন ফেরত পাওয়ার আইনি নির্দেশিকা
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {searchResult.drive.claimInstructions ||
                      "আপনার মোবাইলের প্রকৃত ক্রয় রশিদ (Cash Memo), মূল বক্স ও জাতীয় পরিচয়পত্র (NID) এবং পূর্বের জিডির কপি নিয়ে সংশ্লিষ্ট কর্মকর্তা বা বিজ্ঞ আদালতে জিম্মার আবেদন করুন। আদালতের অনুমোদনক্রমে বৈধ মালিক হিসেবে ফোনটি আপনাকে হস্তান্তর করা হবে।"}
                  </p>
                </div>

                {searchResult.drive.sourceUrl && (
                  <div className="mt-5 text-right">
                    <a
                      href={searchResult.drive.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 underline font-medium"
                    >
                      পুলিশের মূল প্রেস বিজ্ঞপ্তি দেখুন <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    এই মুহূর্তে উদ্ধারকৃত তালিকায় পাওয়া যায়নি
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    আপনার প্রদত্ত IMEI নম্বরটি সাম্প্রতিক পুলিশ প্রেস বিজ্ঞপ্তির তালিকায় এখনো অন্তর্ভুক্ত হয়নি।
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/report"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    PhoneKoi-তে চুরির রিপোর্ট বা জিডি এন্ট্রি করুন <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery Drives Grid Header */}
      <div className="w-full flex items-center justify-between mb-6 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-950 flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-600" />
            সাম্প্রতিক পুলিশ উদ্ধার অভিযানসমূহ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            আইনশৃঙ্খলা বাহিনী কর্তৃক প্রকাশিত প্রেস রিলিজ ও মোবাইল উদ্ধারের বিজ্ঞপ্তি তালিকা
          </p>
        </div>
      </div>

      {/* Drives List */}
      {drivesLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">উদ্ধার অভিযানসমূহ লোড হচ্ছে...</span>
        </div>
      ) : drives.length === 0 ? (
        <div className="w-full py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 text-slate-400">
          <p className="text-sm font-medium">বর্তমানে কোনো প্রকাশিত উদ্ধার ড্রাইভ নেই।</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {drives.map((drive) => (
            <motion.div
              key={drive.id}
              whileHover={{ y: -3 }}
              className="bg-white/80 backdrop-blur-md border border-slate-200/70 hover:border-emerald-300 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-950/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {drive.deviceCount} টি উদ্ধারকৃত ডিভাইস
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(drive.driveDate).toLocaleDateString("bn-BD")}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-indigo-950 line-clamp-2 leading-snug">
                  {drive.title}
                </h3>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    <strong>সংস্থা:</strong> {drive.agency}
                  </p>
                  {drive.policeStation && (
                    <p>
                      <strong>থানা:</strong> {drive.policeStation}
                    </p>
                  )}
                  {drive.officerName && (
                    <p>
                      <strong>তদন্ত কর্মকর্তা:</strong> {drive.officerName}{" "}
                      {drive.officerContact ? `(${drive.officerContact})` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                {drive.sourceUrl ? (
                  <a
                    href={drive.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                  >
                    মূল বিজ্ঞপ্তি <ExternalLink className="w-3 h-3" />
                  </a>
                ) : <span />}

                <button
                  onClick={() => openDriveModal(drive.id)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-emerald-600 hover:text-white text-indigo-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  ডিভাইস তালিকা দেখুন <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Drive Detail Modal with full devices table */}
      <AnimatePresence>
        {selectedDrive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedDrive.devices?.length || 0} টি ডিভাইস উদ্ধার
                    </span>
                    <span className="text-xs text-slate-500">{selectedDrive.agency}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-indigo-950 leading-snug">
                    {selectedDrive.title}
                  </h3>
                  {selectedDrive.officerName && (
                    <p className="text-xs text-slate-600">
                      যোগাযোগ: <strong>{selectedDrive.officerName}</strong> ({selectedDrive.officerContact})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter search in modal */}
              <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={deviceFilter}
                  onChange={(e) => setDeviceFilter(e.target.value)}
                  placeholder="ব্র্যান্ড, মডেল বা IMEI দিয়ে খুঁজুন..."
                  className="w-full text-xs outline-none bg-transparent"
                />
                {deviceFilter && (
                  <button onClick={() => setDeviceFilter("")} className="text-xs text-slate-400 hover:text-slate-600">
                    Clear
                  </button>
                )}
              </div>

              {/* Devices Table */}
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">ব্র্যান্ড ও মডেল</th>
                      <th className="py-2.5 px-3">IMEI 1</th>
                      <th className="py-2.5 px-3">IMEI 2 / সিরিয়াল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedDrive.devices || [])
                      .filter((d: any) => {
                        if (!deviceFilter.trim()) return true;
                        const q = deviceFilter.toLowerCase();
                        return (
                          d.brand?.toLowerCase().includes(q) ||
                          d.model?.toLowerCase().includes(q) ||
                          d.imei1?.includes(q) ||
                          d.imei2?.includes(q) ||
                          d.serialNumber?.toLowerCase().includes(q)
                        );
                      })
                      .map((d: any, idx: number) => (
                        <tr key={d.id || idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {d.brand || "Unknown"} {d.model || ""}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-medium">
                            {d.imei1 || "-"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {d.imei2 || d.serialNumber || "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>প্রয়োজনে সংশ্লিষ্ট কর্মকর্তার সাথে সরাসরি যোগাযোগ করুন।</span>
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 rounded-xl"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
