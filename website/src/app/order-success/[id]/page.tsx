"use client"

import { use, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  MapPin,
  Banknote,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import BottomNav from '@/components/BottomNav';

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams?.id;
  const { user } = useUser();
  const db = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return doc(db, 'userProfiles', user.uid, 'orders', orderId);
  }, [db, user, orderId]);

  const { data: order, isLoading } = useDoc(orderRef);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Navbar />
        <div className="animate-pulse flex flex-col items-center gap-4 py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 opacity-20" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 font-outfit">Order Not Found</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 max-w-[200px]">This order summary is unavailable, expired, or restricted to another account.</p>
          <Button asChild className="rounded-full px-10 h-14 uppercase font-black tracking-widest text-[10px] bg-slate-900 shadow-xl shadow-slate-200">
            <Link href="/">Return Home</Link>
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const breakdown = order?.billingBreakdown;
  const totalSaved = breakdown?.savings || 0;
  const isPendingConsult = order?.status === 'Pending Consult';

  return (
    <PageTransition>
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-lg mx-auto px-6 py-6 md:py-10 flex flex-col items-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
          >
            {/* Confirmation Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-blue-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit uppercase">
                  {isPendingConsult ? "Order Received" : "Order Confirmed!"}
                </h1>
                {isPendingConsult ? (
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
                    <Clock className="w-3 h-3" />
                    Waiting for doctor consultation
                  </div>
                ) : (
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider opacity-70">Your health essentials are being prepared</p>
                )}
              </div>
            </div>

            {/* Payment & Savings Card */}
            <Card className="rounded-[40px] border-none shadow-2xl shadow-blue-900/10 bg-blue-600 overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-32 h-32" />
              </div>
              <CardContent className="p-8 space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Amount Paid</p>
                    <p className="text-4xl font-black font-outfit tracking-tighter">₹{Number(order?.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  {totalSaved > 0 && (
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Smart Savings</p>
                      <p className="text-xl font-black font-outfit flex items-center justify-end gap-1.5 text-blue-100">
                        <Zap className="w-4 h-4 fill-blue-100" />
                        ₹{Number(totalSaved).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Payment Mode</p>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-3.5 h-3.5 text-white/60" />
                      <p className="text-xs font-black uppercase">{order?.paymentType || 'COD'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Order ID</p>
                    <p className="text-xs font-black uppercase truncate">#{orderId?.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address Card */}
            <Card className="rounded-[32px] border border-slate-100 shadow-sm bg-slate-50/50">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Delivering to</p>
                  <p className="text-[11px] font-black text-slate-700 leading-tight uppercase truncate">
                    {order?.shippingDetails?.street || 'Default Address'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {order?.shippingDetails?.city} - {order?.shippingDetails?.pincode}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link href="/orders" className="w-full">
                <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-slate-200 gap-3">
                  Track Order
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full h-16 rounded-2xl border-2 font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <div className="pt-6 text-center">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">SahiMed Secure Gateway</p>
            </div>
          </motion.div>
        </main>

        <BottomNav />
      </div>
    </PageTransition>
  );
}
