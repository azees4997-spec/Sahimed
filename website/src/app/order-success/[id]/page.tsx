
"use client"

import { use, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Package, 
  ShieldCheck, 
  ClipboardCheck, 
  Banknote,
  PartyPopper,
  Zap,
  Star,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams?.id;
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.4;
    
    audio.play().catch(e => {
      console.log("Clinical chime standby: waiting for session interaction.");
    });

    if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  const orderRef = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return doc(db, 'userProfiles', user.uid, 'orders', orderId);
  }, [db, user, orderId]);

  const { data: order, isLoading } = useDoc(orderRef);

  const breakdown = order?.billingBreakdown;
  const totalSaved = breakdown?.savings || 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-2xl mx-auto px-6 py-12 md:py-20 text-center flex flex-col justify-center w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-10"
          >
            <motion.div variants={itemVariants} className="relative">
              <div className="w-28 h-28 bg-emerald-500 text-white rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-3xl rotate-12 group hover:rotate-0 transition-transform duration-500 border-4 border-white">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
              
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Order Secured!</h1>
                <p className="text-primary font-black text-[10px] tracking-[0.4em] uppercase opacity-70">Sahi dawai, sahi daam pe • Clinical Precision</p>
              </div>
            </motion.div>

            {totalSaved > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="rounded-[56px] border-none bg-gradient-to-br from-primary to-primary/80 overflow-hidden shadow-3xl relative group active:scale-[0.98] transition-all">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <Star className="w-32 h-32 text-white" />
                  </div>
                  <CardContent className="p-10 relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <PartyPopper className="w-5 h-5 text-white/80 animate-bounce" />
                      <h2 className="text-[10px] font-black text-white/60 tracking-[0.4em] uppercase">Intelligence Savings Lock-in</h2>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 mb-8">
                      <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase font-outfit flex items-center gap-3">
                        <span className="text-3xl opacity-50 font-normal">₹</span>
                        {Number(totalSaved).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">Cumulative economy generated</span>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                      <div className="text-center space-y-1 border-r border-white/10">
                        <p className="text-[8px] font-black text-white/40 tracking-[0.3em] uppercase">Market Delta</p>
                        <p className="font-black text-base text-white font-outfit">₹{((breakdown?.grossMrp || 0) - (order?.totalAmount || 0) + (breakdown?.campaignDiscount || 0)).toFixed(2)}</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[8px] font-black text-white/40 tracking-[0.3em] uppercase">Campaign Edge</p>
                        <p className="font-black text-base text-white font-outfit">₹{Number(breakdown?.campaignDiscount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Card className="rounded-[56px] border-none shadow-xl bg-white/80 backdrop-blur-xl overflow-hidden border border-white">
                <CardContent className="p-0">
                  <div className="bg-slate-50/50 p-8 flex flex-col items-center gap-4 border-b border-slate-100">
                    <div className="bg-primary/5 px-6 py-2.5 rounded-full flex items-center gap-3 border border-primary/10">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">Manifest ID: {orderId?.substring(0, 12).toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-left space-y-2">
                        <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase opacity-60">Terminal Payable</p>
                        <p className="font-black text-3xl text-slate-900 leading-none font-outfit">₹{Number(order?.totalAmount || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase opacity-60">Protocol</p>
                        <div className="flex items-center justify-end gap-2.5">
                          <Banknote className="w-5 h-5 text-emerald-500" />
                          <p className="font-black text-lg text-emerald-600 uppercase tracking-tight">{order?.paymentType || 'COD'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 flex items-start gap-4 text-left shadow-inner">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                         <ClipboardCheck className="w-5 h-5 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-900 tracking-[0.2em] uppercase mb-1">Pharmacist Review In-Progress</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-relaxed tracking-wider opacity-60">
                            Our clinical team is validating your prescription matrix. expect transmission updates shortly.
                          </p>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5">
              <Link href="/" className="flex-1">
                <Button className="w-full rounded-[24px] h-20 font-black text-[11px] tracking-[0.3em] shadow-2xl shadow-primary/30 uppercase gap-4 active:scale-95 transition-all bg-primary hover:scale-[1.02] border-4 border-white text-white">
                  Continue Procurement
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/orders" className="flex-1">
                <Button variant="outline" className="w-full rounded-[24px] h-20 font-black text-[11px] tracking-[0.3em] border-2 uppercase hover:bg-white active:scale-95 transition-all shadow-xl shadow-slate-100">
                  Track Inventory
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-center gap-4"
            >
               <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                 <ShieldCheck className="w-6 h-6 text-emerald-500" />
               </div>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-60">SahiMed Secure Gateway • Verified Encryption</p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
