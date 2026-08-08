'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Percent, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { SectionHeader } from './SectionHeader';
import { motion } from 'framer-motion';

export function AnalyticsTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/analytics/savings', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const metrics = data?.metrics || {};
  const topMolecules = data?.topMolecules || [];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Patient Savings & Generic Analytics" 
        subtitle="Real-time business intelligence on customer money saved & generic switch rate" 
        onBack={onBack}
      >
        <Button 
          onClick={fetchAnalytics} 
          variant="outline" 
          className="rounded-full h-12 px-6 font-black text-xs border-slate-200 gap-2 uppercase tracking-wider hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </Button>
      </SectionHeader>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calculating Patient Savings & Conversion Metrics...</p>
        </div>
      ) : (
        <>
          {/* ── 4 Key Performance Indicator Metric Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Patient Savings */}
            <Card className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <IndianRupee className="w-24 h-24 text-white" />
              </div>
              <div className="space-y-3 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Total Patient Savings
                </span>
                <p className="text-3xl sm:text-4xl font-black font-outfit tracking-tight">
                  ₹{metrics.totalSavings?.toLocaleString() || '0'}
                </p>
                <p className="text-[11px] text-white/80 font-semibold">
                  Saved by patients choosing SahiMed vs MRP
                </p>
              </div>
            </Card>

            {/* Generic Switch Rate */}
            <Card className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                  Generic Switch Rate
                </span>
                <Percent className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-3xl sm:text-4xl font-black font-outfit text-slate-900 tracking-tight">
                {metrics.genericConversionRate || 0}%
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                {metrics.genericItemsCount || 0} generic vs {metrics.brandedItemsCount || 0} branded units purchased
              </p>
            </Card>

            {/* Average Savings per Order */}
            <Card className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  Avg Savings / Order
                </span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl sm:text-4xl font-black font-outfit text-slate-900 tracking-tight">
                ₹{metrics.avgSavingsPerOrder?.toLocaleString() || '0'}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                Average money saved per patient order
              </p>
            </Card>

            {/* Total Orders Fulfilled */}
            <Card className="rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  Orders Fulfilled
                </span>
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl sm:text-4xl font-black font-outfit text-slate-900 tracking-tight">
                {metrics.totalOrders || 0}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                Total authentic orders processed
              </p>
            </Card>

          </div>

          {/* ── Revenue Split & Top Savings Leaderboard ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Revenue Ratio Bar */}
            <Card className="lg:col-span-5 rounded-[32px] border border-slate-100 p-6 bg-white shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-outfit uppercase tracking-tight">Revenue Distribution</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Generic vs Branded Sales Revenue Split</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Sahi Generics
                  </span>
                  <span className="text-slate-900">₹{metrics.genericRevenue?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-blue-700 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Branded Meds
                  </span>
                  <span className="text-slate-900">₹{metrics.brandedRevenue?.toLocaleString() || '0'}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" 
                    style={{ width: `${metrics.totalRevenue > 0 ? (metrics.genericRevenue / metrics.totalRevenue) * 100 : 50}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" 
                    style={{ width: `${metrics.totalRevenue > 0 ? (metrics.brandedRevenue / metrics.totalRevenue) * 100 : 50}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sahi Impact Statement
                </div>
                <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                  Your platform has saved Indian patients <span className="font-extrabold text-emerald-900">₹{metrics.totalSavings?.toLocaleString()}</span> by offering authentic branded generics at up to 61% off MRP.
                </p>
              </div>
            </Card>

            {/* Top Money-Saving Molecule Formulations Leaderboard */}
            <Card className="lg:col-span-7 rounded-[32px] border border-slate-100 p-6 bg-white shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-outfit uppercase tracking-tight">Top Money-Saving Formulations</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Molecule Compositions Saving Patients the Most Money</p>
              </div>

              {topMolecules.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase">
                  No molecule savings recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {topMolecules.map((mol: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0">
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate uppercase">{mol.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{mol.count} units purchased</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-600 font-outfit">₹{Math.round(mol.totalSaved).toLocaleString()}</span>
                        <p className="text-[9px] font-black text-emerald-700 uppercase">Saved</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        </>
      )}
    </div>
  );
}
