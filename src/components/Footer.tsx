'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#020617] text-white py-4 px-6 mt-auto pb-24 sm:pb-8 border-t-4 border-primary">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          {/* Brand Info */}
          <div className="space-y-2">
            <div className="flex flex-col items-start">
              <div className="bg-white p-1 rounded-lg mb-1">
                <span className="text-black font-black text-[9px] px-1">SAHIMED</span>
              </div>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Sahi Dawa Sahi Daam pe</span>
            </div>
            <p className="text-gray-400 text-[9px] font-medium leading-relaxed max-w-sm uppercase tracking-tight opacity-60">
              Providing high-quality affordable healthcare solutions for everyone across India.
            </p>
          </div>

          {/* Minimal Links Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-white/30">Quick Links</h4>
              <ul className="space-y-1">
                <li><Link href="/search" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Shop Generic</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Health Articles</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Offers</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-white/30">Support</h4>
              <ul className="space-y-1">
                <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Contact Us</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">FAQs</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-[10px] font-bold transition-colors uppercase tracking-tight">Policies</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">
            © Copyright 2026 SAHIMED. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
