"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Share2,
  Download,
  Upload,
  X,
  Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
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
  useUser,
  useMemoFirebase, 
  useCollection,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';

export function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [molecules, setMolecules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchMolecules = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/molecules?q=${q}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMolecules(data);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMolecules(searchQuery);
  }, [searchQuery]);

  const downloadTemplate = () => {
    const headers = ['molecule', 'masterId', 'form'];
    const csv = headers.join(',') + '\n"Paracetamol","MM0001","Tablet"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'molecule_template.csv';
    a.click();
  };

  const handleExport = () => {
    window.open('/api/molecules/bulk', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const moleculesData = lines.slice(1).map((line, idx) => {
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
          obj[h] = values[i]?.replace(/^"|"$/g, '') || '';
        });
        return obj;
      });

      // Pre-validation
      const invalidRow = moleculesData.find((m, i) => !m.molecule || !m.form);
      if (invalidRow) {
        toast({ 
          variant: 'destructive', 
          title: "Invalid CSV Data", 
          description: `All rows must have 'molecule' and 'form'. Check your CSV file.` 
        });
        return;
      }

      try {
        const token = await user?.getIdToken();
        const res = await fetch('/api/molecules/bulk', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(moleculesData)
        });

        const result = await res.json();

        if (res.ok) {
          toast({ title: "Bulk import success", description: result.message || "Registry updated" });
          window.location.reload();
        } else {
          throw new Error(result.message || result.error || 'Import failed');
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} ingredients?`)) return;
    
    try {
      const token = await user?.getIdToken();
      for (const id of selectedIds) {
        await fetch(`/api/molecules/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await deleteDocumentNonBlocking(doc(db, 'moleculeMaster', id));
      }
      toast({ title: "Bulk deletion complete" });
      setSelectedIds([]);
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Partial failure", description: err.message });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === molecules?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(molecules?.map(m => m.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Ingredient Database" subtitle="Manage scientific names and salt data" onBack={onBack}>
        <div className="flex flex-wrap items-center gap-4">
           <div className="relative w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
              placeholder="Search Ingredients..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-full pl-12 h-12 bg-white border-2 border-slate-100 font-bold text-[10px] uppercase tracking-widest focus:border-primary transition-all"
             />
           </div>
           <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
           <Button onClick={downloadTemplate} variant="ghost" className="rounded-full h-12 px-6 font-black text-[10px] text-slate-400 hover:text-primary gap-2 uppercase tracking-widest transition-all">
             <Download className="w-3.5 h-3.5" /> Template
           </Button>
           <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2 text-primary border-primary/20 uppercase tracking-widest hover:bg-white transition-all">
             <Upload className="w-3.5 h-3.5" /> Bulk Import
           </Button>
           <Button onClick={handleExport} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2 uppercase tracking-widest hover:bg-white transition-all">
             <Download className="w-3.5 h-3.5" /> Export
           </Button>
           <div className="w-px h-8 bg-slate-200 mx-2" />
           <Button onClick={() => { setEditingMol(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New Ingredient</Button>
        </div>
      </SectionHeader>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-3xl flex justify-between items-center border border-red-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest pl-4">
            {selectedIds.length} ingredients selected for batch action
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-red-400 hover:text-red-600 font-black text-[9px] uppercase">Cancel</Button>
            <Button onClick={handleBulkDelete} variant="destructive" size="sm" className="rounded-full px-6 font-black text-[9px] uppercase bg-red-500">Delete Selected</Button>
          </div>
        </div>
      )}

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8 w-10">
                  <Checkbox checked={selectedIds.length === molecules?.length && molecules?.length > 0} onCheckedChange={toggleSelectAll} />
                </th>
                <th className="px-6 py-8">Ingredient Name</th>
                <th className="px-10 py-8">Master ID</th>
                <th className="px-10 py-8">Form</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : molecules.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">No ingredients found in MongoDB</td></tr>) : molecules.map(mol => (
                <tr key={mol.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedIds.includes(mol.id) && "bg-primary/5")}>
                  <td className="px-10 py-8">
                    <Checkbox checked={selectedIds.includes(mol.id)} onCheckedChange={() => toggleSelect(mol.id)} />
                  </td>
                  <td className="px-6 py-8 font-black text-sm text-gray-900 uppercase tracking-tight">{mol.molecule}</td>
                  <td className="px-10 py-8 font-bold text-primary">{mol.masterId}</td>
                  <td className="px-10 py-8 font-bold text-gray-400">{mol.form}</td>
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
                            
                            toast({ title: "Ingredient removed from database" });
                            fetchMolecules(searchQuery);
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: "Purge failed", description: err.message });
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
        <DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white">
            <DialogTitle className="text-2xl font-black">Ingredient Settings</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">
              Configure active ingredients and mappings
            </DialogDescription>
          </div>
          <div className="p-8">
            <MoleculeForm db={db} initialData={editingMol} onSuccess={() => { setIsFormOpen(false); fetchMolecules(searchQuery); }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function MoleculeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [form, setForm] = useState({ molecule: initialData?.molecule || '', masterId: initialData?.masterId || '', form: initialData?.form || '' });
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [isCustomForm, setIsCustomForm] = useState(false);
  const [isLoadingForms, setIsLoadingForms] = useState(true);

  useEffect(() => {
    setIsLoadingForms(true);
    fetch('/api/molecules/forms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableForms(data);
          if (initialData?.form && data.length > 0 && !data.includes(initialData.form)) {
            setIsCustomForm(true);
          }
        }
      })
      .catch(err => console.error("Forms fetch failed", err))
      .finally(() => setIsLoadingForms(false));
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: new Date() };

    try {
      const docId = initialData?.id || initialData?._id || `${form.molecule}-${form.form}`.toLowerCase().replace(/\s+/g, '-');
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
      
      toast({ title: "Ingredient updated" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black">Ingredient name</Label><Input value={form.molecule} onChange={e => setForm({...form, molecule: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Master id</Label><Input value={form.masterId} onChange={e => setForm({...form, masterId: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black">Scientific Form</Label>
          {!isCustomForm ? (
            <div className="flex gap-2">
              <Select 
                value={form.form || ""} 
                onValueChange={v => { 
                  if(v === '_custom') { 
                    setIsCustomForm(true); 
                  } else { 
                    setForm({...form, form: v}); 
                  } 
                }}
              >
                <SelectTrigger className="flex-1 rounded-2xl h-14 bg-gray-50 border-none font-bold">
                  <SelectValue placeholder={isLoadingForms ? "Loading forms..." : "Select scientific form"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl z-[120]">
                  {availableForms.map(f => (
                    <SelectItem key={f} value={f} className="font-bold">
                      {f}
                    </SelectItem>
                  ))}
                  <div className="border-t my-2" />
                  <SelectItem value="_custom" className="text-primary font-black">
                    + Create New Form...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="relative">
              <Input 
                value={form.form} 
                onChange={e => setForm({...form, form: e.target.value})} 
                placeholder="Enter custom form (e.g. Injection)" 
                className="rounded-2xl h-14 bg-gray-50 border-none font-bold pr-20" 
                autoFocus
              />
              <Button 
                type="button" 
                onClick={() => setIsCustomForm(false)} 
                variant="ghost" 
                className="absolute right-2 top-2 h-10 rounded-xl text-[10px] font-black text-primary hover:bg-primary/5"
              >
                Back to list
              </Button>
            </div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Save Ingredient</Button>
    </form>
  );
}
