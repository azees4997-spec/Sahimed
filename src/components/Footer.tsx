
'use client';

import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  
  // Do not show footer in admin area
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-white border-t py-12 px-6 mt-auto pb-32 sm:pb-12">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-6">
        <div className="flex items-center gap-3">
           <div className="bg-primary p-2 rounded-xl shadow-lg">
             <div className="text-white font-black text-[10px] tracking-tighter">SM</div>
           </div>
           <div className="flex flex-col items-start leading-none">
             <span className="font-black text-xl text-primary tracking-tighter">SahiMed</span>
             <span className="text-[7px] font-black text-primary/60 uppercase tracking-widest">sahi dawa sahi daam pe</span>
           </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">
            Sahimed copyright all rights reserved
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Licensed Clinical Pharmacy Network</span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50 w-full max-w-xs">
          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed">
            High-precision pharmaceutical logistics • Professional clinical review • Quality healthcare delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
