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
  ChevronRight,
  Smile,
  PackageCheck
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { safeFormat } from '@/lib/safe-date';
import { cn } from '@/lib/utils';

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams?.id;
  const { user, isUserLoading } = useUser();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (isUserLoading) return;
      if (!user || !orderId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/orders?search=${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch order details');
        const data = await res.json();
        const ordersArray = Array.isArray(data) ? data : (data.orders || []);
        const matchedOrder = ordersArray.find((o: any) => o.orderId === orderId);
        setOrder(matchedOrder || null);
      } catch (err) {
        console.error('[OrderSuccess] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [user, isUserLoading, orderId]);

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
      </div>
    );
  }

  const breakdown = order?.billingBreakdown;
  const totalSaved = breakdown?.savings || 0;
  const isPendingConsult = order?.status === 'Pending Consult';

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-lg mx-auto px-6 py-6 md:py-12 flex flex-col items-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-8"
          >
            {/* Confirmation Header */}
            <div className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 border-4 border-white"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-outfit uppercase">
                  {isPendingConsult ? "Order Received" : "Order Confirmed!"}
                </h1>
                <p className="text-emerald-600 font-black text-[10px] tracking-[0.3em] uppercase">YOUR HEALTH ESSENTIALS ARE ON THE WAY</p>
              </div>
            </div>
            
            {/* Success Card - Matches Mobile App Aesthetic */}
            <Card className="rounded-[48px] border-none shadow-2xl shadow-emerald-900/10 bg-emerald-600 overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-40 h-40" />
              </div>
              <CardContent className="p-10 space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/60">Total Amount</p>
                    <p className="text-5xl font-black font-outfit tracking-tighter">₹{Number(order?.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  {totalSaved > 0 && (
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/60">Total Savings</p>
                      <p className="text-2xl font-black font-outfit flex items-center justify-end gap-2 text-emerald-50">
                        <Zap className="w-5 h-5 fill-emerald-50" />
                        ₹{Number(totalSaved).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/20">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/60">Order ID</p>
                    <p className="text-xs font-black uppercase tracking-wider">#{orderId?.substring(0, 12).toUpperCase()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/60">Payment Mode</p>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-100/60" />
                      <p className="text-xs font-black uppercase">{order?.paymentType || 'CASH ON DELIVERY'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info Card */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex gap-5 items-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Delivering to</p>
                  <p className="text-sm font-black text-slate-800 uppercase line-clamp-1">{order?.shippingDetails?.street}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{order?.shippingDetails?.city} • {order?.shippingDetails?.pincode}</p>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100/50 flex gap-5 items-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <Smile className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-[11px] font-bold text-emerald-700 leading-relaxed uppercase tracking-wide">
                  We're excited to serve you! You will receive a confirmation call shortly from our team.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 pt-4">
              <Button asChild className="w-full h-20 rounded-[28px] bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-200 gap-4">
                <Link href="/orders">
                  Track Your Order
                  <PackageCheck className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-20 rounded-[28px] border-2 border-slate-100 bg-white font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-50 active:scale-[0.98] transition-all text-slate-600">
                <Link href="/">
                  Continue Shopping
                </Link>
              </Button>
            </div>

            <div className="pt-8 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">SahiMed Secure Checkout</p>
            </div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
