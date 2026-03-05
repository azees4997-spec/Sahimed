
"use client"

import { use, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag, ArrowRight, Package, ShieldCheck, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams?.id;
  const { user } = useUser();
  const db = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return doc(db, 'userProfiles', user.uid, 'orders', orderId);
  }, [db, user, orderId]);

  const { data: order } = useDoc(orderRef);

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 md:py-24 text-center">
        <div className="mb-10 relative">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-in zoom-in duration-700">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -z-10 animate-pulse" />
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Order Placed Successfully!</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Your clinical needs are being processed</p>
        </div>

        <Card className="rounded-[40px] border-none shadow-xl bg-white overflow-hidden mb-12 animate-in slide-in-from-bottom-8 duration-700">
          <CardContent className="p-10 space-y-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order Reference</span>
              <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                <Package className="w-4 h-4 text-primary" />
                <code className="text-lg font-black text-primary tracking-widest">{orderId?.substring(0, 12).toUpperCase()}</code>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-dashed">
              <div className="text-left">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <p className="font-black text-sm uppercase text-gray-900">Confirmed</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Delivery</p>
                <p className="font-black text-sm uppercase text-accent">2-3 Working Days</p>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-start gap-4 text-left">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-gray-900 tracking-tight">Pharmacist Review</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed mt-1">
                    Our team is currently verifying your order. You will receive tracking details via SMS once dispatched.
                  </p>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/orders" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full rounded-full h-16 px-10 font-black uppercase text-[11px] tracking-widest border-2 hover:bg-gray-50 active:scale-95 transition-all">
              Track Order History
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full rounded-full h-16 px-12 font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-primary/30 gap-3 active:scale-95 transition-all">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-16 pt-10 border-t border-gray-100 flex items-center justify-center gap-4">
           <ShieldCheck className="w-5 h-5 text-green-500" />
           <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Verified Secure Transaction</p>
        </div>
      </main>
    </div>
  );
}
