"use client"

import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink,
  Save,
  ChevronLeft,
  Settings,
  Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCollection, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function PagesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { toast } = useToast();
  const pagesQuery = query(collection(db, 'pages'), orderBy('lastUpdated', 'desc'));
  const { data: pages, isLoading } = useCollection(pagesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Content Pages" subtitle="Manage site pages and policies" onBack={onBack}>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={async () => {
              const standards = [
                { id: 'faq', title: 'Frequently Asked Questions', content: '<h1>FAQs</h1><p>Welcome to our FAQ section.</p>', placement: 'footer' },
                { id: 'contact-us', title: 'Contact Us', content: '<h1>Contact Us</h1><p>Reach out to us at support@sahimed.com</p>', placement: 'footer' },
                { id: 'offers', title: 'Promotional Offers', content: '<h1>Offers</h1><p>Check out our latest healthcare deals.</p>', placement: 'footer' },
                { id: 'policies', title: 'Privacy & Terms', content: '<h1>Policies</h1><p>Legal framework and user privacy guidelines.</p>', placement: 'footer' },
              ];
              toast({ title: "Bootstrapping Protocols..." });
              for (const page of standards) {
                await setDocumentNonBlocking(doc(db, 'pages', page.id), { ...page, lastUpdated: new Date().toISOString() }, { merge: true });
              }
              toast({ title: "Standard Footer Provisioned" });
            }}
            className="rounded-full h-14 px-8 font-black text-[9px] bg-white text-slate-400 border-slate-100 hover:text-primary transition-all uppercase tracking-widest active:scale-95"
          >
            Provision Defaults
          </Button>
          <Button onClick={() => { setEditingPage(null); setIsFormOpen(true); }} className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95">
            <Plus className="w-5 h-5 mr-3" /> Create Page
          </Button>
        </div>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[48px]" />)
        ) : pages?.map((page: any) => (
          <Card key={page.id} className="rounded-[44px] p-10 border-none shadow-xl bg-white group hover:shadow-2xl transition-all border border-white relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-24 h-24" />
            </div>
            
            <div className="flex-1 space-y-6 relative z-10">
              <div className="flex flex-col gap-2">
                <h3 className="font-black text-xl uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{page.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest break-all">/p/{page.id}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={cn("rounded-md font-black text-[8px] px-2 py-1 uppercase tracking-widest", 
                  page.placement === 'footer' ? "bg-slate-100 text-slate-600" :
                  page.placement === 'header' ? "bg-blue-100 text-blue-600" :
                  page.placement === 'both' ? "bg-primary/10 text-primary" : "bg-red-50 text-red-400"
                )}>
                  {page.placement || 'uncategorized'}
                </Badge>
              </div>

              <p className="text-xs font-medium text-slate-500 line-clamp-3 leading-relaxed">
                {page.content?.replace(/<[^>]*>/g, '').slice(0, 150)}...
              </p>
            </div>

            <div className="pt-8 mt-auto flex items-center justify-between border-t border-slate-50">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => { setEditingPage(page); setIsFormOpen(true); }} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 active:scale-90 transition-all">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <a href={`/p/${page.id}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 active:scale-90 transition-all">
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </a>
              </div>
              <Button variant="ghost" size="icon" onClick={async () => { 
                if(confirm("Archiving this document will remove all public access. Proceed?")) {
                  try {
                    await deleteDocumentNonBlocking(doc(db, 'pages', page.id)); 
                    toast({ title: "Document archived" });
                  } catch (err: any) {
                    toast({ variant: 'destructive', title: "Archive failed", description: err.message });
                  }
                }
              }} className="w-12 h-12 rounded-2xl text-red-200 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[48px] border-none p-0 overflow-hidden shadow-4xl max-w-2xl bg-white">
          <PageEditor db={db} initialData={editingPage} onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageEditor({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: initialData?.title || '',
    id: initialData?.id || '',
    content: initialData?.content || '',
    placement: initialData?.placement || 'footer',
    autoFormat: initialData?.autoFormat ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.title) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Slug and Title are mandatory." });
        return;
    }

    try {
      await setDocumentNonBlocking(doc(db, 'pages', form.id), {
        ...form,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "Document Synchronized", description: `Protocol ${form.id} is now live.` });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Logic Error", description: "Transmission failed." });
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="bg-primary p-10 text-white relative shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Settings className="w-24 h-24" />
        </div>
        <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tighter">
          {initialData ? 'Document Mutator' : 'Protocol Creation'}
        </DialogTitle>
        <DialogDescription className="text-xs font-black text-white/60 tracking-widest mt-2 uppercase">
          Standard Compliance & Identity Management
        </DialogDescription>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Document Identity (Title)</Label>
            <Input placeholder="E.G. PRIVACY POLICY..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Universal Slug (URL)</Label>
            <Input placeholder="E.G. PRIVACY-POLICY..." value={form.id} onChange={e => setForm({...form, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} disabled={!!initialData} className="h-16 rounded-2xl bg-slate-50 border-none font-bold disabled:opacity-50" />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black tracking-widest text-slate-400 subtitle-glow uppercase">Link Architecture (Placement)</Label>
          <div className="grid grid-cols-4 gap-4">
            {['footer', 'header', 'both', 'none'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({...form, placement: p})}
                className={cn("h-14 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border-2", 
                  form.placement === p ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Content Matrix</Label>
            <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               <input 
                 type="checkbox" 
                 checked={form.autoFormat} 
                 onChange={e => setForm({...form, autoFormat: e.target.checked})}
                 className="w-3 h-3 accent-primary"
               />
               <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-primary transition-colors">Standard Text Mode (No HTML)</span>
            </label>
          </div>
          <Textarea 
            placeholder={form.autoFormat ? "Paste your plain text here. Spacing will be preserved automatically." : "Write HTML/Markdown content here..."} 
            value={form.content} 
            onChange={e => setForm({...form, content: e.target.value})}
            className="min-h-[300px] rounded-3xl bg-slate-50 border-none font-medium p-8 leading-relaxed resize-none focus:ring-2 ring-primary/10" 
          />
        </div>

        <Button type="submit" className="w-full h-20 rounded-full font-black text-xs tracking-[0.3em] bg-primary text-white shadow-2xl shadow-primary/30 uppercase hover:scale-[1.02] active:scale-95 transition-all">
          <Save className="w-5 h-5 mr-3" /> Commit Changes
        </Button>
      </form>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("px-2 py-1 rounded-md", className)}>{children}</span>;
}
