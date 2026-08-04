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

const MOLECULE_FIELDS = ['Molecule Code', 'Composition', 'Product Form'];

export function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [molecules, setMolecules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMolecules = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/molecules?q=${encodeURIComponent(q)}&limit=500`);
      if (res.ok) {
        const data = await res.json();
        setMolecules(data);
      }
    } catch (err) {
      console.error("Fetch molecules failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchMolecules(searchQuery), 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const downloadTemplate = () => {
    const csv = `Molecule Code,Composition,Product Form\nMOL000001,PARACETAMOL,Tablet\nMOL000002,ANTI-PSORIATIC (NA),Liquid`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'molecule_master_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({
      fields: selectedFields.join(',')
    });
    window.open(`/api/molecules/bulk?${queryParams.toString()}`, '_blank');
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
      const moleculesData = csvLines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      }).filter(m => m.Composition && m['Molecule Code']);

      if (moleculesData.length === 0) {
        toast({ variant: 'destructive', title: "Import failed", description: "Ensure CSV contains 'Molecule Code' and 'Composition' columns." });
        return;
      }

      setImportProgress({ current: 0, total: moleculesData.length });

      try {
        const token = await user?.getIdToken();
        const CHUNK = 100;
        let processed = 0;

        for (let i = 0; i < moleculesData.length; i += CHUNK) {
          const chunk = moleculesData.slice(i, i + CHUNK);
          const res = await fetch('/api/molecules/bulk', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chunk)
          });
          if (!res.ok) throw new Error('Bulk import failed');
          processed += chunk.length;
          setImportProgress({ current: processed, total: moleculesData.length });
        }

        setImportProgress(null);
        toast({ title: "Import complete", description: `${moleculesData.length} ingredients imported.` });
        fetchMolecules(searchQuery);
      } catch (err: any) {
        setImportProgress(null);
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Molecule Master" subtitle={`${molecules.length.toLocaleString()} ingredients • Molecule Master collection`} onBack={onBack}>
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
          <Button onClick={() => { setEditingMol(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white">
            <Plus className="w-4 h-4" /> Add Molecule
          </Button>
        </div>
      </SectionHeader>

      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search ingredients..." 
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
            <p className="text-xs font-black uppercase text-slate-600">Importing: {importProgress.current} / {importProgress.total} molecules</p>
          </div>
        </Card>
      )}

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b tracking-widest uppercase">
              <tr>
                <th className="px-10 py-8">Molecule Code</th>
                <th className="px-10 py-8">Composition / Molecule Name</th>
                <th className="px-10 py-8">Product Form</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8"><div className="w-24 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-48 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-20 h-4 bg-slate-50 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : molecules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-sm">
                    No molecules found
                  </td>
                </tr>
              ) : molecules.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8">
                    <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {mol['Molecule Code']}
                    </span>
                  </td>
                  <td className="px-10 py-8 font-black text-sm text-gray-900 uppercase">{mol.Composition}</td>
                  <td className="px-10 py-8 font-bold text-gray-500">{mol['Product Form']}</td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMol(mol); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { 
                        if(confirm("Delete molecule?")) {
                          try {
                            const token = await user?.getIdToken();
                            const res = await fetch(`/api/molecules/${mol.id || mol._id}`, { 
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            
                            if (!res.ok) throw new Error('Failed to delete from MongoDB');
                            
                            toast({ title: "Molecule removed" });
                            fetchMolecules(searchQuery);
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
            <DialogTitle className="text-2xl font-black text-white">Molecule Definition</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Configure molecule ingredients and forms
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <MoleculeForm initialData={editingMol} onSuccess={() => { setIsFormOpen(false); fetchMolecules(searchQuery); }} />
          </div>
        </DialogContent>
      </Dialog>

      <ExportFieldsDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={MOLECULE_FIELDS}
        title="Molecule Master"
        onExport={handleExport}
      />
    </div>
  );
}

function MoleculeForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ 
    'Molecule Code': initialData?.['Molecule Code'] || '', 
    Composition: initialData?.Composition || '',
    'Product Form': initialData?.['Product Form'] || ''
  });
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = initialData?.id || initialData?._id || form['Molecule Code'];
      if (!docId) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Molecule Code is required" });
        return;
      }

      const token = await user?.getIdToken();
      const res = await fetch(initialData ? `/api/molecules/${docId}` : '/api/molecules', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, id: docId })
      });

      if (!res.ok) throw new Error('Failed to sync with MongoDB');
      
      toast({ title: "Molecule synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Molecule Code *</Label>
        <Input value={form['Molecule Code']} onChange={e => setForm({...form, 'Molecule Code': e.target.value})} required placeholder="e.g. MOL000001" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Composition Name *</Label>
        <Input value={form.Composition} onChange={e => setForm({...form, Composition: e.target.value})} required placeholder="e.g. PARACETAMOL" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product Form</Label>
        <Input value={form['Product Form']} onChange={e => setForm({...form, 'Product Form': e.target.value})} placeholder="e.g. Tablet / Liquid / Injection" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <Button type="submit" className="w-full h-14 rounded-full font-black bg-primary text-white mt-2">Save Molecule</Button>
    </form>
  );
}
