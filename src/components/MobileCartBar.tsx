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
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 animate-in slide-in-from-bottom-6 duration-500 ease-out">
      <Link href="/cart">
        <div className="bg-primary text-white rounded-[32px] p-5 shadow-2xl shadow-primary/50 flex items-center justify-between border border-white/20 backdrop-blur-md bg-primary/95 ring-4 ring-white/10 active:scale-95 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/10">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{totalItems} ITEMS ADDED</p>
              <p className="font-black text-xl tracking-tight">₹{totalPrice}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white text-primary rounded-full px-5 py-2.5 font-black text-[10px] uppercase tracking-widest shadow-lg">
            Checkout
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}
