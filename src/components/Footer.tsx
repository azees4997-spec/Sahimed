
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#020617] text-white py-12 px-6 mt-auto pb-32 sm:pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Col */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded-lg">
                  <span className="text-black font-black text-[10px]">SM</span>
                </div>
                <span className="font-black text-2xl tracking-tighter uppercase">SahiMed</span>
              </div>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-1">Sahi Dawa Sahi Daam pe</span>
            </div>
            <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-xs">
              Providing high-quality affordable healthcare solutions for everyone across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/search" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">Shop Generic</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">Health Articles</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">Offers</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">FAQs</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-xs font-bold transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 text-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            © Copyright 2026 SAHIMED. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
