"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function InteractiveBackground() {
  const [mounted, setMounted] = useState(false);

  // Mouse tracking with smooth spring interpolation
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);
    const handlePointerMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [mouseX, mouseY]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#fbfaff]"
    >
      {/* ─── Layer 1: Subtle Tech Dot Grid Matrix ─── */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `radial-gradient(rgba(99, 102, 241, 0.18) 1.25px, transparent 1.25px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 85%)",
        }}
      />

      {/* ─── Layer 2: Interactive Mouse Spotlight Aura ─── */}
      {mounted && (
        <motion.div
          className="absolute -top-72 -left-72 w-[600px] h-[600px] rounded-full"
          style={{
            x: smoothX,
            y: smoothY,
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.12) 35%, rgba(56, 189, 248, 0.04) 60%, transparent 75%)",
            filter: "blur(50px)",
          }}
        />
      )}

      {/* ─── Layer 3: Organic Floating Gradient Auroras ─── */}
      {/* Top Right Royal Violet Orb */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.12, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-24 -right-24 w-[650px] h-[650px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, rgba(124, 58, 237, 0.14) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Top Left / Center Electric Indigo Orb */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 1.08, 0.92, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-55"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.12) 45%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Middle Sky / Cyan Light Accent Orb */}
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-2/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, rgba(99, 102, 241, 0.10) 45%, transparent 70%)",
          filter: "blur(75px)",
        }}
      />

      {/* Bottom Center Deep Violet/Purple Orb */}
      <motion.div
        animate={{
          x: [0, -30, 50, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 7,
        }}
        className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.24) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)",
          filter: "blur(85px)",
        }}
      />

      {/* ─── Layer 4: Organic Flowing Curved Waves (আঁকাবাঁকা ঢেউ) ─── */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.40" />
            <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.20" />
          </linearGradient>
          <filter id="waveBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="35" />
          </filter>
        </defs>

        {/* Dynamic Curved Flow Path 1 */}
        <motion.path
          animate={{
            d: [
              "M -100,180 C 300,80 500,280 850,150 C 1200,20 1400,260 1600,160 L 1600,0 L -100,0 Z",
              "M -100,160 C 250,220 550,100 900,240 C 1250,110 1450,200 1600,190 L 1600,0 L -100,0 Z",
              "M -100,180 C 300,80 500,280 850,150 C 1200,20 1400,260 1600,160 L 1600,0 L -100,0 Z",
            ],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          fill="url(#waveGrad1)"
          filter="url(#waveBlur)"
        />

        {/* Dynamic Curved Flow Path 2 (Middle Horizon) */}
        <motion.path
          animate={{
            d: [
              "M -100,450 C 250,350 600,580 950,420 C 1300,260 1500,490 1600,430 L 1600,900 L -100,900 Z",
              "M -100,480 C 300,550 650,380 1000,520 C 1350,400 1450,460 1600,400 L 1600,900 L -100,900 Z",
              "M -100,450 C 250,350 600,580 950,420 C 1300,260 1500,490 1600,430 L 1600,900 L -100,900 Z",
            ],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          fill="url(#waveGrad2)"
          filter="url(#waveBlur)"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
