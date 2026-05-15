"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  XCircle,
  AlertCircle,
  PhoneCall,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  ZapOff
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

import { Suspense } from 'react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('error') || 'Your transaction could not be processed at this time.';

  return (
    <main className="flex-1 max-w-lg mx-auto px-6 py-6 md:py-12 flex flex-col items-center w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-rose-200 border-4 border-white"
          >
            <XCircle className="w-12 h-12" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-outfit uppercase">
              Payment Failed
            </h1>
            <p className="text-rose-600 font-black text-[10px] tracking-[0.3em] uppercase">TRANSACTION WAS NOT COMPLETED</p>
          </div>
        </div>
        
        {/* Error Card */}
        <Card className="rounded-[48px] border-none shadow-2xl shadow-rose-900/10 bg-rose-600 overflow-hidden text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ZapOff className="w-40 h-40" />
          </div>
          <CardContent className="p-10 space-y-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/60">Reason for failure</p>
                <p className="text-sm font-bold leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20 text-center">
              <p className="text-[9px] font-bold text-rose-100/80 uppercase tracking-widest leading-loose">
                Don't worry, if any amount was debited, it will be refunded to your source account within 5-7 working days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assistance Card */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex gap-5 items-center">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 text-rose-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Need Help?</p>
              <p className="text-sm font-black text-slate-800 uppercase line-clamp-1">+91 73494 99898</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Call us for manual payment links</p>
            </div>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-100/50 flex gap-5 items-center">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-[11px] font-bold text-rose-700 leading-relaxed uppercase tracking-wide">
              You can also try placing the order with "Cash on Delivery" to ensure immediate processing.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 pt-4">
          <Link href="/checkout" className="w-full">
            <Button className="w-full h-20 rounded-[28px] bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-200 gap-4">
              Retry Payment
              <RefreshCw className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full h-20 rounded-[28px] border-2 border-slate-100 bg-white font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-50 active:scale-[0.98] transition-all text-slate-600">
              Return to Home
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">SahiMed Secure Gateway</p>
        </div>
      </motion.div>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col">
        <Navbar />
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
          </div>
        }>
          <PaymentFailedContent />
        </Suspense>
      </div>
    </PageTransition>
  );
}
