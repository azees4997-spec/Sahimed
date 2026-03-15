
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SahiMedIcon } from './Navbar';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#020617] text-white py-3 px-6 border-t-2 border-[#0061AF]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
        
        {/* Brand Info - Ultra Compact */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-white p-1 rounded-xl flex items-center gap-2 mb-1">
            <SahiMedIcon className="w-6 h-6" />
            <div className="flex items-center leading-none">
              <span className="font-black text-lg text-[#0061AF] tracking-tighter">Sahi</span>
              <span className="font-black text-lg text-[#2E8B57] tracking-tighter">Med</span>
            </div>
          </div>
          <span className="text-[8px] font-black text-[#0061AF] uppercase tracking-[0.2em]">Sahi Dawai, Sahi Daam Pe</span>
        </div>

        {/* Links Section - Single Horizontal Row */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[9px] font-bold uppercase tracking-tight text-gray-500">
          <Link href="/search" className="hover:text-white transition-colors">Shop Generic</Link>
          <Link href="#" className="hover:text-white transition-colors">Health Articles</Link>
          <Link href="#" className="hover:text-white transition-colors">Offers</Link>
          <Link href="#" className="hover:text-white transition-colors">Contact Us</Link>
          <Link href="#" className="hover:text-white transition-colors">FAQs</Link>
          <Link href="#" className="hover:text-white transition-colors">Policies</Link>
        </div>

        <div className="w-full pt-2 border-t border-white/5 text-center">
          <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em]">
            © Copyright 2026 SAHIMED. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
