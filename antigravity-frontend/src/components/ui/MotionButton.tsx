'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function MotionButton({ children, className, variant = 'primary', ...props }: MotionButtonProps) {
  const baseStyles = "relative px-6 py-3 rounded-xl font-medium overflow-hidden transition-colors flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]",
    secondary: "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
