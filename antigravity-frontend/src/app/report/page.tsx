"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Send, Loader2, Info, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import GDUpload from "@/components/report/GDUpload";
import { useDashboardStore } from "@/store/useDashboardStore";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ReportPage() {
  const { language } = useDashboardStore();
  const [imei, setImei] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [description, setDescription] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gdImage, setGdImage] = useState<string | null>(null);
  
  const [gdUploaded, setGdUploaded] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedFromGd, setExtractedFromGd] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [reportsLeft, setReportsLeft] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const checkUserQuota = async () => {
      try {
        setProfileLoading(true);
        const { createClient } = require("@/utils/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          router.push("/login?redirectTo=/report");
          return;
        }

        const res = await fetch(`http://localhost:4000/users/profile?email=${session.user.email}`);
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.isPro && data.plan === "PRO");
          setReportsLeft(data.reportsLeft ?? 0);
        }
      } catch (err) {
        console.error("Error checking user quota:", err);
      } finally {
        setProfileLoading(false);
      }
    };
    checkUserQuota();
  }, [router]);

  const handleGdUpload = async (base64: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setGdImage(base64);
    try {
      const response = await fetch("http://localhost:4000/reports/extract-gd", {
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
      if (data.deviceName) setDeviceName(data.deviceName);
      if (data.description) setDescription(data.description);
      
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
      // Even if API fails, they have successfully uploaded a file, so we mark it as uploaded
      // but they must fill in the details manually.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdUploaded) {
      alert(
        language === 'banglish'
          ? "Verification Police GD copy upload koro mandatory!"
          : "Uploading a verification Police GD copy is mandatory!"
      );
      return;
    }
    if (imei.length !== 15 || description.length < 10 || deviceName.trim().length === 0 || contactNumber.trim().length === 0) {
      alert("Please fill all mandatory fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get currently logged-in user email to associate with report
      const { createClient } = require("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || "";

      const response = await fetch("http://localhost:4000/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei,
          description,
          deviceName,
          contactNumber,
          extractedFromGd,
          aiExtractionConfidence: aiConfidence,
          email: userEmail, // Send email to link userId on the backend
          gdImage, // Send the base64 GD copy image!
        }),
      });

      if (response.ok) {
        router.push("/dashboard?reportSuccess=true");
      } else {
        const errorData = await response.json();
        alert(errorData?.message || "Submission failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validating safety credentials...</span>
      </div>
    );
  }

  if (!isPro || reportsLeft <= 0) {
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
    <div className="w-full max-w-2xl flex flex-col items-center justify-center py-8 px-6">
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
        className="w-full bg-white/80 border border-slate-100 shadow-2xl shadow-indigo-100/40 rounded-[2.5rem] p-6 md:p-10 space-y-8 backdrop-blur-2xl relative overflow-hidden"
      >
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
                {gdUploaded 
                  ? (language === 'banglish' ? 'GD Copy Uploaded' : 'GD Copy Uploaded') 
                  : (language === 'banglish' ? 'Police GD Copy Upload Korun' : 'Upload Police GD Copy')}
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                {language === 'banglish' ? 'Verification copy upload koro mandatory' : 'Mandatory verification document'}
              </p>
            </div>
          </div>
          
          <div className="px-3.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-extrabold text-indigo-600 shadow-sm animate-pulse">
            Quota: {reportsLeft} Left
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
                  {language === 'banglish' ? 'GD Copy successfully upload hoyese! 🎉' : 'GD Copy uploaded successfully! 🎉'}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  {language === 'banglish' 
                    ? 'AI automatic details extract korse. Niche check kore nin.' 
                    : 'AI has extracted data fields in real-time. Please review them below.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Form inputs (visible/active once GD is uploaded) */}
        <AnimatePresence>
          {gdUploaded && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-6 pt-4 border-t border-slate-100/80"
            >
              <div className="flex items-center gap-3 pb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-indigo-950">
                    {language === 'banglish' ? 'Details Verify Korun' : 'Verify Details'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {language === 'banglish' ? 'Extracted details check ebong update korun' : 'Review and update extracted details'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Device Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {language === 'banglish' ? 'Device er Name / Model' : 'Device Name / Model'}
                  </label>
                  <input
                    type="text"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro Max"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-5 py-4 outline-none text-slate-800 transition-all font-semibold shadow-inner text-sm"
                  />
                </div>

                {/* Device IMEI */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {language === 'banglish' ? 'Device er IMEI (15 Digits)' : 'Device IMEI (15 Digits)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    placeholder="Enter 15-digit IMEI"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-5 py-4 outline-none font-mono tracking-[0.2em] text-slate-800 transition-all text-base shadow-inner"
                  />
                </div>

                {/* Incident Details */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {language === 'banglish' ? 'Incident Details (Kivabe haralo)' : 'Incident Details'}
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe where and how the device was stolen..."
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-5 py-4 outline-none text-slate-800 transition-all min-h-[100px] resize-none shadow-inner text-sm font-semibold"
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {language === 'banglish' ? 'Contact / WhatsApp Number' : 'Contact / WhatsApp Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full bg-slate-50/50 border border-slate-200/60 focus:bg-white focus:border-red-500/30 rounded-2xl px-5 py-4 outline-none text-slate-800 transition-all shadow-inner text-sm font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold pl-1">
                    {language === 'banglish' ? 'Verification er jonno phone kora hote pare.' : 'Used for verification communication.'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isSubmitting || imei.length !== 15 || description.length < 10 || deviceName.trim().length === 0 || contactNumber.trim().length === 0}
                className="w-full btn-primary py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-base shadow-xl shadow-indigo-100/35 mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {language === 'banglish' ? 'Confirm & Submit Korun' : 'Confirm & Submit Report'} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
