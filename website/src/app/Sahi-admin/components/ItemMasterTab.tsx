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
  ImageIcon,
  Check,
  ChevronsUpDown,
  ChevronRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
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
  useUser,
  useMemoFirebase, 
  useCollection,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, getDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      'name', 'sku', 'manufacturer', 'category', 'hsnCode', 'gstPercentage', 'isGeneric', 'isBestSeller', 'prescriptionRequired', 'packSize', 'imageUrl', 'imageUrl2', 'imageUrl3', 'description', 'treatment', 
      'safetyAdvice', 'howToUse', 'saltComposition', 'moleculeCode', 'price', 'mrp', 'availableQuantity'
    ];
    const csv = headers.join(',') + '\n"New Product","SKU001","Manufacturer","Category","3004","12","false","false","false","10 Tablets","","","","Description","Treatment","Advice","How to use","Salt","MM0001","0","0","0"';
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

  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);
  const [failedList, setFailedList] = useState<any[]>([]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const csvLines: string[] = [];
      let currentLine = '';
      let lineInQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') lineInQuotes = !lineInQuotes;
        if (char === '\n' && !lineInQuotes) {
          csvLines.push(currentLine.trim());
          currentLine = '';
        } else {
          currentLine += char;
        }
      }
      if (currentLine) csvLines.push(currentLine.trim());
      const filteredLines = csvLines.filter(l => l);

      if (filteredLines.length < 2) return;
      
      const headers = filteredLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const products = filteredLines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
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
          if (['isGeneric', 'isBestSeller', 'prescriptionRequired'].includes(h)) {
            val = val.toLowerCase() === 'true';
          } else if (['price', 'mrp', 'availableQuantity', 'gstPercentage'].includes(h)) {
            val = Number(val) || 0;
          }
          obj[h] = val;
        });

        return obj;
      });

      try {
        const token = await user?.getIdToken();
        const CHUNK_SIZE = 100;
        const allErrors: any[] = [];
        let processed = 0;

        setImportProgress({ current: 0, total: products.length });

        for (let i = 0; i < products.length; i += CHUNK_SIZE) {
          const chunk = products.slice(i, i + CHUNK_SIZE);
          const res = await fetch('/api/products/bulk', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chunk)
          });
          
          const result = await res.json();
          if (!res.ok) {
            allErrors.push(...(chunk.map(p => ({ item: p.name, reason: result.message || 'Network error' }))));
          } else if (result.errors?.length > 0) {
            allErrors.push(...result.errors);
          }

          processed += chunk.length;
          setImportProgress({ current: processed, total: products.length });
        }

        setFailedList(allErrors);
        setImportProgress(null);

        if (allErrors.length > 0) {
          toast({ 
            variant: 'destructive', 
            title: "Import completed with issues", 
            description: `${products.length - allErrors.length} succeeded, ${allErrors.length} failed.` 
          });
        } else {
          toast({ title: "Bulk import success", description: "Catalog updated successfully." });
          window.location.reload();
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
        setImportProgress(null);
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
          const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=10&showDisabled=true`, { cache: 'no-store' });
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
    limit: 50,
    showDisabled: true
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 relative">
      {importProgress && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-[450px] p-10 rounded-[48px] border-none shadow-3xl bg-white/80 backdrop-blur-2xl text-center space-y-8 border border-white/20">
            <div className="relative w-28 h-28 mx-auto">
               <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
               <motion.div 
                className="absolute inset-0 rounded-full border-t-4 border-primary" 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-black text-2xl text-primary">{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
               </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tighter">Syncing Inventory</h3>
              <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.2em] mt-3 bg-slate-50 py-2 rounded-full">
                Processing {importProgress.current} of {importProgress.total} SKUs
              </p>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full shadow-lg" 
                initial={{ width: 0 }}
                animate={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[12px] font-bold text-slate-500 italic">Establishing data links... Please keep this window open.</p>
          </Card>
        </div>
      )}

      {failedList.length > 0 && (
        <div className="fixed bottom-10 right-10 z-[150] w-[350px] animate-in slide-in-from-right-10 duration-500">
           <Card className="rounded-[32px] shadow-3xl border-none overflow-hidden bg-red-600 text-white">
              <div className="p-6 bg-red-700/50 flex items-center justify-between">
                 <h4 className="font-black text-[12px] uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Import Rejections
                 </h4>
                 <Button variant="ghost" size="icon" onClick={() => setFailedList([])} className="h-8 w-8 text-white hover:bg-white/10"><X className="w-4 h-4" /></Button>
              </div>
              <ScrollArea className="h-64 p-6 pt-0">
                 <div className="space-y-4 pt-4">
                    {failedList.map((err, i) => (
                       <div key={i} className="space-y-1 pb-4 border-b border-white/20 last:border-none">
                          <p className="font-black text-[12px] uppercase truncate">{err.item || err.molecule || 'Unknown SKU'}</p>
                          <p className="text-[11px] font-medium text-white/80 leading-relaxed">{err.reason}</p>
                       </div>
                    ))}
                 </div>
              </ScrollArea>
           </Card>
        </div>
      )}

      <SectionHeader title="Product Inventory" subtitle="Manage and organize your store products" onBack={onBack}>
        <div className="flex flex-wrap items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
          <Button onClick={downloadTemplate} variant="ghost" className="rounded-full h-14 px-8 font-black text-[12px] text-slate-500 hover:text-primary gap-3 uppercase tracking-widest transition-all">
            <Download className="w-4 h-4" /> Template
          </Button>
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-14 px-8 font-black text-[12px] border-2 gap-3 text-primary border-primary/20 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <Button onClick={handleExport} variant="outline" className="rounded-full h-14 px-8 font-black text-[12px] border-2 gap-3 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export Matrix
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-full h-14 px-10 font-black text-[12px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95">
            <Plus className="w-5 h-5" /> New Entity
          </Button>
        </div>
      </SectionHeader>

      <div className="relative group/search" ref={suggestionRef}>
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within/search:text-primary transition-colors">
          <Search className="w-6 h-6" />
        </div>
        <Input 
          placeholder="SEARCH PRODUCT INVENTORY (E.G. D-VENIZ)..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="h-20 pl-20 rounded-[40px] border-none bg-white shadow-xl font-black text-base tracking-tight placeholder:text-slate-500 focus:ring-4 focus:ring-primary/10 transition-all uppercase" 
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
              <p className="text-[11px] font-black text-slate-600 tracking-[0.4em] uppercase">Product Matches</p>
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
                    <p className="font-black text-lg text-slate-900 truncate tracking-tighter uppercase font-outfit">{item.name}</p>
                    <p className="text-[11px] font-black text-slate-600 tracking-[0.3em] truncate uppercase">{item.sku} • {item.manufacturer}</p>
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
            <thead className="bg-gray-50 text-[12px] font-black text-gray-900 border-b uppercase tracking-tight">
              <tr><th className="px-10 py-8">Product detail</th><th className="px-10 py-8">Category</th><th className="px-10 py-8 text-right">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 animate-pulse rounded-2xl" />
                        <div className="space-y-2">
                          <div className="w-48 h-4 bg-slate-100 animate-pulse rounded-full" />
                          <div className="w-32 h-2 bg-slate-50 animate-pulse rounded-full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="w-24 h-6 bg-slate-100 animate-pulse rounded-lg" />
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-end gap-2">
                        <div className="w-10 h-10 bg-slate-50 animate-pulse rounded-xl" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : medicines?.length === 0 ? (<tr><td colSpan={3} className="p-20 text-center font-bold text-gray-300">No entries found</td></tr>) : medicines?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border flex items-center justify-center overflow-hidden">
                        {med.imageUrl ? <img src={med.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-gray-200" />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base">{med.name}</span>
                          {med.isActive === false && (
                            <Badge variant="destructive" className="h-5 text-[10px] px-2 font-black uppercase">Inactive</Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 font-bold uppercase">{med.sku} • {med.manufacturer}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[11px] border-2">{med.category}</Badge></td>
                  <td className="px-10 py-8 text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }}>
                         <Edit2 className="w-4 h-4 text-gray-400" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={async () => {
                          if (confirm("Delete this product from MongoDB & Firestore?")) {
                            try {
                              const docId = med._id || med.id;
                              const token = await user?.getIdToken();
                              const res = await fetch(`/api/products/${docId}`, { 
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              
                              if (!res.ok) throw new Error('Failed to delete from MongoDB');
                              
                              toast({ title: "Product deleted" });
                              refetch?.();
                            } catch (err: any) {
                              toast({ variant: 'destructive', title: "Deletion failed", description: err.message });
                            }
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
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Product profile</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Configure product details and live inventory status
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
            {isFormOpen && (
        <ItemForm 
          db={db} 
          initialData={editingItem} 
          onSuccess={() => {
            setIsFormOpen(false);
            refetch?.();
          }} 
        />
      )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const LimitedInput = ({ label, value, onChange, limit, placeholder = "" }: any) => (
  <div className="space-y-1.5 flex-1">
    <div className="flex justify-between items-center px-1">
      <Label className="text-[9px] font-black uppercase text-slate-400">{label}</Label>
      <span className={cn("text-[8px] font-bold", (value?.length || 0) > limit ? "text-rose-500" : "text-slate-300")}>
        {value?.length || 0}/{limit}
      </span>
    </div>
    <Input 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className={cn("rounded-xl h-11 bg-gray-50 border-none font-black text-[11px] uppercase placeholder:text-slate-200", (value?.length || 0) > limit && "ring-1 ring-rose-500")} 
    />
  </div>
);

const LimitedTextarea = ({ label, value, onChange, limit, placeholder = "" }: any) => (
  <div className="space-y-1.5 flex-1">
    <div className="flex justify-between items-center px-1">
      <Label className="text-[9px] font-black uppercase text-slate-400">{label}</Label>
      <span className={cn("text-[8px] font-bold", (value?.length || 0) > limit ? "text-rose-500" : "text-slate-300")}>
        {value?.length || 0}/{limit}
      </span>
    </div>
    <Textarea 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className={cn("rounded-[20px] min-h-[80px] bg-gray-50 border-none font-bold text-[11px] p-4 uppercase placeholder:text-slate-200 scrollbar-hide", (value?.length || 0) > limit && "ring-1 ring-rose-500")} 
    />
  </div>
);

function ItemForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [molecules, setMolecules] = useState<any[]>([]);
  const [isMolsLoading, setIsMolsLoading] = useState(false);
  const [molSearch, setMolSearch] = useState('');
  const [isMolOpen, setIsMolOpen] = useState(false);
  const [selectedMoleculeTitle, setSelectedMoleculeTitle] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Fix: Load initial molecule name on mount & Refresh latest data
  useEffect(() => {
    const docId = initialData?.id || initialData?._id;
    if (!docId) return;

    const refreshProduct = async () => {
       setIsRefreshing(true);
       try {
          const res = await fetch(`/api/products/${docId}`, { cache: 'no-store' });
          if (res.ok) {
             const data = await res.json();
             // Merge/Reset form with latest data
             setForm(prev => ({
                ...prev,
                ...data,
                medicalTabLabel: data.medicalTabLabel || 'Intelligence',
                safetyTabLabel: data.safetyTabLabel || 'Protocol',
                matrixTabLabel: data.matrixTabLabel || 'Matrix',
                // PULL COMPOSITION FROM LEGACY FALLBACKS
                saltComposition: data.saltComposition || data.composition || data.salt || data.molecule || '',
                imageUrl2: data.imageUrls?.[1] || '',
                imageUrl3: data.imageUrls?.[2] || '',
                id: data.id || data._id?.toString()
             }));

             // Pull prices/stock from root if available
             if (data.mrp !== undefined || data.price !== undefined || data.availableQuantity !== undefined) {
                setLiveData(prev => ({
                   ...prev,
                   mrp: data.mrp ?? prev.mrp,
                   price: data.price ?? prev.price,
                   availableQuantity: data.availableQuantity ?? prev.availableQuantity
                }));
             }
             
             // Fetch molecule name if mapped and set as saltComposition if empty
             if (data.moleculeId) {
                const fetchMol = async () => {
                   try {
                      const mRes = await fetch(`/api/molecules/${data.moleculeId}`, { cache: 'no-store' });
                      if (mRes.ok) {
                         const mData = await mRes.json();
                         const molName = mData.molecule || mData.name;
                         if (molName) {
                            setSelectedMoleculeTitle(molName);
                            setForm(f => ({ ...f, saltComposition: f.saltComposition || molName }));
                         }
                      }
                   } catch (e) { console.error("Error fetching molecule", e); }
                };
                fetchMol();
             }
          }
       } catch (e) {
          console.error("Refresh error:", e);
       } finally {
          setIsRefreshing(false);
       }
    };

    refreshProduct();
  }, [initialData?.id, initialData?._id]);

  // Fetch categories for dropdown - separately so it runs in create mode too
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
           const data = await res.json();
           setCategories(data);
        }
      } catch (e) {
        console.error("Error fetching categories", e);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchMols = async () => {
      setIsMolsLoading(true);
      try {
        const res = await fetch(`/api/molecules?q=${encodeURIComponent(molSearch)}&limit=20`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMolecules(data);
        }
      } catch (e) {
        console.error("Molecule search fail:", e);
      } finally {
        setIsMolsLoading(false);
      }
    };

    const t = setTimeout(fetchMols, 300);
    return () => clearTimeout(t);
  }, [molSearch]);

  const HSN_GST_MAP: Record<string, number> = {
    '3004': 12, // Medicaments
    '3002': 5,  // Human blood, vaccines
    '3003': 12, // Medicaments (unmixed)
    '3005': 12, // Wadding, gauze, bandages
    '3006': 12, // Pharmaceutical goods
    '3304': 18, // Beauty or make-up preparations
    '2106': 18, // Food preparations (supplements)
    '3401': 18, // Soap
  };

  const [form, setForm] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    manufacturer: initialData?.manufacturer || '',
    category: initialData?.category || '',
    hsnCode: initialData?.hsnCode || '',
    gstPercentage: initialData?.gstPercentage || 0,
    isGeneric: initialData?.isGeneric || false,
    isBestSeller: initialData?.isBestSeller ?? false,
    prescriptionRequired: initialData?.prescriptionRequired || false,
    moleculeId: initialData?.moleculeId || '',
    packSize: initialData?.packSize || '',
    description: initialData?.description || '',
    howToUse: initialData?.howToUse || '',
    treatment: initialData?.treatment || '',
    saltComposition: initialData?.saltComposition || '',
    safetyAdvice: initialData?.safetyAdvice || '',
    pregnancyInteraction: initialData?.pregnancyInteraction || '',
    lactationInteraction: initialData?.lactationInteraction || '',
    drivingInteraction: initialData?.drivingInteraction || '',
    kidneyInteraction: initialData?.kidneyInteraction || '',
    liverInteraction: initialData?.liverInteraction || '',
    medicalTabLabel: initialData?.medicalTabLabel || 'Intelligence',
    safetyTabLabel: initialData?.safetyTabLabel || 'Protocol',
    matrixTabLabel: initialData?.matrixTabLabel || 'Matrix',
    imageUrl: initialData?.imageUrl || '',
    imageUrl2: initialData?.imageUrls?.[1] || '',
    imageUrl3: initialData?.imageUrls?.[2] || '',
    isTopSelection: initialData?.isTopSelection || false,
    isActive: initialData?.isActive !== false
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

    // MANDATORY VALIDATION WITH SPECIFIC FEEDBACK
    const missing = [];
    if (!form.medicalTabLabel) missing.push("Medical Label");
    if (!form.safetyTabLabel) missing.push("Safety Label");
    if (!form.matrixTabLabel) missing.push("Matrix Label");
    if (!form.saltComposition) missing.push("Salt Composition");

    if (missing.length > 0) {
      toast({ 
        variant: 'destructive', 
        title: "Incomplete Profile", 
        description: `Please fill required fields: ${missing.join(', ')}` 
      });
      return;
    }

    const { imageUrl2, imageUrl3, ...payloadBase } = form;

    const combinedPayload = {
      ...payloadBase,
      imageUrls: [form.imageUrl, imageUrl2, imageUrl3].filter(Boolean),
      mrp: Number(liveData.mrp), 
      price: Number(liveData.price), 
      availableQuantity: Number(liveData.availableQuantity),
      id: docId
    };

    // Remove legacy liveData object if it exists in the spread
    delete (combinedPayload as any).liveData;

    try {
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/products/${docId}` : '/api/products';
      
      const token = await user?.getIdToken();
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(combinedPayload)
      });
      
      if (!res.ok) throw new Error('Failed to sync with MongoDB');

      toast({ title: "Product synchronized", description: "Saved to MongoDB Master" });
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
          <TabsTrigger value="live" className="flex-1 rounded-xl font-black text-[10px] text-primary">Inventory & Sku</TabsTrigger>
          <TabsTrigger value="images" className="flex-1 rounded-xl font-black text-[10px]">Media</TabsTrigger>
          <TabsTrigger value="medical" className="flex-1 rounded-xl font-black text-[10px]">Medical</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {initialData?._id && (
              <div className="col-span-2 space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-300">System ID (Auto-generated)</Label>
                <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed">{initialData._id}</p>
              </div>
            )}
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black">Medicine name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Sku</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Pack Size</Label><Input value={form.packSize} onChange={e => setForm({...form, packSize: e.target.value})} placeholder="e.g. 10 Tablets" className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black">Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black">HSN Code</Label>
              <Input 
                value={form.hsnCode} 
                onChange={e => {
                  const val = e.target.value;
                  const prefix = val.substring(0, 4);
                  const autoGst = HSN_GST_MAP[prefix];
                  setForm({
                    ...form, 
                    hsnCode: val,
                    ...(autoGst !== undefined ? { gstPercentage: autoGst } : {})
                  });
                }} 
                className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black">GST (%)</Label>
              <Input 
                type="number"
                value={form.gstPercentage} 
                onChange={e => setForm({...form, gstPercentage: Number(e.target.value)})} 
                className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
              />
            </div>
            <div className="col-span-2 flex items-center space-x-8 pt-4 flex-wrap gap-y-4">
              <div className="flex items-center space-x-2"><Checkbox id="is-active" checked={form.isActive} onCheckedChange={(c) => setForm({...form, isActive: !!c})} /><Label htmlFor="is-active" className="text-[10px] font-black uppercase text-emerald-600">Active / Live</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="is-top-selection" checked={form.isTopSelection} onCheckedChange={(c) => setForm({...form, isTopSelection: !!c})} /><Label htmlFor="is-top-selection" className="text-[10px] font-black uppercase text-blue-600">Top Selection</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="rx-req" checked={form.prescriptionRequired} onCheckedChange={(c) => setForm({...form, prescriptionRequired: !!c})} /><Label htmlFor="rx-req" className="text-[10px] font-black text-red-500 uppercase">Rx required</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="is-generic" checked={form.isGeneric} onCheckedChange={(c) => setForm({...form, isGeneric: !!c})} /><Label htmlFor="is-generic" className="text-[10px] font-black text-accent uppercase">SahiMed generic</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="is-best-seller" checked={form.isBestSeller} onCheckedChange={(c) => setForm({...form, isBestSeller: !!c})} /><Label htmlFor="is-best-seller" className="text-[10px] font-black text-yellow-500 uppercase">Best Seller</Label></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-primary/5 p-8 rounded-[32px] border border-primary/10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-primary">Item Code (SKU)</Label>
              <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-white border-none font-black text-base" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-primary">Live price</Label>
              <Input type="number" value={liveData.price} onChange={e => setLiveData({...liveData, price: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-black text-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black">Mrp</Label>
              <Input type="number" value={liveData.mrp} onChange={e => setLiveData({...liveData, mrp: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black">Stock</Label>
              <Input type="number" value={liveData.availableQuantity} onChange={e => setLiveData({...liveData, availableQuantity: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" />
            </div>
          </div>
        </TabsContent>
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
        <TabsContent value="medical" className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
              <div className="flex items-center gap-3 mb-2 px-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Search className="w-4 h-4 text-primary" /></div>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 border-none">Molecule mapping</h3>
              </div>
              <div className="relative group">
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <Input 
                    placeholder={selectedMoleculeTitle || "SEARCH PRODUCT REGISTRY..."}
                    value={molSearch}
                    onChange={(e) => {
                      setMolSearch(e.target.value);
                      if (!isMolOpen) setIsMolOpen(true);
                    }}
                    onFocus={() => setIsMolOpen(true)}
                    className="w-full h-14 rounded-2xl bg-white border border-slate-200 pl-16 pr-10 font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 uppercase text-[11px]"
                  />
                  {selectedMoleculeTitle && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedMoleculeTitle("");
                        setForm(f => ({ ...f, moleculeId: "" }));
                        setMolSearch("");
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isMolOpen && molSearch.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 pl-3">Registry Matches ({molecules?.length || 0})</span>
                      <Button type="button" variant="ghost" className="h-6 w-6 p-0 rounded-lg" onClick={() => setIsMolOpen(false)}><Plus className="w-3 h-3 rotate-45" /></Button>
                    </div>
                    <ScrollArea className="h-[320px]">
                      {isMolsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="text-[10px] font-bold text-slate-300 uppercase">Fetching Registry...</span>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {molecules?.length === 0 ? (
                            <div className="py-10 px-4 text-center">
                              <p className="text-[10px] font-black text-slate-300 uppercase">No Match in Registry</p>
                              <Button type="button" variant="link" className="text-[9px] font-bold text-primary p-0 h-auto mt-2">ADD TO REGISTRY</Button>
                            </div>
                          ) : (
                            molecules?.map((mol) => {
                              const molId = mol._id || mol.id;
                              const isSelected = form.moleculeId === mol.masterId || form.moleculeId === molId;
                              return (
                                <button
                                  key={molId}
                                  type="button"
                                  onClick={() => {
                                    setForm({...form, moleculeId: mol.masterId || molId, saltComposition: mol.molecule || mol.name});
                                    setSelectedMoleculeTitle(mol.molecule || mol.name);
                                    setIsMolOpen(false);
                                    setMolSearch('');
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-all group",
                                    isSelected ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600"
                                  )}
                                >
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                  )}>
                                    {mol.form?.[0] || 'M'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("font-black text-[11px] uppercase truncate", isSelected ? "text-white" : "text-slate-900")}>
                                      {mol.molecule || mol.name}
                                    </p>
                                    <p className={cn("text-[9px] font-bold uppercase opacity-60", isSelected ? "text-white/80" : "text-slate-400")}>
                                      {mol.masterId} • {mol.form || 'Active Ingredient'}
                                    </p>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 bg-lavender/30 p-6 rounded-[32px] border border-white">
               <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Category Architecture</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                      <SelectTrigger className="rounded-2xl h-14 bg-white border-none font-bold">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl z-[150]">
                        {categories.map(cat => (
                          <SelectItem key={cat.id || cat._id} value={cat.name} className="font-bold uppercase text-[11px]">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
               <div className="flex gap-4">
                  <LimitedInput label="Medical Header (Required)" value={form.medicalTabLabel} onChange={(v: string) => setForm({...form, medicalTabLabel: v})} limit={20} placeholder="e.g. MEDICAL INFO" required />
               </div>
               <div className="space-y-4">
                  <LimitedTextarea label="Medical Indication" value={form.treatment} onChange={(v: string) => setForm({...form, treatment: v})} limit={150} placeholder="Enter medical usage..." />
                  <LimitedTextarea label="Pharmacology" value={form.description} onChange={(v: string) => setForm({...form, description: v})} limit={150} placeholder="Enter medical formulation details..." />
               </div>
            </div>

            <div className="space-y-6 bg-sahi-pink/10 p-6 rounded-[32px] border border-white">
               <div className="flex gap-4">
                  <LimitedInput label="Protocol Header (Required)" value={form.safetyTabLabel} onChange={(v: string) => setForm({...form, safetyTabLabel: v})} limit={20} placeholder="e.g. PROTOCOL" required />
               </div>
               <div className="space-y-4">
                  <LimitedTextarea label="Protocol Caution" value={form.safetyAdvice} onChange={(v: string) => setForm({...form, safetyAdvice: v})} limit={150} placeholder="Enter safety advice..." />
                  <LimitedTextarea label="Usage Gateway" value={form.howToUse} onChange={(v: string) => setForm({...form, howToUse: v})} limit={150} placeholder="Enter how to use info..." />
               </div>
            </div>

            <div className="space-y-6 bg-sahi-blue/5 p-6 rounded-[32px] border border-white">
               <div className="flex gap-4">
                  <LimitedInput label="Matrix Header (Required)" value={form.matrixTabLabel} onChange={(v: string) => setForm({...form, matrixTabLabel: v})} limit={20} placeholder="e.g. MATRIX" required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <LimitedInput label="Composition (Required)" value={form.saltComposition} onChange={(v: string) => setForm({...form, saltComposition: v})} limit={50} required />
                  <LimitedInput label="Pregnancy" value={form.pregnancyInteraction} onChange={(v: string) => setForm({...form, pregnancyInteraction: v})} limit={50} />
                  <LimitedInput label="Lactation" value={form.lactationInteraction} onChange={(v: string) => setForm({...form, lactationInteraction: v})} limit={50} />
                  <LimitedInput label="Driving" value={form.drivingInteraction} onChange={(v: string) => setForm({...form, drivingInteraction: v})} limit={50} />
                  <LimitedInput label="Renal" value={form.kidneyInteraction} onChange={(v: string) => setForm({...form, kidneyInteraction: v})} limit={50} />
                  <LimitedInput label="Hepatic" value={form.liverInteraction} onChange={(v: string) => setForm({...form, liverInteraction: v})} limit={50} />
               </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Button type="submit" className="w-full h-20 rounded-[32px] font-black tracking-widest bg-primary text-white shadow-2xl">Save profile</Button>
    </form>
  );
}
