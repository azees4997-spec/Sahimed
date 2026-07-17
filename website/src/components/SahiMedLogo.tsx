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

  // Filter out any Firestore logo URL that contains the old logo ID (logo_1774883395013)
  const customLogoUrl = rawLogoUrl && !rawLogoUrl.includes('logo_1774883395013') 
    ? rawLogoUrl 
    : null;

  // Fallback to the local high-fidelity PNG logos with cache-busting query to bypass browser cache
  const resolvedLogoUrl = customLogoUrl || (isWhite ? '/sahimed_logo_white.png?v=3' : '/sahimed_logo_transparent.png?v=3');

  const rawDesktop = (placement === 'footer' ? logoSettings?.footerHeightDesktop : logoSettings?.navHeightDesktop);
  const rawMobile = (placement === 'footer' ? logoSettings?.footerHeightMobile : logoSettings?.navHeightMobile);
  
  const desktopHeight = typeof rawDesktop === 'number' && rawDesktop > 0 ? Math.max(30, rawDesktop) : 80;
  const mobileHeight = typeof rawMobile === 'number' && rawMobile > 0 ? Math.max(20, rawMobile) : 60;

  return (
    <div className={cn("flex items-center justify-start select-none bg-transparent h-full py-1", className)}>
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


