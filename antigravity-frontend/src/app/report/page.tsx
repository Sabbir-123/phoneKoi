"use client";
import { API_URL, authFetch } from '@/utils/api';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Send,
  Loader2,
  Info,
  ArrowRight,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Bell,
  Sparkles,
  Edit3,
  Upload,
  X,
  FileCheck2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import GDUpload from "@/components/report/GDUpload";
import { useDashboardStore } from "@/store/useDashboardStore";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ReportPage() {
  const { profile, fetchProfile, language } = useDashboardStore();
  const [entryMode, setEntryMode] = useState<"AI_SCAN" | "MANUAL">("AI_SCAN");
  const [imei, setImei] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [description, setDescription] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gdImage, setGdImage] = useState<string | null>(null);
  
  const [gdUploaded, setGdUploaded] = useState(false);
  const [manualFileName, setManualFileName] = useState("");
  const [manualFileSize, setManualFileSize] = useState("");
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedFromGd, setExtractedFromGd] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isInitialPro = Boolean(
    profile?.isPro ||
    profile?.role === "ADMIN" ||
    (typeof profile?.plan === "string" && profile.plan.toLowerCase().includes("pro"))
  );
  const [profileLoading, setProfileLoading] = useState(() => !profile);
  const [isPro, setIsPro] = useState(() => (profile ? isInitialPro : true));
  const [reportsLeft, setReportsLeft] = useState(() => (profile ? (profile.reportsLeft ?? 0) : 10));

  const [reportType, setReportType] = useState<"STOLEN" | "LOST">("STOLEN");
  const [brand, setBrand] = useState("Apple");
  const [model, setModel] = useState("");
  const [lossDate, setLossDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [policeGdNumber, setPoliceGdNumber] = useState("");
  const [gdTrackingId, setGdTrackingId] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [activeChannels, setActiveChannels] = useState<{
    inApp: boolean;
    telegram: boolean;
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  }>({
    inApp: true,
    telegram: false,
    email: false,
    whatsapp: false,
    sms: false,
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    inApp: true,
    telegram: true,
    whatsapp: true,
    email: true,
    sms: true,
  });

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const { createClient } = require("@/utils/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          router.push("/login?redirectTo=/report");
          return;
        }

        // Run profile fetch and active-channels concurrently in parallel
        const [profData, chanRes] = await Promise.all([
          fetchProfile().catch(() => null),
          fetch(`${API_URL}/notifications/active-channels`).catch(() => null),
        ]);

        if (isMounted) {
          if (profData) {
            const isProPlan = Boolean(
              profData.isPro || 
              profData.role === "ADMIN" || 
              (typeof profData.plan === "string" && profData.plan.toLowerCase().includes("pro"))
            );
            setIsPro(isProPlan);
            setReportsLeft(profData.reportsLeft ?? 0);
          }
          if (chanRes && chanRes.ok) {
            const channels = await chanRes.json();
            setActiveChannels(channels);
            setNotificationPreferences((prev) => ({
              ...prev,
              telegram: Boolean(channels.telegram),
              whatsapp: Boolean(channels.whatsapp),
              email: Boolean(channels.email),
              sms: Boolean(channels.sms),
            }));
          }
          setProfileLoading(false);
        }
      } catch (err) {
        console.error("Error loading user report context:", err);
        if (isMounted) setProfileLoading(false);
      }
    };

    initData();
    return () => { isMounted = false; };
  }, [router, fetchProfile]);

  const handleGdUpload = async (base64: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setGdImage(base64);
    try {
      const response = await authFetch(`${API_URL}/reports/extract-gd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64 }),
      });

      if (!response.ok) {
        console.warn("GD extraction server endpoint returned a non-OK response.");
        setGdUploaded(true);
        setExtractedFromGd(true);
        setErrorMessage(
          language === 'banglish'
            ? "GD copy processing ektu problem hoyese, kintu file successfully peyechi. Dayani niche manual details puron korun."
            : "We encountered an issue processing the GD copy automatically, but your file is uploaded. Please fill in the details below manually."
        );
        return;
      }
      
      const data = await response.json();
      
      // Auto-populate the form fields with extracted details if they exist
      if (data.imei) setImei(data.imei);
      if (data.deviceName) {
        setDeviceName(data.deviceName);
        setModel(data.deviceName);
      }
      if (data.description) setDescription(data.description);
      if (data.policeGdNumber) setPoliceGdNumber(data.policeGdNumber);
      if (data.policeStation) setPoliceStation(data.policeStation);
      
      setAiConfidence(data.confidence || 0.85);
      setExtractedFromGd(true);
      setGdUploaded(true);

      // If confidence is low or fields are empty, show a soft helper warning instead of a hard crash
      if (data.confidence < 0.3 || (!data.imei && !data.deviceName)) {
        setErrorMessage(
          language === 'banglish'
            ? "Information fully detect kora jay nai. Please manually fill the fields below."
            : "Could not fully extract details automatically. Please fill in the fields below manually."
        );
      }
    } catch (error) {
      console.error("GD copy upload/extraction failed:", error);
      setGdUploaded(true);
      setExtractedFromGd(true);
      setErrorMessage(
        language === 'banglish'
          ? "Information fully detect kora jay nai. Please manually fill the fields below."
          : "Could not fully extract details automatically. Please fill in the fields below manually."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualGdFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      alert("Please upload an image (JPG, PNG) or PDF document.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setGdImage(base64);
      setGdUploaded(true);
      setManualFileName(selectedFile.name);
      setManualFileSize((selectedFile.size / (1024 * 1024)).toFixed(2) + " MB");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdUploaded || !gdImage) {
      alert(
        language === 'banglish'
          ? "Verification Police GD copy upload koro mandatory!"
          : "Uploading a verification Police GD copy is mandatory!"
      );
      return;
    }
    if (
      imei.length !== 15 ||
      description.length < 5 ||
      (deviceName.trim().length === 0 && model.trim().length === 0) ||
      contactNumber.trim().length === 0
    ) {
      alert("Please fill all mandatory fields correctly (Brand, Model, 15-digit IMEI, Incident details, and Contact number).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get currently logged-in user email to associate with report
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || "";

      const finalDeviceName = model.trim() 
        ? (model.toLowerCase().includes(brand.toLowerCase()) ? model.trim() : `${brand} ${model.trim()}`) 
        : deviceName;

      // Normalize notification preferences to array format for database compatibility
      const selectedPrefs: string[] = [];
      if (notificationPreferences.inApp) selectedPrefs.push("IN_APP");
      if (notificationPreferences.telegram && activeChannels.telegram) selectedPrefs.push("TELEGRAM");
      if (notificationPreferences.whatsapp && activeChannels.whatsapp) selectedPrefs.push("WHATSAPP");
      if (notificationPreferences.email && activeChannels.email) selectedPrefs.push("EMAIL");
      if (notificationPreferences.sms && activeChannels.sms) selectedPrefs.push("SMS");

      const finalGdNumber = policeGdNumber.trim()
        ? (gdTrackingId.trim() ? `${policeGdNumber.trim()} (Tracking: ${gdTrackingId.trim()})` : policeGdNumber.trim())
        : (gdTrackingId.trim() ? `Tracking: ${gdTrackingId.trim()}` : undefined);

      const response = await authFetch(`${API_URL}/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei,
          description,
          deviceName: finalDeviceName,
          brand,
          model: model.trim() || finalDeviceName,
          reportType,
          lossDate,
          policeGdNumber: finalGdNumber,
          policeStation: policeStation.trim() || undefined,
          notificationPreferences: selectedPrefs,
          contactNumber,
          extractedFromGd: entryMode === "AI_SCAN" ? extractedFromGd : false,
          aiExtractionConfidence: entryMode === "AI_SCAN" ? aiConfidence : undefined,
          email: userEmail,
          gdImage,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/devices?reportSuccess=true");
      } else {
        const errorData = await response.json().catch(() => null);
        const rawMsg = errorData?.message;
        const errString = Array.isArray(rawMsg)
          ? rawMsg.join('. ')
          : (typeof rawMsg === 'string' ? rawMsg : (errorData?.error || (language === 'banglish' ? "Report submit kora jay ni. Please abar try korun." : "Submission failed. Please try again.")));
        alert(errString);
      }
    } catch (error) {
      console.error(error);
      alert(language === 'banglish' ? "Report submit korte somossa hoyese. Abar chesta korun." : "Something went wrong during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading && !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <span className="text-xs font-semibold text-slate-400">Loading report portal...</span>
      </div>
    );
  }

  if (!profileLoading && (!isPro || reportsLeft <= 0)) {
    return (
      <div className="w-full max-w-2xl flex flex-col items-center justify-center py-12 px-6">
        {/* Ambient backgrounds */}
        <div className="orb w-[500px] h-[500px] bg-red-100/10 top-0 right-0 -z-10 blur-[80px]" />
        <div className="orb w-[300px] h-[300px] bg-indigo-100/10 bottom-0 left-0 -z-10 blur-[60px]" style={{ animationDelay: "4s" }} />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full text-center space-y-6"
        >
          <div className="flex justify-center mb-2">
            <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-lg relative animate-pulse">
              <ShieldAlert className="w-12 h-12 text-indigo-600" />
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full -z-10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-indigo-950">
              Premium Theft Registry Required
            </h1>
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
              {reportsLeft <= 0 ? "Device Quota Exhausted" : "Authorized Accounts Only"}
            </p>
          </div>

          <GlassCard className="p-6 md:p-8 space-y-6 bg-white/80 border border-slate-100 max-w-lg mx-auto shadow-2xl rounded-[2rem] text-left leading-relaxed">
            <p className="text-xs text-slate-500 font-semibold text-center mb-2 leading-relaxed">
              Only registered premium accounts with active device quotas are authorized to submit mobile theft reports in our database. This strict validation gate ensures every flag remains high-trust, verified by police GD records, and protected against fraudulent logs.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150/50 space-y-2.5 text-xs font-bold text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Type:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold border ${isPro ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                  {isPro ? "Pro Watcher" : "Basic User (FREE)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Available Quota:</span>
                <span className={`font-bold ${reportsLeft > 0 ? "text-emerald-650" : "text-red-500"}`}>
                  {reportsLeft} mobile reports remaining
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard/quota")}
              className="w-full font-bold py-3.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs"
            >
              Purchase Premium Package <ArrowRight className="w-4 h-4" />
            </button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center pt-24 sm:pt-28 pb-12 px-4 sm:px-6">
      {/* Ambient backgrounds */}
      <div className="orb w-[500px] h-[500px] bg-red-100/10 top-0 right-0 -z-10 blur-[80px]" />
      <div className="orb w-[300px] h-[300px] bg-indigo-100/10 bottom-0 left-0 -z-10 blur-[60px]" style={{ animationDelay: "4s" }} />

      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center space-y-4 mb-10"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 relative">
            <ShieldAlert className="w-12 h-12 text-red-500" />
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full -z-10" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-indigo-950">
          {language === 'banglish' ? 'Report Stolen Device' : 'Report Stolen Device'}
        </h1>
        <p className="text-slate-500 text-base max-w-lg mx-auto font-medium">
          {language === 'banglish' 
            ? 'GD copy verification process er jonno upload kora mandatory. System will automatically verify and queue report for Admin review.'
            : 'Uploading a Police GD copy is mandatory for verification. The system will automatically parse and queue the report for Admin review.'}
        </p>
      </motion.div>

      {/* Main Unified Report Card */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full bg-white/80 border border-slate-100 shadow-2xl shadow-indigo-100/40 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 backdrop-blur-2xl relative overflow-hidden"
      >
        {/* Entry Mode Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Choose Submission Method
            </span>
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              Quota: {reportsLeft} Left
            </span>
          </div>

          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setEntryMode("AI_SCAN");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                entryMode === "AI_SCAN"
                  ? "bg-white text-indigo-950 shadow-md ring-1 ring-slate-200/70"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${entryMode === "AI_SCAN" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>AI Smart Scan (OCR)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryMode("MANUAL");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                entryMode === "MANUAL"
                  ? "bg-white text-indigo-950 shadow-md ring-1 ring-slate-200/70"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Edit3 className={`w-4 h-4 ${entryMode === "MANUAL" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>Manual Form Entry</span>
            </button>
          </div>
        </div>

        {/* ─── Mode 1: AI Smart Scan (OCR Upload First) ─── */}
        {entryMode === "AI_SCAN" && (
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between border-b border-slate-100/80 pb-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  gdUploaded ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-100' : 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                }`}>
                  {gdUploaded ? '✓' : '1'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-indigo-950">
                    {gdUploaded ? 'GD Copy Uploaded & Scanned' : 'Upload Police GD Copy for AI Scan'}
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Automatic parsing of IMEI, model, GD number & police station
                  </p>
                </div>
              </div>
            </div>

            {/* GD Uploader */}
            <GDUpload onUpload={handleGdUpload} isExtracting={isExtracting} />

            {/* AI feedback or error messaging */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl bg-amber-50 border border-amber-200/50 flex gap-3 items-start"
                >
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-amber-800 font-semibold">{errorMessage}</p>
                </motion.div>
              )}

              {gdUploaded && !errorMessage && !isExtracting && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex gap-3 items-start shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-0.5">
                    <p className="text-xs leading-relaxed text-emerald-800 font-bold">
                      GD Copy successfully uploaded & processed! 🎉
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      AI has pre-filled the extracted data below. Please review and verify.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ─── Mode 2 / Step 2 Form (Always visible in Manual, or after GD upload in AI mode) ─── */}
        {(entryMode === "MANUAL" || (entryMode === "AI_SCAN" && gdUploaded)) && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 pt-4 border-t border-slate-100/80"
          >
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600">
                  {entryMode === "MANUAL" ? "📝" : "2"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-indigo-950">
                    {entryMode === "MANUAL" ? "Manual Device Information" : "Verify & Update Details"}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {entryMode === "MANUAL"
                      ? "Fill in your device specifications, incident info, and upload GD proof"
                      : "Review extracted data and update any fields if needed"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* 1. Report Status: Lost vs Stolen */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Report Classification
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReportType("STOLEN")}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      reportType === "STOLEN"
                        ? "bg-red-50/80 border-red-300 text-red-900 shadow-sm ring-2 ring-red-400/20"
                        : "bg-slate-50/50 border-slate-200/70 text-slate-600 hover:bg-slate-100/50"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-red-600" /> Stolen (চুরি হয়েছে)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">Theft, snatching, burglary</p>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${reportType === "STOLEN" ? "border-red-600 bg-red-600" : "border-slate-300"}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType("LOST")}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      reportType === "LOST"
                        ? "bg-amber-50/80 border-amber-300 text-amber-900 shadow-sm ring-2 ring-amber-400/20"
                        : "bg-slate-50/50 border-slate-200/70 text-slate-600 hover:bg-slate-100/50"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Lost (হারিয়ে গেছে)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">Misplaced, forgotten, dropped</p>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${reportType === "LOST" ? "border-amber-600 bg-amber-600" : "border-slate-300"}`} />
                  </button>
                </div>
              </div>

              {/* 2. Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Brand
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 font-semibold text-sm shadow-inner"
                  >
                    <option value="Apple">Apple iPhone</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi / Redmi</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Realme">Realme</option>
                    <option value="Google">Google Pixel</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Honor">Honor</option>
                    <option value="Motorola">Motorola</option>
                    <option value="Other">Other Brand</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Model Name / Number
                  </label>
                  <input
                    type="text"
                    required
                    value={model || deviceName}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setDeviceName(e.target.value);
                    }}
                    placeholder="e.g. iPhone 15 Pro Max 256GB"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 font-semibold text-sm shadow-inner"
                  />
                </div>
              </div>

              {/* 3. Device IMEI & Date of Loss */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Device IMEI (15 Digits)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {imei.length}/15
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    placeholder="358066149534298"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none font-mono tracking-[0.15em] text-slate-900 text-sm shadow-inner font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Date of Loss or Theft
                  </label>
                  <input
                    type="date"
                    required
                    value={lossDate}
                    onChange={(e) => setLossDate(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 font-semibold text-sm shadow-inner"
                  />
                </div>
              </div>

              {/* 4. Police GD & Station Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Police GD Number (থানার জিডি নং)
                  </label>
                  <input
                    type="text"
                    value={policeGdNumber}
                    onChange={(e) => setPoliceGdNumber(e.target.value)}
                    placeholder="e.g. GD-10294/2026"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 font-semibold text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    GD Tracking ID (অনলাইন ট্র্যাকিং)
                  </label>
                  <input
                    type="text"
                    value={gdTrackingId}
                    onChange={(e) => setGdTrackingId(e.target.value)}
                    placeholder="e.g. TRK-884920"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 font-semibold text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Police Station (থানা / জেলা)
                  </label>
                  <input
                    type="text"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    placeholder="e.g. Uttara West, DMP"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 font-semibold text-sm shadow-inner"
                  />
                </div>
              </div>

              {/* 5. Incident Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Incident Summary (ঘটনার বিবরণ)
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where and how the device was stolen or lost (e.g. Stolen from bag on bus route near Mirpur-10)..."
                  className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3 outline-none text-slate-800 min-h-[85px] resize-none shadow-inner text-sm font-semibold"
                />
              </div>

              {/* 6. Contact Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Contact / WhatsApp Number
                </label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-4 py-3.5 outline-none text-slate-800 shadow-inner text-sm font-semibold"
                />
                <p className="text-[11px] text-slate-400 font-medium pl-1">
                  Used for verified owner contact relay and instant search alerts.
                </p>
              </div>

              {/* 7. Mandatory GD Document Upload (In Manual Mode) */}
              {entryMode === "MANUAL" && (
                <div className="space-y-2.5 p-4 sm:p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Police GD Document / Proof (বাধ্যতামূলক)
                    </label>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      gdImage
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-red-50 text-red-600 border border-red-200/60"
                    }`}>
                      {gdImage ? "✓ Uploaded" : "Required *"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Please attach a clear photo (JPG, PNG) or PDF of your Police GD copy or retail invoice.
                  </p>

                  {gdImage ? (
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {gdImage.startsWith("data:image/") ? (
                          <img src={gdImage} alt="GD Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <FileCheck2 className="w-6 h-6 text-indigo-600" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {manualFileName || "Police GD Document Attached"}
                          </p>
                          <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> File ready {manualFileSize ? `(${manualFileSize})` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGdImage(null);
                          setGdUploaded(false);
                          setManualFileName("");
                          setManualFileSize("");
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => manualFileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white/70 hover:bg-white rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 group shadow-xs"
                    >
                      <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Click to browse or drag & drop GD Copy
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Supports JPG, PNG, PDF (Max 10MB)
                        </p>
                      </div>
                      <input
                        ref={manualFileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleManualGdFile(e.target.files[0])}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 8. Real-Time Search Alert Preferences */}
              <div className="p-4 sm:p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-indigo-600 shrink-0" /> Real-Time Search Alert Channels
                  </span>
                  <span className="self-start sm:self-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Instant Dispatch Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select how you want to be notified the exact instant someone queries this IMEI on PhoneKoi:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* 1. In-App Dashboard */}
                  <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-150 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={notificationPreferences.inApp}
                      onChange={(e) => setNotificationPreferences({ ...notificationPreferences, inApp: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">In-App Dashboard</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-150">Default</span>
                    </div>
                  </label>

                  {/* 2. Telegram Bot Push Alert */}
                  {activeChannels.telegram && (
                    <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-sky-200/80 shadow-sm cursor-pointer hover:bg-sky-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.telegram}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, telegram: e.target.checked })}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 shrink-0"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">Telegram Bot Push</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">100% Free</span>
                      </div>
                    </label>
                  )}

                  {/* 3. Email Notification */}
                  {activeChannels.email && (
                    <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-150 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.email}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, email: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-700">Email Notification</span>
                    </label>
                  )}

                  {/* 4. WhatsApp Alert */}
                  {activeChannels.whatsapp && (
                    <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-150 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.whatsapp}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, whatsapp: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-700">WhatsApp Alert</span>
                    </label>
                  )}

                  {/* 5. Emergency SMS */}
                  {activeChannels.sms && (
                    <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-150 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.sms}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, sms: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-700">Emergency SMS</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={
                isSubmitting ||
                !gdImage ||
                imei.length !== 15 ||
                description.length < 5 ||
                (deviceName.trim().length === 0 && model.trim().length === 0) ||
                contactNumber.trim().length === 0
              }
              className="w-full btn-primary py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-base shadow-xl shadow-indigo-100/35 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Confirm & Submit Report <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
