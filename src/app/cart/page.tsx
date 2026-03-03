
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  // Calculate detailed billing
  const totalMrp = cart.reduce((acc, item) => acc + (item.mrp || item.price + 50) * item.quantity, 0);
  const discount = totalMrp - totalPrice;
  const shippingFee = 0;
  const handlingFee = 5; // Professional handling fee for clinical supplies
  const totalPayable = totalPrice + shippingFee + handlingFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShoppingBag className="w-6 h-6 text-gray-200" />
          </div>
          <h1 className="text-xl font-black mb-2 uppercase tracking-tight text-gray-900">Your bag is empty</h1>
          <p className="text-gray-400 mb-6 text-[10px] font-bold uppercase tracking-widest">Build your health journey today.</p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-10 h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
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
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Shopping Bag</h1>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
            {totalItems} items
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-all">
                <Link href={`/product/${item.id}`} className="relative w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 active:scale-95 transition-transform">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.id}`} className="group/title">
                    <h3 className="font-black text-gray-900 truncate group-hover/title:text-primary transition-colors text-[11px] uppercase tracking-tight mb-0.5">{item.name}</h3>
                  </Link>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate mb-2">{item.saltComposition}</p>
                  
                  <div className="flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 border">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-gray-400 hover:text-primary transition-colors shadow-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-black text-gray-900 w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-gray-400 hover:text-primary transition-colors shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                  <p className="text-[7px] text-gray-400 uppercase tracking-widest font-black line-through">₹{(item.mrp || item.price + 50) * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 sticky top-20">
              <h2 className="text-[10px] font-black mb-8 uppercase tracking-widest text-gray-400">Clinical Bill Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Total MRP</span>
                  <span>₹{totalMrp}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Clinical Discount</span>
                  <span className="text-green-600">- ₹{discount}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Shipping Fee</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Handling Fee</span>
                  <span className="text-gray-900">₹{handlingFee}</span>
                </div>
                
                <div className="pt-6 border-t border-dashed flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Payable</span>
                  <span className="text-3xl font-black text-primary">₹{totalPayable}</span>
                </div>
                
                {discount > 0 && (
                  <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-[8px] text-green-700 font-black uppercase tracking-widest">
                      You are saving ₹{discount} on this order
                    </p>
                  </div>
                )}
              </div>
              
              <Link href="/checkout">
                 <Button className="w-full rounded-full h-16 text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform gap-3 bg-primary text-white">
                   Proceed to Checkout
                   <ArrowRight className="w-4 h-4" />
                 </Button>
              </Link>
              
              <div className="mt-8 pt-6 border-t flex items-center gap-3">
                 <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                 </div>
                 <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   Pharmacist Verified • Secure Clinical Gateway
                 </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
