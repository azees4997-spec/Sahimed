"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Upload, 
  X, 
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

export function MarketersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [marketers, setMarketers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMarketers = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/marketers?q=${q}&limit=500`);
      if (res.ok) {
        const data = await res.json();
        setMarketers(data);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMarketers(searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const downloadTemplate = () => {
    const headers = ['name'];
    const csv = headers.join(',') + '\n"Abbott Healthcare"\n"Cipla Ltd"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marketer_template.csv';
    a.click();
  };

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({
      fields: selectedFields.join(',')
    });
    window.open(`/api/marketers/bulk?${queryParams.toString()}`, '_blank');
  };

  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const csvLines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (csvLines.length < 2) return;
      
      const headers = csvLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const marketersData = csvLines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      }).filter(m => m.name);

      if (marketersData.length === 0) {
        toast({ variant: 'destructive', title: "Empty CSV", description: "No valid marketer rows found." });
        return;
      }

      setImportProgress({ current: 0, total: marketersData.length });

      try {
        const token = await user?.getIdToken();
        const CHUNK_SIZE = 100;
        let processed = 0;

        for (let i = 0; i < marketersData.length; i += CHUNK_SIZE) {
          const chunk = marketersData.slice(i, i + CHUNK_SIZE);
          await fetch('/api/marketers/bulk', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chunk)
          });
          processed += chunk.length;
          setImportProgress({ current: processed, total: marketersData.length });
        }

        setImportProgress(null);
        toast({ title: "Bulk import success", description: `Successfully processed ${marketersData.length} marketers.` });
        fetchMarketers(searchQuery);
      } catch (err: any) {
        setImportProgress(null);
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Marketer directory" subtitle="Manage manufacturers & marketers" onBack={onBack}>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".csv" 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full h-12 px-6 font-black text-[10px] gap-2 border-slate-200"
          >
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsExportOpen(true)}
            className="rounded-full h-12 px-6 font-black text-[10px] gap-2 border-slate-200"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button 
            variant="ghost" 
            onClick={downloadTemplate}
            className="h-12 px-4 font-black text-[10px] text-slate-500 hover:text-slate-900"
          >
            Template
          </Button>
          <Button 
            onClick={() => { setEditingMarketer(null); setIsFormOpen(true); }} 
            className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"
          >
            <Plus className="w-4 h-4" /> Add Marketer
          </Button>
        </div>
      </SectionHeader>

      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search marketers..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:bg-slate-100/50 focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          />
        </div>
      </div>

      {importProgress && (
        <Card className="rounded-[32px] p-6 bg-slate-50 border-none animate-pulse">
          <p className="text-xs font-black uppercase text-slate-500">Processing bulk upload: {importProgress.current} / {importProgress.total}</p>
        </Card>
      )}

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">Marketer Name</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8"><div className="w-48 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : marketers.map(m => (
                <tr key={m._id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm text-gray-900">{m.name}</td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMarketer(m); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => {
                        if(confirm("Delete marketer?")) {
                          try {
                            const token = await user?.getIdToken();
                            await fetch(`/api/marketers/${m._id}`, { 
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            toast({ title: "Marketer removed" });
                            fetchMarketers(searchQuery);
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
            <DialogTitle className="text-2xl font-black text-white">Marketer Definition</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase font-outfit">
              Create and edit manufacturing entities
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <MarketerForm initialData={editingMarketer} onSuccess={() => { setIsFormOpen(false); fetchMarketers(searchQuery); }} />
          </div>
        </DialogContent>
      </Dialog>

      <ExportFieldsDialog 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={['name']}
        title="Marketers"
        onExport={handleExport}
      />
    </div>
  );
}

function MarketerForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
  const [name, setName] = useState(initialData?.name || '');
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await user?.getIdToken();
      const res = await fetch(initialData ? `/api/marketers/${initialData._id}` : '/api/marketers', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Sync failed');
      toast({ title: "Marketer synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black">Marketer / Manufacturer name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Save Marketer</Button>
    </form>
  );
}
