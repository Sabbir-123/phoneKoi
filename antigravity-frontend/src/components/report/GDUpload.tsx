"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";

interface GDUploadProps {
  onUpload: (base64: string) => void;
  isExtracting: boolean;
}

export default function GDUpload({ onUpload, isExtracting }: GDUploadProps) {
  const { language } = useDashboardStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      alert(
        language === 'banglish'
          ? "Please key image (JPG, PNG) ba PDF upload korun."
          : "Please upload an image (JPG, PNG) or PDF."
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert(
        language === 'banglish'
          ? "File details 10MB er kom hote hobe."
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
      // For PDF, we just show an icon and might need a different handling or just send base64
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
          {language === 'banglish' ? 'GD Copy Upload Korun' : 'Upload Police GD Copy'}
        </h3>
        <p className="text-sm text-slate-500 max-w-md font-medium">
          {language === 'banglish' 
            ? 'AI-powered fast reporting er jonno apnar police GD copy er clear photo ba PDF upload korun.'
            : 'Upload a clear photo or PDF of your police GD copy for AI-powered fast reporting.'}
        </p>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 ${
          isDragging 
            ? "border-red-500/50 bg-red-500/5" 
            : "border-slate-200 bg-slate-50/20 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm"
        } p-8 md:p-12`}
      >
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
          accept="image/*,.pdf"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center space-y-4 relative z-10"
            >
              <div className="p-4 rounded-2xl bg-slate-100/80 group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-500">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-indigo-950">Drag & Drop or Click to Upload</p>
                <p className="text-sm text-slate-400 font-semibold">Supports JPG, PNG, PDF (Max 10MB)</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center space-y-4 relative z-10"
            >
              {preview ? (
                <div className="relative w-32 h-40 rounded-xl overflow-hidden border border-slate-100 shadow-2xl">
                  <img src={preview} alt="GD Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-100/80 border border-slate-200/50">
                  <FileText className="w-12 h-12 text-red-500" />
                </div>
              )}
              <div className="text-center space-y-1">
                <p className="text-slate-800 font-semibold truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-slate-500 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isExtracting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-20">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <div className="space-y-1 text-center">
              <p className="text-indigo-950 font-bold animate-pulse">
                {language === 'banglish' ? 'GD copy analyse kortesi...' : 'Analyzing GD copy...'}
              </p>
              <p className="text-xs text-slate-500 font-medium">Extracting information using AI</p>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Message */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/80 shadow-sm flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[13px] leading-relaxed text-indigo-950 font-semibold">
            {language === 'banglish' 
              ? 'GD copy verification process er jonno use kora hobe.'
              : 'The GD copy will strictly be used for safety and ownership verification.'}
          </p>
        </div>
      </div>
    </div>
  );
}
