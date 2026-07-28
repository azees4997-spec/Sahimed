"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

const SUPPLIER_FIELDS = [
  'supplier_code',
  'supplier_name',
  'compliance_details.gstin',
  'compliance_details.drug_license_number',
  'financials.credit_days',
  'financials.is_active'
];

export function SuppliersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSuppliers = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/suppliers?q=${encodeURIComponent(q)}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error("Fetch suppliers failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchSuppliers(searchQuery), 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const downloadTemplate = () => {
    const csv = `supplier_code,supplier_name,compliance_details.gstin,compliance_details.drug_license_number,financials.credit_days,financials.is_active\nSUP-001,Med Town Pharma,29BYSPA3764J1ZV,"KA-B51-286602, KA-B51-286603",7,true`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier_master_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({
      fields: selectedFields.join(',')
    });
    window.open(`/api/suppliers/bulk?${queryParams.toString()}`, '_blank');
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
        toast({ variant: 'destructive', title: "Empty CSV", description: "No data rows found." });
        return;
      }
      
      const headers = csvLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const supplierData = csvLines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      }).filter(s => s.supplier_name && s.supplier_code);

      if (supplierData.length === 0) {
        toast({ variant: 'destructive', title: "Import failed", description: "Ensure CSV contains 'supplier_code' and 'supplier_name'." });
        return;
      }

      setImportProgress({ current: 0, total: supplierData.length });

      try {
        const token = await user?.getIdToken();
        const CHUNK = 100;
        let processed = 0;

        for (let i = 0; i < supplierData.length; i += CHUNK) {
          const chunk = supplierData.slice(i, i + CHUNK);
          const res = await fetch('/api/suppliers/bulk', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chunk)
          });
          if (!res.ok) throw new Error('Bulk import failed');
          processed += chunk.length;
          setImportProgress({ current: processed, total: supplierData.length });
        }

        setImportProgress(null);
        toast({ title: "Import complete", description: `${supplierData.length} suppliers imported.` });
        fetchSuppliers(searchQuery);
      } catch (err: any) {
        setImportProgress(null);
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Supplier Master" subtitle={`${suppliers.length.toLocaleString()} suppliers • Supplier Master collection`} onBack={onBack}>
        <div className="flex gap-3 flex-wrap">
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
          <Button onClick={() => { setEditingSupplier(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white">
            <Plus className="w-4 h-4" /> Add Supplier
          </Button>
        </div>
      </SectionHeader>

      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:bg-slate-100/50 focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          />
        </div>
      </div>

      {importProgress && (
        <Card className="rounded-[32px] p-6 bg-primary/5 border-none">
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-xs font-black uppercase text-slate-600">Importing: {importProgress.current} / {importProgress.total} suppliers</p>
          </div>
        </Card>
      )}

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b tracking-widest uppercase">
              <tr>
                <th className="px-10 py-8">Supplier Code</th>
                <th className="px-10 py-8">Supplier Name</th>
                <th className="px-10 py-8">GSTIN</th>
                <th className="px-10 py-8">Credit Days</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8"><div className="w-20 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-32 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-24 h-4 bg-slate-50 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-12 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-16 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-sm">
                    No suppliers found
                  </td>
                </tr>
              ) : suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8">
                    <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {s.supplier_code}
                    </span>
                  </td>
                  <td className="px-10 py-8 font-black text-sm text-gray-900">{s.supplier_name}</td>
                  <td className="px-10 py-8 font-mono text-xs text-gray-500">{s.compliance_details?.gstin || '—'}</td>
                  <td className="px-10 py-8 font-bold text-gray-600">{s.financials?.credit_days || 0} Days</td>
                  <td className="px-10 py-8">
                    {s.financials?.is_active !== false ? (
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase"><CheckCircle className="w-4 h-4" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-black text-rose-500 uppercase"><XCircle className="w-4 h-4" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingSupplier(s); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { 
                        if(confirm("Delete supplier?")) {
                          try {
                            const token = await user?.getIdToken();
                            const res = await fetch(`/api/suppliers/${s.id || s._id}`, { 
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            
                            if (!res.ok) throw new Error('Failed to delete from MongoDB');
                            
                            toast({ title: "Supplier removed" });
                            fetchSuppliers(searchQuery);
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: "Delete failed", description: err.message });
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
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Supplier Configuration</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Configure supplier profile and compliance parameters
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <SupplierForm initialData={editingSupplier} onSuccess={() => { setIsFormOpen(false); fetchSuppliers(searchQuery); }} />
          </div>
        </DialogContent>
      </Dialog>

      <ExportFieldsDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={SUPPLIER_FIELDS}
        title="Supplier Master"
        onExport={handleExport}
      />
    </div>
  );
}

function SupplierForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ 
    supplier_code: initialData?.supplier_code || '', 
    supplier_name: initialData?.supplier_name || '',
    'compliance_details.gstin': initialData?.compliance_details?.gstin || '',
    'compliance_details.drug_license_number': initialData?.compliance_details?.drug_license_number || '',
    'financials.credit_days': initialData?.financials?.credit_days || 0,
    'financials.is_active': initialData?.financials?.is_active ?? true
  });
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = initialData?.id || initialData?._id || form.supplier_code;
      if (!docId) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Supplier Code is required" });
        return;
      }

      const payload = {
        supplier_code: form.supplier_code,
        supplier_name: form.supplier_name,
        compliance_details: {
          gstin: form['compliance_details.gstin'],
          drug_license_number: form['compliance_details.drug_license_number']
        },
        financials: {
          credit_days: Number(form['financials.credit_days']),
          is_active: form['financials.is_active']
        }
      };

      const token = await user?.getIdToken();
      const res = await fetch(initialData ? `/api/suppliers/${docId}` : '/api/suppliers', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...payload, id: docId })
      });

      if (!res.ok) throw new Error('Failed to sync with MongoDB');
      
      toast({ title: "Supplier synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-500">Supplier Code *</Label>
          <Input value={form.supplier_code} onChange={e => setForm({...form, supplier_code: e.target.value})} required placeholder="e.g. SUP-001" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-500">Supplier Name *</Label>
          <Input value={form.supplier_name} onChange={e => setForm({...form, supplier_name: e.target.value})} required placeholder="e.g. Med Town" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] font-black uppercase text-slate-500">GSTIN</Label>
        <Input value={form['compliance_details.gstin']} onChange={e => setForm({...form, 'compliance_details.gstin': e.target.value})} placeholder="e.g. 29BYSPA3764J1ZV" className="rounded-2xl h-12 bg-gray-50 border-none font-bold font-mono uppercase" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] font-black uppercase text-slate-500">Drug License Numbers</Label>
        <Input value={form['compliance_details.drug_license_number']} onChange={e => setForm({...form, 'compliance_details.drug_license_number': e.target.value})} placeholder="e.g. KA-B51-286602, KA-B51-286603" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-500">Credit Days</Label>
          <Input type="number" value={form['financials.credit_days']} onChange={e => setForm({...form, 'financials.credit_days': Number(e.target.value)})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox id="is-active" checked={form['financials.is_active']} onCheckedChange={c => setForm({...form, 'financials.is_active': !!c})} />
          <Label htmlFor="is-active" className="text-[10px] font-black uppercase text-emerald-600">Active Supplier</Label>
        </div>
      </div>
      <Button type="submit" className="w-full h-14 rounded-full font-black bg-primary text-white mt-4">Save Supplier</Button>
    </form>
  );
}
