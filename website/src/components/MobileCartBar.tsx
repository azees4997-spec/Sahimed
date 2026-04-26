
"use client"

import { useCart } from '@/context/CartContext';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileCartBar() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();

  const hideOnPaths = ['/cart', '/checkout', '/Sahi-admin', '/login', '/prescription'];
  if (hideOnPaths.includes(pathname) || totalItems === 0) return null;

  return (
    <div className="sm:hidden fixed bottom-[92px] left-0 right-0 z-[160] animate-in slide-in-from-bottom-6 duration-500 ease-out">
      <Link href="/cart">
        <div className="w-full bg-primary text-white py-4 px-6 shadow-2xl shadow-primary/30 flex items-center justify-between border-t border-white/20 backdrop-blur-xl bg-primary/95 active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black tracking-[0.2em] text-white/60 mb-0.5">{totalItems} items</p>
              <p className="font-black text-lg tracking-tight">₹{Number(totalPrice).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white text-primary rounded-full px-4 py-2 font-black text-[9px] tracking-widest shadow-lg">
            Cart
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Link>
    </div>
  );
}
