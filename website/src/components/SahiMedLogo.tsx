"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

interface SahiMedLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  variant?: 'default' | 'white';
  placement?: 'nav' | 'footer';
}

export default function SahiMedLogo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  variant = 'default',
  placement = 'nav'
}: SahiMedLogoProps) {
  const db = useFirestore();
  const docRef = useMemoFirebase(() => doc(db, 'settings', 'logo'), [db]);
  const { data: logoSettings, isLoading } = useDoc(docRef);

  const isWhite = variant === 'white';
  
  // Color codes
  const blueColor = isWhite ? '#FFFFFF' : '#1E3A8A';
  const greenColor = '#15803D'; // Corporate Green

  // Resolve custom uploaded logo url if present
  const resolvedLogoUrl = isWhite 
    ? (logoSettings?.whiteLogoUrl || logoSettings?.logoUrl) 
    : logoSettings?.logoUrl;

  const rawDesktop = (placement === 'footer' ? logoSettings?.footerHeightDesktop : logoSettings?.navHeightDesktop);
  const rawMobile = (placement === 'footer' ? logoSettings?.footerHeightMobile : logoSettings?.navHeightMobile);
  
  // Ensure we have reasonable heights (minimum 30px for desktop, 20px for mobile) so the logo remains legible
  const desktopHeight = typeof rawDesktop === 'number' && rawDesktop > 0 ? Math.max(30, rawDesktop) : 44;
  const mobileHeight = typeof rawMobile === 'number' && rawMobile > 0 ? Math.max(20, rawMobile) : 32;

  if (resolvedLogoUrl) {
    return (
      <div className={cn("flex items-center justify-start select-none bg-transparent h-full py-1", className)}>
        <img 
          src={resolvedLogoUrl} 
          style={{ 
            '--logo-h-desktop': `${desktopHeight}px`, 
            '--logo-h-mobile': `${mobileHeight}px` 
          } as React.CSSProperties} 
          className="w-auto object-contain h-[var(--logo-h-mobile)] sm:h-[var(--logo-h-desktop)]" 
          alt="SahiMed" 
        />
      </div>
    );
  }

  return (
    <div 
      className={cn("flex items-center select-none bg-transparent h-full py-1", className)}
      style={{
        '--logo-h-desktop': `${desktopHeight}px`,
        '--logo-h-mobile': `${mobileHeight}px`
      } as React.CSSProperties}
    >
      {/* Native Vector SVG Logo Icon */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0 h-[var(--logo-h-mobile)] w-[var(--logo-h-mobile)] sm:h-[var(--logo-h-desktop)] sm:w-[var(--logo-h-desktop)] transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98]", iconClassName)}
      >
        <defs>
          {/* Mask to cut out a gap in the heart where the cross lies */}
          <mask id="cross-cutout">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <path
              d="M 56 38 L 56 62 M 44 50 L 68 50"
              stroke="black"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>

        {/* Heart curves with mask to create cutout spacing */}
        <g mask="url(#cross-cutout)">
          {/* Heart Left Symmetrical Loop (Meets at bottom tip 50 86) */}
          <path
            d="M 50 24 C 28 4, 8 16, 8 46 C 8 70, 24 82, 50 86 C 36 78, 36 62, 42 50"
            stroke={blueColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Heart Right Symmetrical Loop (Meets at bottom tip 50 86) */}
          <path
            d="M 50 24 C 72 4, 92 16, 92 46 C 92 70, 76 82, 50 86 C 64 78, 64 62, 58 50"
            stroke={blueColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Green Medical Cross */}
        <path
          d="M 56 38 L 56 62 M 44 50 L 68 50"
          stroke={greenColor}
          strokeWidth="10"
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
              className="font-extrabold tracking-tight font-outfit"
              style={{ 
                color: blueColor,
                fontSize: 'calc(var(--logo-h-mobile) * 0.55)',
                lineHeight: 1
              }}
              // Scale desktop font size cleanly via custom Tailwind/CSS logic or media classes if necessary,
              // but style attribute with var() references is fully reactive.
            >
              <span className="hidden sm:inline" style={{ fontSize: 'calc(var(--logo-h-desktop) * 0.55)' }}>Sahi</span>
              <span className="inline sm:hidden">Sahi</span>
            </span>
            {/* "Med" */}
            <span 
              className="font-extrabold tracking-tight font-outfit"
              style={{ 
                color: greenColor,
                fontSize: 'calc(var(--logo-h-mobile) * 0.55)',
                lineHeight: 1
              }}
            >
              <span className="hidden sm:inline" style={{ fontSize: 'calc(var(--logo-h-desktop) * 0.55)' }}>Med</span>
              <span className="inline sm:hidden">Med</span>
            </span>
          </div>
          {/* Tagline */}
          <div 
            className="font-black tracking-[0.08em] mt-0.5 font-outfit"
            style={{ fontSize: 'calc(var(--logo-h-mobile) * 0.18)' }}
          >
            <span className="hidden sm:inline" style={{ fontSize: 'calc(var(--logo-h-desktop) * 0.18)' }}>
              <span style={{ color: blueColor }}>Sahi Dawai </span>
              <span style={{ color: greenColor }}>Sahi Daam Pe</span>
            </span>
            <span className="inline sm:hidden">
              <span style={{ color: blueColor }}>Sahi Dawai </span>
              <span style={{ color: greenColor }}>Sahi Daam Pe</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
