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
    primary: {
      from: 'from-[#3B82F6]',
      via: 'via-[#2563EB]',
      to: 'to-[#1E40AF]',
      fold: 'bg-[#1E3A8A]'
    },
    accent: {
      from: 'from-[#F43F5E]',
      via: 'via-[#E11D48]',
      to: 'to-[#9F1239]',
      fold: 'bg-[#881337]'
    },
    success: {
      from: 'from-[#10B981]',
      via: 'via-[#059669]',
      to: 'to-[#047857]',
      fold: 'bg-[#064E3B]'
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
          "absolute inset-0 bg-gradient-to-b rounded-t-sm flex flex-col items-center pt-0.5 sm:pt-1",
          colors.from, colors.via, colors.to
        )}>
          <span className="text-[5px] sm:text-[7px] font-black text-white leading-none tracking-tighter uppercase opacity-80">Save</span>
          <span className="text-[7px] sm:text-[11px] font-black text-white leading-tight font-outfit">
            {savingsPct}%
          </span>
          <span className="text-[4px] sm:text-[6px] font-black text-white/90 uppercase tracking-widest -mt-0.5 sm:mt-0">OFF</span>
        </div>
        
        {/* Serrated Bottom Edge (SVG) */}
        <div className="absolute -bottom-[5px] left-0 w-full">
          <svg viewBox="0 0 40 10" className="w-full h-[5px]" preserveAspectRatio="none">
            <path d="M0 0 L5 8 L10 0 L15 8 L20 0 L25 8 L30 0 L35 8 L40 0 V10 H0 Z" className={cn(variant === 'primary' ? 'fill-[#1E40AF]' : variant === 'accent' ? 'fill-[#9F1239]' : 'fill-[#047857]')} />
          </svg>
        </div>

        {/* Fold effect at top (The darker flap) */}
        <div className={cn("absolute -top-[2px] left-0 w-1.5 h-[2px] rounded-tl-sm -skew-x-[45deg] origin-bottom-left", colors.fold)} />
      </div>
    </div>
  );
}
