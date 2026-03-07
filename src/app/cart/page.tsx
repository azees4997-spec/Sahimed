
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus, Ticket, Check, X, PartyPopper, ChevronRight, FileWarning, Camera, RotateCcw, ClipboardCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/dialog";
import { useState } from 'react';

export default function CartPage() {
  const { 
    cart, removeFromCart, updateQuantity, totalPrice, totalItems, activeFees, 
    availablePromos, appliedPromo, applyPromo, attachedPrescription, setAttachedPrescription 
  } = useCart();
  
  const { toast } = useToast();
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const totalMrp = cart.reduce((acc, item) => acc + (item.mrp || item.price + 50) * item.quantity, 0);
  const applicableFees = activeFees.filter(f => totalPrice >= (f.minPurchase || 0));
  const feeTotal = applicableFees.reduce((acc, fee) => {
    const amt = fee.discountedAmount ?? fee.originalAmount ?? 0;
    return fee.type === 'fixed' ? acc + amt : acc + (totalPrice * (amt / 100));
  }, 0);

  let rawDiscount = 0;
  if (appliedPromo) {
    rawDiscount = appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue / 100));
  }
  const promoDiscount = (appliedPromo?.maxDiscount && appliedPromo.maxDiscount > 0) ? Math.min(rawDiscount, appliedPromo.maxDiscount) : rawDiscount;
  const finalPayableBeforeDelivery = Math.max(0, totalPrice + feeTotal - promoDiscount);
  const deliveryFeeDoc = activeFees.find(f => f.name.toLowerCase().includes('delivery'));
  const deliveryCharge = finalPayableBeforeDelivery < (deliveryFeeDoc?.minPurchase || 500) ? (deliveryFeeDoc?.discountedAmount || 40) : 0;
  const finalPayable = finalPayableBeforeDelivery + deliveryCharge;

  const requiresPrescription = cart.some(item => item.prescriptionRequired);
  const isPrescriptionReady = !requiresPrescription || !!attachedPrescription;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Limit: 2MB" });
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedPrescription(reader.result as string);
        setIsUploading(false);
        toast({ title: "Clinical File Attached" });
      };
      reader.readAsDataURL(file);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl border"><ShoppingBag className="w-8 h-8 text-gray-200" /></div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tight">Your bag is empty</h1>
          <Link href="/"><Button className="rounded-full px-12 h-16 font-black uppercase tracking-widest shadow-2xl bg-primary">Start Shopping</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-10">Shopping Bag ({totalItems})</h1>

        {requiresPrescription && (
          <div className={cn("border-2 p-6 rounded-[40px] mb-8 flex items-center gap-6 shadow-lg", attachedPrescription ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100")}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", attachedPrescription ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600")}>
               {attachedPrescription ? <ClipboardCheck className="w-6 h-6" /> : <FileWarning className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase tracking-tight">{attachedPrescription ? "Prescription Attached" : "Prescription Required"}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">Clinical verification will occur during fulfillment.</p>
            </div>
            <input type="file" id="cart-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
            <Button onClick={() => document.getElementById('cart-upload')?.click()} variant="outline" className="rounded-full font-black uppercase text-[10px] h-12 gap-2">
              <Camera className="w-4 h-4" /> {attachedPrescription ? "Change" : "Upload Now"}
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              // Robust URL Validation for Cart Images
              const safeImageUrl = (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http'))
                ? item.imageUrl
                : `https://picsum.photos/seed/${item.id}/300/300`;
                
              return (
                <div key={item.id} className="bg-white p-6 rounded-[40px] shadow-sm border flex items-center gap-6 group hover:shadow-2xl transition-all">
                  <div className="relative w-20 h-20 bg-gray-50 rounded-[32px] overflow-hidden shrink-0 border">
                    <Image src={safeImageUrl} alt={item.name} fill className="object-contain p-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 truncate text-sm uppercase tracking-tight">{item.name}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate mb-4">{item.saltComposition}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 border">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="text-right shrink-0 px-4">
                    <p className="text-lg font-black text-gray-900">₹{item.price * item.quantity}</p>
                    <p className="text-[9px] text-red-500 font-black line-through">₹{(item.mrp || item.price + 50) * item.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border sticky top-24">
              <h2 className="text-[11px] font-black mb-10 uppercase tracking-[0.3em] text-gray-400">Bill Details</h2>
              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase"><span>Cart Gross (MRP)</span><span className="text-red-500 line-through">₹{totalMrp}</span></div>
                <div className="flex justify-between text-[11px] font-black uppercase"><span>Estimated Taxes</span><span className="text-gray-900">₹{(totalPrice * 0.12).toFixed(0)}</span></div>
                <div className="flex justify-between text-[11px] font-black uppercase"><span>Delivery</span><span className={deliveryCharge === 0 ? "text-accent" : "text-gray-900"}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                <div className="pt-10 border-t border-dashed flex justify-between items-baseline"><span className="text-sm font-black uppercase text-gray-900">Total Payable</span><span className="text-4xl font-black text-primary tracking-tighter">₹{finalPayable.toFixed(0)}</span></div>
              </div>
              {isPrescriptionReady ? (
                <Link href="/checkout"><Button className="w-full rounded-full h-20 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl bg-primary text-white">Checkout Now <ArrowRight className="w-5 h-5 ml-4" /></Button></Link>
              ) : (
                <Button onClick={() => document.getElementById('cart-upload')?.click()} className="w-full rounded-full h-20 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl bg-orange-600 text-white">Upload Prescription <Camera className="w-5 h-5 ml-4" /></Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
