import React from 'react';
import { cn } from '@/lib/utils';
import { useBranding } from '@/context/BrandingContext';

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
  const { logoSettings } = useBranding();

  const isWhite = variant === 'white';
  
  // Color codes
  const blueColor = isWhite ? '#FFFFFF' : '#1E3A8A';
  const greenColor = '#15803D'; // Corporate Green

  // Resolve custom uploaded logo url if present
  const resolvedLogoUrl = isWhite 
    ? (logoSettings?.whiteLogoUrl || logoSettings?.logoUrl) 
    : logoSettings?.logoUrl;

  if (resolvedLogoUrl) {
    const rawDesktop = (placement === 'footer' ? logoSettings?.footerHeightDesktop : logoSettings?.navHeightDesktop);
    const rawMobile = (placement === 'footer' ? logoSettings?.footerHeightMobile : logoSettings?.navHeightMobile);
    
    // Ensure we have premium heights (minimum 40px for desktop, 28px for mobile) so the logo remains legible and looks premium
    const desktopHeight = typeof rawDesktop === 'number' && rawDesktop > 0 ? Math.max(40, rawDesktop) : 44;
    const mobileHeight = typeof rawMobile === 'number' && rawMobile > 0 ? Math.max(28, rawMobile) : 32;

    return (
      <div className={cn("flex items-center justify-start select-none bg-transparent h-full min-h-[32px] sm:min-h-[44px] py-1", className)}>
        <img 
          src={resolvedLogoUrl} 
          style={{ 
            '--logo-h-desktop': `${desktopHeight}px`, 
            '--logo-h-mobile': `${mobileHeight}px` 
          } as React.CSSProperties} 
          className="w-auto object-contain h-[var(--logo-h-mobile)] sm:h-[var(--logo-h-desktop)] transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98]" 
          alt="SahiMed" 
        />
      </div>
    );
  }

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
