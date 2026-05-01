"use client"

import React from 'react';
import { cn } from '@/lib/utils';

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

  const config = {
    primary: { // Branded - Now Pink
      from: 'from-[#FF3B8E]',
      via: 'via-[#FF0055]',
      to: 'to-[#CC0044]'
    },
    accent: { // Alternative/Generic - Now Green
      from: 'from-[#00D991]',
      via: 'via-[#00B377]',
      to: 'to-[#008C5D]'
    },
    success: { // Success variant (Green)
      from: 'from-[#00D991]',
      via: 'via-[#00B377]',
      to: 'to-[#008C5D]'
    }
  };

  const colors = config[variant];

  // Responsive sizes
  const sizeClasses = {
    sm: "w-5 sm:w-6 h-7 sm:h-9",
    md: "w-6 sm:w-7 h-8 sm:h-10",
    lg: "w-7 sm:w-10 h-10 sm:h-14"
  };

  return (
    <div className={cn("absolute top-0 z-20 pointer-events-none drop-shadow-md", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* The Ribbon Body */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-b rounded-t-sm flex flex-col items-center pt-0.5 sm:pt-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]",
          colors.from, colors.via, colors.to
        )}>
          <span className="text-[5.5px] sm:text-[7.5px] font-black text-white leading-none tracking-tighter uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Save</span>
          <span className="text-[8px] sm:text-[12px] font-black text-white leading-tight font-outfit drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.5)]">
            {savingsPct}%
          </span>
          <span className="text-[4.5px] sm:text-[6.5px] font-black text-white uppercase tracking-widest -mt-0.5 sm:mt-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">OFF</span>
        </div>
        
        {/* Serrated Bottom Edge (SVG) */}
        <div className="absolute -bottom-[5px] left-0 w-full">
          <svg viewBox="0 0 40 10" className="w-full h-[5px]" preserveAspectRatio="none">
            <path d="M0 0 L5 8 L10 0 L15 8 L20 0 L25 8 L30 0 L35 8 L40 0 V10 H0 Z" className={cn(variant === 'primary' ? 'fill-[#CC0044]' : 'fill-[#008C5D]')} />
          </svg>
        </div>
      </div>
    </div>
  );
}
