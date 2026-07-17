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
  const rawLogoUrl = isWhite 
    ? (logoSettings?.whiteLogoUrl || logoSettings?.logoUrl) 
    : logoSettings?.logoUrl;

  // Filter out the old logo URL from Firestore so it doesn't cause a flash/flicker
  const customLogoUrl = rawLogoUrl && !rawLogoUrl.includes('logo_1774883395013.png') 
    ? rawLogoUrl 
    : null;

  const rawDesktop = (placement === 'footer' ? logoSettings?.footerHeightDesktop : logoSettings?.navHeightDesktop);
  const rawMobile = (placement === 'footer' ? logoSettings?.footerHeightMobile : logoSettings?.navHeightMobile);
  
  const desktopHeight = typeof rawDesktop === 'number' && rawDesktop > 0 ? Math.max(30, rawDesktop) : 80;
  const mobileHeight = typeof rawMobile === 'number' && rawMobile > 0 ? Math.max(20, rawMobile) : 60;

  // If a custom logo URL is configured, render it as an image
  if (customLogoUrl) {
    return (
      <div className={cn("flex items-center justify-start select-none bg-transparent h-full py-1", className)}>
        <img 
          src={customLogoUrl} 
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

  // Otherwise, render our premium inline SVG logo (zero HTTP request, zero SSR hydration flash)
  return (
    <div 
      className={cn("flex items-center justify-start select-none bg-transparent h-full py-1", className)}
      style={{ 
        '--logo-h-desktop': `${desktopHeight}px`, 
        '--logo-h-mobile': `${mobileHeight}px` 
      } as React.CSSProperties}
    >
      <svg 
        viewBox="0 0 540 120" 
        className="w-auto h-[var(--logo-h-mobile)] sm:h-[var(--logo-h-desktop)] transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(10, 10)">
          <mask id={isWhite ? "ecg-gap-white" : "ecg-gap-color"}>
            <rect x="0" y="0" width="120" height="100" fill="white" />
            <rect x="0" y="41" width="120" height="18" fill="black" />
          </mask>
          
          <path 
            d="M 60 92 C 57.5 92 15 58 15 34 C 15 18 27.5 5 44 5 C 51.5 5 57 8 60 11 C 63 8 68.5 5 76 5 C 92.5 5 105 18 105 34 C 105 58 62.5 92 60 92 Z" 
            fill="none" 
            stroke={isWhite ? "white" : "#009F9C"} 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            mask={`url(#${isWhite ? "ecg-gap-white" : "ecg-gap-color"})`}
          />
          
          <path 
            d="M 5 50 L 32 50 L 40 50 L 45 42 L 50 62 L 56 12 L 64 88 L 72 38 L 78 50 L 86 50 L 115 50" 
            fill="none" 
            stroke={isWhite ? "white" : "#FF5C2B"} 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </g>
        
        {showText && (
          <text 
            x="145" 
            y="76" 
            fontFamily="'Outfit', 'Poppins', sans-serif" 
            fontSize="64" 
            fontWeight="600" 
            letterSpacing="-0.03em"
            fill={isWhite ? "white" : "#009F9C"}
          >
            Sahi
            <tspan fontWeight="900" fill={isWhite ? "white" : "#FF5C2B"}>Med</tspan>
          </text>
        )}
      </svg>
    </div>
  );
}

