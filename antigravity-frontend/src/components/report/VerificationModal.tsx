"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, CheckCircle2, Phone, Smartphone, ClipboardList, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData: {
    imei?: string;
    deviceName?: string;
    description?: string;
    confidence?: number;
  };
}

export default function VerificationModal({ isOpen, onClose, onConfirm, initialData }: VerificationModalProps) {
  const [formData, setFormData] = useState({
    imei: "",
    deviceName: "",
    description: "",
    contactNumber: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        imei: initialData.imei || "",
        deviceName: initialData.deviceName || "",
        description: initialData.description || "",
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <div className="p-8 md:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Verify Information</h2>
                  <p className="text-sm text-neutral-400">Review AI extracted details</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-amber-200/80">
                AI extraction accuracy depend kore document quality-r upore. Please cross-check and correct if needed.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Device IMEI (15 Digits)
                </label>
                <input
                  type="text"
                  required
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value.replace(/\D/g, "").slice(0, 15) })}
                  className="w-full bg-black/50 border border-white/10 focus:border-red-500/50 rounded-2xl px-4 py-3.5 outline-none font-mono text-white transition-all"
                  placeholder="Enter IMEI number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-3 h-3" /> Device Name / Model
                </label>
                <input
                  type="text"
                  required
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 focus:border-red-500/50 rounded-2xl px-4 py-3.5 outline-none text-white transition-all"
                  placeholder="e.g. iPhone 15 Pro Max"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-3 h-3" /> Incident Details
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 focus:border-red-500/50 rounded-2xl px-4 py-3.5 outline-none text-white transition-all min-h-[100px] resize-none"
                  placeholder="Describe what happened..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2 text-blue-400">
                  <Phone className="w-3 h-3" /> WhatsApp / Contact Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full bg-blue-500/5 border border-blue-500/20 focus:border-blue-500/50 rounded-2xl px-4 py-3.5 outline-none text-white transition-all"
                  placeholder="e.g. 01700000000"
                />
                <p className="text-[10px] text-neutral-500">For recovery and verification communication.</p>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                >
                  Confirm & Submit <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
