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
  
  // Color codes
  const blueColor = isWhite ? '#FFFFFF' : '#1E3A8A';
  const greenColor = '#15803D'; // Corporate Green
  
  return (
    <div className={cn("flex items-center select-none bg-transparent", className)}>
      {/* Native Vector SVG Logo Icon */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-8 h-8 sm:w-11 sm:h-11 shrink-0", iconClassName)}
      >
        <defs>
          {/* Mask to cut out a gap in the heart where the cross lies */}
          <mask id="cross-cutout">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <path
              d="M 54 34 L 54 66 M 38 50 L 70 50"
              stroke="black"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>

        {/* Heart curves with mask to create cutout spacing */}
        <g mask="url(#cross-cutout)">
          {/* Heart Left Symmetrical Loop */}
          <path
            d="M 50 24 C 28 4, 8 16, 8 46 C 8 72, 22 86, 38 76 C 48 70, 48 56, 40 48"
            stroke={blueColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Heart Right Symmetrical Loop */}
          <path
            d="M 50 24 C 72 4, 92 16, 92 46 C 92 72, 62 76 C 52 70, 52 56, 60 48"
            stroke={blueColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Green Medical Cross */}
        <path
          d="M 54 34 L 54 66 M 38 50 L 70 50"
          stroke={greenColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* SahiMed Typography */}
      {showText && (
        <div className={cn("flex flex-col ml-2 sm:ml-2.5 leading-none", textClassName)}>
          <div className="flex items-center leading-none">
            {/* "Sahi" */}
            <span 
              className="font-extrabold text-lg sm:text-2xl tracking-tight font-outfit"
              style={{ color: blueColor }}
            >
              Sahi
            </span>
            {/* "Med" */}
            <span 
              className="font-extrabold text-lg sm:text-2xl tracking-tight font-outfit"
              style={{ color: greenColor }}
            >
              Med
            </span>
          </div>
          {/* Tagline */}
          <div className="text-[6px] sm:text-[8px] font-black tracking-[0.08em] mt-0.5 font-outfit">
            <span style={{ color: blueColor }}>Sahi Dawai </span>
            <span style={{ color: greenColor }}>Sahi Daam Pe</span>
          </div>
        </div>
      )}
    </div>
  );
}
