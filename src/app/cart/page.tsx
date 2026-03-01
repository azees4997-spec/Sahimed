
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
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
          </div>
          <h1 className="text-3xl font-bold mb-4 font-headline">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 text-lg">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-12 h-14 font-bold shadow-lg shadow-primary/20">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <h1 className="text-3xl font-bold font-headline mb-8 text-gray-900">Your Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:border-primary/20 transition-all">
                <div className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.id}`}>
                    <h3 className="font-bold text-gray-900 truncate hover:text-primary transition-colors">{item.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">{item.saltComposition}</p>
                  <div className="mt-3 flex items-center gap-6">
                    <div className="flex items-center border rounded-full bg-gray-50 h-10 px-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 h-auto" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-gray-900">₹{item.price * item.quantity}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">₹{item.price} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl border sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold uppercase text-xs">FREE</span>
                </div>
                <div className="pt-4 border-t flex justify-between">
                  <span className="text-lg font-bold">Grand Total</span>
                  <span className="text-2xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>
              
              <Link href="/checkout">
                 <Button className="w-full rounded-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform gap-2">
                   Proceed to Checkout
                   <ArrowRight className="w-5 h-5" />
                 </Button>
              </Link>
              
              <div className="mt-8 pt-8 border-t">
                 <div className="flex items-center gap-3 text-xs text-muted-foreground bg-gray-50 p-3 rounded-xl">
                   <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                   Safe & secure payments. 100% authentic medicines guaranteed.
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
