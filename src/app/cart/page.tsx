"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus, Tag, Check, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, activeFees, availablePromos, appliedPromo, applyPromo } = useCart();
  const { toast } = useToast();

  // Billing Calculations
  const totalMrp = cart.reduce((acc, item) => acc + (item.mrp || item.price + 50) * item.quantity, 0);
  const baseDiscount = totalMrp - totalPrice;
  
  // Calculate dynamic fees
  const feeTotal = activeFees.reduce((acc, fee) => {
    if (fee.type === 'fixed') return acc + fee.amount;
    return acc + (totalPrice * (fee.amount / 100));
  }, 0);

  // Calculate promo discount
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'fixed') {
      promoDiscount = appliedPromo.discountValue;
    } else {
      promoDiscount = (totalPrice * (appliedPromo.discountValue / 100));
    }
  }

  const finalPayable = Math.max(0, totalPrice + feeTotal - promoDiscount);

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

  const handleApplyPromo = (promo: any) => {
    if (totalPrice < promo.minOrderValue) {
      toast({ variant: 'destructive', title: 'Criteria Not Met', description: `Add ₹${promo.minOrderValue - totalPrice} more to use this code.` });
      return;
    }
    applyPromo(promo);
    toast({ title: 'Promo Applied', description: `Discount of ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '₹'} applied.` });
  };

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
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-xl transition-all duration-300">
                <Link href={`/product/${item.id}`} className="relative w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 active:scale-95 transition-transform">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.id}`} className="group/title">
                    <h3 className="font-black text-gray-900 truncate group-hover/title:text-primary transition-colors text-[11px] uppercase tracking-tight mb-1">{item.name}</h3>
                  </Link>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate mb-3">{item.saltComposition}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-full p-1 border shadow-inner">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-400 hover:text-primary transition-all shadow-md active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-black text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-400 hover:text-primary transition-all shadow-md active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all flex items-center justify-center active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-black text-gray-900">₹{item.price * item.quantity}</p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-widest font-black line-through">₹{(item.mrp || item.price + 50) * item.quantity}</p>
                </div>
              </div>
            ))}

            {/* Promo Codes Section */}
            <div className="mt-8 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Available Promo Codes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePromos.length === 0 ? (
                  <p className="text-[10px] font-bold text-gray-400 uppercase italic ml-2">No active promotions available at this time.</p>
                ) : availablePromos.map(promo => {
                  const isEligible = totalPrice >= promo.minOrderValue;
                  const isApplied = appliedPromo?.id === promo.id;
                  return (
                    <div 
                      key={promo.id} 
                      className={cn(
                        "p-4 rounded-[24px] border-2 transition-all flex items-center justify-between",
                        isApplied ? "bg-primary/5 border-primary shadow-lg" : isEligible ? "bg-white border-gray-100 hover:border-primary/30" : "bg-gray-50 border-gray-100 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isApplied ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={cn("text-xs uppercase tracking-widest font-black", isEligible || isApplied ? "text-primary" : "text-gray-400")}>
                            {promo.code}
                          </p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{promo.description}</p>
                        </div>
                      </div>
                      {isApplied ? (
                        <Button variant="ghost" size="sm" onClick={() => applyPromo(null)} className="h-8 w-8 rounded-full p-0 text-red-400"><X className="w-4 h-4" /></Button>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={!isEligible}
                          onClick={() => handleApplyPromo(promo)}
                          className={cn("rounded-full h-8 px-4 font-black uppercase text-[8px] tracking-widest", isEligible ? "bg-primary" : "bg-gray-200")}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 sticky top-20">
              <h2 className="text-[10px] font-black mb-8 uppercase tracking-widest text-gray-400">Clinical Bill Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Total MRP</span>
                  <span>₹{totalMrp}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Cart Discount</span>
                  <span className="text-green-600">- ₹{baseDiscount}</span>
                </div>
                
                {activeFees.map(fee => (
                  <div key={fee.id} className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span>{fee.name}</span>
                    <span className="text-gray-900">₹{fee.type === 'fixed' ? fee.amount : (totalPrice * (fee.amount / 100)).toFixed(0)}</span>
                  </div>
                ))}

                {appliedPromo && (
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-2">
                    <span className="text-primary flex items-center gap-1"><Tag className="w-3 h-3" /> PROMO: {appliedPromo.code}</span>
                    <span className="text-green-600">- ₹{promoDiscount.toFixed(0)}</span>
                  </div>
                )}
                
                <div className="pt-6 border-t border-dashed flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Payable</span>
                  <span className="text-3xl font-black text-primary">₹{finalPayable.toFixed(0)}</span>
                </div>
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