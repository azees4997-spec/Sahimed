"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

interface RibbonBadgeProps {
  savingsPct: number;
  variant?: 'primary' | 'accent' | 'success';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RibbonBadge({ 
  savingsPct, 
  variant = 'primary', 
  className,
  size = 'md'
}: RibbonBadgeProps) {
  if (savingsPct <= 0) return null;

  // Branded Tag (Pink Luxury Coupon Ticket)
  if (variant === 'primary') {
    return (
      <div className={cn("absolute top-2 z-20 pointer-events-none drop-shadow-lg", className)}>
        <motion.div
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative flex flex-col items-center justify-between bg-gradient-to-b from-[#FF3B8E] via-[#FF0055] to-[#CC0044] text-white font-outfit border border-white/20 overflow-hidden shadow-[0_6px_16px_rgba(255,0,85,0.35)]"
          style={{
            borderRadius: '10px 10px 14px 14px',
            width: size === 'sm' ? '38px' : size === 'md' ? '46px' : '56px',
            height: size === 'sm' ? '52px' : size === 'md' ? '64px' : '78px',
          }}
        >
          {/* Holographic Sheen Shimmer Sweep */}
          <motion.div
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 pointer-events-none"
          />

          {/* Ticket Punch/Hole Cuts on Left and Right Edges */}
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-4 bg-white rounded-full z-10 border-r border-slate-100" />
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-4 bg-white rounded-full z-10 border-l border-slate-100" />

          {/* Tiny Animated Sparkle Icon */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1 text-white/95"
          >
            <Sparkles className={cn(size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4')} />
          </motion.div>

          {/* Text Contents */}
          <div className="flex flex-col items-center justify-between h-full py-1.5 sm:py-2 z-10 select-none">
            <span className="text-[5px] sm:text-[7px] font-black text-pink-100 uppercase tracking-[0.2em] leading-none">SAVE</span>
            <span className="text-[11px] sm:text-[14px] font-black leading-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)] font-outfit">
              {savingsPct}%
            </span>
            <span className="text-[5px] sm:text-[7px] font-black text-pink-100 uppercase tracking-[0.15em] leading-none">OFF</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Generic/Sahi Recommended Tag (Smart Green Badge)
  return (
    <div className={cn("absolute top-2 z-20 pointer-events-none drop-shadow-lg", className)}>
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center bg-gradient-to-br from-[#00F5A0] via-[#00D17B] to-[#00A862] text-white font-outfit shadow-[0_6px_16px_rgba(0,209,123,0.35)] border border-white/20 overflow-visible"
        style={{
          borderRadius: '50%',
          width: size === 'sm' ? '42px' : size === 'md' ? '52px' : '64px',
          height: size === 'sm' ? '42px' : size === 'md' ? '52px' : '64px',
        }}
      >
        {/* Rotating Neon Dotted Dashing Border Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-[-3px] rounded-full border border-dashed border-emerald-300/60 pointer-events-none"
        />

        {/* Glossy radial overlay for premium shine */}
        <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none z-10" />

        {/* Small floating Verification Check Badge */}
        <div className="absolute -top-1 -right-1 bg-white text-emerald-600 rounded-full p-0.5 shadow-md border border-emerald-100 flex items-center justify-center z-20">
          <Check className={cn(size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5')} strokeWidth={4} />
        </div>

        {/* Text Contents */}
        <div className="flex flex-col items-center justify-center text-center z-10 leading-none select-none">
          <span className="text-[5px] sm:text-[7px] font-black text-emerald-50 tracking-[0.1em] uppercase">SMART</span>
          <span className="text-[11px] sm:text-[14px] font-black leading-tight drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)] my-0.5 font-outfit">
            {savingsPct}%
          </span>
          <span className="text-[5px] sm:text-[6px] font-black text-emerald-50 tracking-[0.15em] uppercase">SAVINGS</span>
        </div>
      </motion.div>
    </div>
  );
}
