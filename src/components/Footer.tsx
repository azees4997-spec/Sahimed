'use client';

import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  
  // Do not show footer in admin area
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-white border-t py-4 px-6 mt-auto pb-32 sm:pb-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-4">
        {/* Brand Section */}
        <div className="flex items-center gap-3">
           <div className="bg-primary p-1.5 rounded-[12px] shadow-lg shadow-primary/10">
             <div className="text-white font-black text-[10px] tracking-tighter">SM</div>
           </div>
           <div className="flex flex-col items-start leading-none">
             <span className="font-black text-xl text-primary tracking-tighter uppercase">SahiMed</span>
             <span className="text-[6px] font-black text-primary/70 uppercase tracking-[0.45em] mt-0.5 text-left w-full whitespace-nowrap">sahi dawa sahi daam pe</span>
           </div>
        </div>
        
        {/* Copyright & Network Section */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em] flex items-center justify-center gap-1.5">
            <span className="text-lg font-light leading-none">©</span> SahiMed | All rights reserved
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-3 h-3 text-accent/60" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em]">Licensed Clinical Pharmacy Network</span>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="pt-2 border-t border-gray-100 w-full max-w-xs">
          <p className="text-[7px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-relaxed">
            Precision Pharmaceutical Logistics • Quality Healthcare Delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
