"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShoppingBag className="w-8 h-8 text-gray-200" />
          </div>
          <h1 className="text-2xl font-bold mb-3 font-headline">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6 text-sm">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-10 h-12 font-bold shadow-lg shadow-primary/20">
              Start Shopping
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <h1 className="text-2xl font-bold font-headline mb-6 text-gray-900">Your Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-primary/20 transition-all">
                <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.id}`}>
                    <h3 className="font-bold text-gray-900 truncate hover:text-primary transition-colors text-sm">{item.name}</h3>
                  </Link>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 italic">{item.saltComposition}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center border rounded-full bg-gray-50 h-8 px-1">
                      <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-2.5 h-2.5" />
                      </Button>
                      <span className="w-6 text-center font-bold text-[11px]">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 h-auto" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-black text-gray-900">₹{item.price * item.quantity}</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">₹{item.price} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl border sticky top-20">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold uppercase text-[10px]">FREE</span>
                </div>
                <div className="pt-3 border-t flex justify-between">
                  <span className="text-base font-bold">Grand Total</span>
                  <span className="text-xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>
              
              <Link href="/checkout">
                 <Button className="w-full rounded-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform gap-2">
                   Proceed to Checkout
                   <ArrowRight className="w-3.5 h-3.5" />
                 </Button>
              </Link>
              
              <div className="mt-6 pt-6 border-t">
                 <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-gray-50 p-2.5 rounded-lg">
                   <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                   Safe & secure payments. 100% authentic medicines.
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
