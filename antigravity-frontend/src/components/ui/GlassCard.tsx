'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hoverGlow?: boolean;
}

export function GlassCard({ children, className, glowColor, hoverGlow = true, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={twMerge(
        "relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden group",
        className
      )}
      {...props}
    >
      {hoverGlow && glowColor && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at 50% 50%, ${glowColor}, transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
