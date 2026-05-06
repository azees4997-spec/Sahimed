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
    isActive: initialData?.isActive ?? true 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...form, 
      discountedAmount: Number(form.discountedAmount),
      minPurchase: Number(form.minPurchase),
      updatedAt: serverTimestamp() 
    };
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
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Label (e.g. Delivery Charge)</Label>
        <Input 
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} 
          required 
          placeholder="Shipping / Delivery Fee"
          className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Amount (₹)</Label>
          <Input 
            type="number"
            value={form.discountedAmount} 
            onChange={e => setForm({...form, discountedAmount: Number(e.target.value)})} 
            required 
            className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Free Above (₹)</Label>
          <Input 
            type="number"
            value={form.minPurchase} 
            onChange={e => setForm({...form, minPurchase: Number(e.target.value)})} 
            required 
            className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
          />
        </div>
      </div>

      <div className="p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 space-y-2">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pricing Strategy Preview</p>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
          Orders below <span className="text-blue-600">₹{form.minPurchase}</span> will be charged <span className="text-blue-600">₹{form.discountedAmount}</span>. 
          Orders equal to or above this amount will have <span className="text-green-600 uppercase">Free Delivery</span>.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fee-active" 
          checked={form.isActive} 
          onCheckedChange={c => setForm({...form, isActive: !!c})} 
        />
        <Label htmlFor="fee-active" className="text-[10px] font-black cursor-pointer">Active in Clinical Matrix</Label>
      </div>

      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
        Update Logistics Policy
      </Button>
    </form>
  );
}
