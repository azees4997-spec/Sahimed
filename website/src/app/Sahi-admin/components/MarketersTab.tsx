"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Upload, 
  Search 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription,
  DialogHeader
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { SectionHeader } from './SectionHeader';
import { ExportFieldsDialog } from './ExportFieldsDialog';

// MongoDB Collection: "Marketer Master"
// Fields: "Marketer ID", "Standardized Marketer Name", "Product Count"

const MARKETER_FIELDS = ['Marketer ID', 'Standardized Marketer Name', 'Product Count'];

export function MarketersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [marketers, setMarketers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isErpDensity, setIsErpDensity] = useState(false);
  const [viewingMarketer, setViewingMarketer] = useState<string | null>(null);
  const [marketerProducts, setMarketerProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_marketer_erp_density');
    if (saved === 'true') setIsErpDensity(true);
  }, []);

  const toggleErpDensity = () => {
    setIsErpDensity(prev => {
      const next = !prev;
      localStorage.setItem('admin_marketer_erp_density', String(next));
      return next;
    });
  };

  const handleViewProducts = async (marketerName: string) => {
    setViewingMarketer(marketerName);
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?marketerName=${encodeURIComponent(marketerName)}&limit=100&showDisabled=true`);
      if (res.ok) {
        const data = await res.json();
        setMarketerProducts(data.filter((p: any) => p._type === 'medicine'));
      }
    } catch (e) {
      console.error('Failed to fetch marketer products', e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchMarketers = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/marketers?q=${encodeURIComponent(q)}&limit=500`);
      if (res.ok) {
        const data = await res.json();
        setMarketers(data);
      } else {
        toast({ variant: 'destructive', title: 'Fetch failed', description: 'Could not load marketers.' });
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchMarketers(searchQuery), 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const downloadTemplate = () => {
    const csv = `Marketer ID,Standardized Marketer Name,Product Count\nMKT00001,Abbott Healthcare,26\nMKT00002,Cipla Ltd,14`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marketer_master_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({ fields: selectedFields.join(',') });
    window.open(`/api/marketers/bulk?${queryParams.toString()}`, '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const csvLines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (csvLines.length < 2) {
        toast({ variant: 'destructive', title: 'Empty CSV', description: 'No data rows found.' });
        return;
      }
      
      const headers = csvLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const marketersData = csvLines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
        return obj;
      }).filter(m => m['Standardized Marketer Name']);

      if (marketersData.length === 0) {
        toast({ variant: 'destructive', title: 'No valid rows', description: 'Ensure CSV has "Standardized Marketer Name" column.' });
        return;
      }

      setImportProgress({ current: 0, total: marketersData.length });

      try {
        const token = await user?.getIdToken();
        const CHUNK = 100;
        let processed = 0;

        for (let i = 0; i < marketersData.length; i += CHUNK) {
          const chunk = marketersData.slice(i, i + CHUNK);
          const res = await fetch('/api/marketers/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(chunk)
          });
          if (!res.ok) throw new Error('Bulk import failed');
          processed += chunk.length;
          setImportProgress({ current: processed, total: marketersData.length });
        }

        setImportProgress(null);
        toast({ title: 'Import complete', description: `${marketersData.length} marketers processed.` });
        fetchMarketers(searchQuery);
      } catch (err: any) {
        setImportProgress(null);
        toast({ variant: 'destructive', title: 'Import failed', description: err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Marketer Master" subtitle={`${marketers.length.toLocaleString()} manufacturers • Marketer Master collection`} onBack={onBack}>
        <div className="flex gap-3 flex-wrap items-center">
          {/* ERP Compact View Toggle */}
          <Button 
            onClick={toggleErpDensity} 
            variant="outline" 
            className={`rounded-full h-12 px-6 font-black text-[11px] gap-2 uppercase tracking-wider transition-all ${
              isErpDensity ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {isErpDensity ? '📊 ERP Compact View' : '📑 Standard View'}
          </Button>

          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-full h-12 px-6 font-black text-[10px] gap-2 border-slate-200">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button variant="outline" onClick={() => setIsExportOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] gap-2 border-slate-200">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="ghost" onClick={downloadTemplate} className="h-12 px-4 font-black text-[10px] text-slate-500 hover:text-slate-900">
            Template
          </Button>
          <Button onClick={() => { setEditingMarketer(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white">
            <Plus className="w-4 h-4" /> Add Marketer
          </Button>
        </div>
      </SectionHeader>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by marketer name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:bg-slate-100/50 focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">
          {isLoading ? 'Loading...' : `${marketers.length.toLocaleString()} results`}
        </span>
      </div>

      {/* Import progress */}
      {importProgress && (
        <Card className="rounded-[32px] p-6 bg-primary/5 border-none">
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-xs font-black uppercase text-slate-600">
              Importing: {importProgress.current} / {importProgress.total} marketers
            </p>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b tracking-widest uppercase">
              <tr>
                <th className={isErpDensity ? "px-5 py-2.5" : "px-8 py-6"}>Marketer ID</th>
                <th className={isErpDensity ? "px-5 py-2.5" : "px-8 py-6"}>Standardized Marketer Name</th>
                <th className={isErpDensity ? "px-5 py-2.5 text-center" : "px-8 py-6 text-center"}>Product Count</th>
                <th className={isErpDensity ? "px-5 py-2.5 text-right" : "px-8 py-6 text-right"}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className={isErpDensity ? "px-5 py-2" : "px-8 py-5"}><div className="w-20 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className={isErpDensity ? "px-5 py-2" : "px-8 py-5"}><div className="w-48 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className={isErpDensity ? "px-5 py-2" : "px-8 py-5"}><div className="w-10 h-4 bg-slate-100 animate-pulse rounded-full mx-auto" /></td>
                    <td className={isErpDensity ? "px-5 py-2" : "px-8 py-5"}><div className="w-16 h-8 bg-slate-50 animate-pulse rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : marketers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No marketers found</p>
                  </td>
                </tr>
              ) : marketers.map(m => (
                <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className={isErpDensity ? "px-5 py-2" : "px-8 py-5"}>
                    <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {m['Marketer ID'] || '—'}
                    </span>
                  </td>
                  <td className={isErpDensity ? "px-5 py-2" : "px-8 py-5"}>
                    <div className="flex items-center gap-3">
                      {m.logoUrl || m.logo_url ? (
                        <img src={m.logoUrl || m.logo_url} alt="" className="w-8 h-8 rounded-full object-contain bg-slate-50 border p-0.5" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                          {m['Standardized Marketer Name']?.substring(0, 2).toUpperCase() || 'MK'}
                        </div>
                      )}
                      <span className={isErpDensity ? "font-bold text-xs text-gray-900" : "font-bold text-sm text-gray-900"}>
                        {m['Standardized Marketer Name']}
                      </span>
                    </div>
                  </td>
                  <td className={isErpDensity ? "px-5 py-2 text-center" : "px-8 py-5 text-center"}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {m['Product Count'] || '0'}
                      </span>
                      <button
                        onClick={() => handleViewProducts(m['Standardized Marketer Name'])}
                        className="text-[9px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider transition-all active:scale-95 shadow-2xs"
                      >
                        View Products 📦
                      </button>
                    </div>
                  </td>
                  <td className={isErpDensity ? "px-5 py-2 text-right" : "px-8 py-5 text-right"}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className={isErpDensity ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl"} onClick={() => { setEditingMarketer(m); setIsFormOpen(true); }}>
                        <Edit2 className={isErpDensity ? "w-3 h-3 text-gray-400" : "w-4 h-4 text-gray-400"} />
                      </Button>
                      <Button variant="ghost" size="icon" className={isErpDensity ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl"} onClick={async () => {
                        if (!confirm('Delete this marketer?')) return;
                        try {
                          const token = await user?.getIdToken();
                          await fetch(`/api/marketers/${m._id}`, { 
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          toast({ title: 'Marketer deleted' });
                          fetchMarketers(searchQuery);
                        } catch (err: any) {
                          toast({ variant: 'destructive', title: 'Delete failed', description: err.message });
                        }
                      }}>
                        <Trash2 className={isErpDensity ? "w-3 h-3 text-red-300" : "w-4 h-4 text-red-300"} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Linked Products Modal */}
      <Dialog open={Boolean(viewingMarketer)} onOpenChange={(open) => { if (!open) setViewingMarketer(null); }}>
        <DialogContent className="rounded-[36px] max-w-3xl border-none p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="bg-emerald-600 p-6 text-white space-y-1">
            <DialogTitle className="text-xl font-black text-white font-outfit uppercase tracking-tight">
              Products for {viewingMarketer}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/70 tracking-widest uppercase">
              Showing linked items in Product Master
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {isLoadingProducts ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Fetching linked products...
              </div>
            ) : marketerProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase">
                No products found linked to this marketer
              </div>
            ) : (
              <div className="space-y-2">
                {marketerProducts.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 hover:bg-slate-100/60 transition-all">
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 uppercase">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{p.sku} • {p.saltComposition || p.composition || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        (p.medicine_type || '').toLowerCase().includes('generic') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.medicine_type || 'Branded'}
                      </span>
                      <span className="text-xs font-black text-slate-800 font-mono">₹{p.mrp || p.price || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">
              {editingMarketer ? 'Edit Marketer' : 'Add Marketer'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Marketer Master collection
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <MarketerForm 
              initialData={editingMarketer} 
              onSuccess={() => { setIsFormOpen(false); fetchMarketers(searchQuery); }} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportFieldsDialog 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={MARKETER_FIELDS}
        title="Marketer Master"
        onExport={handleExport}
      />
    </div>
  );
}

function MarketerForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
  const [marketerId, setMarketerId] = useState(initialData?.['Marketer ID'] || '');
  const [name, setName] = useState(initialData?.['Standardized Marketer Name'] || '');
  const [productCount, setProductCount] = useState(initialData?.['Product Count'] || '0');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || initialData?.logo_url || '');
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await user?.getIdToken();
      const payload = {
        'Marketer ID': marketerId,
        'Standardized Marketer Name': name,
        'Product Count': productCount,
        'logoUrl': logoUrl,
        'logo_url': logoUrl,
      };
      const res = await fetch(
        initialData ? `/api/marketers/${initialData._id}` : '/api/marketers',
        {
          method: initialData ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) throw new Error('Save failed');
      toast({ title: initialData ? 'Marketer updated' : 'Marketer added' });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Marketer ID</Label>
        <Input 
          value={marketerId} 
          onChange={e => setMarketerId(e.target.value)} 
          placeholder="e.g. MKT00001"
          className="rounded-2xl h-12 bg-gray-50 border-none font-bold font-mono text-sm" 
        />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Standardized Marketer Name *</Label>
        <Input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          placeholder="e.g. Abbott Healthcare"
          className="rounded-2xl h-12 bg-gray-50 border-none font-bold text-sm" 
        />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Marketer Logo Image URL</Label>
        <Input 
          value={logoUrl} 
          onChange={e => setLogoUrl(e.target.value)} 
          placeholder="https://example.com/logo.png"
          className="rounded-2xl h-12 bg-gray-50 border-none font-bold text-sm" 
        />
        {logoUrl && (
          <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <img src={logoUrl} alt="Logo preview" className="w-10 h-10 object-contain rounded-lg border bg-white" />
            <span className="text-xs font-bold text-slate-600">Logo Preview</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product Count</Label>
        <Input 
          value={productCount} 
          onChange={e => setProductCount(e.target.value)} 
          placeholder="0"
          className="rounded-2xl h-12 bg-gray-50 border-none font-bold text-sm" 
        />
      </div>
      <Button type="submit" className="w-full h-14 rounded-full font-black bg-primary text-white mt-2">
        {initialData ? 'Update Marketer' : 'Add Marketer'}
      </Button>
    </form>
  );
}
