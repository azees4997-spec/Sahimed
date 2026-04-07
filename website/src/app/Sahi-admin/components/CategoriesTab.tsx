"use client"

import { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2 
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
import { useToast } from '@/hooks/use-toast';
import { 
  useUser,
  useMemoFirebase, 
  useCollection,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';

export function CategoriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const catsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db, isVerified]);
  const { data: categories, isLoading } = useCollection(catsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Category architecture" subtitle="Manage therapeutic classification" onBack={onBack}><Button onClick={() => { setEditingCat(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> Add category</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Category Name</th><th className="px-10 py-8">Image URL</th><th className="px-10 py-8">Display Order</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : categories?.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm text-gray-900">{cat.name}</td>
                  <td className="px-10 py-8 font-medium text-xs text-gray-400 truncate max-w-[200px]">{cat.imageUrl || 'No image'}</td>
                  <td className="px-10 py-8 font-bold text-gray-400">{cat.order || 0}</td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { 
                        if(confirm("Delete category?")) {
                          try {
                            const token = await user?.getIdToken();
                            const res = await fetch(`/api/categories/${cat.id || cat._id}`, { 
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            
                            if (!res.ok) throw new Error('Failed to delete from MongoDB');
                            
                            await deleteDocumentNonBlocking(doc(db, 'categories', cat.id)); 
                            toast({ title: "Category archived" });
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: "Archive failed", description: err.message });
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
            <DialogTitle className="text-2xl font-black">Category definition</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">
              Identify therapeutic segments for storefront navigation
            </DialogDescription>
          </div>
          <div className="p-8">
            <CategoryForm db={db} initialData={editingCat} onSuccess={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ 
    name: initialData?.name || '', 
    imageUrl: initialData?.imageUrl || '',
    order: initialData?.order || 0 
  });
  const { user } = useUser();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const docId = initialData?.id || initialData?._id || form.name.toLowerCase().replace(/\s+/g, '-');
      const token = await user?.getIdToken();

      const res = await fetch(initialData ? `/api/categories/${docId}` : '/api/categories', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, id: docId })
      });

      if (!res.ok) throw new Error('Failed to sync with MongoDB');

      // 2. Sync to Firestore
      const firestorePayload = { ...form, updatedAt: serverTimestamp() };
      if (initialData?.id) {
        await updateDocumentNonBlocking(doc(db, 'categories', initialData.id), firestorePayload);
      } else {
        await addDocumentNonBlocking(collection(db, 'categories'), { ...firestorePayload, createdAt: serverTimestamp() });
      }
      
      toast({ title: "Category synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black">Category name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Image URL</Label><Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Display order</Label><Input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Save class entry</Button>
    </form>
  );
}
