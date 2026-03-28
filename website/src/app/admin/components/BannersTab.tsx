"use client"

import { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  ImageIcon 
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
  useMemoFirebase, 
  useCollection,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';

export function BannersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const bannersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'banners'), orderBy('order', 'asc')) : null, [db, isVerified]);
  const { data: banners, isLoading } = useCollection(bannersQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Storefront banners" subtitle="Manage carousel promotions" onBack={onBack}>
        <Button onClick={() => { setEditingBanner(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> Add banner</Button>
      </SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : banners?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-none shadow-sm">
            <ImageIcon className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400">No custom banners found. Using fallbacks.</p>
          </div>
        ) : banners?.map(banner => (
          <Card key={banner.id} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white group">
            <div className="aspect-[24/9] relative bg-gray-50">
              {banner.imageUrl && <img src={banner.imageUrl} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => { setEditingBanner(banner); setIsFormOpen(true); }} className="rounded-full"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => { if(confirm("Delete banner?")) deleteDocumentNonBlocking(doc(db, 'banners', banner.id)); }} className="rounded-full"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("text-[8px] font-black uppercase tracking-widest", banner.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>{banner.isActive ? 'Active' : 'Inactive'}</Badge>
                <span className="text-[10px] font-black text-gray-300">Order: {banner.order}</span>
              </div>
              <h3 className="font-black text-xs truncate text-gray-900 tracking-tight">{banner.title || 'No title'}</h3>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white">
            <DialogTitle className="text-2xl font-black">Banner configuration</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">
              Sync visual promotions and storefront carousel order
            </DialogDescription>
          </div>
          <div className="p-8"><BannerForm db={db} initialData={editingBanner} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: initialData?.title || 'Upto 81% discount',
    subtitle: initialData?.subtitle || 'On all medicines & health products',
    hindiTagline: initialData?.hindiTagline || 'सही दवा, सही दाम',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true,
    order: initialData?.order || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: new Date() };

    try {
      // 1. Sync to MongoDB
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/banners/${initialData.id || initialData._id}` : '/api/banners';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 2. Sync to Firestore
      if (initialData?.id) {
        updateDocumentNonBlocking(doc(db, 'banners', initialData.id), { ...payload, updatedAt: serverTimestamp() });
      } else {
        addDocumentNonBlocking(collection(db, 'banners'), { ...payload, createdAt: serverTimestamp() });
      }
      
      toast({ title: "Banner synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Main title (Left)</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" placeholder="e.g. Upto 81% discount" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Subtitle (Left)</Label><Input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" placeholder="On all medicines..." /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Hindi tagline (Bottom)</Label><Input value={form.hindiTagline} onChange={e => setForm({...form, hindiTagline: e.target.value})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" placeholder="सही दवा, सही दाम" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Display order</Label><Input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" /></div>
      </div>
      <Button type="submit" className="w-full h-20 rounded-full font-black tracking-[0.2em] bg-primary text-white shadow-2xl active:scale-[0.98] transition-all">
        {initialData?.id ? 'Commit updates' : 'Sync visual promotion'}
      </Button>
    </form>
  );
}
