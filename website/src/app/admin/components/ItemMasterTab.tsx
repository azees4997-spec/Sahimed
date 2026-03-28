"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Search, 
  Plus, 
  Package, 
  Edit2, 
  Trash2, 
  Download, 
  Upload, 
  ImageIcon 
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  setDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, getDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMongoDBCollection } from '@/hooks/use-mongodb';
import { motion } from 'framer-motion';
import { SectionHeader } from './SectionHeader';

export function ItemMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['id', 'name', 'sku', 'manufacturer', 'category', 'isGeneric', 'prescriptionRequired', 'packSize', 'imageUrl', 'imageUrl2', 'imageUrl3', 'description', 'treatment'];
    const csv = headers.join(',') + '\n"","New Product","SKU001","Manufacturer","Category","false","false","10 Tablets","","","","Description","Treatment"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
  };

  const handleExport = async () => {
    window.open('/api/products/bulk', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const products = lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const obj: any = {};
        headers.forEach((h, i) => {
          let val: any = values[i]?.replace(/^"|"$/g, '') || '';
          if (h === 'isGeneric' || h === 'prescriptionRequired') val = val.toLowerCase() === 'true';
          obj[h] = val;
        });
        return obj;
      });

      try {
        const res = await fetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(products)
        });
        if (res.ok) {
          toast({ title: "Bulk import success", description: "Catalog updated" });
          window.location.reload();
        } else {
          throw new Error('Import failed');
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setIsSearching(true);
      const term = searchTerm.trim();
      
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=10`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setSuggestions(data.map((p: any) => ({ ...p, id: p._id || p.id })));
            }
          }
        } catch (error) {
          console.warn("Suggestion fetch error:", error);
        } finally {
          setIsSearching(false);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const { data: medicines, isLoading, refetch } = useMongoDBCollection({
    q: debouncedSearch,
    limit: 50
  });

  return (
    <div className="space-y-10">
      <SectionHeader title="Clinical Catalog" subtitle="Master Inventory Intelligence" onBack={onBack}>
        <div className="flex flex-wrap items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
          <Button onClick={downloadTemplate} variant="ghost" className="rounded-full h-14 px-8 font-black text-[10px] text-slate-400 hover:text-primary gap-3 uppercase tracking-widest transition-all">
            <Download className="w-4 h-4" /> Template
          </Button>
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-14 px-8 font-black text-[10px] border-2 gap-3 text-primary border-primary/20 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <Button onClick={handleExport} variant="outline" className="rounded-full h-14 px-8 font-black text-[10px] border-2 gap-3 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export Matrix
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95">
            <Plus className="w-5 h-5" /> New Entity
          </Button>
        </div>
      </SectionHeader>

      <div className="relative group/search" ref={suggestionRef}>
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within/search:text-primary transition-colors">
          <Search className="w-6 h-6" />
        </div>
        <Input 
          placeholder="SEARCH CLINICAL REGISTRY (E.G. D-VENIZ)..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="h-20 pl-20 rounded-[40px] border-none bg-white shadow-xl font-black text-sm tracking-tight placeholder:text-slate-300 focus:ring-4 focus:ring-primary/10 transition-all uppercase" 
        />
        {isSearching && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+20px)] left-0 right-0 bg-white/95 backdrop-blur-2xl rounded-[48px] shadow-3xl border border-white overflow-hidden z-[110] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="px-10 py-5 bg-slate-50/50 border-b border-white">
              <p className="text-[9px] font-black text-slate-400 tracking-[0.4em] uppercase opacity-60">Intelligence Matches</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSearchTerm(item.name);
                    setSuggestions([]);
                  }}
                  className="w-full px-10 py-6 flex items-center gap-6 hover:bg-primary/5 transition-all text-left group/item border-b border-slate-50 last:border-none active:scale-[0.99]"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex-shrink-0 border border-slate-100 p-2 flex items-center justify-center overflow-hidden shadow-sm group-hover/item:scale-110 transition-transform duration-500">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-slate-100" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-black text-base text-slate-900 truncate tracking-tighter uppercase font-outfit">{item.name}</p>
                    <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] truncate uppercase opacity-60">{item.sku} • {item.manufacturer}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-full group-hover/item:bg-primary group-hover/item:text-white transition-all">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-white transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Clinical item</th><th className="px-10 py-8">Category</th><th className="px-10 py-8 text-right">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : medicines?.length === 0 ? (<tr><td colSpan={3} className="p-20 text-center font-bold text-gray-300">No entries found</td></tr>) : medicines?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border flex items-center justify-center overflow-hidden">{med.imageUrl ? <img src={med.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-gray-200" />}</div><div className="flex flex-col"><span className="font-black text-sm">{med.name}</span><span className="text-[9px] text-gray-400 uppercase">{med.sku} • {med.manufacturer}</span></div></div></td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[8px]">{med.category}</Badge></td>
                  <td className="px-10 py-8 text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }}>
                         <Edit2 className="w-4 h-4 text-gray-400" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={async () => {
                         if (confirm("Delete this product from MongoDB & Firestore?")) {
                           const docId = med._id || med.id;
                           await fetch(`/api/products/${docId}`, { method: 'DELETE' });
                           deleteDocumentNonBlocking(doc(db, 'medicines', docId));
                           toast({ title: "Product deleted" });
                           refetch?.();
                         }
                       }}>
                         <Trash2 className="w-4 h-4 text-red-300" />
                       </Button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={isFormOpen => setIsFormOpen(isFormOpen)}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white">
            <DialogTitle className="text-2xl font-black">Product profile</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">
              Configure clinical identity and live inventory status
            </DialogDescription>
          </div>
          <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide"><ItemForm db={db} initialData={editingItem} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc'), limit(100)), [db]);
  const { data: molecules } = useCollection(molsQuery);
  const [form, setForm] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    manufacturer: initialData?.manufacturer || '',
    category: initialData?.category || '',
    isGeneric: initialData?.isGeneric || false,
    prescriptionRequired: initialData?.prescriptionRequired || false,
    moleculeId: initialData?.moleculeId || '',
    packSize: initialData?.packSize || '',
    description: initialData?.description || '',
    howToUse: initialData?.howToUse || '',
    treatment: initialData?.treatment || '',
    imageUrl: initialData?.imageUrl || '',
    imageUrl2: initialData?.imageUrls?.[1] || '',
    imageUrl3: initialData?.imageUrls?.[2] || ''
  });

  const [liveData, setLiveData] = useState({ price: 0, mrp: 0, availableQuantity: 0 });

  useEffect(() => {
    if (initialData?.sku) {
      getDoc(doc(db, 'product_live_data', initialData.sku)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ price: d.sahimed_price || 0, mrp: d.mrp || 0, availableQuantity: d.stock_quantity || 0 });
        }
      });
    }
  }, [initialData, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const docId = initialData?.id || initialData?._id || form.sku;
    if (!docId) {
      toast({ variant: 'destructive', title: "Error", description: "Sku is required for new products" });
      return;
    }

    const staticPayload = { 
      ...form, 
      imageUrls: [form.imageUrl, form.imageUrl2, form.imageUrl3].filter(Boolean) 
    };
    const livePayload = { 
      mrp: Number(liveData.mrp), 
      sahimed_price: Number(liveData.price), 
      stock_quantity: Number(liveData.availableQuantity) 
    };

    const combinedPayload = {
      ...staticPayload,
      liveData: livePayload,
      id: docId
    };

    try {
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/products/${docId}` : '/api/products';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combinedPayload)
      });
      
      if (!res.ok) throw new Error('Failed to sync with MongoDB');

      setDocumentNonBlocking(doc(db, 'medicines', docId), { ...staticPayload, updatedAt: serverTimestamp() }, { merge: true });
      if (form.sku) {
        setDocumentNonBlocking(doc(db, 'product_live_data', form.sku), { ...livePayload, updatedAt: serverTimestamp() }, { merge: true });
      }

      toast({ title: "Product synchronized", description: "Updated in MongoDB and Firestore" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-14 w-full flex mb-8">
          <TabsTrigger value="basic" className="flex-1 rounded-xl font-black text-[10px]">Identity</TabsTrigger>
          <TabsTrigger value="live" className="flex-1 rounded-xl font-black text-[10px] text-primary">Live stock</TabsTrigger>
          <TabsTrigger value="images" className="flex-1 rounded-xl font-black text-[10px]">Media</TabsTrigger>
          <TabsTrigger value="clinical" className="flex-1 rounded-xl font-black text-[10px]">Clinical</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black">Medicine name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Sku</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 flex items-center space-x-10 pt-4">
              <div className="flex items-center space-x-2"><Checkbox id="rx-req" checked={form.prescriptionRequired} onCheckedChange={(c) => setForm({...form, prescriptionRequired: !!c})} /><Label htmlFor="rx-req" className="text-[10px] font-black text-red-500">Rx required</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="is-generic" checked={form.isGeneric} onCheckedChange={(c) => setForm({...form, isGeneric: !!c})} /><Label htmlFor="is-generic" className="text-[10px] font-black text-accent">SahiMed generic</Label></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="live" className="space-y-6"><div className="grid grid-cols-3 gap-6 bg-primary/5 p-8 rounded-[32px] border border-primary/10"><div className="space-y-2"><Label className="text-[10px] font-black text-primary">Live price</Label><Input type="number" value={liveData.price} onChange={e => setLiveData({...liveData, price: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-black text-xl" /></div><div className="space-y-2"><Label className="text-[10px] font-black">Mrp</Label><Input type="number" value={liveData.mrp} onChange={e => setLiveData({...liveData, mrp: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" /></div><div className="space-y-2"><Label className="text-[10px] font-black">Stock</Label><Input type="number" value={liveData.availableQuantity} onChange={e => setLiveData({...liveData, availableQuantity: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" /></div></div></TabsContent>
        <TabsContent value="images" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary">Primary Image URL</Label>
                <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black">Alternate Image 2</Label>
                <Input value={form.imageUrl2} onChange={e => setForm({...form, imageUrl2: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black">Alternate Image 3</Label>
                <Input value={form.imageUrl3} onChange={e => setForm({...form, imageUrl3: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
              </div>
              <p className="text-[9px] font-bold text-gray-400">Add up to 3 public URLs for the product. The first one is the primary display image.</p>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Previews</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-[32px] border border-dashed aspect-[16/9] flex items-center justify-center p-4">
                  {form.imageUrl ? <img src={form.imageUrl} alt="1" className="h-full object-contain rounded-xl" /> : <ImageIcon className="w-8 h-8 text-gray-100" />}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-[28px] border border-dashed aspect-square flex items-center justify-center p-2">
                    {form.imageUrl2 ? <img src={form.imageUrl2} alt="2" className="h-full object-contain rounded-lg" /> : <ImageIcon className="w-4 h-4 text-gray-100" />}
                  </div>
                  <div className="bg-gray-50 rounded-[28px] border border-dashed aspect-square flex items-center justify-center p-2">
                    {form.imageUrl3 ? <img src={form.imageUrl3} alt="3" className="h-full object-contain rounded-lg" /> : <ImageIcon className="w-4 h-4 text-gray-100" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black">Molecule mapping</Label>
              <Select value={form.moleculeId} onValueChange={v => setForm({...form, moleculeId: v})}>
                <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue placeholder="Select molecule" /></SelectTrigger>
                <SelectContent className="rounded-2xl">{molecules?.map(m => (<SelectItem key={m.id} value={m.id}>{m.molecule} ({m.masterId})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Primary treatment</Label><Input value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black">Clinical description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
          </div>
        </TabsContent>
      </Tabs>
      <Button type="submit" className="w-full h-20 rounded-[32px] font-black tracking-widest bg-primary text-white shadow-2xl">Save profile</Button>
    </form>
  );
}
