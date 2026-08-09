"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronRight,
  ShieldAlert,
  X,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
import { useUser } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMongoDBCollection } from '@/hooks/use-mongodb';
import { motion } from 'framer-motion';
import { SectionHeader } from './SectionHeader';
import { ExportFieldsDialog } from './ExportFieldsDialog';

export function ItemMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'branded' | 'generic' | 'linked' | 'unlinked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [marketerFilter, setMarketerFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [linkingItem, setLinkingItem] = useState<any>(null);
  const [linkMoleculeCode, setLinkMoleculeCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isErpDensity, setIsErpDensity] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin_erp_density');
    if (saved === 'true') setIsErpDensity(true);
  }, []);

  const toggleErpDensity = () => {
    setIsErpDensity(prev => {
      const next = !prev;
      localStorage.setItem('admin_erp_density', String(next));
      return next;
    });
  };

  const toggleMedicineType = async (med: any) => {
    const isCurrentlyGeneric = (med.medicine_type || '').toLowerCase().includes('generic') || med.is_generic === true;
    const newType = isCurrentlyGeneric ? 'Branded' : 'Generic';
    
    // Optimistically update local object properties for instant UI response
    med.medicine_type = newType;
    med.is_generic = (newType === 'Generic');

    try {
      const docId = med._id || med.id;
      const token = await user?.getIdToken();
      const res = await fetch(`/api/products/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ medicine_type: newType, is_generic: newType === 'Generic' })
      });
      if (!res.ok) throw new Error('Failed to update type');
      toast({ title: `Updated to ${newType}`, description: `${med.name} marked as ${newType}.` });
      refetch?.();
    } catch (err: any) {
      med.medicine_type = isCurrentlyGeneric ? 'Generic' : 'Branded';
      med.is_generic = isCurrentlyGeneric;
      toast({ variant: 'destructive', title: "Update failed", description: err.message });
    }
  };

  const handleSaveLink = async () => {
    if (!linkingItem || !linkMoleculeCode.trim()) return;
    setIsLinking(true);
    try {
      const docId = linkingItem._id || linkingItem.id;
      const token = await user?.getIdToken();
      const res = await fetch(`/api/products/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ molecule_code: linkMoleculeCode.trim() })
      });
      if (!res.ok) throw new Error('Failed to update molecule code');
      toast({ title: "Generic Linked!", description: `Assigned molecule code ${linkMoleculeCode.trim()} to ${linkingItem.name}.` });
      setLinkingItem(null);
      refetch?.();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Link failed", description: err.message });
    } finally {
      setIsLinking(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'product_id', 'product_name', 'molecule_code', 'medicine_type', 'salable_status', 'country_of_origin',
      'taxonomy.marketer_id', 'taxonomy.marketer_name', 'taxonomy.category_id', 'taxonomy.category_name', 'taxonomy.sub_category',
      'packaging.package_type', 'packaging.product_form', 'packaging.package_quantity', 'packaging.packaging_detail', 'packaging.mrp',
      'medical_info.composition', 'medical_info.primary_use', 'medical_info.introduction',
      'safety_warnings.is_rx_required', 'seo.url_slug', 'images'
    ];
    const csv = headers.join(',') + '\n"DRS207571","Nimsid P 100mg/325mg Tablet","MOL019884","Ethical","Salable (Rx Required)","India","MKT10308","Smile Healthcare","CAT00010","Analgesics","NSAIDs (General Pain)","Strip","Tablet","10","strip of 10 tablets","30","Nimesulide (100mg) + Paracetamol (325mg)","Pain relief","Introduction text here...","true","/buy-nimsid-p-100mg-325mg-tablet-tablet-smile-healthcare","https://..."';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_master_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMigrateIsGeneric = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/migrate-is-generic', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Migration failed');
      toast({
        title: "MongoDB Sync Complete! 🎉",
        description: `Populated is_generic field across MongoDB Product Master collection: ${data.genericProductsUpdated} Generics updated, ${data.brandedProductsUpdated} Branded updated.`
      });
      refetch?.();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({
      fields: selectedFields.join(',')
    });
    window.open(`/api/products/bulk?${queryParams.toString()}`, '_blank');
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
              current += '"';
              i++;
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
          if (h.includes('.')) {
            const [parent, child] = h.split('.');
            if (!obj[parent]) obj[parent] = {};
            if (val === 'true' || val === 'false') val = val === 'true';
            else if (!isNaN(val) && val !== '') val = Number(val);
            obj[parent][child] = val;
          } else {
            if (h === 'images') {
              obj.images = [val].filter(Boolean);
            } else {
              if (val === 'true' || val === 'false') val = val === 'true';
              else if (!isNaN(val) && val !== '') val = Number(val);
              obj[h] = val;
            }
          }
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
            allErrors.push(...(chunk.map(p => ({ item: p.product_name || p.product_id, reason: result.message || 'Network error' }))));
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

  const filteredMedicines = useMemo(() => {
    return (medicines || []).filter((med: any) => {
      const isGen = (med.medicine_type || '').toLowerCase().includes('generic') || med.is_generic === true;
      const isMapped = med.hasGenericMapped === true;

      if (statusFilter === 'branded' && isGen) return false;
      if (statusFilter === 'generic' && !isGen) return false;
      if (statusFilter === 'linked' && !isMapped) return false;
      if (statusFilter === 'unlinked' && isMapped) return false;

      if (categoryFilter !== 'all') {
        const cat = (med.category || med.taxonomy?.category_name || '').toLowerCase();
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }

      if (marketerFilter !== 'all') {
        const mkt = (med.manufacturer || med.taxonomy?.marketer_name || '').toLowerCase();
        if (!mkt.includes(marketerFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [medicines, statusFilter, categoryFilter, marketerFilter]);

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
                          <p className="font-black text-[12px] uppercase truncate">{err.item || 'Unknown SKU'}</p>
                          <p className="text-[11px] font-medium text-white/80 leading-relaxed">{err.reason}</p>
                       </div>
                    ))}
                 </div>
              </ScrollArea>
           </Card>
        </div>
      )}

      <SectionHeader title="Product Master" subtitle="Configure catalog item attributes" onBack={onBack}>
        <div className="flex flex-wrap items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
          <Button onClick={downloadTemplate} variant="ghost" className="rounded-full h-14 px-8 font-black text-[12px] text-slate-500 hover:text-primary gap-3 uppercase tracking-widest transition-all">
            <Download className="w-4 h-4" /> Template
          </Button>
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-14 px-8 font-black text-[12px] border-2 gap-3 text-primary border-primary/20 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <Button 
            onClick={toggleErpDensity} 
            variant="outline" 
            className={cn(
              "rounded-full h-14 px-6 font-black text-[12px] border-2 gap-2 uppercase tracking-wider transition-all active:scale-95",
              isErpDensity ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            {isErpDensity ? '📊 ERP Compact View' : '📑 Standard View'}
          </Button>
          <Button 
            onClick={handleMigrateIsGeneric} 
            variant="outline" 
            className="rounded-full h-14 px-6 font-black text-[12px] border-2 border-emerald-500/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 uppercase tracking-wider transition-all active:scale-95 shadow-xs"
          >
            ⚡ Sync is_generic DB Field
          </Button>
          <Button onClick={() => setIsExportOpen(true)} variant="outline" className="rounded-full h-14 px-8 font-black text-[12px] border-2 gap-3 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export Matrix
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-full h-14 px-10 font-black text-[12px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95">
            <Plus className="w-5 h-5" /> New Entity
          </Button>
        </div>
      </SectionHeader>

      <div className="relative group/search">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within/search:text-primary transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <Input 
          placeholder="SEARCH PRODUCT INVENTORY (E.G. D-VENIZ)..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="h-14 pl-14 pr-12 rounded-2xl border bg-slate-50 shadow-sm font-black text-sm tracking-tight placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all uppercase" 
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-all"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 3 Interactive Catalog Filters ── */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 shadow-2xs">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-black uppercase tracking-wider pr-1">
          <Filter className="w-3.5 h-3.5 text-primary" /> Filter Catalog:
        </div>

        {/* Filter 1: Type & Generic Status */}
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[210px] h-10 rounded-xl bg-white border-slate-200 font-bold text-xs shadow-2xs">
            <SelectValue placeholder="Type & Generic Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl font-bold text-xs z-[150]">
            <SelectItem value="all">All Types & Link Status</SelectItem>
            <SelectItem value="branded">🏷️ Branded Only</SelectItem>
            <SelectItem value="generic">💊 Generic Only</SelectItem>
            <SelectItem value="linked">✓ Generic Mapped Only</SelectItem>
            <SelectItem value="unlinked">🔗 Unlinked (Needs Link)</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter 2: Category */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white border-slate-200 font-bold text-xs shadow-2xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl font-bold text-xs z-[150]">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Analgesics">Analgesics</SelectItem>
            <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
            <SelectItem value="Neurology">Neurology</SelectItem>
            <SelectItem value="Cardiac">Cardiac Care</SelectItem>
            <SelectItem value="Vitamins">Vitamins & Nutrition</SelectItem>
            <SelectItem value="Dermatology">Dermatology</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter 3: Marketer / Manufacturer */}
        <Select value={marketerFilter} onValueChange={setMarketerFilter}>
          <SelectTrigger className="w-[200px] h-10 rounded-xl bg-white border-slate-200 font-bold text-xs shadow-2xs">
            <SelectValue placeholder="Marketer / Manufacturer" />
          </SelectTrigger>
          <SelectContent className="rounded-xl font-bold text-xs z-[150]">
            <SelectItem value="all">All Marketers</SelectItem>
            <SelectItem value="Capri">Capri Pharmaceuticals</SelectItem>
            <SelectItem value="Starmed">Starmed Biotech</SelectItem>
            <SelectItem value="Awan">Awan Remedies</SelectItem>
            <SelectItem value="Hallmark">Hallmark Formulations</SelectItem>
            <SelectItem value="Merhaki">Merhaki Foods</SelectItem>
            <SelectItem value="Kea">Kea Consumer Products</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {(statusFilter !== 'all' || categoryFilter !== 'all' || marketerFilter !== 'all') && (
          <Button
            onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setMarketerFilter('all'); }}
            variant="ghost"
            className="h-10 text-[11px] font-black text-rose-600 hover:bg-rose-50 rounded-xl uppercase tracking-wider ml-auto"
          >
            Reset Filters ✕
          </Button>
        )}
      </div>

      <Card className="rounded-[32px] overflow-hidden border border-slate-100 shadow-sm bg-white">
        {!debouncedSearch.trim() ? (
          /* ── Clean Empty State when no query is typed ── */
          <div className="p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-xl font-black text-slate-900 uppercase font-outfit tracking-tight">Search Product Catalog</h3>
              <p className="text-xs font-semibold text-slate-400">
                Type any medicine name, brand, SKU code (e.g. DRS207571), or composition above to search 6,71,000+ catalog items.
              </p>
            </div>

            {/* Quick Filter Chips */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Quick Search:</span>
              {['Dolo 650', 'Pantocid', 'Amoxycillin', 'Atorfit', 'Paracetamol', 'Azithromycin'].map(chip => (
                <button
                  key={chip}
                  onClick={() => setSearchTerm(chip)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 hover:border-primary hover:text-primary hover:bg-white transition-all active:scale-95 shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Search Results Table ── */
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50 text-slate-800 border-b border-slate-100 uppercase tracking-tight font-black">
                <tr>
                  <th className={isErpDensity ? "px-4 py-2.5 text-[10px]" : "px-6 py-4 text-[11px]"}>Product Detail</th>
                  <th className={isErpDensity ? "px-4 py-2.5 text-[10px]" : "px-6 py-4 text-[11px]"}>Type & Generic Status</th>
                  <th className={isErpDensity ? "px-4 py-2.5 text-[10px]" : "px-6 py-4 text-[11px]"}>Category</th>
                  <th className={isErpDensity ? "px-4 py-2.5 text-[10px]" : "px-6 py-4 text-[11px]"}>Marketer / Manufacturer</th>
                  <th className={cn("text-right", isErpDensity ? "px-4 py-2.5 text-[10px]" : "px-6 py-4 text-[11px]")}>Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className={isErpDensity ? "px-4 py-2" : "px-6 py-4"}>
                        <div className="flex items-center gap-3">
                          <div className={cn("bg-slate-100 animate-pulse rounded-xl", isErpDensity ? "w-7 h-7" : "w-10 h-10")} />
                          <div className="space-y-1.5">
                            <div className="w-36 h-3 bg-slate-100 animate-pulse rounded-full" />
                            <div className="w-24 h-2 bg-slate-50 animate-pulse rounded-full" />
                          </div>
                        </div>
                      </td>
                      <td className={isErpDensity ? "px-4 py-2" : "px-6 py-4"}><div className="w-24 h-5 bg-slate-100 animate-pulse rounded-md" /></td>
                      <td className={isErpDensity ? "px-4 py-2" : "px-6 py-4"}><div className="w-20 h-5 bg-slate-100 animate-pulse rounded-md" /></td>
                      <td className={isErpDensity ? "px-4 py-2" : "px-6 py-4"}><div className="w-28 h-5 bg-slate-100 animate-pulse rounded-md" /></td>
                      <td className={cn("text-right", isErpDensity ? "px-4 py-2" : "px-6 py-4")}><div className="w-8 h-8 bg-slate-100 animate-pulse rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <p className="font-black text-sm text-slate-700 uppercase">No products match active filters</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Try clearing your search query or clicking "Reset Filters"</p>
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map(med => {
                    const isGenericMed = (med.medicine_type || '').toLowerCase().includes('generic') || med.is_generic === true;
                    const isGenericMapped = med.hasGenericMapped === true;

                    return (
                      <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className={isErpDensity ? "px-4 py-1.5" : "px-6 py-4"}>
                          <div className="flex items-center gap-2.5">
                            <div className={cn("bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0", isErpDensity ? "w-7 h-7 rounded-md p-0.5" : "w-11 h-11 rounded-xl p-1")}>
                              {(() => {
                                const img = med.images?.[0] || med.imageUrl || '';
                                const isValid = img && !img.includes('placeholder') && !img.includes('picsum') && !img.includes('hero_generics') && !img.includes('patient-avatars');
                                return isValid ? <img src={img} alt="" className="w-full h-full object-contain" /> : <Package className={cn("text-slate-300", isErpDensity ? "w-3.5 h-3.5" : "w-5 h-5")} />;
                              })()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={cn("font-extrabold text-slate-900 uppercase truncate", isErpDensity ? "text-[11px]" : "text-xs")}>{med.name}</span>
                                {med.salable_status?.toLowerCase().includes('rx') && (
                                  <Badge variant="destructive" className="h-3.5 text-[7.5px] px-1 font-black uppercase">Rx</Badge>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{med.sku} {med.saltComposition && `• ${med.saltComposition}`}</span>
                            </div>
                          </div>
                        </td>
                        <td className={isErpDensity ? "px-4 py-1.5" : "px-6 py-4"}>
                          <div className="flex flex-wrap gap-1 items-center">
                            {/* 1-Tap Branded / Generic Toggle Badge */}
                            <button
                              onClick={() => toggleMedicineType(med)}
                              title="Click to toggle Branded / Generic"
                              className={cn(
                                "rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all border active:scale-95 flex items-center gap-1 shadow-2xs",
                                isErpDensity ? "px-2 py-0.2" : "px-2.5 py-0.5",
                                isGenericMed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              )}
                            >
                              {isGenericMed ? '💊 Generic' : '🏷️ Branded'}
                              <span className="text-[8px] opacity-60">⇄</span>
                            </button>

                            {/* Generic Link Status / Red Link Generic Action */}
                            {isGenericMapped ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 uppercase">
                                <Check className="w-2.5 h-2.5 text-emerald-600" /> Generic Linked ({med.molecule_code || med.moleculeId || 'Mapped'})
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setLinkingItem(med);
                                  setLinkMoleculeCode(med.molecule_code || med.moleculeId || '');
                                }}
                                className="inline-flex items-center gap-1 text-[8px] font-black text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.2 rounded uppercase transition-all active:scale-95 shadow-2xs"
                              >
                                Link Generic 🔗
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={isErpDensity ? "px-4 py-1.5" : "px-6 py-4"}><Badge variant="outline" className="font-black text-[9px] py-0 border-slate-200 text-slate-700 uppercase">{med.category || '—'}</Badge></td>
                        <td className={cn("font-bold text-slate-700 truncate max-w-[150px]", isErpDensity ? "px-4 py-1.5 text-[11px]" : "px-6 py-4 text-xs")}>{med.manufacturer || '—'}</td>
                        <td className={cn("text-right", isErpDensity ? "px-4 py-1.5" : "px-6 py-4")}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className={cn("rounded-xl hover:bg-slate-100", isErpDensity ? "h-6 w-6" : "h-8 w-8")} onClick={() => { setEditingItem(med); setIsFormOpen(true); }}>
                              <Edit2 className={isErpDensity ? "w-3 h-3 text-slate-500" : "w-3.5 h-3.5 text-slate-500"} />
                            </Button>
                            <Button variant="ghost" size="icon" className={cn("rounded-xl hover:bg-rose-50 hover:text-rose-600", isErpDensity ? "h-6 w-6" : "h-8 w-8")} onClick={async () => {
                              if (confirm("Delete this product?")) {
                                try {
                                  const docId = med._id || med.id;
                                  const token = await user?.getIdToken();
                                  const res = await fetch(`/api/products/${docId}`, { 
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  if (!res.ok) throw new Error('Failed to delete');
                                  toast({ title: "Product deleted" });
                                  refetch?.();
                                } catch (err: any) {
                                  toast({ variant: 'destructive', title: "Deletion failed", description: err.message });
                                }
                              }
                            }}>
                              <Trash2 className={isErpDensity ? "w-3 h-3 text-slate-400 hover:text-rose-600" : "w-3.5 h-3.5 text-slate-400 hover:text-rose-600"} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Product Profile Setup</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Configure Product Master Database parameters
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
            {isFormOpen && (
              <ItemForm 
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

      <ExportFieldsDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={[
          'product_id', 'product_name', 'molecule_code', 'medicine_type', 'salable_status', 'country_of_origin',
          'taxonomy.marketer_id', 'taxonomy.marketer_name', 'taxonomy.category_id', 'taxonomy.category_name', 'taxonomy.sub_category',
          'packaging.product_form', 'packaging.package_type', 'packaging.package_quantity', 'packaging.packaging_detail', 'packaging.mrp',
          'medical_info.composition', 'medical_info.primary_use', 'safety_warnings.is_rx_required', 'images', 'seo.url_slug'
        ]}
        title="Product Master"
        onExport={handleExport}
      />

      <Dialog open={Boolean(linkingItem)} onOpenChange={(open) => { if (!open) setLinkingItem(null); }}>
        <DialogContent className="rounded-[32px] sm:max-w-md p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-outfit uppercase tracking-tight text-slate-900">
              Link Generic Substitute
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium mt-1">
              Assign or update the Molecule Code for <span className="font-extrabold text-slate-800">{linkingItem?.name}</span> to pair it with its generic equivalent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Current Composition</p>
              <p className="text-xs font-bold text-slate-800 italic">{linkingItem?.saltComposition || linkingItem?.medical_info?.composition || 'No composition listed'}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Molecule Code *</Label>
              <Input
                value={linkMoleculeCode}
                onChange={(e) => setLinkMoleculeCode(e.target.value)}
                placeholder="e.g. MOL007410"
                className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-400 font-medium">Both Branded & Generic products sharing this Molecule Code will display in Rule 1 Side-by-Side PDP comparison.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setLinkingItem(null)}
                className="flex-1 h-12 rounded-full font-bold text-xs border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLink}
                disabled={isLinking || !linkMoleculeCode.trim()}
                className="flex-1 h-12 rounded-full font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md uppercase tracking-wider"
              >
                {isLinking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Pair & Save 🔗'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [molecules, setMolecules] = useState<any[]>([]);

  const [form, setForm] = useState({
    product_id: initialData?.product_id || initialData?.sku || '',
    product_name: initialData?.product_name || initialData?.name || '',
    molecule_code: initialData?.molecule_code || initialData?.moleculeId || initialData?.['Molecule Code'] || initialData?.molecule_id || '',
    medicine_type: initialData?.medicine_type || (initialData?.is_generic || initialData?.isGeneric ? 'Generic' : 'Branded'),
    is_generic: initialData?.is_generic ?? initialData?.isGeneric ?? (initialData?.medicine_type === 'Generic') ?? false,
    salable_status: initialData?.salable_status || 'Salable (Rx Required)',
    country_of_origin: initialData?.country_of_origin || 'India',
    
    'taxonomy.marketer_id': initialData?.taxonomy?.marketer_id || '',
    'taxonomy.marketer_name': initialData?.taxonomy?.marketer_name || initialData?.manufacturer || '',
    'taxonomy.category_id': initialData?.taxonomy?.category_id || '',
    'taxonomy.category_name': initialData?.taxonomy?.category_name || initialData?.category || '',
    'taxonomy.sub_category': initialData?.taxonomy?.sub_category || '',

    'packaging.package_type': initialData?.packaging?.package_type || 'Strip',
    'packaging.product_form': initialData?.packaging?.product_form || 'Tablet',
    'packaging.package_quantity': initialData?.packaging?.package_quantity || 10,
    'packaging.packaging_detail': initialData?.packaging?.packaging_detail || 'strip of 10 tablets',
    'packaging.mrp': initialData?.packaging?.mrp || initialData?.mrp || 0,

    'medical_info.composition': initialData?.medical_info?.composition || initialData?.saltComposition || '',
    'medical_info.primary_use': initialData?.medical_info?.primary_use || initialData?.treatment || '',
    'medical_info.introduction': initialData?.medical_info?.introduction || initialData?.description || '',
    'medical_info.benefits': initialData?.medical_info?.benefits || '',
    'medical_info.how_to_use': initialData?.medical_info?.how_to_use || initialData?.howToUse || '',
    'medical_info.if_miss': initialData?.medical_info?.if_miss || '',
    'medical_info.storage_instructions': initialData?.medical_info?.storage_instructions || '',
    
    'safety_warnings.is_rx_required': initialData?.safety_warnings?.is_rx_required ?? initialData?.prescriptionRequired ?? true,
    'safety_warnings.is_controlled_substance': initialData?.safety_warnings?.is_controlled_substance ?? false,

    'safety_warnings.interactions.alcohol': initialData?.safety_warnings?.interactions?.alcohol || 'Caution',
    'safety_warnings.interactions.pregnancy': initialData?.safety_warnings?.interactions?.pregnancy || 'Unsafe',
    'safety_warnings.interactions.lactation': initialData?.safety_warnings?.interactions?.lactation || 'Consult Doctor',
    'safety_warnings.interactions.driving': initialData?.safety_warnings?.interactions?.driving || 'Unsafe',
    'safety_warnings.interactions.kidney': initialData?.safety_warnings?.interactions?.kidney || 'Consult Doctor',
    'safety_warnings.interactions.liver': initialData?.safety_warnings?.interactions?.liver || 'Unsafe',
    'safety_warnings.interactions.safety_advise': (initialData?.safety_warnings?.interactions?.safety_advise || '')
      .replace(/<[^>]*>/g, '\n') // Replace HTML tags with newlines
      .replace(/\|/g, '\n')      // Replace pipe characters with newlines
      .replace(/\n\s*\n/g, '\n') // Normalize multiple newlines
      .trim(),

    imageUrl: initialData?.images?.[0] || initialData?.imageUrl || '',
    'seo.url_slug': initialData?.seo?.url_slug || '',
    'seo.seo_title': initialData?.seo?.seo_title || '',
    'seo.seo_description': initialData?.seo?.seo_description || '',
  });

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories).catch(console.error);
    fetch('/api/molecules?limit=1500').then(res => res.json()).then((list: any[]) => {
      const currentCode = initialData?.molecule_code || initialData?.moleculeId || initialData?.['Molecule Code'] || initialData?.molecule_id || '';
      if (currentCode && Array.isArray(list) && !list.some(m => (m['Molecule Code'] === currentCode || m.id === currentCode || m._id === currentCode))) {
        list.unshift({
          _id: currentCode,
          'Molecule Code': currentCode,
          Composition: initialData?.medical_info?.composition || currentCode
        });
      }
      setMolecules(Array.isArray(list) ? list : []);
    }).catch(console.error);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const docId = initialData?.id || initialData?._id || form.product_id;
    if (!docId) {
      toast({ variant: 'destructive', title: "Validation Error", description: "Product ID is required" });
      return;
    }

    const payload: any = {
      product_id: form.product_id,
      product_name: form.product_name,
      molecule_code: form.molecule_code,
      medicine_type: form.is_generic ? 'Generic' : form.medicine_type,
      is_generic: form.is_generic,
      isGeneric: form.is_generic,
      salable_status: form.salable_status,
      country_of_origin: form.country_of_origin,
      images: [form.imageUrl].filter(Boolean),
      taxonomy: {
        marketer_id: form['taxonomy.marketer_id'],
        marketer_name: form['taxonomy.marketer_name'],
        category_id: form['taxonomy.category_id'],
        category_name: form['taxonomy.category_name'],
        sub_category: form['taxonomy.sub_category'],
      },
      packaging: {
        package_type: form['packaging.package_type'],
        product_form: form['packaging.product_form'],
        package_quantity: Number(form['packaging.package_quantity']),
        packaging_detail: form['packaging.packaging_detail'],
        mrp: Number(form['packaging.mrp']),
      },
      medical_info: {
        composition: form['medical_info.composition'],
        primary_use: form['medical_info.primary_use'],
        introduction: form['medical_info.introduction'],
        benefits: form['medical_info.benefits'],
        how_to_use: form['medical_info.how_to_use'],
        if_miss: form['medical_info.if_miss'],
        storage_instructions: form['medical_info.storage_instructions'],
      },
      safety_warnings: {
        is_rx_required: form['safety_warnings.is_rx_required'],
        is_controlled_substance: form['safety_warnings.is_controlled_substance'],
        interactions: {
          alcohol: form['safety_warnings.interactions.alcohol'],
          pregnancy: form['safety_warnings.interactions.pregnancy'],
          lactation: form['safety_warnings.interactions.lactation'],
          driving: form['safety_warnings.interactions.driving'],
          kidney: form['safety_warnings.interactions.kidney'],
          liver: form['safety_warnings.interactions.liver'],
          safety_advise: form['safety_warnings.interactions.safety_advise'],
        }
      },
      seo: {
        url_slug: form['seo.url_slug'],
        seo_title: form['seo.seo_title'],
        seo_description: form['seo.seo_description'],
      }
    };

    try {
      const token = await user?.getIdToken();
      const res = await fetch(initialData ? `/api/products/${docId}` : '/api/products', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      toast({ title: "Product Master updated" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="identity">
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-14 w-full flex mb-8">
          <TabsTrigger value="identity" className="flex-1 font-black text-[10px]">Identity</TabsTrigger>
          <TabsTrigger value="taxonomy" className="flex-1 font-black text-[10px]">Taxonomy</TabsTrigger>
          <TabsTrigger value="packaging" className="flex-1 font-black text-[10px]">Packaging</TabsTrigger>
          <TabsTrigger value="medical" className="flex-1 font-black text-[10px]">Medical</TabsTrigger>
          <TabsTrigger value="safety" className="flex-1 font-black text-[10px]">Safety</TabsTrigger>
          <TabsTrigger value="seo" className="flex-1 font-black text-[10px]">SEO & SEO Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Product ID *</Label>
              <Input value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} required className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Product Name *</Label>
              <Input value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})} required className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Molecule Code</Label>
              <Input
                value={form.molecule_code}
                onChange={e => setForm({...form, molecule_code: e.target.value})}
                placeholder="e.g. MOL007410"
                className="rounded-2xl h-12 bg-gray-50 border-none font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Medicine Type</Label>
              <Select value={form.medicine_type} onValueChange={v => setForm({...form, medicine_type: v, is_generic: v === 'Generic'})}>
                <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl z-[150]">
                  <SelectItem value="Branded" className="font-bold">Branded</SelectItem>
                  <SelectItem value="Ethical" className="font-bold">Ethical</SelectItem>
                  <SelectItem value="Generic" className="font-bold">Generic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Dedicated Branded Generic Checkbox */}
            <div className="col-span-2 flex items-center space-x-3 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 my-1">
              <Checkbox 
                id="is-branded-generic" 
                checked={form.is_generic} 
                onCheckedChange={c => {
                  const checked = !!c;
                  setForm({
                    ...form, 
                    is_generic: checked,
                    medicine_type: checked ? 'Generic' : (form.medicine_type === 'Generic' ? 'Branded' : form.medicine_type)
                  });
                }} 
              />
              <div className="flex flex-col cursor-pointer" onClick={() => {
                const checked = !form.is_generic;
                setForm({
                  ...form, 
                  is_generic: checked,
                  medicine_type: checked ? 'Generic' : (form.medicine_type === 'Generic' ? 'Branded' : form.medicine_type)
                });
              }}>
                <Label htmlFor="is-branded-generic" className="text-xs font-black uppercase text-emerald-900 cursor-pointer">
                  ✨ Mark as Branded Generic
                </Label>
                <span className="text-[10.5px] text-emerald-700 font-bold">
                  100% Genuine Branded Generic Medicine (Validates in Product Profile & Storefront for up to 61% savings)
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Salable Status</Label>
              <Input value={form.salable_status} onChange={e => setForm({...form, salable_status: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Country of Origin</Label>
              <Input value={form.country_of_origin} onChange={e => setForm({...form, country_of_origin: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Image URL</Label>
              <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Marketer ID</Label>
              <Input value={form['taxonomy.marketer_id']} onChange={e => setForm({...form, 'taxonomy.marketer_id': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Marketer Name</Label>
              <Input value={form['taxonomy.marketer_name']} onChange={e => setForm({...form, 'taxonomy.marketer_name': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Category Name</Label>
              <Select value={form['taxonomy.category_name']} onValueChange={v => {
                const cat = categories.find(c => c.category === v);
                setForm({
                  ...form,
                  'taxonomy.category_name': v,
                  'taxonomy.category_id': cat?.category_id || ''
                });
              }}>
                <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none font-bold">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl z-[150]">
                  {categories.map(cat => (
                    <SelectItem key={cat.id || cat._id} value={cat.category} className="font-bold">
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Sub-Category</Label>
              <Input value={form['taxonomy.sub_category']} onChange={e => setForm({...form, 'taxonomy.sub_category': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="packaging" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Packaging Detail</Label>
              <Input value={form['packaging.packaging_detail']} onChange={e => setForm({...form, 'packaging.packaging_detail': e.target.value})} placeholder="e.g. strip of 10 tablets" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">MRP *</Label>
              <Input type="number" value={form['packaging.mrp']} onChange={e => setForm({...form, 'packaging.mrp': Number(e.target.value)})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-500">Composition / Salt formulation *</Label>
            <Input value={form['medical_info.composition']} onChange={e => setForm({...form, 'medical_info.composition': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Primary Medical Use</Label>
              <Input value={form['medical_info.primary_use']} onChange={e => setForm({...form, 'medical_info.primary_use': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">Storage Instructions</Label>
              <Input value={form['medical_info.storage_instructions']} onChange={e => setForm({...form, 'medical_info.storage_instructions': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-500">Introduction Details</Label>
            <Textarea value={form['medical_info.introduction']} onChange={e => setForm({...form, 'medical_info.introduction': e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-500">Benefits & Pharmacology Info</Label>
            <Textarea value={form['medical_info.benefits']} onChange={e => setForm({...form, 'medical_info.benefits': e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-500">How to use</Label>
            <Textarea value={form['medical_info.how_to_use']} onChange={e => setForm({...form, 'medical_info.how_to_use': e.target.value})} className="rounded-2xl min-h-[80px] bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-500">If Missed Dose</Label>
            <Textarea value={form['medical_info.if_miss']} onChange={e => setForm({...form, 'medical_info.if_miss': e.target.value})} className="rounded-2xl min-h-[80px] bg-gray-50 border-none font-bold" />
          </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <div className="flex gap-8 border-b pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="rx-required" checked={form['safety_warnings.is_rx_required']} onCheckedChange={c => setForm({...form, 'safety_warnings.is_rx_required': !!c})} />
              <Label htmlFor="rx-required" className="text-[10px] font-black uppercase text-red-500">Prescription Required</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="controlled-sub" checked={form['safety_warnings.is_controlled_substance']} onCheckedChange={c => setForm({...form, 'safety_warnings.is_controlled_substance': !!c})} />
              <Label htmlFor="controlled-sub" className="text-[10px] font-black uppercase text-amber-500">Controlled Substance</Label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500">Alcohol Interaction</Label>
              <Input value={form['safety_warnings.interactions.alcohol']} onChange={e => setForm({...form, 'safety_warnings.interactions.alcohol': e.target.value})} className="rounded-2xl h-11 bg-gray-50 border-none font-bold text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500">Pregnancy Interaction</Label>
              <Input value={form['safety_warnings.interactions.pregnancy']} onChange={e => setForm({...form, 'safety_warnings.interactions.pregnancy': e.target.value})} className="rounded-2xl h-11 bg-gray-50 border-none font-bold text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500">Lactation Interaction</Label>
              <Input value={form['safety_warnings.interactions.lactation']} onChange={e => setForm({...form, 'safety_warnings.interactions.lactation': e.target.value})} className="rounded-2xl h-11 bg-gray-50 border-none font-bold text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500">Driving Interaction</Label>
              <Input value={form['safety_warnings.interactions.driving']} onChange={e => setForm({...form, 'safety_warnings.interactions.driving': e.target.value})} className="rounded-2xl h-11 bg-gray-50 border-none font-bold text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500">Kidney Interaction</Label>
              <Input value={form['safety_warnings.interactions.kidney']} onChange={e => setForm({...form, 'safety_warnings.interactions.kidney': e.target.value})} className="rounded-2xl h-11 bg-gray-50 border-none font-bold text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500">Liver Interaction</Label>
              <Input value={form['safety_warnings.interactions.liver']} onChange={e => setForm({...form, 'safety_warnings.interactions.liver': e.target.value})} className="rounded-2xl h-11 bg-gray-50 border-none font-bold text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-500">Safety Advise Detail text</Label>
            <Textarea value={form['safety_warnings.interactions.safety_advise']} onChange={e => setForm({...form, 'safety_warnings.interactions.safety_advise': e.target.value})} className="rounded-2xl min-h-[80px] bg-gray-50 border-none font-bold" />
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">URL Slug</Label>
              <Input value={form['seo.url_slug']} onChange={e => setForm({...form, 'seo.url_slug': e.target.value})} placeholder="/buy-product-name" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">SEO Title</Label>
              <Input value={form['seo.seo_title']} onChange={e => setForm({...form, 'seo.seo_title': e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-500">SEO Description</Label>
              <Textarea value={form['seo.seo_description']} onChange={e => setForm({...form, 'seo.seo_description': e.target.value})} className="rounded-2xl min-h-[80px] bg-gray-50 border-none font-bold" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Save Product Profile</Button>
    </form>
  );
}
