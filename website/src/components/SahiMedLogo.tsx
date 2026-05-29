import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  variant = 'default'
}: SahiMedLogoProps) {
  const isWhite = variant === 'white';
  const logoSrc = isWhite ? '/sahimed_logo_white.png' : '/sahimed_logo_transparent.png';

  return (
    <div className={cn("flex items-center select-none bg-transparent", className)}>
      <Image
        src={logoSrc}
        alt="SahiMed"
        width={180}
        height={48}
        className={cn("h-8 w-auto sm:h-10", iconClassName)}
        priority
      />
    </div>
  );
}
