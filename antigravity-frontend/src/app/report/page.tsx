"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const [imei, setImei] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imei.length !== 15 || description.length < 10) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Let's redirect to a success state or dashboard
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[70vh] px-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center space-y-4 mb-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Report Stolen Device
        </h1>
        <p className="text-neutral-400">
          Help protect the community. Your report will be instantly distributed to the network.
        </p>
      </motion.div>

      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">Device IMEI (15 Digits)</label>
          <input
            type="text"
            required
            value={imei}
            onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
            placeholder="000000000000000"
            className="w-full bg-black/50 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none font-mono tracking-widest text-white transition-colors"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">Incident Details</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about how and when the device was stolen..."
            className="w-full bg-black/50 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none text-white transition-colors min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting || imei.length !== 15 || description.length < 10}
          className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:hover:bg-red-600 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Submit Report <Send className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}
