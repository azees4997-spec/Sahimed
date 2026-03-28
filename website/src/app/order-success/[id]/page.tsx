
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
  TrendingDown,
  Tag,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 md:py-12 text-center flex flex-col justify-center">
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-in zoom-in duration-700">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -z-10 animate-pulse" />
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Order confirmed!</h1>
          <p className="text-[#0061AF] font-bold text-[10px] tracking-[0.3em]">Sahi dawai, sahi daam pe</p>
        </div>

        {totalSaved > 0 && (
          <Card className="rounded-[32px] border-none bg-gradient-to-br from-accent/10 to-accent/5 overflow-hidden mb-6 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <PartyPopper className="w-4 h-4 text-accent animate-bounce" />
                <h2 className="text-[10px] font-black text-accent tracking-widest">Clinical savings unlocked</h2>
              </div>
              
              <div className="flex flex-col items-center gap-0.5 mb-4">
                <p className="text-4xl font-black text-accent tracking-tighter animate-pulse">₹{Number(totalSaved).toFixed(2)}</p>
                <span className="text-[8px] font-black text-accent/60 tracking-widest">Total savings on this order</span>
              </div>

              <div className="flex justify-center gap-8 border-t border-accent/10 pt-4">
                <div className="text-center space-y-0.5">
                  <p className="text-[7px] font-black text-gray-400 tracking-widest">MRP edge</p>
                  <p className="font-black text-[11px] text-gray-900">₹{((breakdown?.grossMrp || 0) - (order?.totalAmount || 0) + (breakdown?.campaignDiscount || 0)).toFixed(2)}</p>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[7px] font-black text-gray-400 tracking-widest">Campaign</p>
                  <p className="font-black text-[11px] text-gray-900">₹{Number(breakdown?.campaignDiscount || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden mb-8 animate-in slide-in-from-bottom-8 duration-700">
          <CardContent className="p-0">
            <div className="bg-gray-50/50 p-6 flex flex-col items-center gap-3 border-b border-gray-100">
              <div className="bg-primary/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                <Package className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-black text-primary tracking-widest">Order id: {orderId?.substring(0, 12).toUpperCase()}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">Final payable</p>
                  <p className="font-black text-lg text-gray-900 leading-none">₹{Number(order?.totalAmount || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">Payment</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-accent" />
                    <p className="font-black text-xs text-accent">{order?.paymentType || 'COD'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 text-left">
                 <ClipboardCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                 <div>
                    <p className="text-[9px] font-black text-gray-900 tracking-tight">Pharmacist review in-progress</p>
                    <p className="text-[8px] font-bold text-gray-500 leading-relaxed mt-0.5">
                      Our clinical team is verifying your order. You will receive SMS updates once dispatched.
                    </p>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 justify-center items-center">
          <Link href="/" className="w-full">
            <Button className="w-full rounded-full h-14 font-black text-[10px] tracking-[0.2em] shadow-2xl shadow-primary/30 gap-3 active:scale-95 transition-all bg-primary text-white">
              Continue shopping
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/orders" className="w-full">
            <Button variant="outline" className="w-full rounded-full h-14 font-black text-[10px] tracking-[0.2em] border-2 hover:bg-gray-50 active:scale-95 transition-all">
              Track order history
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-3">
           <ShieldCheck className="w-4 h-4 text-green-500" />
           <p className="text-[8px] text-gray-400 font-black tracking-[0.2em]">Verified secure transaction</p>
        </div>
      </main>
    </div>
  );
}
