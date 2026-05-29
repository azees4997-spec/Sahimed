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

  const isBranded = variant === 'primary';

  // Responsive dimensions & text sizes
  const sizes = {
    sm: {
      circleSize: '44px',
      saveText: 'text-[6px]',
      pctText: 'text-[12px]',
      labelTag: 'text-[5px]',
      iconSize: 'w-2 h-2',
      badgeSize: 'w-3.5 h-3.5',
      badgeOffset: '-top-1.5 -right-1.5',
      checkSize: 'w-2 h-2',
      checkPadding: 'p-[1px]',
    },
    md: {
      circleSize: '54px',
      saveText: 'text-[7.5px]',
      pctText: 'text-[15px]',
      labelTag: 'text-[6px]',
      iconSize: 'w-2.5 h-2.5',
      badgeSize: 'w-4 h-4',
      badgeOffset: '-top-1 -right-1',
      checkSize: 'w-2.5 h-2.5',
      checkPadding: 'p-0.5',
    },
    lg: {
      circleSize: '66px',
      saveText: 'text-[9px]',
      pctText: 'text-[19px]',
      labelTag: 'text-[7.5px]',
      iconSize: 'w-3 h-3',
      badgeSize: 'w-5 h-5',
      badgeOffset: '-top-0.5 -right-0.5',
      checkSize: 'w-3 h-3',
      checkPadding: 'p-0.5',
    }
  };

  const s = sizes[size];

  // Electric, high-contrast neon gradients and glow colors
  const theme = isBranded ? {
    // Branded Tag: Solid Deep Crimson/Red (Option 2)
    gradient: 'from-[#D32F2F] via-[#C62828] to-[#B71C1C]',
    glow: 'shadow-[0_8px_20px_rgba(198,40,40,0.45)]',
    borderColor: 'border-[#C62828]/70',
    label: 'OFF',
    iconColor: 'text-[#C62828]',
    icon: Sparkles,
  } : {
    // Generic Tag: Solid Forest Green (Option 2)
    gradient: 'from-[#2E7D32] via-[#1B5E20] to-[#0D3C13]',
    glow: 'shadow-[0_8px_20px_rgba(27,94,32,0.45)]',
    borderColor: 'border-[#1B5E20]/70',
    label: 'SMART',
    iconColor: 'text-[#1B5E20]',
    icon: Check,
  };

  const TopRightIcon = theme.icon;

  return (
    <div className={cn("absolute top-2 z-20 pointer-events-none", className)}>
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          y: [0, -3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "relative flex flex-col items-center justify-center text-white border border-white/40 overflow-visible bg-gradient-to-br",
          theme.gradient,
          theme.glow
        )}
        style={{
          borderRadius: '50%',
          width: s.circleSize,
          height: s.circleSize,
        }}
      >
        {/* Rotating Outer Dotted Dashing Ring */}
        <motion.div
          animate={{ rotate: isBranded ? 360 : -360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className={cn("absolute inset-[-4px] rounded-full border border-dashed pointer-events-none", theme.borderColor)}
        />

        {/* Glossy overlay for rich liquid glass shine */}
        <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-white/0 via-white/30 to-white/0 pointer-events-none z-10" />

        {/* Small floating verification badge at the top-right corner */}
        <div className={cn("absolute bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center z-20", s.badgeOffset, s.checkPadding, s.badgeSize)}>
          <TopRightIcon className={cn("stroke-[4px]", theme.iconColor, s.checkSize)} />
        </div>

        {/* High contrast, high impact texts (Pure white with distinct dark text-shadow) */}
        <div className="flex flex-col items-center justify-center leading-none text-center select-none z-10 px-1 font-outfit">
          <span className={cn("font-black tracking-[0.2em] text-white/90 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]", s.saveText)}>
            SAVE
          </span>
          <span className={cn("font-black tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)] my-0.5 font-outfit", s.pctText)}>
            {savingsPct}%
          </span>
          <span className={cn("font-black tracking-[0.15em] text-white/95 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]", s.labelTag)}>
            {theme.label}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
