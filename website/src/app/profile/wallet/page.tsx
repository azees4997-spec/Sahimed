"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

export default function WalletPage() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) return;
      try {
        const res = await fetch('/api/user/wallet');
        const walletData = await res.json();
        setData(walletData);
      } catch (e) {
        console.error("Wallet fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 pharma-bg-pattern pb-20">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
          <div className="space-y-12">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase font-outfit">SahiWallet</h1>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">Your secure digital healthcare credit</p>
            </div>

            {/* Balance Card */}
            <div className="relative group">
               <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-[56px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <Card className="relative overflow-hidden rounded-[56px] border-none shadow-2xl bg-gradient-to-br from-primary via-primary to-blue-600 p-12 md:p-20 text-white">
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Wallet className="w-48 h-48" />
                  </div>
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Available Balance</span>
                    </div>

                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter font-outfit">
                      ₹{data?.balance?.toFixed(2) || '0.00'}
                    </h2>

                    <div className="flex flex-wrap gap-4 pt-4">
                       <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none py-2 px-4 rounded-full font-black text-[10px] tracking-widest uppercase flex gap-2">
                         <ShieldCheck className="w-3.5 h-3.5" /> Secure Asset
                       </Badge>
                    </div>
                  </div>
               </Card>
            </div>

            {/* Transactions Section */}
            <div className="space-y-8 pt-8">
               <div className="flex items-center gap-4">
                  <div className="w-1 h-6 bg-slate-300 rounded-full" />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase font-outfit">Transaction History</h3>
               </div>

               <div className="space-y-4">
                 {data?.transactions?.length > 0 ? (
                   data.transactions.map((t: any, idx: number) => (
                     <div 
                      key={idx}
                      className="bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-between group"
                     >
                       <div className="flex items-center gap-6">
                         <div className={cn(
                           "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                           t.type === 'debit' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                         )}>
                           {t.type === 'debit' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                         </div>
                         <div>
                           <p className="font-black text-slate-900 tracking-tight uppercase text-sm md:text-base">{t.description}</p>
                           <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                             {format(new Date(t.timestamp), 'MMM dd, yyyy • HH:mm')}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className={cn(
                           "text-lg md:text-2xl font-black font-outfit",
                           t.type === 'debit' ? "text-rose-500" : "text-emerald-500"
                         )}>
                           {t.type === 'debit' ? '-' : '+'}₹{t.amount}
                         </p>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-20 text-center bg-white/40 backdrop-blur-md rounded-[48px] border-2 border-dashed border-slate-200">
                     <History className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                     <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">No transactions detected</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
