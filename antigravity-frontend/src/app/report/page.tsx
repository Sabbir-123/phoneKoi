"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Send, Loader2, Info, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import GDUpload from "@/components/report/GDUpload";
import VerificationModal from "@/components/report/VerificationModal";

export default function ReportPage() {
  const [imei, setImei] = useState("");
  const [description, setDescription] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [extractionData, setExtractionData] = useState<any>(null);
  const router = useRouter();

  const handleGdUpload = async (base64: string) => {
    setIsExtracting(true);
    try {
      const response = await fetch("http://localhost:4000/reports/extract-gd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64 }),
      });
      
      if (!response.ok) throw new Error("Extraction failed");
      
      const data = await response.json();
      setExtractionData(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      alert("Information fully detect kora jay nai. Manually fill koro.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVerificationConfirm = async (verifiedData: any) => {
    setIsModalOpen(false);
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:4000/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei: verifiedData.imei,
          description: verifiedData.description,
          deviceName: verifiedData.deviceName,
          contactNumber: verifiedData.contactNumber,
          extractedFromGd: true,
          aiExtractionConfidence: extractionData?.confidence,
        }),
      });

      if (response.ok) {
        router.push("/dashboard?reportSuccess=true");
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imei.length !== 15 || description.length < 10) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:4000/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei,
          description,
          contactNumber,
          extractedFromGd: false,
        }),
      });

      if (response.ok) {
        router.push("/dashboard?reportSuccess=true");
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center py-20 px-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center space-y-4 mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 relative">
            <ShieldAlert className="w-12 h-12 text-red-500" />
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full -z-10" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Report Stolen Device
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
          Help protect the community. Your report will be instantly distributed to the network and increase device safety.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
        {/* Left Side: GD Upload (AI Flow) */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20">
            <div className="bg-neutral-900/90 backdrop-blur-3xl rounded-[2.4rem] p-8 space-y-6 h-full border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center font-bold text-red-500">1</div>
                <h2 className="text-xl font-bold text-white">Faster Way: AI Extraction</h2>
              </div>
              <GDUpload onUpload={handleGdUpload} isExtracting={isExtracting} />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
            <Info className="w-6 h-6 text-neutral-500 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-300">Why upload a GD copy?</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                GD verified reports get a higher trust score and are prioritized in our system. It helps law enforcement and recovery efforts.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Manual Entry */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 space-y-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-neutral-400">2</div>
              <h2 className="text-xl font-bold text-white">Manual Entry Fallback</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400 ml-1">Device IMEI (15 Digits)</label>
                <input
                  type="text"
                  required
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  placeholder="Enter 15-digit IMEI"
                  className="w-full bg-black/40 border border-white/10 focus:border-red-500/50 rounded-2xl px-5 py-4 outline-none font-mono tracking-[0.2em] text-white transition-all text-lg shadow-inner"
                  disabled={isSubmitting || isExtracting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400 ml-1">Incident Details</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where and how the device was stolen..."
                  className="w-full bg-black/40 border border-white/10 focus:border-red-500/50 rounded-2xl px-5 py-4 outline-none text-white transition-all min-h-[120px] resize-none shadow-inner"
                  disabled={isSubmitting || isExtracting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400 ml-1">Contact Number</label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full bg-black/40 border border-white/10 focus:border-red-500/50 rounded-2xl px-5 py-4 outline-none text-white transition-all shadow-inner"
                  disabled={isSubmitting || isExtracting}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || isExtracting || imei.length !== 15 || description.length < 10}
              className="w-full bg-white text-black hover:bg-neutral-200 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg shadow-xl shadow-white/5"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Submit Manual Report <ArrowRight className="w-6 h-6" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleVerificationConfirm}
        initialData={extractionData}
      />
    </div>
  );
}
