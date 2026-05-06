"use client"

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  Plus, 
  PlusCircle, 
  Edit2, 
  Trash2,
  RefreshCcw,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, getDocs, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';
import { motion, AnimatePresence } from 'framer-motion';

export function FeesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [fees, setFees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const { toast } = useToast();

  const fetchFees = useCallback(async () => {
    if (!db || !isVerified) return;
    setIsLoading(true);
    try {
      // Explicit fetch pattern to bypass onSnapshot bugs in Firebase 11
      const q = query(collection(db, 'fees'), orderBy('name', 'asc'), limit(50));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFees(data);
    } catch (err: any) {
      console.error("LOGISTICS_FETCH_CRITICAL:", err);
      toast({ variant: 'destructive', title: "Engine Link Failure", description: "Could not connect to logistics database." });
    } finally {
      setIsLoading(false);
    }
  }, [db, isVerified, toast]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const handleDelete = async (id: string) => {
    if (!confirm("Decommission this logistics policy?")) return;
    try {
      await deleteDocumentNonBlocking(doc(db, 'fees', id));
      toast({ title: "Policy Decommissioned" });
      setFees(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Purge Failed", description: err.message });
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Logistics Engine" subtitle="Global shipping orchestration" onBack={onBack}>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchFees} 
            disabled={isLoading}
            className="rounded-full h-14 w-14 p-0 border-2 border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-primary transition-all active:rotate-180 duration-500"
          >
            <RefreshCcw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </Button>
          <Button 
            onClick={() => { setEditingFee(null); setIsFormOpen(true); }} 
            className="rounded-full h-14 px-10 font-black text-[11px] bg-primary text-white border-4 border-white shadow-2xl shadow-primary/30 hover:scale-105 transition-all uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" /> New Strategy
          </Button>
        </div>
      </SectionHeader>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
             <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Accessing Engine Core...</p>
          </div>
        ) : fees.length === 0 ? (
          <Card className="p-20 text-center rounded-[56px] border-none bg-white shadow-xl flex flex-col items-center gap-6">
            <Zap className="w-10 h-10 text-slate-200" />
            <h3 className="text-xl font-black text-slate-900 uppercase font-outfit">No active strategies</h3>
          </Card>
        ) : (
          fees.map(fee => (
            <motion.div key={fee.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="group relative p-10 rounded-[48px] border-none shadow-xl bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                  <div className="space-y-4 max-w-md">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-3 h-3 rounded-full", fee.isActive ? "bg-accent shadow-lg shadow-accent/40" : "bg-slate-200")} />
                      <h3 className="text-2xl font-black text-slate-900 uppercase font-outfit tracking-tighter leading-none">{fee.name}</h3>
                    </div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] px-7">Policy Active</p>
                  </div>

                  <div className="flex-1 px-7 border-l border-slate-100 flex flex-wrap gap-3">
                    {fee.tiers?.sort((a: any, b: any) => a.minOrder - b.minOrder).map((t: any, idx: number, arr: any[]) => (
                      <div key={idx} className="flex items-center bg-slate-50 rounded-2xl py-3 px-5 gap-4 border border-slate-100/50">
                         <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Range</span>
                            <span className="text-xs font-black text-slate-900">
                              ₹{t.minOrder}{idx < arr.length - 1 ? `-₹${arr[idx+1].minOrder - 1}` : '+'}
                            </span>
                         </div>
                         <ArrowRight className="w-3 h-3 text-slate-300" />
                         <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Fee</span>
                            <span className={cn("text-xs font-black", t.charge === 0 ? "text-accent" : "text-primary")}>
                              {t.charge === 0 ? "FREE" : `₹${t.charge}`}
                            </span>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }} className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm"><Edit2 className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(fee.id)} className="w-14 h-14 rounded-full bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[56px] max-w-2xl border-none p-0 overflow-hidden shadow-3xl bg-white/95 backdrop-blur-2xl">
          <DialogHeader className="bg-primary p-12 text-white">
            <DialogTitle className="text-4xl font-black text-white font-outfit uppercase tracking-tighter">Strategy Config</DialogTitle>
            <DialogDescription className="text-[11px] font-black text-white/50 tracking-[0.3em] uppercase">
              Defining Logistics Protocols
            </DialogDescription>
          </DialogHeader>
          <div className="p-12">
            <FeeForm db={db} initialData={editingFee} onSuccess={() => { setIsFormOpen(false); fetchFees(); }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    name: initialData?.name || '', 
    tiers: initialData?.tiers || [
      { minOrder: 0, charge: 49 }, 
      { minOrder: 500, charge: 29 }, 
      { minOrder: 1000, charge: 0 }
    ],
    isActive: initialData?.isActive ?? true 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const sortedTiers = [...form.tiers]
      .map(t => ({ minOrder: Number(t.minOrder), charge: Number(t.charge) }))
      .sort((a, b) => a.minOrder - b.minOrder);

    const payload = { 
      name: form.name,
      tiers: sortedTiers,
      isActive: form.isActive,
      updatedAt: serverTimestamp() 
    };

    try {
      if (initialData?.id) {
        await updateDocumentNonBlocking(doc(db, 'fees', initialData.id), payload);
      } else {
        await addDocumentNonBlocking(collection(db, 'fees'), { ...payload, createdAt: serverTimestamp() });
      }
      toast({ title: "Protocol Synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync Failure", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTier = () => {
    setForm({...form, tiers: [...form.tiers, { minOrder: 0, charge: 0 }]});
  };

  const removeTier = (index: number) => {
    setForm({...form, tiers: form.tiers.filter((_: any, i: number) => i !== index)});
  };

  const updateTier = (index: number, field: string, value: number) => {
    const next = [...form.tiers];
    next[index] = { ...next[index], [field]: value };
    setForm({...form, tiers: next});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="space-y-3">
        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Policy Identifier</Label>
        <Input 
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} 
          required 
          placeholder="E.G. STANDARD DELIVERY..."
          className="rounded-3xl h-20 bg-slate-50 border-none font-black text-lg px-8 placeholder:text-slate-200 uppercase focus:ring-4 focus:ring-primary/5 transition-all" 
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Active Intervals</h4>
          </div>
          <Button type="button" onClick={addTier} variant="ghost" className="h-10 text-[10px] font-black text-primary uppercase tracking-widest gap-2 hover:bg-primary/5 rounded-full px-6 transition-all">
            <PlusCircle className="w-4 h-4" /> Add Threshold
          </Button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {form.tiers.map((t: any, i: number) => (
              <motion.div 
                key={i} 
                layout 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="group flex gap-6 items-end bg-slate-50/50 p-6 rounded-[32px] border-2 border-transparent hover:border-primary/10 hover:bg-white transition-all shadow-sm"
              >
                <div className="flex-1 space-y-3">
                  <Label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Threshold (₹)</Label>
                  <Input 
                    type="number" 
                    value={t.minOrder} 
                    onChange={e => updateTier(i, 'minOrder', Number(e.target.value))} 
                    className="rounded-2xl h-14 bg-white border-none font-black text-base px-6 shadow-inner" 
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <Label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Charge (₹)</Label>
                  <Input 
                    type="number" 
                    value={t.charge} 
                    onChange={e => updateTier(i, 'charge', Number(e.target.value))} 
                    className="rounded-2xl h-14 bg-white border-none font-black text-base px-6 shadow-inner" 
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(i)} className="h-14 w-14 text-slate-200 hover:bg-rose-50 hover:text-red-500 rounded-2xl transition-all">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-10 bg-slate-900 rounded-[40px] shadow-2xl space-y-6">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3">
          <Edit2 className="w-3.5 h-3.5" /> Logic Simulation
        </p>
        <div className="grid gap-3">
          {[...form.tiers].sort((a, b) => a.minOrder - b.minOrder).map((t, idx, arr) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-none">
              <div className="flex flex-col">
                <p className="text-sm font-black text-white font-outfit uppercase">
                  {idx === arr.length - 1 ? (
                    <span>Orders Over ₹{t.minOrder}</span>
                  ) : (
                    <span>₹{t.minOrder} To ₹{arr[idx+1].minOrder - 1}</span>
                  )}
                </p>
              </div>
              <span className={cn("text-lg font-black tracking-tighter", t.charge === 0 ? "text-accent" : "text-white")}>
                {t.charge === 0 ? "FREE" : `₹${t.charge}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4 px-4 py-2">
        <Checkbox 
          id="fee-active" 
          checked={form.isActive} 
          onCheckedChange={c => setForm({...form, isActive: !!c})} 
          className="w-7 h-7 rounded-xl border-2 border-slate-100 data-[state=checked]:bg-accent data-[state=checked]:border-accent transition-all shadow-sm"
        />
        <Label htmlFor="fee-active" className="text-[11px] font-black cursor-pointer uppercase tracking-[0.2em] text-slate-500">Authorize Strategy</Label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-24 rounded-[32px] font-black bg-primary text-white shadow-3xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.4em] text-sm border-[6px] border-white">
        {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : "Sync Engine"}
      </Button>
    </form>
  );
}
