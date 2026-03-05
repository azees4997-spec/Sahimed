
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus, Ticket, Check, X, PartyPopper, ChevronRight, FileWarning, Camera, RotateCcw, ClipboardCheck, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from 'react';

export default function CartPage() {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    totalPrice, 
    totalItems, 
    activeFees, 
    availablePromos, 
    appliedPromo, 
    applyPromo,
    attachedPrescription,
    setAttachedPrescription
  } = useCart();
  
  const { toast } = useToast();
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const totalMrp = cart.reduce((acc, item) => acc + (item.mrp || item.price + 50) * item.quantity, 0);
  
  // Calculate Fee Totals with potential strike-through logic
  const feeTotal = activeFees.reduce((acc, fee) => {
    if (fee.type === 'fixed') return acc + fee.amount;
    return acc + (totalPrice * (fee.amount / 100));
  }, 0);

  let rawDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'fixed') {
      rawDiscount = appliedPromo.discountValue;
    } else {
      rawDiscount = (totalPrice * (appliedPromo.discountValue / 100));
    }
  }

  // Apply Capping Logic
  const promoDiscount = (appliedPromo?.maxDiscount && appliedPromo.maxDiscount > 0) 
    ? Math.min(rawDiscount, appliedPromo.maxDiscount) 
    : rawDiscount;

  const finalPayable = Math.max(0, totalPrice + feeTotal - promoDiscount);
  const totalSavings = (totalMrp - totalPrice) + promoDiscount;

  const requiresPrescription = cart.some(item => item.prescriptionRequired);
  const isPrescriptionReady = !requiresPrescription || !!attachedPrescription;

  // Free Delivery Threshold (Static for now, can be linked to a fee doc)
  const FREE_DELIVERY_THRESHOLD = 500;
  const deliveryCharge = finalPayable < FREE_DELIVERY_THRESHOLD ? 40 : 0;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - finalPayable);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit: 2MB for clinical scans." });
        return;
      }
      
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedPrescription(reader.result as string);
        setIsUploading(false);
        toast({ title: "Clinical File Attached", description: "Prescription successfully added to your order." });
      };
      reader.readAsDataURL(file);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-50 animate-in zoom-in duration-500">
            <ShoppingBag className="w-8 h-8 text-gray-200" />
          </div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tight text-gray-900">Your bag is empty</h1>
          <p className="text-gray-400 mb-10 text-[10px] font-bold uppercase tracking-[0.3em]">Build your health journey today.</p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-12 h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-xs active:scale-95 transition-transform">
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
    setIsPromoDialogOpen(false);
    toast({ title: 'Success!', description: `Voucher applied successfully.` });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper pb-20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-10">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Shopping Bag</h1>
          <div className="bg-primary/5 px-4 py-1 rounded-full border border-primary/10">
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {totalItems} Items
             </span>
          </div>
        </div>

        {remainingForFree > 0 && (
          <div className="bg-white p-4 rounded-[24px] mb-8 border border-green-100 flex items-center gap-4 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">
                Add products worth ₹{remainingForFree} to get free delivery
              </p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (finalPayable / FREE_DELIVERY_THRESHOLD) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        )}

        {requiresPrescription && (
          <div className={cn(
            "border-2 p-6 rounded-[40px] mb-8 flex items-center gap-6 animate-in slide-in-from-top-4 shadow-lg transition-all duration-500",
            attachedPrescription ? "bg-green-50 border-green-100 shadow-green-100/50" : "bg-orange-50 border-orange-100 shadow-orange-100/50"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              attachedPrescription ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
            )}>
               {attachedPrescription ? <ClipboardCheck className="w-6 h-6" /> : <FileWarning className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-black text-sm uppercase tracking-tight",
                attachedPrescription ? "text-green-900" : "text-orange-900"
              )}>
                {attachedPrescription ? "Prescription Attached" : "Prescription Required"}
              </p>
              <p className={cn(
                "text-[9px] font-bold uppercase tracking-widest mt-1",
                attachedPrescription ? "text-green-600/70" : "text-orange-600/70"
              )}>
                {attachedPrescription ? "Clinical verification will occur during fulfillment." : "Some items in your cart require a valid clinical prescription."}
              </p>
            </div>
            
            <input 
              type="file" 
              id="cart-prescription-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />

            {attachedPrescription ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden shadow-md relative group">
                  <Image src={attachedPrescription} alt="Attachment" fill className="object-cover" />
                  <button 
                    onClick={() => setAttachedPrescription(null)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <Button 
                  onClick={() => document.getElementById('cart-prescription-upload')?.click()}
                  variant="outline" 
                  className="rounded-full border-green-200 text-green-600 hover:bg-green-100 font-black uppercase text-[9px] tracking-widest px-4 h-10 gap-2"
                >
                  <RotateCcw className="w-3 h-3" /> Change
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => document.getElementById('cart-prescription-upload')?.click()}
                disabled={isUploading}
                variant="outline" 
                className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-100 font-black uppercase text-[10px] tracking-widest px-6 h-12 gap-2"
              >
                <Camera className="w-4 h-4" /> {isUploading ? "Processing..." : "Upload Now"}
              </Button>
            )}
          </div>
        )}

        {appliedPromo && (
          <div className="bg-green-50 border-2 border-green-100 p-6 rounded-[40px] mb-8 flex items-center justify-center gap-4 animate-in zoom-in duration-500 shadow-xl shadow-green-100/50">
            <PartyPopper className="w-8 h-8 text-green-600 animate-bounce" />
            <div className="text-center">
              <p className="text-green-800 font-black text-sm uppercase tracking-tight">
                Congratulations! 🎉 You saved ₹{promoDiscount.toFixed(0)} with code <span className="text-green-600 font-black">{appliedPromo.code}</span>
              </p>
              {appliedPromo.maxDiscount && rawDiscount > appliedPromo.maxDiscount && (
                <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">Capped at max discount limit</p>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-2xl hover:border-primary/5 transition-all duration-500 animate-in slide-in-from-bottom-4">
                  <Link href={`/product/${item.id}`} className="relative w-24 h-24 bg-gray-50 rounded-[32px] overflow-hidden shrink-0 active:scale-95 transition-transform border border-gray-100/50">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-3 group-hover:scale-110 transition-transform duration-500" />
                  </Link>
                  
                  <div className="flex-1 min-w-0 py-2">
                    <Link href={`/product/${item.id}`} className="group/title">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-gray-900 truncate group-hover/title:text-primary transition-colors text-sm uppercase tracking-tight">{item.name}</h3>
                        {item.prescriptionRequired && (
                          <Badge variant="outline" className="text-[7px] font-black uppercase text-orange-500 border-orange-200">RX Required</Badge>
                        )}
                      </div>
                    </Link>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate mb-4">{item.saltComposition}</p>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1.5 border border-gray-200">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white hover:bg-primary/90 transition-all shadow-lg active:scale-90"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-black text-gray-900 w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white hover:bg-primary/90 transition-all shadow-lg active:scale-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all flex items-center justify-center active:scale-90 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0 px-4">
                    <p className="text-xl font-black text-gray-900">₹{item.price * item.quantity}</p>
                    <p className="text-[9px] text-[#E11D48] uppercase tracking-widest font-black line-through">₹{(item.mrp || item.price + 50) * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-full bg-white p-6 rounded-[32px] border-2 border-dashed border-primary/20 hover:border-primary transition-all flex items-center justify-between group active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          {appliedPromo ? `Applied: ${appliedPromo.code}` : "Apply Coupons & Offers"}
                        </p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                          {appliedPromo ? `Savings: ₹${promoDiscount.toFixed(0)}` : "View available vouchers"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-[40px] border-none shadow-3xl p-0 overflow-hidden max-w-xl animate-in fade-in zoom-in duration-300">
                  <div className="bg-primary p-8 text-white">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Available Offers</DialogTitle>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Select a voucher to apply</p>
                  </div>
                  <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                    {availablePromos.length === 0 ? (
                      <div className="text-center py-10">
                        <Ticket className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No active offers available</p>
                      </div>
                    ) : availablePromos.map(promo => {
                      const isEligible = totalPrice >= promo.minOrderValue;
                      const isApplied = appliedPromo?.id === promo.id;
                      return (
                        <div 
                          key={promo.id} 
                          onClick={() => isEligible && !isApplied && handleApplyPromo(promo)}
                          className={cn(
                            "relative p-6 rounded-[32px] border-2 transition-all duration-300 overflow-hidden cursor-pointer group active:scale-[0.98]",
                            isApplied 
                              ? "bg-primary text-white border-primary shadow-xl" 
                              : isEligible 
                                ? "bg-white border-primary/20 hover:border-primary shadow-sm" 
                                : "bg-gray-50 border-gray-200 opacity-60 grayscale cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                                isApplied ? "bg-white/20 text-white" : "bg-primary/5 text-primary"
                              )}>
                                <Ticket className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "text-sm uppercase tracking-[0.15em] font-black mb-0.5",
                                    isApplied ? "text-white" : "text-gray-900"
                                  )}>
                                    {promo.code}
                                  </p>
                                  {isApplied && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <p className={cn(
                                  "text-[9px] font-bold uppercase tracking-widest max-w-[140px] leading-tight",
                                  isApplied ? "text-white/70" : "text-gray-400"
                                )}>
                                  {promo.description}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                               {isApplied ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); applyPromo(null); setIsPromoDialogOpen(false); }} 
                                    className="h-8 rounded-full px-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[8px] active:scale-90"
                                  >
                                    Remove
                                  </Button>
                               ) : (
                                 <Button 
                                    size="sm" 
                                    disabled={!isEligible}
                                    className={cn(
                                      "rounded-full h-10 px-6 font-black uppercase text-[9px] tracking-widest transition-all active:scale-95",
                                      isEligible 
                                        ? "bg-primary text-white shadow-lg" 
                                        : "bg-gray-200 text-gray-400"
                                    )}
                                  >
                                    {isEligible ? 'Apply' : 'Locked'}
                                  </Button>
                               )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-50 sticky top-24 overflow-hidden relative animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <h2 className="text-[11px] font-black mb-10 uppercase tracking-[0.3em] text-gray-400 relative z-10">Bill Details</h2>
              
              <div className="space-y-6 mb-10 relative z-10">
                <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Cart Gross (MRP)</span>
                  <span className="text-[#E11D48] line-through">₹{totalMrp}</span>
                </div>
                
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Total Savings</span>
                  <span className="text-accent font-black">₹{totalSavings.toFixed(0)}</span>
                </div>

                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-500">
                  <span>Estimated Taxes</span>
                  <span className="text-gray-900">₹{(totalPrice * 0.12).toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-500">
                  <span>Delivery Charge</span>
                  <div className="flex gap-2">
                    {deliveryCharge === 0 ? (
                      <span className="text-accent font-black">FREE</span>
                    ) : (
                      <span className="text-gray-900 font-black">₹{deliveryCharge}</span>
                    )}
                  </div>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-right-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                    <span className="text-primary flex items-center gap-2 font-black"><Ticket className="w-4 h-4" /> VOUCHER_APPLIED</span>
                    <span className="text-accent font-black">- ₹{promoDiscount.toFixed(0)}</span>
                  </div>
                )}
                
                <div className="pt-10 border-t border-dashed border-gray-200 flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Total Payable</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">₹{(finalPayable + deliveryCharge).toFixed(0)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="pt-4 flex items-center justify-center gap-2 bg-green-50 rounded-2xl py-3 border border-green-100">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                      You saved ₹{totalSavings.toFixed(0)} on this order
                    </p>
                  </div>
                )}
              </div>
              
              {isPrescriptionReady ? (
                <Link href="/checkout">
                   <Button className="w-full rounded-full h-20 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all gap-4 bg-primary text-white">
                     Checkout Now
                     <ArrowRight className="w-5 h-5" />
                   </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => document.getElementById('cart-prescription-upload')?.click()}
                  className="w-full rounded-full h-20 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange/40 hover:scale-[1.02] active:scale-95 transition-all gap-4 bg-orange-600 text-white"
                >
                  Upload Prescription
                  <Camera className="w-5 h-5" />
                </Button>
              )}
              
              <div className="mt-10 pt-8 border-t border-gray-50 flex items-center gap-4">
                 <div className="w-12 h-12 bg-accent/5 rounded-[20px] flex items-center justify-center shrink-0 border border-accent/10">
                    <ShieldCheck className="w-6 h-6 text-accent" />
                 </div>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   Secure Gateway • Quality Products • Fast Delivery
                 </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
