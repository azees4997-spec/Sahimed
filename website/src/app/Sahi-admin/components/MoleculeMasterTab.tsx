"use client"

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Share2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';

export function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const molsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: molecules, isLoading } = useCollection(molsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Ingredient Database" subtitle="Manage scientific names and salt data" onBack={onBack}><Button onClick={() => { setEditingMol(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New Ingredient</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Ingredient Name</th><th className="px-10 py-8">Master ID</th><th className="px-10 py-8">Form</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : molecules?.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm text-gray-900 uppercase tracking-tight">{mol.molecule}</td>
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
                            
                            await deleteDocumentNonBlocking(doc(db, 'moleculeMaster', mol.id)); 
                            toast({ title: "Ingredient removed from database" });
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
            <MoleculeForm db={db} initialData={editingMol} onSuccess={() => setIsFormOpen(false)} />
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

      // 2. Sync to Firestore
      if (initialData?.id) {
        await updateDocumentNonBlocking(doc(db, 'moleculeMaster', initialData.id), { ...payload, updatedAt: serverTimestamp() });
      } else {
        await addDocumentNonBlocking(collection(db, 'moleculeMaster'), { ...payload, createdAt: serverTimestamp() });
      }
      
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
