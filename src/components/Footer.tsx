
'use client';

import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  
  // Do not show footer in admin area
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-white border-t py-16 px-6 mt-auto pb-32 sm:pb-16">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
        {/* Brand Section */}
        <div className="flex items-center gap-5">
           <div className="bg-primary p-4 rounded-[22px] shadow-2xl shadow-primary/20">
             <div className="text-white font-black text-xl tracking-tighter">SM</div>
           </div>
           <div className="flex flex-col items-start leading-none">
             <span className="font-black text-4xl text-primary tracking-tighter uppercase">SahiMed</span>
             <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.43em] mt-1 text-left w-full">sahi dawa sahi daam pe</span>
           </div>
        </div>
        
        {/* Copyright & Network Section */}
        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
            <span className="text-3xl font-light leading-none">©</span> SahiMed | All rights reserved
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Licensed Clinical Pharmacy Network</span>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="pt-8 border-t border-gray-100 w-full max-w-sm">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-relaxed">
            High-precision pharmaceutical logistics • Professional clinical review • Quality healthcare delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
