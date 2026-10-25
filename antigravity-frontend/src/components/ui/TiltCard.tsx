"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareOpacity?: number;
  scaleOnHover?: number;
}

export function TiltCard({
  children,
  className,
  maxTilt = 12,
  glareOpacity = 0.25,
  scaleOnHover = 1.02,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-maxTilt, maxTilt]);

  const glareX = useTransform(smoothMouseX, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(smoothMouseY, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div
      style={{ perspective: "1000px" }}
      className="w-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative overflow-hidden rounded-3xl transition-shadow duration-300",
          isHovered ? "shadow-2xl shadow-indigo-500/20" : "shadow-lg shadow-indigo-950/5",
          className
        )}
        {...(props as any)}
      >
        {/* Specular Glare Layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
          style={{
            opacity: isHovered ? glareOpacity : 0,
            background: `radial-gradient(circle 350px at ${glareX} ${glareY}, rgba(255, 255, 255, 0.8) 0%, rgba(139, 92, 246, 0.15) 30%, transparent 70%)`,
          }}
        />

        {/* Content with 3D Pop Layer */}
        <div style={{ transform: "translateZ(20px)" }} className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
