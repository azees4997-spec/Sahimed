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

  // Responsive dimensions & text sizes
  const sizes = {
    sm: {
      width: '42px',
      height: '56px',
      saveText: 'text-[6px]',
      pctText: 'text-[11px]',
      offText: 'text-[6px]',
      circleSize: '40px',
      iconSize: 'w-2 h-2',
      checkSize: 'w-1.5 h-1.5',
      checkPadding: 'p-0.5',
    },
    md: {
      width: '48px',
      height: '66px',
      saveText: 'text-[7px]',
      pctText: 'text-[13px]',
      offText: 'text-[7px]',
      circleSize: '48px',
      iconSize: 'w-2.5 h-2.5',
      checkSize: 'w-2 h-2',
      checkPadding: 'p-0.5',
    },
    lg: {
      width: '58px',
      height: '80px',
      saveText: 'text-[8px]',
      pctText: 'text-[16px]',
      offText: 'text-[8px]',
      circleSize: '58px',
      iconSize: 'w-3 h-3',
      checkSize: 'w-2.5 h-2.5',
      checkPadding: 'p-1',
    }
  };

  const s = sizes[size];

  // 1. BRANDED DISCOUNT TAG (Premium Floating Shimmer Capsule)
  if (variant === 'primary') {
    return (
      <div className={cn("absolute top-2 z-20 pointer-events-none drop-shadow-xl", className)}>
        <motion.div
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative flex flex-col items-center justify-between bg-gradient-to-b from-[#FF2E93] via-[#FF0055] to-[#D8004F] text-white font-outfit border border-white/25 shadow-[0_8px_16px_rgba(255,0,85,0.25)] rounded-[12px] overflow-hidden"
          style={{
            width: s.width,
            height: s.height,
          }}
        >
          {/* Holographic light reflection sweep */}
          <motion.div
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
          />

          {/* Golden Sparkle at the top */}
          <div className="pt-1.5 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className={cn("text-pink-100", s.iconSize)} />
            </motion.div>
          </div>

          {/* Spaced Text Layout to prevent squishing */}
          <div className="flex flex-col items-center justify-center flex-1 py-1">
            <span className={cn("font-black tracking-[0.25em] text-pink-200 uppercase leading-none", s.saveText)}>SAVE</span>
            <span className={cn("font-black tracking-tight leading-none my-1 font-outfit drop-shadow-md", s.pctText)}>
              {savingsPct}%
            </span>
            <span className={cn("font-black tracking-[0.2em] text-pink-200 uppercase leading-none", s.offText)}>OFF</span>
          </div>
          
          <div className="pb-1" />
        </motion.div>
      </div>
    );
  }

  // 2. GENERIC / SAHI RECOMMENDED TAG (Smart Choice Minimalist Circle Badge)
  return (
    <div className={cn("absolute top-2 z-20 pointer-events-none drop-shadow-xl", className)}>
      <motion.div
        animate={{
          scale: [1, 1.03, 1],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white font-outfit shadow-[0_8px_16px_rgba(16,185,129,0.25)] border border-white/25 overflow-visible"
        style={{
          borderRadius: '50%',
          width: s.circleSize,
          height: s.circleSize,
        }}
      >
        {/* Soft rotating pulse ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-[-3px] rounded-full border border-dashed border-emerald-400/30 pointer-events-none"
        />

        {/* Glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />

        {/* Tiny checkmark indicator at top-right */}
        <div className={cn("absolute -top-0.5 -right-0.5 bg-white text-emerald-600 rounded-full shadow-md border border-emerald-100 flex items-center justify-center z-10", s.checkPadding)}>
          <Check className={cn("stroke-[4px]", s.checkSize)} />
        </div>

        {/* Dynamic percentage savings text */}
        <div className="flex flex-col items-center justify-center leading-none text-center select-none z-10 px-1">
          <span className="text-[5px] sm:text-[6px] font-black text-emerald-100 tracking-widest uppercase">SAVE</span>
          <span className={cn("font-black tracking-tight drop-shadow-sm my-0.5 font-outfit", s.pctText)}>
            {savingsPct}%
          </span>
          <span className="text-[4px] sm:text-[5px] font-black text-emerald-100 tracking-widest uppercase">SMART</span>
        </div>
      </motion.div>
    </div>
  );
}
