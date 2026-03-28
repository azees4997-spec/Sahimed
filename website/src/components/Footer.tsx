
"use client"

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SahiMedIcon } from './Navbar';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#020617] text-white pt-6 pb-32 sm:pb-10 px-6 border-t-2 border-primary">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        
        <div className="flex flex-col items-center text-center">
          <div className="bg-white p-1.5 rounded-xl flex items-center gap-2 mb-1.5 shadow-lg shadow-black/20">
            <SahiMedIcon className="w-7 h-7" />
            <div className="flex items-center leading-none">
              <span className="font-black text-xl text-primary tracking-tighter">Sahi</span>
              <span className="font-black text-xl text-accent tracking-tighter">Med</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-black tracking-widest text-gray-400">
          <Link href="/search" className="hover:text-white transition-colors">Shop generic</Link>
          <Link href="#" className="hover:text-white transition-colors">Health articles</Link>
          <Link href="#" className="hover:text-white transition-colors">Offers</Link>
          <Link href="#" className="hover:text-white transition-colors">Contact us</Link>
          <Link href="#" className="hover:text-white transition-colors">FAQs</Link>
          <Link href="#" className="hover:text-white transition-colors">Policies</Link>
        </div>

        <div className="w-full pt-4 border-t border-white/5 text-center">
          <p className="text-[8px] font-bold text-gray-600 tracking-[0.2em]">
            © {new Date().getFullYear()} SahiMed Pharmacy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
