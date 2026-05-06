"use client"

import { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  PlusCircle, 
  Edit2, 
  Trash2 
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
  useMemoFirebase, 
  useCollection,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';

export function FeesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const feesQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'fees'), orderBy('name', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: fees, isLoading } = useCollection(feesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical fees" subtitle="Manage dynamic charges" onBack={onBack}><Button onClick={() => { setEditingFee(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> Add charge</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Charge name</th><th className="px-10 py-8">Pricing</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8"><div className="w-48 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-20 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-16 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg" /></div></td>
                  </tr>
                ))
              ) : (!fees || fees.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No fees found</td></tr>) : fees?.map(fee => (
                <tr key={fee.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm">{fee.name}</td>
                  <td className="px-10 py-8 font-black text-gray-900">₹{Number(fee.discountedAmount || 0).toFixed(2)}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", fee.isActive ? "bg-accent text-white" : "bg-gray-100 text-gray-400")}>{fee.isActive ? 'Enabled' : 'Paused'}</Badge></td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { 
                        if(confirm("Delete fee?")) {
                          try {
                            await deleteDocumentNonBlocking(doc(db, 'fees', fee.id));
                            toast({ title: "Fee model deleted" });
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: "Deletion failed", description: err.message });
                          }
                        }
                      }}><Trash2 className="w-4 h-4 text-red-300" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Fee structure</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Define shipping tiers and administrative surcharges
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <FeeForm db={db} initialData={editingFee} onSuccess={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ 
    name: initialData?.name || '', 
    tiers: initialData?.tiers || [{ minOrder: 0, charge: 49 }, { minOrder: 500, charge: 29 }, { minOrder: 1000, charge: 0 }],
    isActive: initialData?.isActive ?? true 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sort tiers by minOrder to ensure correct evaluation order
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
      toast({ title: "Clinical fee protocol synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Policy Name (e.g. Standard Delivery)</Label>
        <Input 
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} 
          required 
          placeholder="ENTER POLICY IDENTIFIER..."
          className="rounded-2xl h-14 bg-gray-50 border-none font-black text-xs placeholder:text-slate-200 uppercase" 
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pricing Tiers</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Define cost per order value range</p>
          </div>
          <Button type="button" onClick={addTier} variant="ghost" className="h-8 text-[10px] font-black text-primary uppercase tracking-widest gap-2 hover:bg-primary/5 rounded-full px-4">
            <PlusCircle className="w-3.5 h-3.5" /> Add Tier
          </Button>
        </div>

        <div className="space-y-3">
          {form.tiers.map((t: any, i: number) => (
            <div key={i} className="group flex gap-4 items-end bg-slate-50/50 p-5 rounded-[28px] border-2 border-transparent hover:border-primary/10 hover:bg-white transition-all shadow-sm">
              <div className="flex-1 space-y-2">
                <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Threshold (₹)</Label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">MIN</div>
                   <Input 
                    type="number" 
                    value={t.minOrder} 
                    onChange={e => updateTier(i, 'minOrder', Number(e.target.value))} 
                    className="rounded-xl h-12 bg-white border-none font-black text-sm pl-12" 
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Charge (₹)</Label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₹</div>
                   <Input 
                    type="number" 
                    value={t.charge} 
                    onChange={e => updateTier(i, 'charge', Number(e.target.value))} 
                    className="rounded-xl h-12 bg-white border-none font-black text-sm pl-8" 
                  />
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(i)} className="h-12 w-12 text-slate-200 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-900 rounded-[32px] shadow-2xl space-y-4">
        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
          <Edit2 className="w-3 h-3" /> System Logic Preview
        </p>
        <div className="grid gap-2">
          {[...form.tiers].sort((a, b) => a.minOrder - b.minOrder).map((t, idx, arr) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-none">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                {idx === 0 && t.minOrder === 0 ? "Initial Range" : `Threshold Reach`}
              </span>
              <p className="text-[11px] font-bold text-white">
                {idx === arr.length - 1 ? (
                  <span className="flex items-center gap-2">
                    Orders <span className="text-primary font-black">₹{t.minOrder}+</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Orders <span className="text-primary font-black">₹{t.minOrder} - ₹{arr[idx+1].minOrder - 1}</span>
                  </span>
                )}
              </p>
              <div className="h-6 w-px bg-white/5 mx-2" />
              <span className={cn("text-xs font-black", t.charge === 0 ? "text-accent" : "text-white")}>
                {t.charge === 0 ? "FREE" : `₹${t.charge}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-3 px-2">
        <Checkbox 
          id="fee-active" 
          checked={form.isActive} 
          onCheckedChange={c => setForm({...form, isActive: !!c})} 
          className="w-5 h-5 rounded-md border-2 border-slate-200"
        />
        <Label htmlFor="fee-active" className="text-[10px] font-black cursor-pointer uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors">Deploy policy to Live environment</Label>
      </div>

      <Button type="submit" className="w-full h-20 rounded-[28px] font-black bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-xs border-4 border-white">
        Sync Logistics Engine
      </Button>
    </form>
  );
}
