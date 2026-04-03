"use client"

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Tag,
  Search,
  Check,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { doc, collection, query, orderBy, serverTimestamp, limit, getDocs, startAt, endAt } from 'firebase/firestore';
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
      <SectionHeader title="Clinical coupons" subtitle="Manage patient offers" onBack={onBack}>
        <Button onClick={() => { setEditingPromo(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> New campaign
        </Button>
      </SectionHeader>
      
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">Code</th>
                <th className="px-10 py-8">Value</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
              ) : (!promos || promos.length === 0) ? (
                <tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No active campaigns</td></tr>
              ) : promos?.map(promo => (
                <tr key={promo.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm text-primary uppercase">{promo.code}</td>
                  <td className="px-10 py-8 font-black text-accent">
                    {Number(promo.discountValue || 0).toFixed(0)}{promo.discountType === 'percentage' ? '%' : '₹'}
                  </td>
                  <td className="px-10 py-8">
                    <Badge className={cn("rounded-full font-black text-[8px] uppercase tracking-widest px-3", promo.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>
                      {promo.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }}>
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={async () => { 
                        if(confirm("Delete coupon?")) {
                          try {
                            await deleteDocumentNonBlocking(doc(db, 'promocodes', promo.id));
                            toast({ title: "Campaign terminated" });
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: "Termination failed", description: err.message });
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
          <ScrollArea className="max-h-[70vh] p-8">
            <PromoCodeForm db={db} isVerified={isVerified} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromoCodeForm({ db, isVerified, initialData, onSuccess }: { db: any, isVerified: boolean, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [mongoCategories, setMongoCategories] = useState<any[]>([]);
  
  useEffect(() => {
    fetch('/api/categories?limit=100').then(res => res.ok && res.json()).then(data => data && setMongoCategories(data));
  }, []);

  const [form, setForm] = useState({ 
    code: initialData?.code || '', 
    discountType: initialData?.discountType || 'percentage', 
    discountValue: initialData?.discountValue || 0, 
    minOrderValue: initialData?.minOrderValue || 0, 
    maxDiscount: initialData?.maxDiscount || 0,
    expiryDate: initialData?.expiryDate || '',
    scope: initialData?.scope || 'global', 
    scopeValue: initialData?.scopeValue || '',
    isFirstOrderOnly: initialData?.isFirstOrderOnly || false,
    isActive: initialData?.isActive ?? true,
    rules: initialData?.rules || {
      categories: [],
      products: [],
      patients: [],
      isBrandedOnly: false,
      isGenericOnly: false
    }
  });

  const [medSearch, setMedSearch] = useState('');
  const [medSuggestions, setMedSuggestions] = useState<any[]>([]);
  const [isMedSearching, setIsMedSearching] = useState(false);
  const [isMedOpen, setIsMedOpen] = useState(false);
  
  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  // Search Logics
  useEffect(() => {
    if (medSearch.trim().length >= 2) {
      setIsMedSearching(true);
      const t = setTimeout(async () => {
        try {
          const res = await fetch(`/api/products?q=${encodeURIComponent(medSearch)}&limit=10`);
          if (res.ok) setMedSuggestions(await res.json());
        } catch (e) {
          console.error("Clinical Search Fail:", e);
        } finally {
          setIsMedSearching(false);
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [medSearch]);

  useEffect(() => {
    if (userSearch.trim().length >= 3 && isVerified) {
      setIsUserSearching(true);
      const t = setTimeout(async () => {
        try {
          const q = query(collection(db, 'userProfiles'), orderBy('phone'), startAt(userSearch), endAt(userSearch + '\uf8ff'), limit(20));
          const snap = await getDocs(q);
          setUserSuggestions(snap.docs.map(d => ({id: d.id, ...d.data()})));
        } catch (e) {
          console.error("Patient Search Fail:", e);
        } finally {
          setIsUserSearching(false);
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [userSearch, isVerified, db]);

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

  const removeItem = (type: 'categories' | 'products' | 'patients', val: string) => {
    setForm(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [type]: prev.rules[type].filter((x: string) => x !== val)
      }
    }));
  };

  const addItem = (type: 'categories' | 'products' | 'patients', val: string) => {
    if (!form.rules[type]?.includes(val)) {
      setForm(prev => ({
        ...prev,
        rules: {
          ...prev.rules,
          [type]: [...(prev.rules[type] || []), val]
        }
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Coupon Code</Label>
          <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required placeholder="SAVE50" className="h-10 rounded-xl bg-slate-50 border-none font-black text-[11px] px-4 uppercase focus:bg-white transition-colors" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Pricing Type</Label>
          <Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}>
             <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-black text-[10px] px-4 uppercase focus:bg-white transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl z-[300]">
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Flat Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Benefit Value</Label>
          <Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] px-4 focus:bg-white transition-colors" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Min. Order (₹)</Label>
          <Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] px-4 focus:bg-white transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Max Cap (₹)</Label>
          <Input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: Number(e.target.value)})} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] px-4 focus:bg-white transition-colors" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Expiry Date</Label>
          <Input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] px-4 focus:bg-white transition-colors" />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-50">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowed Application Scope</Label>
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic">Multi-Select Enabled</p>
        </div>
        <Select value={form.scope} onValueChange={v => setForm({...form, scope: v})}>
          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-black text-[10px] px-4 uppercase focus:bg-white transition-colors mb-2"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl z-[300]">
            <SelectItem value="global">Global (No Restrictions)</SelectItem>
            <SelectItem value="customer">Allowed Customers</SelectItem>
            <SelectItem value="category">Allowed Categories</SelectItem>
            <SelectItem value="product">Allowed Medicines</SelectItem>
            <SelectItem value="branded">Branded Products Only</SelectItem>
            <SelectItem value="generic">Generics Only</SelectItem>
            <SelectItem value="custom">Combined Rule Matrix</SelectItem>
          </SelectContent>
        </Select>

        <div className="min-h-[44px]">
          {form.scope === 'category' ? (
            <div className="space-y-2">
              <Select onValueChange={v => addItem('categories', v)}>
                <SelectTrigger className="h-11 rounded-xl bg-primary/5 text-primary border-none font-black text-[10px] px-4 uppercase"><SelectValue placeholder="+ Click to Add Category..." /></SelectTrigger>
                <SelectContent className="rounded-xl z-[310]">{mongoCategories?.map((cat: any) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {form.rules.categories?.map((c: string) => <Badge key={c} variant="secondary" className="bg-primary/5 text-primary text-[8px] py-1 px-3 rounded-lg border-none flex items-center gap-2 font-black uppercase">
                  {c} <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeItem('categories', c)} />
                </Badge>)}
                {(!form.rules.categories || form.rules.categories.length === 0) && <p className="text-[8px] font-bold text-red-400 uppercase italic p-1">No categories selected - campaign restricted.</p>}
              </div>
            </div>
          ) : form.scope === 'product' ? (
             <div className="space-y-2">
               <div className="relative">
                  <Button variant="outline" type="button" onClick={() => setIsMedOpen(!isMedOpen)} className="w-full h-11 rounded-xl bg-primary/5 text-primary border-none justify-between px-4 font-black text-[10px] uppercase shadow-none hover:bg-primary/10 transition-colors">
                    <span className="truncate">+ Search & Add Medicines...</span>
                    <Search className="w-3 h-3 opacity-30" />
                  </Button>
                  {isMedOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[350] overflow-hidden">
                      <div className="p-3 border-b flex items-center gap-2">
                        <Input autoFocus placeholder="Type code/name..." value={medSearch} onChange={e => setMedSearch(e.target.value)} onKeyDown={e => e.stopPropagation()} className="h-8 border-none font-black text-[9px] px-2 uppercase shadow-none ring-0 outline-none" />
                        <Button variant="ghost" size="icon" onClick={() => {setIsMedOpen(false); setMedSearch('');}} className="h-6 w-6"><X className="w-3 h-3"/></Button>
                      </div>
                      <ScrollArea className="h-44">
                        {isMedSearching ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-4 h-4 text-primary" /></div> : medSuggestions.length === 0 ? (
                          <div className="p-10 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">Type to search Catalog</div>
                        ) : medSuggestions.map(m => (
                          <button key={m.id || m._id} type="button" onClick={() => { addItem('products', m.name); setIsMedOpen(false); setMedSearch(''); }} className="w-full px-4 py-3 text-left hover:bg-primary/5 text-[10px] font-black uppercase border-b border-slate-50 flex justify-between items-center group">
                            <span>{m.name}</span>
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
               </div>
               <div className="flex flex-wrap gap-1">
                 {form.rules.products?.map((i: string) => <Badge key={i} variant="secondary" className="bg-primary/5 text-primary text-[8px] py-1 px-3 rounded-lg border-none flex items-center gap-2 font-black uppercase max-w-[150px] truncate">
                   {i} <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeItem('products', i)} />
                 </Badge>)}
                 {(!form.rules.products || form.rules.products.length === 0) && <p className="text-[8px] font-bold text-red-400 uppercase italic p-1">No medicines selected - campaign restricted.</p>}
               </div>
             </div>
          ) : form.scope === 'customer' ? (
             <div className="space-y-2">
               <div className="relative">
                  <Button variant="outline" type="button" onClick={() => setIsUserOpen(!isUserOpen)} className="w-full h-11 rounded-xl bg-primary/5 text-primary border-none justify-between px-4 font-black text-[10px] uppercase shadow-none hover:bg-primary/10 transition-colors">
                    <span className="truncate">+ Search & Add Patients...</span>
                    <Search className="w-3 h-3 opacity-30" />
                  </Button>
                  {isUserOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[350] overflow-hidden">
                      <div className="p-3 border-b flex items-center gap-2">
                        <Input autoFocus placeholder="Mobile number..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.stopPropagation()} className="h-8 border-none font-black text-[9px] px-2 uppercase shadow-none" />
                        <Button variant="ghost" size="icon" onClick={() => {setIsUserOpen(false); setUserSearch('');}} className="h-6 w-6"><X className="w-3 h-3"/></Button>
                      </div>
                      <ScrollArea className="h-44">
                        {isUserSearching ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-4 h-4 text-primary" /></div> : userSuggestions.length === 0 ? (
                           <div className="p-10 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">Type to search Patients</div>
                        ) : userSuggestions.map(u => (
                          <button key={u.id} type="button" onClick={() => { addItem('patients', u.phone); setIsUserOpen(false); setUserSearch(''); }} className="w-full px-4 py-3 text-left hover:bg-primary/5 border-b border-slate-50 group flex justify-between items-center transition-colors">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-tight truncate">{u.name || 'Patient'}</p>
                              <p className="text-[8px] font-mono opacity-40 font-bold">{u.phone}</p>
                            </div>
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
               </div>
               <div className="flex flex-wrap gap-1">
                 {form.rules.patients?.map((p: string) => <Badge key={p} variant="secondary" className="bg-primary/5 text-primary text-[8px] py-1 px-3 rounded-lg border-none flex items-center gap-2 font-black uppercase">
                   {p} <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeItem('patients', p)} />
                 </Badge>)}
                 {(!form.rules.patients || form.rules.patients.length === 0) && <p className="text-[8px] font-bold text-red-400 uppercase italic p-1">No patients selected - campaign restricted.</p>}
               </div>
             </div>
          ) : form.scope === 'custom' ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Matrix configuration</p>
                <Button variant="ghost" type="button" onClick={() => setForm({...form, rules:{categories:[], products:[], patients:[], isBrandedOnly:false, isGenericOnly:false}})} className="h-5 text-[8px] font-black uppercase text-red-500 px-2 hover:bg-transparent transition-colors">Clear All</Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({...form, rules: {...form.rules, isBrandedOnly: !form.rules.isBrandedOnly, isGenericOnly: false}})} 
                  className={cn("py-2 px-3 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all", form.rules.isBrandedOnly ? "bg-primary border-primary text-white shadow-md active:scale-95" : "bg-white border-slate-200 text-slate-400 hover:border-primary/30")}>Branded Only</button>
                <button type="button" onClick={() => setForm({...form, rules: {...form.rules, isGenericOnly: !form.rules.isGenericOnly, isBrandedOnly: false}})} 
                  className={cn("py-2 px-3 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all", form.rules.isGenericOnly ? "bg-primary border-primary text-white shadow-md active:scale-95" : "bg-white border-slate-200 text-slate-400 hover:border-primary/30")}>Generics Only</button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Allowed categories</p>
                  <Select onValueChange={v => addItem('categories', v)}>
                    <SelectTrigger className="h-8 rounded-lg bg-white border-slate-200 font-bold text-[9px] px-3 uppercase"><SelectValue placeholder="+ Category" /></SelectTrigger>
                    <SelectContent className="rounded-xl z-[310]">{mongoCategories?.map((cat: any) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.rules.categories?.map((c: string) => <Badge key={c} variant="secondary" className="bg-white text-[7px] py-1 px-2 rounded-md border-slate-100 flex items-center gap-1 font-black">{c} <X className="w-2.5 h-2.5 cursor-pointer ml-1 hover:text-red-500" onClick={() => removeItem('categories', c)} /></Badge>)}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Allowed medicines</p>
                  <div className="relative">
                    <Input placeholder="Search catalog..." value={medSearch} onChange={e => setMedSearch(e.target.value)} className="h-8 rounded-lg bg-white border-slate-200 font-bold text-[9px] px-3 uppercase focus:bg-white transition-all shadow-none" />
                    {medSuggestions.length > 0 && medSearch.length >= 2 && (
                      <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-100 shadow-2xl rounded-xl z-[400] max-h-32 overflow-y-auto">
                        {medSuggestions.map(m => (
                          <button key={m.id || m._id} type="button" onClick={() => { addItem('products', m.name); setMedSearch(''); }} className="w-full p-2.5 text-left hover:bg-primary/5 text-[9px] font-bold uppercase border-b border-slate-50 transition-colors">{m.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.rules.products?.map((i: string) => <Badge key={i} variant="secondary" className="bg-white text-[8px] py-1 px-2 rounded-md border-slate-100 flex items-center gap-1 font-black max-w-[140px] truncate">{i} <X className="w-2.5 h-2.5 cursor-pointer ml-1 hover:text-red-500" onClick={() => removeItem('products', i)} /></Badge>)}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Allowed patients</p>
                  <div className="relative">
                    <Input placeholder="Search phone..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="h-8 rounded-lg bg-white border-slate-200 font-bold text-[9px] px-3 uppercase focus:bg-white transition-all shadow-none" />
                    {userSuggestions.length > 0 && userSearch.length >= 2 && (
                      <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-100 shadow-2xl rounded-xl z-[400] max-h-32 overflow-y-auto">
                        {userSuggestions.map(u => (
                          <button key={u.id} type="button" onClick={() => { addItem('patients', u.phone); setUserSearch(''); }} className="w-full p-2.5 text-left hover:bg-primary/5 text-[9px] font-bold uppercase border-b border-slate-50 transition-colors">
                            {u.phone} <span className="opacity-40 ml-1">({u.name || 'User'})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.rules.patients?.map((p: string) => <Badge key={p} variant="secondary" className="bg-white text-[8px] py-1 px-2 rounded-md border-slate-100 flex items-center gap-1 font-mono font-black">{p} <X className="w-2.5 h-2.5 cursor-pointer ml-1 hover:text-red-500" onClick={() => removeItem('patients', p)} /></Badge>)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Input value={form.scopeValue} onChange={e => setForm({...form, scopeValue: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-black text-[10px] px-4 uppercase focus:bg-white transition-all shadow-none" placeholder={form.scope === 'global' ? 'E.G. SUMMER BLITZ 2024' : 'Enter target value...'} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-8 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-100">
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox checked={form.isFirstOrderOnly} onCheckedChange={c => setForm({...form, isFirstOrderOnly: !!c})} />
          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-primary transition-colors">First order only</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} />
          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-primary transition-colors">Active campaign</span>
        </label>
      </div>

      <Button type="submit" className="w-full h-14 rounded-2xl font-black bg-primary text-white shadow-xl active:scale-[0.98] transition-all text-[11px] uppercase tracking-widest mt-2 hover:shadow-primary/20">
        Authorize & Commit Campaign
      </Button>
    </form>
  );
}
