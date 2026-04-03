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
  ChevronsUpDown,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
            <PromoCodeForm db={db} isVerified={isVerified} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} />
          </div>
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

  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles'), limit(1000)) : null, [db, isVerified]);
  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

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
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isUserSearching, setIsUserSearching] = useState(false);

  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Medicine Search Logic (MongoDB)
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

  // Patient Search Logic (Firestore)
  useEffect(() => {
    if (userSearch.trim().length >= 3 && isVerified) {
      setIsUserSearching(true);
      const t = setTimeout(async () => {
        try {
          // Since Firestore doesn't support easy case-insensitive/or queries without multiple indexes,
          // we pull a larger sorted subset and filter locally for maximum accuracy.
          // This is much faster than a complex live query for every letter.
          const q = query(collection(db, 'userProfiles'), orderBy('phone'), startAt(userSearch), endAt(userSearch + '\uf8ff'), limit(20));
          const snap = await getDocs(q);
          const results = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setUserSuggestions(results);
        } catch (e) {
          console.error("Patient Search Fail:", e);
        } finally {
          setIsUserSearching(false);
        }
      }, 300);
      return () => clearTimeout(t);
    } else if (userSearch.length === 0) {
      setUserSuggestions([]);
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
  };  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coupon Code</Label>
          <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-2xl h-14 bg-gray-50 border-none font-black text-primary" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Type</Label>
          <Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}>
             <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6 uppercase tracking-tight focus:bg-white transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl z-[220]">
              <SelectItem value="fixed">Amount (Flat ₹)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Benefit Value</Label>
          <Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Discount Cap (₹)</Label>
          <Input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Threshold Order Value</Label>
          <Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Date</Label>
          <Input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inclusion Mode</Label>
          <Select value={form.scope} onValueChange={v => setForm({...form, scope: v})}>
             <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6 uppercase tracking-tight focus:bg-white transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl z-[220]">
              <SelectItem value="global">Global (Every Order)</SelectItem>
              <SelectItem value="customer">Patient Level (Mobile Number)</SelectItem>
              <SelectItem value="category">Category Level</SelectItem>
              <SelectItem value="product">Item Level (Medicine Search)</SelectItem>
              <SelectItem value="branded">Branded Products Only</SelectItem>
              <SelectItem value="generic">Generic Products Only</SelectItem>
              <SelectItem value="custom">Custom Protocol / Rule Matrix</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {form.scope === 'global' ? 'Marketing Description' : 
             form.scope === 'customer' ? 'Firestore Lookup' :
             form.scope === 'category' ? 'Firestore Taxonomy' :
             form.scope === 'product' ? 'MongoDB Catalog' :
             form.scope === 'custom' ? 'Multivariate Selector' :
             'Inclusion Value'}
          </Label>

          {form.scope === 'category' ? (
            <Select value={form.scopeValue} onValueChange={v => setForm({...form, scopeValue: v})}>
              <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6 uppercase tracking-tight focus:bg-white transition-colors"><SelectValue placeholder="SELECT CATEGORY..." /></SelectTrigger>
              <SelectContent className="rounded-2xl z-[230]">
                {mongoCategories?.map((cat: any) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : form.scope === 'product' ? (
            <Popover open={isMedOpen} onOpenChange={setIsMedOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-14 rounded-2xl bg-gray-50 border-none justify-between hover:bg-gray-100 px-6 font-black text-sm uppercase text-slate-900 shadow-none overflow-hidden">
                  <span className="truncate">{form.scopeValue || "SEARCH CLINICAL MASTER..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-3xl border-none shadow-3xl bg-white/95 backdrop-blur-xl z-[250]" align="start">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <Input autoFocus placeholder="Type medicine name..." value={medSearch} onChange={e => setMedSearch(e.target.value)} onKeyDown={e => e.stopPropagation()} className="h-10 border-none bg-transparent font-black text-xs uppercase focus-visible:ring-0 p-0 shadow-none" />
                </div>
                <ScrollArea className="h-[300px] p-2">
                  {isMedSearching ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : medSuggestions.length === 0 ? (
                    <div className="py-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase">Search MongoDB Registry</div>
                  ) : (
                    medSuggestions.map((med) => (
                      <button key={med._id || med.id} type="button" onClick={() => { setForm({...form, scopeValue: med.name}); setIsMedOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-primary/5 group">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[12px] uppercase truncate tracking-tight">{med.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase opacity-60 truncate">{med.sku} • {med.manufacturer}</p>
                        </div>
                        {form.scopeValue === med.name && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          ) : form.scope === 'customer' ? (
             <Popover open={isUserOpen} onOpenChange={setIsUserOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-14 rounded-2xl bg-gray-50 border-none justify-between hover:bg-gray-100 px-6 font-black text-sm uppercase text-slate-900 shadow-none">
                  {form.scopeValue || "FIRESTORE SEARCH..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-3xl border-none shadow-3xl bg-white/95 backdrop-blur-xl z-[250]" align="start">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <Input autoFocus placeholder="Type mobile number..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.stopPropagation()} className="h-10 border-none bg-transparent font-black text-xs uppercase focus-visible:ring-0 p-0 shadow-none" />
                </div>
                <ScrollArea className="h-[300px] p-2">
                  {isUserSearching ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : userSuggestions.length === 0 ? (
                    <div className="py-6 px-4 text-center text-[10px] font-black text-slate-400 uppercase">Search Patient Registry</div>
                  ) : (
                    userSuggestions.map((u: any) => (
                      <button key={u.id} type="button" onClick={() => { setForm({...form, scopeValue: u.phone}); setIsUserOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-primary/5 group" onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[12px] uppercase truncate tracking-tight">{u.name || 'Anonymous Patient'}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase opacity-60 tracking-wider font-mono">{u.phone}</p>
                        </div>
                        {form.scopeValue === u.phone && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          ) : form.scope === 'custom' ? (
            <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-14 rounded-2xl bg-gray-50 border-none justify-between hover:bg-gray-100 px-6 font-black text-xs uppercase tracking-widest text-primary shadow-none">
                  AUTHORIZE RULE MATRIX
                  <Plus className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 rounded-[32px] border-none shadow-3xl bg-white z-[250] overflow-hidden" align="start">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Orchestrator</p>
                </div>
                <ScrollArea className="h-[450px] p-6">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Therapeutic Constraints</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setForm({...form, rules: {...form.rules, isBrandedOnly: !form.rules.isBrandedOnly, isGenericOnly: false}})} 
                          className={cn("p-4 rounded-2xl border-2 transition-all text-left", form.rules.isBrandedOnly ? "border-primary bg-primary/5" : "border-slate-50 bg-white opacity-60")}>
                          <p className="text-[10px] font-black uppercase">Branded Only</p>
                        </button>
                        <button type="button" onClick={() => setForm({...form, rules: {...form.rules, isGenericOnly: !form.rules.isGenericOnly, isBrandedOnly: false}})} 
                          className={cn("p-4 rounded-2xl border-2 transition-all text-left", form.rules.isGenericOnly ? "border-primary bg-primary/5" : "border-slate-50 bg-white opacity-60")}>
                          <p className="text-[10px] font-black uppercase">Generic Only</p>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Category Whitelist (Firestore)</p>
                      <Select value={form.rules.categories?.[0]} onValueChange={v => setForm({...form, rules: {...form.rules, categories: [v]}})}>
                        <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-[10px] uppercase"><SelectValue placeholder="Add Category..." /></SelectTrigger>
                        <SelectContent className="z-[300]">
                          {mongoCategories?.map((cat: any) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Clinical Entity (MongoDB)</p>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                        <Input placeholder="Search medicine..." value={medSearch} onChange={e => setMedSearch(e.target.value)} className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold text-[10px] uppercase" />
                      </div>
                      {medSuggestions.length > 0 && medSearch.length >= 2 && (
                         <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-xl">
                          {medSuggestions.map(med => (
                            <button key={med._id || med.id} type="button" onClick={() => setForm({...form, rules: {...form.rules, products: [med.name]}, scopeValue: med.name})} className="w-full p-2 text-[9px] font-bold uppercase hover:bg-white rounded-lg text-left flex justify-between">
                              {med.name}
                              {form.rules.products?.includes(med.name) && <Check className="w-3 h-3 text-primary" />}
                            </button>
                          ))}
                         </div>
                      )}
                    </div>

                     <div className="space-y-4 pt-4 border-t border-slate-50">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Patient Lock (Firestore)</p>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                        <Input placeholder="Search phone..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold text-[10px] uppercase" />
                      </div>
                      {users && userSearch.length >= 2 && (
                         <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-xl">
                          {users.filter((u: any) => String(u.phone)?.includes(userSearch)).map(u => (
                            <button key={u.id} type="button" onClick={() => setForm({...form, rules: {...form.rules, patients: [u.phone]}, scopeValue: u.phone})} className="w-full p-2 text-[9px] font-bold uppercase hover:bg-white rounded-lg text-left flex justify-between">
                              {u.phone} ({u.name || 'User'})
                              {form.rules.patients?.includes(u.phone) && <Check className="w-3 h-3 text-primary" />}
                            </button>
                          ))}
                         </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-6 bg-primary text-white flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest">Authorize Changes</p>
                   <Button variant="ghost" type="button" onClick={() => setIsCustomOpen(false)} className="text-white hover:bg-white/10 rounded-full h-10 w-10 p-0 transition-transform active:scale-95"><Check className="w-5 h-5" /></Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Input 
              value={form.scopeValue} 
              onChange={e => setForm({...form, scopeValue: e.target.value})} 
              className="rounded-2xl h-14 bg-gray-50 border-none font-black text-sm px-6" 
              placeholder={form.scope === 'global' ? 'e.g. Summer Blitz' : 'Target Value'} 
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-8 py-4 px-2 border-y border-slate-50">
        <div className="flex items-center space-x-3">
          <Checkbox id="promo-first" checked={form.isFirstOrderOnly} onCheckedChange={c => setForm({...form, isFirstOrderOnly: !!c})} />
          <Label htmlFor="promo-first" className="text-[11px] font-black cursor-pointer uppercase tracking-tighter">First order only</Label>
        </div>
        <div className="flex items-center space-x-3">
          <Checkbox id="promo-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} />
          <Label htmlFor="promo-active" className="text-[11px] font-black cursor-pointer uppercase tracking-tighter">Active campaign</Label>
        </div>
      </div>

      <Button type="submit" className="w-full h-20 rounded-[32px] font-black tracking-widest bg-primary text-white shadow-3xl shadow-primary/20 active:scale-95 transition-all text-xs uppercase">
        Authorize & Commit Campaign
      </Button>
    </form>
  );
}
