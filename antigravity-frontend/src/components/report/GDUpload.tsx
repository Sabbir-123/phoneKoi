"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface GDUploadProps {
  onUpload: (base64: string) => void;
  isExtracting: boolean;
}

export default function GDUpload({ onUpload, isExtracting }: GDUploadProps) {
  const { t, isBn } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      alert(
        isBn
          ? "অনুগ্রহ করে ছবির ফাইল (JPG, PNG) অথবা PDF আপলোড করুন।"
          : "Please upload an image (JPG, PNG) or PDF."
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert(
        isBn
          ? "ফাইলের সাইজ ১০ মেগাবাইট (10MB) এর কম হতে হবে।"
          : "File size should be less than 10MB."
      );
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setPreview(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col items-center justify-center space-y-2 text-center mb-2">
        <h3 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
          {isBn ? "থানার জিডি (GD) কপি আপলোড করুন" : "Upload Police GD Copy"}
        </h3>
        <p className="text-sm text-slate-500 max-w-md font-medium">
          {isBn 
            ? "এআই-ভিত্তিক দ্রুত রিপোর্টিংয়ের জন্য আপনার পুলিশ জিডি কপির পরিষ্কার ছবি বা PDF আপলোড করুন।"
            : "Upload a clear photo or PDF of your police GD copy for AI-powered fast reporting."}
        </p>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 ${
          isDragging 
            ? "border-indigo-500/50 bg-indigo-500/5" 
            : "border-slate-200 bg-slate-50/20 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm"
        } p-5 sm:p-8 md:p-12`}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*,.pdf" 
          onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} 
          className="hidden" 
        />

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-bold text-indigo-950">
              {isBn ? "ছবি এখানে টানুন বা ব্রাউজ করুন" : "Click to upload or drag & drop"}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              PNG, JPG, PDF (max 10MB)
            </p>
          </div>
        </div>

        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center p-4 z-10"
            >
              <img src={preview} alt="GD Preview" className="max-h-full max-w-full rounded-2xl object-contain shadow-md" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isExtracting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <div className="space-y-1 text-center">
              <p className="text-indigo-950 font-bold animate-pulse">
                {isBn ? "জিডি কপি বিশ্লেষণ করা হচ্ছে..." : "Analyzing GD copy..."}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {isBn ? "এআই দিয়ে তথ্য সংগ্রহ করা হচ্ছে" : "Extracting information using AI"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Message */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/80 shadow-sm flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[13px] leading-relaxed text-indigo-950 font-semibold">
            {isBn 
              ? "আপলোডকৃত জিডি কপি শুধুমাত্র ডিভাইসের মালিকানা ও নিরাপত্তা নিশ্চিত করতে ব্যবহৃত হবে।"
              : "The GD copy will strictly be used for safety and ownership verification."}
          </p>
        </div>
      </div>
    </div>
  );
}
