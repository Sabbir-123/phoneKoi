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
        setSearchResult({ found: false, message: "Unable to retrieve data from server." });
      }
    } catch (e) {
      setSearchResult({ found: false, message: "Search failed. Please check your connection and try again." });
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
      <div className="orb w-[500px] h-[500px] bg-indigo-200/50 top-20 right-10 -z-10" />
      <div className="orb w-[400px] h-[400px] bg-purple-200/40 bottom-20 left-10 -z-10" style={{ animationDelay: "3s" }} />

      {/* Header Badge & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-10 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider shadow-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Bangladesh Police Recovered Handset Registry
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-950 tracking-tight leading-tight">
          Check If Your Lost Phone <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            Has Been Recovered by Police
          </span>
        </h1>

        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Easily search and match IMEI numbers against hundreds of mobile devices recovered across special police operations by DB Cyber, CID, RAB, DMP, and district police units nationwide.
        </p>
      </motion.div>

      {/* Hero Search Box */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-3xl p-4 md:p-6 shadow-xl shadow-indigo-950/5 mb-12"
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enter 15-digit Device IMEI Number
            </span>
            <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/60">
              {searchImei.length}/15 digits
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex-1">
              <input
                type="text"
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="e.g. 355235048744323"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-2xl px-4 py-3.5 text-lg font-mono tracking-widest text-indigo-950 placeholder:text-slate-300 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={searching || searchImei.length < 14}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Database
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
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-48 h-48 text-indigo-400" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
                      MATCH CONFIRMED (IN POLICE CUSTODY)
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      🎉 Your device has been found in police custody!
                    </h3>
                  </div>
                </div>

                {/* Device Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div>
                    <span className="text-xs text-slate-400">Device Model</span>
                    <p className="font-bold text-slate-100 text-base">
                      {searchResult.device?.brand || ""} {searchResult.device?.model || "Handset"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">IMEI Number</span>
                    <p className="font-mono font-semibold text-indigo-300 text-sm">
                      {searchResult.device?.imei1 || searchResult.device?.imei2}
                    </p>
                  </div>
                </div>

                {/* Recovery Drive Details */}
                <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <Building className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Agency / Station:</strong> {searchResult.drive.agency}{" "}
                      {searchResult.drive.policeStation ? `(${searchResult.drive.policeStation})` : ""}
                    </span>
                  </div>

                  {searchResult.drive.caseNumber && (
                    <div className="flex items-start gap-2.5 text-slate-300">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>GD / Case Number:</strong> {searchResult.drive.caseNumber}
                      </span>
                    </div>
                  )}

                  {searchResult.drive.officerName && (
                    <div className="flex items-start gap-2.5 text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Investigating Officer:</strong> {searchResult.drive.officerName}
                      </span>
                    </div>
                  )}

                  {searchResult.drive.officerContact && (
                    <div className="flex items-center gap-2.5 text-indigo-200 pt-1">
                      <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-bold">Contact Phone:</span>
                      <a
                        href={`tel:${searchResult.drive.officerContact}`}
                        className="font-mono font-bold underline bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-200"
                      >
                        {searchResult.drive.officerContact}
                      </a>
                    </div>
                  )}
                </div>

                {/* Claim Instructions */}
                <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Legal Claim & Retrieval Instructions
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {searchResult.drive.claimInstructions ||
                      "Please visit the designated police officer or submit a custody petition (জিম্মার আবেদন) to the competent court along with original cash memo/invoice, retail box, National ID (NID), and copy of your Police GD. Upon verification, the device will be legally handed over to the rightful owner."}
                  </p>
                </div>

                {searchResult.drive.sourceUrl && (
                  <div className="mt-5 text-right">
                    <a
                      href={searchResult.drive.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 underline font-medium"
                    >
                      View Official Police Press Release <ExternalLink className="w-3.5 h-3.5" />
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
                    Not Found in Current Police Recovery Drives
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    The provided IMEI does not match any devices published in recent police recovery press releases.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/report"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    File a Stolen Report or Record GD on PhoneKoi <ChevronRight className="w-4 h-4" />
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
            <Building className="w-6 h-6 text-indigo-600" />
            Recent Police Recovery Drives
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official press releases and recovered mobile registries published by law enforcement agencies
          </p>
        </div>
      </div>

      {/* Drives List */}
      {drivesLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Loading recovery drives...</span>
        </div>
      ) : drives.length === 0 ? (
        <div className="w-full py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 text-slate-400">
          <p className="text-sm font-medium">No published recovery drives available at the moment.</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {drives.map((drive) => (
            <motion.div
              key={drive.id}
              whileHover={{ y: -3 }}
              className="bg-white/80 backdrop-blur-md border border-slate-200/70 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-950/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    {drive.deviceCount} Recovered Devices
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(drive.driveDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-indigo-950 line-clamp-2 leading-snug">
                  {drive.title}
                </h3>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    <strong>Agency:</strong> {drive.agency}
                  </p>
                  {drive.policeStation && (
                    <p>
                      <strong>Police Station:</strong> {drive.policeStation}
                    </p>
                  )}
                  {drive.officerName && (
                    <p>
                      <strong>Officer:</strong> {drive.officerName}{" "}
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
                    className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    Official Release <ExternalLink className="w-3 h-3" />
                  </a>
                ) : <span />}

                <button
                  onClick={() => openDriveModal(drive.id)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  View Device List <ChevronRight className="w-3.5 h-3.5" />
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
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {selectedDrive.devices?.length || 0} Devices Recovered
                    </span>
                    <span className="text-xs text-slate-500">{selectedDrive.agency}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-indigo-950 leading-snug">
                    {selectedDrive.title}
                  </h3>
                  {selectedDrive.officerName && (
                    <p className="text-xs text-slate-600">
                      Contact: <strong>{selectedDrive.officerName}</strong> ({selectedDrive.officerContact})
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
                  placeholder="Search by brand, model, or IMEI..."
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
                      <th className="py-2.5 px-3">Brand & Model</th>
                      <th className="py-2.5 px-3">IMEI 1</th>
                      <th className="py-2.5 px-3">IMEI 2 / Serial</th>
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
                          <td className="py-2.5 px-3 font-mono text-indigo-600 font-medium">
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
                <span>Contact the designated investigating officer for legal claim verification.</span>
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
