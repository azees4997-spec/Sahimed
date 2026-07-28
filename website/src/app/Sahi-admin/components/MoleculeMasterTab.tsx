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
  Search,
  ShieldAlert
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, generateSlug } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription,
  DialogHeader
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
import { ExportFieldsDialog } from './ExportFieldsDialog';

export function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [molecules, setMolecules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchMolecules = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/molecules?q=${q}&limit=500`);
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
    const csv = headers.join(',') + '\n"Paracetamol 500mg","MM0001","Tablet"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'molecule_template.csv';
    a.click();
  };

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({
      fields: selectedFields.join(',')
    });
    window.open(`/api/molecules/bulk?${queryParams.toString()}`, '_blank');
  };

  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);
  const [failedList, setFailedList] = useState<{ molecule: string, reason: string }[]>([]);

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
      
      const moleculesData = filteredLines.slice(1).map((line, idx) => {
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
          
          // Header normalization
          const normalizedHeader = h.toLowerCase().trim();
          if (normalizedHeader === 'molecule' || normalizedHeader === 'ingredient name' || normalizedHeader === 'name') {
            obj['molecule'] = val;
          } else if (normalizedHeader === 'masterid' || normalizedHeader === 'master id' || normalizedHeader === 'id') {
            obj['masterId'] = val;
          } else if (normalizedHeader === 'form' || normalizedHeader === 'scientific form' || normalizedHeader === 'type') {
            obj['form'] = val;
          } else {
            obj[h] = val;
          }
        });

        return obj;
      }).filter(m => m && (m.molecule || m.masterId || m.form)); 

      if (moleculesData.length === 0) {
        toast({ variant: 'destructive', title: "Empty CSV", description: "No valid ingredient rows found." });
        return;
      }
      
      // Pre-validation
      const invalidRowIdx = moleculesData.findIndex((m) => !m.molecule || !m.form);
      if (invalidRowIdx !== -1) {
        const row = moleculesData[invalidRowIdx];
        toast({ 
          variant: 'destructive', 
          title: "Incomplete Data in CSV", 
          description: `Row ${invalidRowIdx + 2}: '${row.molecule || 'Unknown'}' is missing ${!row.molecule ? 'a Name' : ''}${!row.molecule && !row.form ? ' and ' : ''}${!row.form ? 'a Scientific Form' : ''}.` 
        });
        return;
      }

      setImportProgress({ current: 0, total: moleculesData.length });
      setFailedList([]);

      try {
        const token = await user?.getIdToken();
        const CHUNK_SIZE = 100;
        let processed = 0;
        const allErrors: any[] = [];

        for (let i = 0; i < moleculesData.length; i += CHUNK_SIZE) {
          const chunk = moleculesData.slice(i, i + CHUNK_SIZE);
          try {
            const res = await fetch('/api/molecules/bulk', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(chunk)
            });

            let result;
            const textResponse = await res.text();
            try {
              result = JSON.parse(textResponse);
            } catch (e) {
              result = { error: "Server Error", message: textResponse.slice(0, 100) };
            }

            if (!res.ok) {
              // Add all items in this chunk to failed list if the whole chunk failed
              allErrors.push(...chunk.map(m => ({ 
                molecule: m.molecule || 'Unknown', 
                reason: result.message || result.error || 'Server rejected chunk' 
              })));
            } else if (result.errors && Array.isArray(result.errors)) {
              allErrors.push(...result.errors);
            }
          } catch (chunkErr: any) {
            allErrors.push(...chunk.map(m => ({ 
              molecule: m.molecule || 'Unknown', 
              reason: chunkErr.message || 'Connection lost during chunk' 
            })));
          }

          processed += chunk.length;
          setImportProgress({ current: processed, total: moleculesData.length });
        }

        setFailedList(allErrors);
        setImportProgress(null);

        if (allErrors.length > 0) {
          toast({ 
            variant: 'destructive',
            title: "Import completed with issues", 
            description: `${moleculesData.length - allErrors.length} succeeded, ${allErrors.length} failed. See the red rejection panel for details.` 
          });
        } else {
          toast({ title: "Bulk import success", description: `Successfully processed ${moleculesData.length} ingredients.` });
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
        setImportProgress(null);
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
    <div className="space-y-8 animate-in slide-in-from-bottom-2 relative">
      {importProgress && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <Card className="w-[450px] p-10 rounded-[48px] border-none shadow-3xl bg-white text-center space-y-8">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border-8 border-slate-100" />
               <div className="text-2xl font-black text-primary">
                  {importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
               </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Uploading Ingredients</h3>
              <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.2em] mt-3 bg-slate-50 py-2 rounded-full px-4 inline-block">
                {importProgress.current} / {importProgress.total} PROCESSED
              </p>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 shadow-lg" 
                style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[12px] font-bold text-slate-500 italic animate-pulse">Syncing with database...</p>
          </Card>
        </div>
      )}

      {failedList.length > 0 && (
        <div className="fixed bottom-10 right-10 z-[150] w-[350px] animate-in slide-in-from-right-10 duration-500">
           <Card className="rounded-[32px] shadow-3xl border-none overflow-hidden bg-red-600 text-white">
              <div className="p-6 bg-red-700/50 flex items-center justify-between">
                 <h4 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Import Rejections
                 </h4>
                 <Button variant="ghost" size="icon" onClick={() => setFailedList([])} className="h-8 w-8 text-white hover:bg-white/10"><X className="w-4 h-4" /></Button>
              </div>
              <ScrollArea className="h-64 p-6 pt-0">
                 <div className="space-y-4 pt-4">
                    {failedList.map((err, i) => (
                       <div key={i} className="space-y-1 pb-4 border-b border-white/20 last:border-none">
                          <p className="font-black text-[12px] uppercase truncate">{err.molecule || err.item || 'Unknown Ingredient'}</p>
                          <p className="text-[11px] font-medium text-white/80 leading-relaxed">{err.reason}</p>
                       </div>
                    ))}
                 </div>
              </ScrollArea>
           </Card>
        </div>
      )}
      <SectionHeader title="Ingredient Database" subtitle="Manage scientific names and salt data" onBack={onBack}>
        <div className="flex flex-wrap items-center gap-4">
           <div className="relative w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <Input 
              placeholder="Search Ingredients..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-full pl-12 h-12 bg-white border-2 border-slate-200 font-bold text-[12px] uppercase tracking-widest focus:border-primary transition-all placeholder:text-slate-500"
             />
           </div>
           <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
            <Button onClick={downloadTemplate} variant="ghost" className="rounded-full h-12 px-6 font-black text-[12px] text-slate-500 hover:text-primary gap-2 uppercase tracking-widest transition-all">
             <Download className="w-3.5 h-3.5" /> Template
           </Button>
           <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-12 px-6 font-black text-[12px] border-2 gap-2 text-primary border-primary/20 uppercase tracking-widest hover:bg-white transition-all">
             <Upload className="w-3.5 h-3.5" /> Bulk Import
           </Button>
            <Button onClick={() => setIsExportOpen(true)} variant="outline" className="rounded-full h-12 px-6 font-black text-[12px] border-2 gap-2 uppercase tracking-widest hover:bg-white transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
           <div className="w-px h-8 bg-slate-200 mx-2" />
           <Button onClick={() => { setEditingMol(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[12px] bg-primary text-white"><Plus className="w-4 h-4" /> New Ingredient</Button>
        </div>
      </SectionHeader>

      {failedList.length > 0 && (
        <Card className="rounded-[40px] border-2 border-red-200 bg-red-50/50 overflow-hidden animate-in slide-in-from-top-4">
          <div className="bg-red-600 p-6 text-white flex justify-between items-center">
            <div>
              <h3 className="text-base font-black uppercase tracking-widest">Import Exception Report</h3>
              <p className="text-[12px] font-medium opacity-90 mt-1">The following {failedList.length} items could not be processed</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFailedList([])} className="text-white hover:bg-white/10 rounded-full font-black text-[11px] uppercase">Dismiss</Button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-red-50 text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-100">
                <tr>
                  <th className="px-10 py-4">Molecule</th>
                  <th className="px-10 py-4">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {failedList.map((fail, idx) => (
                  <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-10 py-4 font-black text-[11px] text-red-900 uppercase">{fail.molecule}</td>
                    <td className="px-10 py-4 text-[11px] font-medium text-red-700">{fail.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-white/50 border-t border-red-100">
             <p className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Tip: Check for duplicates or missing Master IDs in your CSV file.</p>
          </div>
        </Card>
      )}

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-3xl flex justify-between items-center border border-red-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-[11px] font-black text-red-600 uppercase tracking-widest pl-4">
            {selectedIds.length} ingredients selected for batch action
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-red-400 hover:text-red-600 font-black text-[11px] uppercase">Cancel</Button>
            <Button onClick={handleBulkDelete} variant="destructive" size="sm" className="rounded-full px-6 font-black text-[11px] uppercase bg-red-500">Delete Selected</Button>
          </div>
        </div>
      )}

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[12px] font-black text-gray-900 border-b uppercase tracking-tight">
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
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8" colSpan={2}>
                       <div className="flex flex-col space-y-2">
                          <div className="w-48 h-4 bg-slate-100 animate-pulse rounded-full" />
                          <div className="w-32 h-2 bg-slate-50 animate-pulse rounded-full" />
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="w-20 h-4 bg-slate-100 animate-pulse rounded-full" />
                    </td>
                    <td className="px-10 py-8">
                       <div className="w-16 h-4 bg-slate-100 animate-pulse rounded-full" />
                    </td>
                    <td className="px-10 py-8 text-right">
                       <div className="flex justify-end gap-2">
                          <div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg" />
                       </div>
                    </td>
                  </tr>
                ))
              ) : (!molecules || molecules.length === 0) ? (<tr><td colSpan={5} className="p-20 text-center text-slate-500 font-black text-[12px] uppercase tracking-[0.2em]">No ingredients found in MongoDB</td></tr>) : molecules.map(mol => (
                <tr key={mol.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedIds.includes(mol.id) && "bg-primary/5")}>
                  <td className="px-10 py-8">
                    <Checkbox checked={selectedIds.includes(mol.id)} onCheckedChange={() => toggleSelect(mol.id)} />
                  </td>
                  <td className="px-6 py-8 font-black text-base text-gray-900 uppercase tracking-tight">{mol.molecule}</td>
                  <td className="px-10 py-8 font-black text-primary">{mol.masterId}</td>
                  <td className="px-10 py-8 font-bold text-gray-600">{mol.form}</td>
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
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Ingredient Settings</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Configure active ingredients and mappings
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <MoleculeForm db={db} initialData={editingMol} onSuccess={() => { setIsFormOpen(false); fetchMolecules(searchQuery); }} />
          </div>
        </DialogContent>
      </Dialog>
      <ExportFieldsDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={['molecule', 'masterId', 'form']}
        title="Molecules"
        onExport={handleExport}
      />
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
      const docId = initialData?.id || initialData?._id || generateSlug(`${form.molecule}-${form.form}`);
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
