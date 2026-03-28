
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus, Ticket, ChevronRight, FileWarning, Camera, ClipboardCheck, Tag, PartyPopper, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { 
    cart, removeFromCart, updateQuantity, totalPrice, totalItems, activeFees, 
    availablePromos, appliedPromo, applyPromo, attachedPrescription, setAttachedPrescription 
  } = useCart();
  
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (appliedPromo) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [appliedPromo]);

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
  
  const finalPayable = Math.max(0, totalPrice + feeTotal - promoDiscount);
  const itemSavings = totalMrp - totalPrice;
  const totalSavings = itemSavings + promoDiscount;

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
        toast({ title: "Clinical file attached" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPromo = (promo: any) => {
    applyPromo(promo);
    setIsPromoDialogOpen(false);
    toast({
      title: "Coupon applied!",
      description: `You just saved ₹${(promo.discountType === 'fixed' ? promo.discountValue : (totalPrice * (promo.discountValue / 100))).toFixed(2)} extra!`,
    });
  };

  const handleCheckoutClick = () => {
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=/checkout');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl border"><ShoppingBag className="w-8 h-8 text-gray-200" /></div>
          <h1 className="text-2xl font-black mb-2 tracking-tight">Your bag is empty</h1>
          <Link href="/"><Button className="rounded-full px-12 h-16 font-black tracking-widest shadow-2xl bg-primary">Start shopping</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter mb-6 sm:mb-10">Shopping bag ({totalItems})</h1>

        {requiresPrescription && (
          <div className={cn(
            "border-2 p-4 sm:p-6 rounded-[32px] sm:rounded-[40px] mb-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-lg relative overflow-hidden",
            attachedPrescription ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"
          )}>
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
              attachedPrescription ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
            )}>
               {attachedPrescription ? <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" /> : <FileWarning className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-black text-xs sm:text-sm tracking-tight">{attachedPrescription ? "Prescription attached" : "Prescription required"}</p>
              <p className="text-[8px] sm:text-[9px] font-bold tracking-widest mt-1 opacity-70 leading-relaxed">Clinical verification will occur during fulfillment.</p>
            </div>
            <input type="file" id="cart-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
            <Button 
              onClick={() => document.getElementById('cart-upload')?.click()} 
              variant="outline" 
              className="w-full sm:w-auto rounded-full font-black text-[9px] sm:text-[10px] h-10 sm:h-12 gap-2 border-2"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {attachedPrescription ? "Change" : "Upload now"}
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const safeImageUrl = (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http'))
                ? item.imageUrl
                : `https://picsum.photos/seed/${item.id}/300/300`;
                
              return (
                <div key={item.id} className="bg-white p-4 sm:p-6 rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100 flex gap-4 sm:gap-6 items-start group hover:shadow-xl transition-all">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl sm:rounded-[32px] overflow-hidden shrink-0 border border-gray-100">
                    <Image src={safeImageUrl} alt={item.name} fill className="object-contain p-2" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 text-xs sm:text-sm tracking-tight line-clamp-2">{item.name}</h3>
                      <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold tracking-widest truncate mt-1 mb-3">{item.saltComposition}</p>
                      
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 border w-fit">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary text-white tap-highlight"><Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                        <span className="text-[10px] sm:text-xs font-black w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary text-white tap-highlight"><Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between sm:text-right shrink-0">
                      <div className="space-y-0.5">
                        <p className="text-sm sm:text-lg font-black text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-[8px] sm:text-[10px] text-red-500 font-black line-through">₹{((item.mrp || item.price + 50) * item.quantity).toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="mt-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              <div 
                className={cn(
                  "p-6 rounded-[40px] shadow-sm border flex items-center justify-between group cursor-pointer transition-all",
                  appliedPromo ? "bg-primary/5 border-primary/20 hover:shadow-xl" : "bg-white border-gray-100 hover:shadow-lg"
                )} 
                onClick={() => setIsPromoDialogOpen(true)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    appliedPromo ? "bg-primary text-white" : "bg-purple-50 text-purple-600"
                  )}>
                    < Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-[10px] tracking-tight text-gray-900">
                      {appliedPromo ? `Applied: ${appliedPromo.code}` : "Apply coupon"}
                    </p>
                    <p className="text-[8px] font-bold text-gray-400">
                      {appliedPromo ? appliedPromo.description : "Save more on this order"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {appliedPromo ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); applyPromo(null); }} 
                      className="text-red-500 font-black text-[10px] tracking-widest hover:underline"
                    >
                      Remove
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>

              {appliedPromo && showCelebration && (
                <div className="bg-accent text-white p-4 rounded-[32px] shadow-2xl flex items-center justify-center gap-3 animate-spring overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                  <PartyPopper className="w-5 h-5 animate-bounce shrink-0" />
                  <div className="text-center">
                    <p className="text-[10px] font-black tracking-tight leading-none">Coupon celebration!</p>
                    <p className="text-[13px] font-black tracking-tighter mt-1">Extra ₹{promoDiscount.toFixed(2)} saved!</p>
                  </div>
                  <Sparkles className="w-5 h-5 animate-pulse shrink-0" />
                </div>
              )}

              <div className="bg-white p-8 sm:p-10 rounded-[40px] sm:rounded-[50px] shadow-2xl border relative overflow-hidden">
                {appliedPromo && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16" />
                )}
                
                <h2 className="text-[10px] sm:text-[11px] font-black mb-8 sm:mb-10 tracking-[0.3em] text-gray-400 relative z-10">Bill details</h2>
                <div className="space-y-5 sm:space-y-6 mb-8 sm:mb-10 relative z-10">
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-black text-gray-500">
                    <span>Cart gross (MRP)</span>
                    <span className="text-red-500 line-through">₹{totalMrp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-black">
                    <span>Item total</span>
                    <span className="text-gray-900">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-[10px] sm:text-[11px] font-black text-accent animate-in slide-in-from-left-2">
                      <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Coupon discount</span>
                      <span>-₹{promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {feeTotal > 0 && (
                    <div className="flex justify-between text-[10px] sm:text-[11px] font-black">
                      <span>Clinical fees</span>
                      <span className="text-gray-900">₹{feeTotal.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {totalSavings > 0 && (
                    <div className="pt-2 flex justify-between text-[10px] sm:text-[11px] font-black text-accent bg-accent/5 p-3 rounded-xl border border-accent/10">
                      <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 fill-current" /> Total savings</span>
                      <span>₹{totalSavings.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-8 sm:pt-10 border-t border-dashed flex justify-between items-baseline">
                    <span className="text-xs sm:text-sm font-black text-gray-900">Total payable</span>
                    <span className="text-3xl sm:text-4xl font-black text-primary tracking-tighter">₹{finalPayable.toFixed(2)}</span>
                  </div>
                </div>
                {isPrescriptionReady ? (
                  <Button onClick={handleCheckoutClick} className="w-full rounded-full h-16 sm:h-20 text-[10px] sm:text-[11px] font-black tracking-[0.2em] shadow-2xl shadow-primary/30 bg-primary text-white relative z-10">
                    Checkout now <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-4" />
                  </Button>
                ) : (
                  <Button onClick={() => document.getElementById('cart-upload')?.click()} className="w-full rounded-full h-16 sm:h-20 text-[10px] sm:text-[11px] font-black tracking-[0.2em] shadow-2xl shadow-orange-200 bg-orange-600 text-white relative z-10">
                    Upload prescription <Camera className="w-4 h-4 sm:w-5 sm:h-5 ml-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="rounded-[40px] max-w-md border-none p-0 overflow-hidden shadow-3xl">
          <div className="bg-primary p-8 text-white">
            <DialogTitle className="text-2xl font-black tracking-tight">Available offers</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1">
              Select a clinical discount to apply to your order
            </DialogDescription>
          </div>
          <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {availablePromos.length === 0 ? (
              <div className="py-12 text-center">
                <Ticket className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-[10px] tracking-widest">No active coupons available</p>
              </div>
            ) : (
              availablePromos.map(promo => {
                const isApplicable = totalPrice >= promo.minOrderValue;
                return (
                  <div 
                    key={promo.id} 
                    className={cn(
                      "p-6 rounded-[32px] border-2 transition-all flex flex-col gap-2 relative overflow-hidden group",
                      isApplicable ? "border-gray-100 hover:border-primary cursor-pointer bg-white" : "opacity-50 grayscale cursor-not-allowed border-dashed bg-gray-50"
                    )}
                    onClick={() => isApplicable && handleApplyPromo(promo)}
                  >
                    <div className="flex justify-between items-center">
                      <Badge className="bg-purple-100 text-purple-600 font-black text-[9px] tracking-widest px-3 py-1 border-none">
                        {promo.code}
                      </Badge>
                      <span className="font-black text-sm text-primary">
                        {promo.discountType === 'percentage' ? `${promo.discountValue}% Off` : `₹${promo.discountValue.toFixed(2)} Off`}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-600 leading-relaxed">{promo.description}</p>
                    {!isApplicable ? (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400" style={{ width: `${(totalPrice / promo.minOrderValue) * 100}%` }} />
                        </div>
                        <p className="text-[8px] font-black text-orange-500 tracking-tighter shrink-0">
                          Add ₹{(promo.minOrderValue - totalPrice).toFixed(2)} more
                        </p>
                      </div>
                    ) : (
                      <p className="text-[8px] font-black text-accent tracking-widest mt-2 group-hover:animate-pulse">Tap to apply</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
