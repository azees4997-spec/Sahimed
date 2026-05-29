import React from 'react';
import { cn } from '@/lib/utils';

interface SahiMedLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  variant?: 'default' | 'white';
}

export default function SahiMedLogo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  variant = 'default'
}: SahiMedLogoProps) {
  const isWhite = variant === 'white';
  
  // Dynamic color mappings based on theme variant
  const heartColor = isWhite ? '#FFFFFF' : '#1E3A8A';
  const sahiTextColor = isWhite ? 'text-white' : 'text-[#1E3A8A]';
  const medTextColor = 'text-[#E11D48]'; // Always Accent Pink
  const pulseColor = '#E11D48'; // Always Accent Pink
  const subtitleColor = isWhite ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={cn("flex items-center select-none bg-transparent", className)}>
      {/* Native SVG Heart & Pulse Icon */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-8 h-8 sm:w-11 sm:h-11 shrink-0", iconClassName)}
      >
        {/* Heart Left Curve */}
        <path
          d="M 50 25 C 28 5, 6 18, 6 46 C 6 72, 30 88, 50 96"
          stroke={heartColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Heart Right Folded Curve */}
        {/* Right side breaks and folds smoothly downward/inward inside the heart */}
        <path
          d="M 50 25 C 72 5, 94 18, 94 46 C 94 68, 80 82, 65 72 C 54 64, 52 50, 52 42"
          stroke={heartColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Continuous ECG Pulse Line */}
        {/* Features 3 distinct, sharp ECG spikes traversing horizontally */}
        <path
          d="M -5 54 L 20 54 L 24 62 L 28 35 L 32 54 L 40 54 L 43 72 L 48 15 L 53 65 L 56 54 L 64 54 L 68 30 L 72 65 L 75 54 L 105 54"
          stroke={pulseColor}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* SahiMed Typography */}
      {showText && (
        <div className={cn("flex flex-col ml-2 sm:ml-2.5 leading-none", textClassName)}>
          <div className="flex items-center leading-none">
            {/* "Sahi" - Medium Weight */}
            <span className={cn("font-medium text-lg sm:text-2xl tracking-tight font-outfit", sahiTextColor)}>
              Sahi
            </span>
            {/* "Med" - Bold Weight */}
            <span className={cn("font-extrabold text-lg sm:text-2xl tracking-tight font-outfit", medTextColor)}>
              Med
            </span>
          </div>
          {/* Subtitle tag */}
          <span className={cn("text-[7.5px] sm:text-[9px] font-black tracking-[0.15em] uppercase mt-0.5 font-outfit", subtitleColor)}>
            Sahi dawai sahi daam pe
          </span>
        </div>
      )}
    </div>
  );
}
