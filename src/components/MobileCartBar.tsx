
"use client"

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileCartBar() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();

  // Don't show on cart or checkout pages
  const hideOnPaths = ['/cart', '/checkout', '/admin', '/login'];
  if (hideOnPaths.includes(pathname) || totalItems === 0) return null;

  return (
    <div className="sm:hidden fixed bottom-[72px] left-0 right-0 z-40 px-4 animate-in slide-in-from-bottom-4 duration-300">
      <Link href="/cart">
        <div className="bg-primary text-white rounded-2xl p-4 shadow-2xl shadow-primary/40 flex items-center justify-between border border-white/20 backdrop-blur-sm bg-primary/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{totalItems} Items in Cart</p>
              <p className="font-black text-lg">₹{totalPrice}</p>
            </div>
          </div>
          <Button variant="ghost" className="text-white font-black uppercase text-xs gap-2 hover:bg-white/10 px-0">
            View Cart
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Link>
    </div>
  );
}
