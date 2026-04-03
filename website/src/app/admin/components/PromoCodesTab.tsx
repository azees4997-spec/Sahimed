"use client"

import { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Tag 
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
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function PromoCodesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const promosQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'promocodes'), orderBy('code', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: promos, isLoading } = useCollection(promosQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical coupons" subtitle="Manage patient offers" onBack={onBack}><Button onClick={() => { setEditingPromo(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New campaign</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Code</th><th className="px-10 py-8">Value</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!promos || promos.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No active campaigns</td></tr>) : promos?.map(promo => (
                <tr key={promo.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm text-primary">{promo.code}</td>
                  <td className="px-10 py-8 font-black text-accent">{Number(promo.discountValue).toFixed(2)}{promo.discountType === 'percentage' ? '%' : '₹'}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", promo.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>{promo.isActive ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { 
                        if(confirm("Delete coupon?")) {
                          try {
                            await deleteDocumentNonBlocking(doc(db, 'promocodes', promo.id));
                            toast({ title: "Coupon deleted" });
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
        <DialogContent className="rounded-[40px] max-w-3xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-10 text-white relative">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Tag className="w-24 h-24 rotate-12" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase font-outfit">Campaign configuration</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-[0.4em] mt-3 uppercase">
              Control promotional scope and cashflow parameters
            </DialogDescription>
          </div>
          <div className="p-8">
            <PromoCodeForm db={db} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromoCodeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ 
    code: initialData?.code || '', 
    description: initialData?.description || '', 
    discountType: initialData?.discountType || 'percentage', 
    discountValue: initialData?.discountValue || 0, 
    minOrderValue: initialData?.minOrderValue || 0, 
    maxDiscount: initialData?.maxDiscount || 0,
    expiryDate: initialData?.expiryDate || '',
    scope: initialData?.scope || 'global', 
    scopeValue: initialData?.scopeValue || '',
    isFirstOrderOnly: initialData?.isFirstOrderOnly || false,
    isActive: initialData?.isActive ?? true 
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    try {
      if (initialData?.id) {
        await updateDocumentNonBlocking(doc(db, 'promocodes', initialData.id), payload);
      } else {
        await addDocumentNonBlocking(collection(db, 'promocodes'), { ...payload, createdAt: serverTimestamp() });
      }
      toast({ title: "Campaign committed" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Commit failed", description: err.message });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black">Code</Label>
          <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-2xl h-14 bg-gray-50 border-none font-black text-primary" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Type</Label>
          <Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}>
             <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6 uppercase tracking-tight focus:bg-white transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="fixed">Amount (Flat ₹)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black">Value</Label>
          <Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black">Max Discount Cap (₹)</Label>
          <Input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black">Min purchase</Label>
          <Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black">Expiry Date</Label>
          <Input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistical Scope</Label>
          <Select value={form.scope} onValueChange={v => setForm({...form, scope: v})}>
            <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6 uppercase tracking-tight focus:bg-white transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="global">Global (Every Order)</SelectItem>
              <SelectItem value="customer">Patient Level (Mobile Number)</SelectItem>
              <SelectItem value="category">Category Level (e.g. Wellness)</SelectItem>
              <SelectItem value="product">Item Level (Medicine ID)</SelectItem>
              <SelectItem value="branded">Branded Products Only</SelectItem>
              <SelectItem value="generic">Generic Products Only (High Margin)</SelectItem>
              <SelectItem value="custom">Custom Protocol Wise / Custom Rules</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {form.scope === 'global' ? 'Marketing Description' : 
             form.scope === 'customer' ? 'Target Mobile Number' :
             form.scope === 'category' ? 'Category Name' :
             form.scope === 'product' ? 'Target Medicine ID' :
             'Target Value / Protocol ID'}
          </Label>
          <Input 
            value={form.scopeValue} 
            onChange={e => setForm({...form, scopeValue: e.target.value})} 
            className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6" 
            placeholder={
              form.scope === 'global' ? 'e.g. Summer Blitz' : 
              form.scope === 'customer' ? 'e.g. 9876543210' :
              form.scope === 'branded' ? 'N/A' :
              'Injection payload or ID'
            } 
          />
        </div>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="promo-first" checked={form.isFirstOrderOnly} onCheckedChange={c => setForm({...form, isFirstOrderOnly: !!c})} />
            <Label htmlFor="promo-first" className="text-[10px] font-black cursor-pointer">First order only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="promo-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} />
            <Label htmlFor="promo-active" className="text-[10px] font-black cursor-pointer">Live campaign</Label>
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white shadow-3xl shadow-primary/20 active:scale-95 transition-all">
        Commit campaign
      </Button>
    </form>
  );
}
