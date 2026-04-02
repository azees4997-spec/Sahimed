
"use client"

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, ArrowRight, Plus, Minus, Ticket, ChevronRight, FileWarning, Camera, ClipboardCheck, Tag, PartyPopper, Sparkles, Zap, Loader2, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { useUser, useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    availablePromos, appliedPromo, applyPromo, attachedPrescriptions, addPrescription, removePrescription 
  } = useCart();
  
  const { user } = useUser();
  const storage = useStorage();
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
  const isPrescriptionReady = !requiresPrescription || attachedPrescriptions.length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!storage) {
       toast({ variant: "destructive", title: "Storage service not ready" });
       return;
    }

    const fileList = Array.from(files);
    setIsUploading(true);

    try {
      for (const file of fileList) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: "destructive", title: `${file.name} is too large (>5MB)` });
          continue;
        }

        const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          toast({ variant: "destructive", title: `${file.name}: Invalid format` });
          continue;
        }

        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const userId = user?.uid || 'anonymous';
        const storageRef = ref(storage, `prescriptions/${userId}/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        addPrescription(downloadURL);
      }
      toast({ title: "Clinical files uploaded successfully" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
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
        <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-4 sm:mb-10 font-outfit flex items-baseline gap-2"
          >
            Your Cart <span className="text-primary/50 text-[10px] sm:text-xl font-black tracking-widest uppercase bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{totalItems} Items</span>
          </motion.h1>

          {requiresPrescription && (
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "border border-white/50 p-3 sm:p-4 rounded-[20px] sm:rounded-[28px] mb-6 flex flex-col gap-3 shadow-lg backdrop-blur-md relative overflow-hidden",
                attachedPrescriptions.length > 0 ? "bg-emerald-50/20" : "bg-primary/5"
              )}
            >
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                    attachedPrescriptions.length > 0 ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                  )}>
                     {attachedPrescriptions.length > 0 ? <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileWarning className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <div>
                    <p className="font-black text-[10px] sm:text-xs tracking-tight uppercase font-outfit">Prescription Matrix ({attachedPrescriptions.length})</p>
                    <p className="text-[7px] sm:text-[8px] font-black tracking-widest opacity-60 uppercase">Max 5MB per file • Multiple allowed</p>
                  </div>
                </div>
                
                  <input type="file" id="cart-upload" className="hidden" accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFileChange} />
                  <Button 
                    onClick={() => document.getElementById('cart-upload')?.click()} 
                    disabled={isUploading}
                    className="rounded-full font-black text-[8px] h-8 sm:h-10 px-4 gap-2 bg-primary text-white uppercase tracking-widest shadow-lg"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3 sm:w-4 sm:h-4" />} 
                    {isUploading ? "Uploading..." : "Add File"}
                  </Button>
                </div>

                {attachedPrescriptions.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1 border-t border-slate-100/50">
                    {attachedPrescriptions.map((url, idx) => {
                      const isPDF = url.toLowerCase().includes('.pdf') || url.includes('application%2Fpdf');
                      return (
                        <motion.div 
                          key={idx} 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-white shadow-sm shrink-0 group bg-slate-50 flex items-center justify-center"
                        >
                          {isPDF ? (
                            <div className="flex flex-col items-center justify-center w-full h-full text-rose-500">
                               <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                               <span className="text-[6px] font-black uppercase tracking-tighter mt-0.5">PDF</span>
                            </div>
                          ) : (
                            <Image src={url} alt="prescription" fill className="object-cover" />
                          )}
                          <button 
                            onClick={() => removePrescription(idx)}
                            className="absolute top-0 right-0 bg-rose-500 text-white p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
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
                    className="bg-white p-2.5 sm:p-4 rounded-[20px] sm:rounded-[32px] shadow-sm border border-slate-100 flex flex-row gap-3 sm:gap-6 items-center group transition-all relative overflow-hidden"
                  >
                    <Link href={`/product/${item.id}`} className="relative w-14 h-14 sm:w-24 sm:h-24 bg-slate-50 rounded-[14px] sm:rounded-[24px] overflow-hidden shrink-0 border border-slate-100 shadow-inner cursor-pointer">
                      <Image src={safeImageUrl} alt={item.name} fill className="object-contain p-1.5 sm:p-3 group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`} className="hover:text-primary transition-colors cursor-pointer">
                          <h3 className="font-extrabold text-slate-900 text-[11px] sm:text-base tracking-tight line-clamp-1 sm:line-clamp-2 font-outfit uppercase leading-tight">{item.name}</h3>
                        </Link>
                        <p className="text-[7px] sm:text-[9px] text-slate-400 font-bold tracking-widest truncate mt-0.5 sm:mt-1 mb-1 sm:mb-2 uppercase">{item.saltComposition}</p>
                        
                        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/50 rounded-full p-0.5 sm:p-1 border border-slate-100 w-fit">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white text-primary shadow-sm hover:bg-primary hover:text-white transition-all"><Minus className="w-2.5 h-2.5" /></button>
                          <span className="text-[10px] sm:text-sm font-black w-4 sm:w-6 text-center font-outfit">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white text-primary shadow-sm hover:bg-primary hover:text-white transition-all"><Plus className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:text-right shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-xl font-black text-slate-900 font-outfit tracking-tighter leading-none">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-[7px] sm:text-[10px] text-primary font-black line-through opacity-30 mt-0.5">₹{((item.mrp || item.price + 50) * item.quantity).toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-7 h-7 sm:w-8 sm:h-8 sm:mt-2 rounded-full flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
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
                    "p-5 rounded-[32px] shadow-xl border flex items-center justify-between group cursor-pointer transition-all relative overflow-hidden",
                    appliedPromo ? "bg-primary text-white border-primary shadow-primary/20" : "bg-white/40 border-white backdrop-blur-md"
                  )} 
                  onClick={() => setIsPromoDialogOpen(true)}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md",
                      appliedPromo ? "bg-white text-primary" : "bg-white text-primary"
                    )}>
                      < Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-[10px] tracking-widest uppercase">
                        {appliedPromo ? `REWARD: ${appliedPromo.code}` : "Coupon Gateway"}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    {appliedPromo ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); applyPromo(null); }} 
                        className="text-white font-black text-[8px] tracking-widest hover:underline uppercase p-1"
                      >
                        [ Revoke ]
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-300 transition-transform group-hover:translate-x-1" />
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
                  className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24" />
                  
                  <h2 className="text-[7px] sm:text-[9px] font-black mb-4 sm:mb-6 tracking-[0.2em] text-slate-400 uppercase relative z-10">Matrix Summary</h2>
                  <div className="space-y-2 sm:space-y-4 mb-6 relative z-10">
                    <div className="flex justify-between text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Gross MRP</span>
                      <span>₹{totalMrp.toFixed(2)}</span>
                    </div>
                    {itemSavings > 0 && (
                      <div className="flex justify-between text-[9px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                        <span>Optimization</span>
                        <span>-₹{itemSavings.toFixed(2)}</span>
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="flex justify-between text-[9px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                        <span>Coupon Reward</span>
                        <span>-₹{promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {feeTotal > 0 && (
                      <div className="flex justify-between text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>Handling Feed</span>
                        <span>₹{feeTotal.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-3 sm:pt-6 border-t border-slate-50 flex justify-between items-baseline">
                      <span className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-widest">Net Payable</span>
                      <span className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter font-outfit">₹{finalPayable.toFixed(2)}</span>
                    </div>
                    
                    {totalSavings > 0 && (
                      <div className="mt-2 flex justify-between items-center text-[9px] sm:text-xs font-black text-emerald-700 bg-emerald-50 p-2 sm:p-3 rounded-[16px] border border-emerald-100">
                        <span className="uppercase tracking-widest">Savings Matrix</span>
                        <span className="bg-emerald-100 px-2 py-0.5 rounded text-[8px] sm:text-[10px] uppercase tracking-widest font-black">
                          ₹{totalSavings.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  {isPrescriptionReady ? (
                    <Button onClick={handleCheckoutClick} className="w-full rounded-full h-12 sm:h-16 text-[9px] sm:text-xs font-black tracking-[0.2em] uppercase shadow-xl bg-primary text-white relative z-10 group hover:scale-[1.01] transition-all">
                      Confirm Checkout <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  ) : (
                    <Button onClick={() => document.getElementById('cart-upload')?.click()} className="w-full rounded-full h-12 sm:h-16 text-[9px] sm:text-xs font-black tracking-[0.2em] uppercase shadow-lg bg-rose-600 text-white relative z-10 group transition-all">
                      Attach clinical file <Camera className="w-4 h-4 ml-1" />
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
