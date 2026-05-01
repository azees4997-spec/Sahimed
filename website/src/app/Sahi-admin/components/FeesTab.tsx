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
    discountedAmount: initialData?.discountedAmount || 0, 
    type: initialData?.type || 'fixed', 
    minPurchase: initialData?.minPurchase || 0, 
    tiers: initialData?.tiers || [{ minOrder: 499, charge: 50 }, { minOrder: 1000, charge: 25 }],
    isActive: initialData?.isActive ?? true 
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    try {
      if (initialData?.id) {
        await updateDocumentNonBlocking(doc(db, 'fees', initialData.id), payload);
      } else {
        await addDocumentNonBlocking(collection(db, 'fees'), { ...payload, createdAt: serverTimestamp() });
      }
      toast({ title: "Logistics protocol updated" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Update failed", description: err.message });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black">Fee label</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiered Pricing Levels</h4>
        {form.tiers.map((t: any, i: number) => (
          <div key={i} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2"><Label className="text-[8px] font-black">For orders above (₹)</Label><Input type="number" value={t.minOrder} onChange={e => { const next = [...form.tiers]; next[i].minOrder = Number(e.target.value); setForm({...form, tiers: next}); }} className="rounded-xl h-12 bg-white border-none font-bold" /></div>
            <div className="flex-1 space-y-2"><Label className="text-[8px] font-black">Charge amount (₹)</Label><Input type="number" value={t.charge} onChange={e => { const next = [...form.tiers]; next[i].charge = Number(e.target.value); setForm({...form, tiers: next}); }} className="rounded-xl h-12 bg-white border-none font-bold" /></div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setForm({...form, tiers: form.tiers.filter((_: any, idx: number) => idx !== i)})} className="h-10 w-10 text-red-300"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        <Button type="button" onClick={() => setForm({...form, tiers: [...form.tiers, { minOrder: 0, charge: 0 }]})} variant="outline" className="w-full rounded-xl h-12 border-dashed font-black text-[10px] gap-2"><PlusCircle className="w-4 h-4" /> Add price level</Button>
      </div>
      <div className="flex items-center space-x-2"><Checkbox id="fee-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} /><Label htmlFor="fee-active" className="text-[10px] font-black cursor-pointer">Active in cart & checkout</Label></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Update logistics policy</Button>
    </form>
  );
}
