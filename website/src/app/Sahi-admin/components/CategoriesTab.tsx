"use client"

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { SectionHeader } from './SectionHeader';
import { ExportFieldsDialog } from './ExportFieldsDialog';
import { Switch } from '@/components/ui/switch';

const CATEGORY_FIELDS = ['category_id', 'category', 'sub_category', 'product_count', 'source_catalog', 'imageUrl', 'showOnHomepage'];

export function CategoriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();

  const fetchCategories = async (q: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/categories?q=${encodeURIComponent(q)}&limit=500`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Fetch categories failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchCategories(searchQuery), 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleExport = (selectedFields: string[]) => {
    const queryParams = new URLSearchParams({
      fields: selectedFields.join(',')
    });
    window.open(`/api/categories/bulk?${queryParams.toString()}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Category Master" subtitle="Manage therapeutic classification categories" onBack={onBack}>
        <div className="flex gap-3">
          <Button onClick={() => setIsExportOpen(true)} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] gap-2 border-slate-200">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button onClick={() => { setEditingCat(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white">
            <Plus className="w-4 h-4" /> Add category
          </Button>
        </div>
      </SectionHeader>

      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:bg-slate-100/50 focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          />
        </div>
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b tracking-widest uppercase">
              <tr>
                <th className="px-10 py-8">Image</th>
                <th className="px-10 py-8">Category ID</th>
                <th className="px-10 py-8">Category Name</th>
                <th className="px-10 py-8">Sub-Category</th>
                <th className="px-10 py-8">Product Count</th>
                <th className="px-10 py-8">Home</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8"><div className="w-10 h-10 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-20 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-32 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-24 h-4 bg-slate-50 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-12 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-8 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-sm">
                    No categories found
                  </td>
                </tr>
              ) : categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8">
                    {cat.imageUrl ? (
                      <div className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden bg-white shadow-sm flex items-center justify-center">
                        <img src={cat.imageUrl} alt={cat.category} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <span className="text-xs text-slate-300 font-bold">N/A</span>
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {cat.category_id}
                    </span>
                  </td>
                  <td className="px-10 py-8 font-black text-sm text-gray-900">{cat.category}</td>
                  <td className="px-10 py-8 font-medium text-xs text-gray-500">{cat.sub_category}</td>
                  <td className="px-10 py-8 font-bold text-gray-500">{cat.product_count || 0}</td>
                  <td className="px-10 py-8">
                    <Badge variant={cat.showOnHomepage ? 'default' : 'outline'} className={cat.showOnHomepage ? 'bg-[#25D366] text-white font-black text-[10px] uppercase' : 'font-black text-[10px] uppercase'}>
                      {cat.showOnHomepage ? 'Yes' : 'No'}
                    </Badge>
                  </td>
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
                            
                            toast({ title: "Category archived" });
                            fetchCategories(searchQuery);
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
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Category definition</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Identify therapeutic segments for storefront navigation
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <CategoryForm initialData={editingCat} onSuccess={() => { setIsFormOpen(false); fetchCategories(searchQuery); }} />
          </div>
        </DialogContent>
      </Dialog>

      <ExportFieldsDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fields={CATEGORY_FIELDS}
        title="Category Master"
        onExport={handleExport}
      />
    </div>
  );
}

function CategoryForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ 
    category_id: initialData?.category_id || '', 
    category: initialData?.category || '',
    sub_category: initialData?.sub_category || '',
    product_count: initialData?.product_count || '0',
    source_catalog: initialData?.source_catalog || 'OTC',
    imageUrl: initialData?.imageUrl || '',
    showOnHomepage: initialData?.showOnHomepage || false
  });
  const { user } = useUser();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = initialData?.id || initialData?._id || form.category_id;
      if (!docId) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Category ID is required" });
        return;
      }

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
      
      toast({ title: "Category synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Category ID *</Label>
        <Input value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required placeholder="e.g. CAT00001" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Category Name *</Label>
        <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required placeholder="e.g. Analgesics" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sub-Category</Label>
        <Input value={form.sub_category} onChange={e => setForm({...form, sub_category: e.target.value})} placeholder="e.g. NSAIDs (General Pain)" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Image URL</Label>
        <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product Count</Label>
          <Input value={form.product_count} onChange={e => setForm({...form, product_count: e.target.value})} placeholder="0" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
        </div>
        <div className="flex items-center gap-4 bg-gray-50 rounded-2xl h-12 px-4 justify-between mt-6">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Show on Homepage</Label>
          <Switch checked={form.showOnHomepage} onCheckedChange={v => setForm({...form, showOnHomepage: v})} />
        </div>
      </div>
      <Button type="submit" className="w-full h-14 rounded-full font-black bg-primary text-white mt-2">Save Category</Button>
    </form>
  );
}
