
"use client"

import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileCartBar() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();

  // Don't show on pages that already handle cart or checkout logic
  const hideOnPaths = ['/cart', '/checkout', '/admin', '/login', '/prescription'];
  if (hideOnPaths.includes(pathname) || totalItems === 0) return null;

  return (
    <div className="sm:hidden fixed bottom-20 left-0 right-0 z-40 px-4 animate-in slide-in-from-bottom-6 duration-500 ease-out">
      <Link href="/cart">
        <div className="bg-primary text-white rounded-[24px] p-4 shadow-2xl shadow-primary/50 flex items-center justify-between border border-white/20 backdrop-blur-md bg-primary/95 active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">{totalItems} ITEMS</p>
              <p className="font-black text-lg tracking-tight">₹{totalPrice}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white text-primary rounded-full px-4 py-2 font-black text-[9px] uppercase tracking-widest shadow-lg">
            Cart
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Link>
    </div>
  );
}
