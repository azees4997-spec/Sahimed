"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

  const isBranded = variant === 'primary';

  // Beautiful high-visibility gradient colors
  const colors = isBranded 
    ? {
        from: 'from-[#FF3B8E]',
        via: 'via-[#FF0055]',
        to: 'to-[#CC0044]',
        serratedFill: 'fill-[#CC0044]',
        fold: 'bg-[#990033]'
      }
    : {
        from: 'from-[#00D991]',
        via: 'via-[#00B377]',
        to: 'to-[#008C5D]',
        serratedFill: 'fill-[#008C5D]',
        fold: 'bg-[#005A3C]'
      };

  // Responsive dimensions matching the original pixel-perfect layout
  const sizes = {
    sm: {
      container: "w-[24px] sm:w-[28px] h-[34px] sm:h-[40px]",
      saveText: "text-[5.5px] sm:text-[6.5px]",
      pctText: "text-[8.5px] sm:text-[10.5px]",
      offText: "text-[4.5px] sm:text-[5.5px]",
      bottomOffset: "-bottom-[4px]",
      bottomHeight: "h-[4px]",
      foldOffset: "-top-[1.5px]",
      foldSize: "w-1 h-[1.5px]"
    },
    md: {
      container: "w-[30px] sm:w-[36px] h-[42px] sm:h-[50px]",
      saveText: "text-[6px] sm:text-[7.5px]",
      pctText: "text-[10px] sm:text-[13px]",
      offText: "text-[5px] sm:text-[6.5px]",
      bottomOffset: "-bottom-[5px]",
      bottomHeight: "h-[5px]",
      foldOffset: "-top-[2px]",
      foldSize: "w-1.5 h-[2px]"
    },
    lg: {
      container: "w-[36px] sm:w-[44px] h-[52px] sm:h-[64px]",
      saveText: "text-[7.5px] sm:text-[9px]",
      pctText: "text-[12px] sm:text-[16px]",
      offText: "text-[6.5px] sm:text-[8px]",
      bottomOffset: "-bottom-[6px]",
      bottomHeight: "h-[6px]",
      foldOffset: "-top-[2.5px]",
      foldSize: "w-2 h-[2.5px]"
    }
  };

  const s = sizes[size];

  return (
    <div className={cn("absolute top-0 z-20 pointer-events-none drop-shadow-md", className)}>
      <motion.div 
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn("relative", s.container)}
      >
        {/* The Ribbon Body */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-b rounded-t-sm flex flex-col items-center pt-0.5 sm:pt-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]",
          colors.from, colors.via, colors.to
        )}>
          <span className={cn("font-black text-white leading-none tracking-tighter uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]", s.saveText)}>
            Save
          </span>
          <span className={cn("font-black text-white leading-tight font-outfit drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.5)] my-0.5", s.pctText)}>
            {savingsPct}%
          </span>
          <span className={cn("font-black text-white uppercase tracking-widest leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]", s.offText)}>
            OFF
          </span>
        </div>
        
        {/* Serrated Bottom Edge (SVG) */}
        <div className={cn("absolute left-0 w-full", s.bottomOffset)}>
          <svg viewBox="0 0 40 10" className={cn("w-full", s.bottomHeight)} preserveAspectRatio="none">
            <path d="M0 0 L5 8 L10 0 L15 8 L20 0 L25 8 L30 0 L35 8 L40 0 V10 H0 Z" className={colors.serratedFill} />
          </svg>
        </div>

      </motion.div>
    </div>
  );
}
