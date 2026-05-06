"use client"

import React from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCcw, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

export default function PaymentFailedPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 pt-12 pb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-8 border-4 border-white shadow-xl shadow-rose-500/10"
          >
            <XCircle className="w-12 h-12" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter font-outfit uppercase mb-4">
              Payment Failed
            </h1>
            <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto leading-relaxed uppercase text-[10px] sm:text-xs tracking-widest">
              WE COULDN'T PROCESS YOUR SECURE TRANSACTION. NO FUNDS HAVE BEEN DEDUCTED FROM YOUR ACCOUNT.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-10 space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-left">
                <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-black text-[11px] text-slate-800 uppercase tracking-wider mb-1">Common reasons:</h3>
                  <ul className="text-[10px] text-slate-500 font-bold uppercase tracking-tight list-disc pl-4 space-y-1">
                    <li>Insufficient balance in bank account</li>
                    <li>Payment was canceled by user</li>
                    <li>Bank servers are temporarily down</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-slate-100 flex flex-col gap-3">
              <Button asChild className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-xs tracking-widest uppercase gap-2 shadow-lg shadow-primary/20">
                <Link href="/checkout">
                  <RefreshCcw className="w-4 h-4" /> Try Again
                </Link>
              </Button>
              <Button variant="ghost" asChild className="w-full h-14 rounded-full text-slate-400 font-black text-xs tracking-widest uppercase gap-2 hover:bg-slate-50">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" /> Return to Home
                </Link>
              </Button>
            </div>
          </motion.div>

          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">
            Need help? Contact SahiMed support at <span className="text-primary">+91 80 4709 6868</span>
          </p>
        </main>
      </div>
    </PageTransition>
  );
}
