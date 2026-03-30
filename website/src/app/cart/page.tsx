
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, ArrowRight, Plus, Minus, Ticket, ChevronRight, FileWarning, Camera, ClipboardCheck, Tag, PartyPopper, Sparkles, Zap, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

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
      <PageTransition>
        <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern">
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 py-32 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[32px] sm:rounded-[48px] flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white"
            >
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tighter font-outfit">Your cart is empty</h1>
            <p className="text-slate-500 font-bold mb-12 tracking-tight uppercase text-[10px]">Add clinical supplies to start your order</p>
            <Link href="/"><Button className="rounded-full px-16 h-20 font-black tracking-[0.2em] shadow-2xl shadow-primary/20 bg-primary uppercase text-sm">Start Discovering</Button></Link>
          </main>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tighter mb-6 sm:mb-16 font-outfit flex items-baseline gap-2"
          >
            Your Cart <span className="text-primary/50 text-xs sm:text-2xl font-black tracking-widest uppercase bg-primary/5 px-3 py-1 rounded-full border border-primary/10">{totalItems} Items</span>
          </motion.h1>

          {requiresPrescription && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "border border-white/50 p-4 sm:p-10 rounded-[32px] sm:rounded-[48px] mb-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10 shadow-xl backdrop-blur-md relative overflow-hidden",
                attachedPrescription ? "bg-emerald-50/50" : "bg-primary/5"
              )}
            >
              <div className={cn(
                "w-12 h-12 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[32px] flex items-center justify-center shrink-0 shadow-inner",
                attachedPrescription ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
              )}>
                 {attachedPrescription ? <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8" /> : <FileWarning className="w-6 h-6 sm:w-8 sm:h-8" />}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="font-black text-sm sm:text-xl tracking-tight uppercase font-outfit">{attachedPrescription ? "Prescription Attached" : "Prescription Required"}</p>
                <p className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] mt-1 opacity-60 leading-relaxed uppercase">Doctor's prescription is required for these items.</p>
              </div>
              <input type="file" id="cart-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
              <Button 
                onClick={() => document.getElementById('cart-upload')?.click()} 
                variant="outline" 
                className="w-full sm:w-auto rounded-full font-black text-[9px] h-12 sm:h-16 px-8 gap-3 border-2 uppercase tracking-widest hover:bg-white"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 sm:w-5 sm:h-5" />} 
                {attachedPrescription ? "Update" : "Upload now"}
              </Button>
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="lg:col-span-2 space-y-6"
            >
              {cart.map((item) => {
                const safeImageUrl = (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http'))
                  ? item.imageUrl
                  : `https://picsum.photos/seed/${item.id}/300/300`;
                  
                return (
                  <motion.div 
                    key={item.id} 
                    variants={itemVariants}
                    className="bg-white p-3 sm:p-6 rounded-[20px] sm:rounded-[40px] shadow-sm sm:shadow-lg border border-slate-100 sm:border-white/50 flex flex-row gap-3 sm:gap-8 items-center group transition-all relative overflow-hidden"
                  >
                    <Link href={`/product/${item.id}`} className="relative w-16 h-16 sm:w-28 sm:h-28 bg-slate-50 sm:bg-white rounded-[14px] sm:rounded-[28px] overflow-hidden shrink-0 border border-slate-100 sm:border-white shadow-inner cursor-pointer">
                      <Image src={safeImageUrl} alt={item.name} fill className="object-contain p-2 sm:p-4 group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`} className="hover:text-primary transition-colors cursor-pointer">
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-xl tracking-tight line-clamp-1 sm:line-clamp-2 font-outfit uppercase leading-tight">{item.name}</h3>
                        </Link>
                        <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold tracking-widest truncate mt-0.5 sm:mt-1 mb-2 sm:mb-4 uppercase">{item.saltComposition}</p>
                        
                        <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-100 sm:bg-white/60 rounded-full p-0.5 sm:p-1.5 border border-slate-100 sm:border-white shadow-none sm:shadow-sm w-fit">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white sm:bg-slate-900 text-primary sm:text-white shadow-sm hover:bg-primary hover:text-white transition-all"><Minus className="w-3 h-3" /></button>
                          <span className="text-[11px] sm:text-base font-black w-5 sm:w-8 text-center font-outfit">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white sm:bg-slate-900 text-primary sm:text-white shadow-sm hover:bg-primary hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:text-right shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="text-sm sm:text-2xl font-black text-slate-900 font-outfit tracking-tighter leading-none">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-[8px] sm:text-[11px] text-primary font-black line-through opacity-40 mt-0.5 sm:mt-1">₹{((item.mrp || item.price + 50) * item.quantity).toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-8 h-8 sm:w-10 sm:h-10 sm:mt-3 rounded-full flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="lg:col-span-1">
              <div className="space-y-8 sticky top-32">
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "p-8 rounded-[48px] shadow-2xl border flex items-center justify-between group cursor-pointer transition-all relative overflow-hidden",
                    appliedPromo ? "bg-primary text-white border-primary shadow-primary/20" : "bg-white/40 border-white backdrop-blur-md"
                  )} 
                  onClick={() => setIsPromoDialogOpen(true)}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                      appliedPromo ? "bg-white text-primary" : "bg-white text-primary"
                    )}>
                      < Ticket className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-black text-xs tracking-widest uppercase mb-1">
                        {appliedPromo ? `Reward: ${appliedPromo.code}` : "Apply Promo Code"}
                      </p>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", appliedPromo ? "text-white" : "text-slate-400")}>
                        {appliedPromo ? appliedPromo.description : "Maximum clinical savings"}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    {appliedPromo ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); applyPromo(null); }} 
                        className="text-white font-black text-[10px] tracking-widest hover:underline uppercase p-2"
                      >
                        [ Remove ]
                      </button>
                    ) : (
                      <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-2" />
                    )}
                  </div>
                </motion.div>

                <AnimatePresence>
                  {appliedPromo && showCelebration && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.5, opacity: 0, y: -20 }}
                      className="bg-accent text-white p-6 rounded-[40px] shadow-3xl flex items-center justify-center gap-4 relative overflow-hidden border border-white/20"
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      <PartyPopper className="w-6 h-6 animate-bounce shrink-0" />
                      <div className="text-center relative z-10">
                        <p className="text-[10px] font-black tracking-[0.2em] leading-none uppercase mb-2">Clinical Bonus Applied</p>
                        <p className="text-xl font-black tracking-tighter font-outfit">Extra ₹{promoDiscount.toFixed(2)} Saved!</p>
                      </div>
                      <Sparkles className="w-6 h-6 animate-pulse shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white p-5 sm:p-12 rounded-[28px] sm:rounded-[56px] shadow-2xl border border-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  
                  <h2 className="text-[8px] sm:text-xs font-black mb-6 sm:mb-8 tracking-[0.3em] text-slate-400 uppercase relative z-10">Invoice Summary</h2>
                  <div className="space-y-3 sm:space-y-6 mb-8 relative z-10">
                    <div className="flex justify-between text-[11px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
                      <span>Total MRP</span>
                      <span>₹{totalMrp.toFixed(2)}</span>
                    </div>
                    {itemSavings > 0 && (
                      <div className="flex justify-between text-[11px] sm:text-sm font-bold text-primary uppercase tracking-widest">
                        <span>Cart Discount</span>
                        <span>-₹{itemSavings.toFixed(2)}</span>
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="flex justify-between text-[11px] sm:text-sm font-bold text-primary uppercase tracking-widest">
                        <span className="flex items-center gap-2">Coupon Applied</span>
                        <span>-₹{promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {feeTotal > 0 && (
                      <div className="flex justify-between text-[11px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
                        <span>Delivery & Handling</span>
                        <span>₹{feeTotal.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-4 sm:pt-8 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-xs sm:text-base font-black text-slate-900 uppercase tracking-widest">Final Payable</span>
                      <span className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tighter font-outfit">₹{finalPayable.toFixed(2)}</span>
                    </div>
                    
                    {totalSavings > 0 && (
                      <div className="mt-4 flex justify-between items-center text-[10px] sm:text-sm font-black text-emerald-700 bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-100 shadow-inner">
                        <span className="uppercase tracking-widest">You Saved</span>
                        <span className="bg-emerald-100 px-2.5 py-1 rounded-md text-[9px] sm:text-xs uppercase tracking-widest border border-emerald-200">
                          ₹{totalSavings.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  {isPrescriptionReady ? (
                    <Button onClick={handleCheckoutClick} className="w-full rounded-full h-14 sm:h-20 text-[10px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase shadow-2xl shadow-primary/20 bg-primary text-white relative z-10 group hover:scale-[1.02] transition-transform">
                      Checkout Pipeline <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" />
                    </Button>
                  ) : (
                    <Button onClick={() => document.getElementById('cart-upload')?.click()} className="w-full rounded-full h-14 sm:h-20 text-[10px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase shadow-2xl shadow-rose-200 bg-rose-600 text-white relative z-10 group hover:scale-[1.02] transition-transform">
                      Upload Prescription <Camera className="w-5 h-5 ml-2 transition-transform group-hover:scale-110" />
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </main>

        <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
          <DialogContent className="rounded-[56px] max-w-lg border-none p-0 overflow-hidden shadow-3xl backdrop-blur-3xl bg-white/90">
            <div className="bg-primary p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                <Ticket className="w-32 h-32" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter font-outfit uppercase">Medical Privileges</DialogTitle>
              <DialogDescription className="text-[10px] font-black text-white/60 tracking-[0.2em] mt-3 uppercase">
                Select a clinical discount to optimize your healthcare budget
              </DialogDescription>
            </div>
            <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {availablePromos.length === 0 ? (
                <div className="py-20 text-center">
                  <Ticket className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <p className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">No active rewards available</p>
                </div>
              ) : (
                availablePromos.map((promo, idx) => {
                  const isApplicable = totalPrice >= promo.minOrderValue;
                  return (
                    <motion.div 
                      key={promo.id} 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "p-8 rounded-[40px] border-2 transition-all flex flex-col gap-3 relative overflow-hidden group",
                        isApplicable ? "border-slate-100 hover:border-primary cursor-pointer bg-white shadow-lg hover:shadow-2xl" : "opacity-50 grayscale cursor-not-allowed border-dashed bg-slate-50"
                      )}
                      onClick={() => isApplicable && handleApplyPromo(promo)}
                    >
                      <div className="flex justify-between items-center">
                        <Badge className="bg-primary/10 text-primary font-black text-[10px] tracking-widest px-4 py-2 border-none uppercase">
                          {promo.code}
                        </Badge>
                        <span className="font-black text-xl text-primary font-outfit">
                          {promo.discountType === 'percentage' ? `${promo.discountValue}% Off` : `₹${promo.discountValue.toFixed(2)} Off`}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-2">{promo.description}</p>
                      {!isApplicable ? (
                        <div className="mt-4 flex items-center gap-4">
                          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(totalPrice / promo.minOrderValue) * 100}%` }} />
                          </div>
                          <p className="text-[9px] font-black text-primary tracking-tighter shrink-0 uppercase">
                            Add ₹{(promo.minOrderValue - totalPrice).toFixed(2)} More
                          </p>
                        </div>
                      ) : (
                        <p className="text-[9px] font-black text-primary/40 tracking-[0.3em] mt-4 uppercase group-hover:text-primary transition-colors">Select Reward Matrix</p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
