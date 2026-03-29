"use client"

import { useState, useMemo } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  ImageIcon,
  Maximize2,
  AlertCircle,
  ArrowUp
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

  // Auto-calculate next order
  const nextOrder = useMemo(() => {
    if (!banners || banners.length === 0) return 0;
    return Math.max(...banners.map(b => b.order || 0)) + 1;
  }, [banners]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Visual Storefront" subtitle="Carousel & Promotional Control" onBack={onBack}>
        <Button 
          onClick={() => { setEditingBanner(null); setIsFormOpen(true); }} 
          className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95"
        >
          <Plus className="w-5 h-5 mr-3" /> Insert Promotion
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[48px]" />)
        ) : banners?.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[64px] border-none shadow-2xl shadow-slate-100 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-slate-100" />
            </div>
            <div className="space-y-2">
              <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-600">No active promotions</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global fallbacks currently operational</p>
            </div>
          </div>
        ) : banners?.map(banner => (
          <Card key={banner.id} className="rounded-[44px] overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl transition-all border border-white relative h-full flex flex-col">
            <div className="aspect-[24/9] relative bg-slate-100 overflow-hidden">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <ImageIcon className="w-12 h-12 text-slate-200" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 backdrop-blur-sm">
                <Button variant="secondary" onClick={() => { setEditingBanner(banner); setIsFormOpen(true); }} className="rounded-full w-14 h-14 bg-white/20 hover:bg-white text-white hover:text-primary backdrop-blur-md border-white/20 border transition-all">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button variant="destructive" onClick={() => { if(confirm("Archiving this promotion will remove it from the live storefront. Proceed?")) deleteDocumentNonBlocking(doc(db, 'banners', banner.id)); }} className="rounded-full w-14 h-14 bg-red-500/20 hover:bg-red-500 text-white backdrop-blur-md border-red-500/20 border transition-all">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={cn("rounded-md font-black text-[8px] px-2 py-1 uppercase tracking-widest", banner.isActive ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400")}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <div className="flex items-center gap-1.5 opacity-40">
                  <ArrowUp className="w-3 h-3 text-slate-400 rotate-45" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Seq. {banner.order}</span>
                </div>
              </div>
              <h3 className="font-black text-sm uppercase truncate text-slate-900 tracking-tight leading-tight">{banner.title || 'Untitled Protocol'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{banner.subtitle || 'No subtitle provided'}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[56px] max-w-2xl border-none p-0 overflow-hidden shadow-4xl bg-white">
          <div className="bg-primary p-10 text-white relative">
             <div className="absolute top-0 right-0 p-10 opacity-10">
                <Maximize2 size={80} />
             </div>
             <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tighter">Visual Configuration</DialogTitle>
             <DialogDescription className="text-xs font-black text-white/60 tracking-widest mt-2 uppercase">
                Promotion Matrix & Carousel Orchestration
             </DialogDescription>
          </div>
          <div className="p-10">
            <BannerForm db={db} initialData={editingBanner} defaultOrder={nextOrder} onSuccess={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerForm({ db, initialData, defaultOrder, onSuccess }: { db: any, initialData?: any, defaultOrder: number, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: initialData?.title || 'Upto 81% discount',
    subtitle: initialData?.subtitle || 'On all medicines & health products',
    hindiTagline: initialData?.hindiTagline || 'सही दवा, सही दाम',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true,
    order: initialData?.order ?? defaultOrder
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Resource URL is mandatory for promotion." });
        return;
    }

    try {
      if (initialData?.id) {
        updateDocumentNonBlocking(doc(db, 'banners', initialData.id), { ...form, updatedAt: serverTimestamp() });
      } else {
        addDocumentNonBlocking(collection(db, 'banners'), { ...form, createdAt: serverTimestamp() });
      }
      
      toast({ title: "Visual Synchronized", description: "Storefront protocol updated successfully." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
           <AlertCircle className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
           <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">Recommended Size: 1920 x 720 px</span>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aspect Ratio 24:9 | High Quality JPEG/PNG</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Headline (EN)</Label>
           <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-2xl h-16 bg-slate-50 border-none font-bold text-xs" />
        </div>
        <div className="space-y-3">
           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Sequence</Label>
           <Input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} className="rounded-2xl h-16 bg-slate-50 border-none font-bold text-xs" />
        </div>
        <div className="space-y-3 col-span-full">
           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Image Resource (URL)</Label>
           <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="rounded-2xl h-16 bg-slate-50 border-none font-bold text-xs" placeholder="HTTPS://..." />
        </div>
        <div className="space-y-3">
           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtitle / Details</Label>
           <Input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="rounded-2xl h-16 bg-slate-50 border-none font-bold text-xs" />
        </div>
        <div className="space-y-3">
           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cultural Tagline (Hindi)</Label>
           <Input value={form.hindiTagline} onChange={e => setForm({...form, hindiTagline: e.target.value})} className="rounded-2xl h-16 bg-slate-50 border-none font-bold text-xs" />
        </div>
      </div>

      <Button type="submit" className="w-full h-20 rounded-full font-black text-xs tracking-[0.3em] bg-primary text-white shadow-2xl shadow-primary/30 uppercase hover:scale-[1.02] active:scale-95 transition-all">
        {initialData?.id ? 'Patch Global Matrix' : 'Commit New Promotion'}
      </Button>
    </form>
  );
}
