
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShoppingBag className="w-6 h-6 text-gray-200" />
          </div>
          <h1 className="text-xl font-black mb-2 uppercase tracking-tight">Your cart is empty</h1>
          <p className="text-gray-400 mb-6 text-[10px] font-bold uppercase tracking-widest">Build your health journey today.</p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-10 h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              Start Shopping
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-black mb-6 text-gray-900 uppercase tracking-tight">Shopping Bag</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3 group hover:shadow-md transition-all">
                <div className="relative w-14 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.id}`}>
                    <h3 className="font-black text-gray-900 truncate hover:text-primary transition-colors text-[10px] uppercase tracking-tight">{item.name}</h3>
                  </Link>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate">{item.saltComposition}</p>
                  <div className="mt-1.5 flex items-center gap-4">
                    <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase">Qty: {item.quantity}</span>
                    <Button variant="ghost" className="text-red-400 hover:text-red-500 p-1 h-auto" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                  <p className="text-[7px] text-gray-400 uppercase tracking-widest font-black">₹{item.price} EA</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-50 sticky top-20">
              <h2 className="text-xs font-black mb-6 uppercase tracking-widest text-gray-400">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-gray-900">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="text-green-600 font-black">FREE</span>
                </div>
                <div className="pt-4 border-t flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-tight">Total</span>
                  <span className="text-2xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>
              
              <Link href="/checkout">
                 <Button className="w-full rounded-full h-14 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform gap-2">
                   Checkout Now
                   <ArrowRight className="w-4 h-4" />
                 </Button>
              </Link>
              
              <div className="mt-8 pt-6 border-t flex items-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                 <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   Pharmacist Verified • Secure Checkout
                 </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
