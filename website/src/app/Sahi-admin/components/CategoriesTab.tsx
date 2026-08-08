"use client"

import { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2,
  Download,
  Upload,
  Search,
  Layers,
  ListFilter,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
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
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const handleViewCategoryProducts = async (catName: string) => {
    setViewingCategory(catName);
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(catName)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setCategoryProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

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

  // ─── Group Sub-Categories by Main Category Name ────────────────────────────
  const groupedCategories = useMemo(() => {
    const map: Record<string, {
      categoryName: string;
      imageUrl: string;
      showOnHomepage: boolean;
      totalProductCount: number;
      items: any[];
    }> = {};

    categories.forEach(cat => {
      const name = cat.category || 'Uncategorized';
      if (!map[name]) {
        map[name] = {
          categoryName: name,
          imageUrl: cat.imageUrl || '',
          showOnHomepage: cat.showOnHomepage === true,
          totalProductCount: 0,
          items: []
        };
      }
      map[name].items.push(cat);
      map[name].totalProductCount += parseInt(cat.product_count || '0', 10);
      if (cat.imageUrl && !map[name].imageUrl) {
        map[name].imageUrl = cat.imageUrl;
      }
      if (cat.showOnHomepage) {
        map[name].showOnHomepage = true;
      }
    });

    return Object.values(map).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [categories]);

  const toggleGroupExpand = (catName: string) => {
    setExpandedGroups(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

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

      {/* Filter and View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search categories or sub-categories (e.g. Neurology, Anticonvulsants)..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:bg-slate-100/50 focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'grouped'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Grouped by Main Category ({groupedCategories.length})
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'all'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            All Sub-Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: GROUPED BY MAIN CATEGORY */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-6 rounded-[28px] border-none shadow-sm bg-white animate-pulse h-24" />
            ))
          ) : groupedCategories.length === 0 ? (
            <Card className="p-12 rounded-[32px] border-none text-center bg-white text-slate-400 font-bold uppercase tracking-wider text-sm">
              No main categories found
            </Card>
          ) : (
            groupedCategories.map((group) => {
              const isExpanded = expandedGroups[group.categoryName];

              return (
                <Card key={group.categoryName} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white transition-all">
                  <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
                        {group.imageUrl ? (
                          <img src={group.imageUrl} alt={group.categoryName} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900">{group.categoryName}</h3>
                          <Badge variant={group.showOnHomepage ? 'default' : 'outline'} className={group.showOnHomepage ? 'bg-[#25D366] text-white font-black text-[9px] uppercase' : 'font-black text-[9px] uppercase'}>
                            {group.showOnHomepage ? 'Home Featured' : 'Hidden'}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          {group.items.length} Sub-Categories · {group.totalProductCount.toLocaleString()} Total Products
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <Button
                        onClick={() => handleViewCategoryProducts(group.categoryName)}
                        variant="outline"
                        className="rounded-xl h-10 px-4 font-black text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      >
                        View Products 📦
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingCat(group.items[0]);
                          setIsFormOpen(true);
                        }}
                        className="rounded-xl h-10 px-4 font-black text-xs bg-primary text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Category & Image
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleGroupExpand(group.categoryName)}
                        className="rounded-xl h-10 w-10 text-slate-500"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Sub-categories Drawer */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-6 bg-white space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Sub-categories under {group.categoryName}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {group.items.map((subCat) => (
                          <div key={subCat.id || subCat._id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{subCat.sub_category || 'General'}</p>
                              <p className="text-[10px] font-semibold text-slate-400">{subCat.product_count || 0} products · {subCat.category_id}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewCategoryProducts(subCat.sub_category || group.categoryName)}
                                className="text-[9px] font-black text-emerald-700 hover:bg-emerald-50 h-8 px-2 rounded-lg uppercase"
                              >
                                View 📦
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingCat(subCat);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: FLAT ALL SUB-CATEGORIES TABLE */}
      {viewMode === 'all' && (
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
                    <td colSpan={7} className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-sm">
                      No categories found
                    </td>
                  </tr>
                ) : categories.map(cat => (
                  <tr key={cat.id || cat._id} className="hover:bg-gray-50/50">
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
      )}
      
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

      {/* Linked Products Modal */}
      <Dialog open={Boolean(viewingCategory)} onOpenChange={(open) => { if (!open) setViewingCategory(null); }}>
        <DialogContent className="rounded-[36px] max-w-3xl border-none p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="bg-emerald-600 p-6 text-white space-y-1">
            <DialogTitle className="text-xl font-black text-white font-outfit uppercase tracking-tight">
              Products under {viewingCategory}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/70 tracking-widest uppercase">
              Showing linked medicines in Product Master
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {isLoadingProducts ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Fetching category products...
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase">
                No products found linked to this category
              </div>
            ) : (
              <div className="space-y-2">
                {categoryProducts.map((p) => (
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
    showOnHomepage: initialData?.showOnHomepage || false,
    applyToAllSubcategories: true
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
      const resData = await res.json();

      if (resData.appliedToAll) {
        toast({ title: "Category synchronized", description: `Updated Image & Homepage settings for all sub-categories of ${form.category}` });
      } else {
        toast({ title: "Category synchronized" });
      }
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
        <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://... or /images/cat_neuro.jpg" className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
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

      {/* Bulk Apply Switch */}
      <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4 justify-between">
        <div>
          <p className="text-xs font-black text-primary">Apply to all sub-categories of {form.category || 'this category'}?</p>
          <p className="text-[10px] font-medium text-slate-500">Updates Image URL & Homepage toggle across all sub-categories at once.</p>
        </div>
        <Switch checked={form.applyToAllSubcategories} onCheckedChange={v => setForm({...form, applyToAllSubcategories: v})} />
      </div>

      <Button type="submit" className="w-full h-14 rounded-full font-black bg-primary text-white mt-2">Save Category</Button>
    </form>
  );
}
