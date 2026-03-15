
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SahiMedIcon } from './Navbar';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#020617] text-white py-6 px-6 border-t-4 border-[#0061AF]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        
        {/* Brand Info - Centered */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-white p-2 rounded-2xl flex items-center gap-3">
            <SahiMedIcon className="w-8 h-8" />
            <div className="flex items-center">
              <span className="font-black text-xl text-[#0061AF] tracking-tighter">Sahi</span>
              <span className="font-black text-xl text-[#2E8B57] tracking-tighter">Med</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-[#0061AF] uppercase tracking-[0.2em]">Sahi Dawai, Sahi Daam Pe</span>
          <p className="text-gray-400 text-[9px] font-medium leading-relaxed max-w-sm uppercase tracking-tight opacity-60">
            Providing high-quality affordable healthcare solutions for everyone across India.
          </p>
        </div>

        {/* Minimal Links - Horizontal Layout */}
        <div className="flex flex-row justify-center gap-12 w-full max-w-lg">
          <div className="space-y-2 text-center">
            <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-white/30">Quick Links</h4>
            <ul className="space-y-1">
              <li><Link href="/search" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Shop Generic</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Health Articles</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Offers</Link></li>
            </ul>
          </div>

          <div className="space-y-2 text-center">
            <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-white/30">Support</h4>
            <ul className="space-y-1">
              <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Contact Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">FAQs</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Policies</Link></li>
            </ul>
          </div>
        </div>

        <div className="w-full pt-4 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">
            © Copyright 2026 SAHIMED. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
