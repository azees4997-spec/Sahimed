"use client"

import { useState, useEffect } from 'react';
import { 
  Rocket, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Globe,
  FileText,
  Save,
  Settings,
  Edit2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, generateSlug } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function MarketingTab({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [config, setConfig] = useState({ isDbConfigured: true });

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/marketing/content');
      const result = await res.json();
      if (result.data) setContents(result.data);
      if (result.config) setConfig(result.config);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Fetch Error', description: 'Failed to sync with MongoDB' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this blog post?")) {
      return;
    }
    try {
      const res = await fetch('/api/marketing/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setContents(prev => prev.filter(c => c._id !== id));
        toast({ title: 'Deleted', description: 'Content removed from MongoDB' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Delete failed' });
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 text-slate-400 font-black tracking-widest text-[10px] uppercase gap-2">
            ← Back to Fleet
          </Button>
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase font-outfit">SEO Blog Hub</h2>
          <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase mt-2">Manage Blog Articles & SEO Resources</p>
        </div>
        
        <div>
          <Button 
            onClick={() => { setEditingBlog(null); setIsFormOpen(true); }} 
            className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95"
          >
            <Plus className="w-5 h-5 mr-3" /> Create Blog Post
          </Button>
        </div>
      </div>

      {/* Cloud Config Warning */}
      <AnimatePresence>
        {!isLoading && !config.isDbConfigured && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4 items-start"
          >
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
              <Globe className="text-white w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Cloud Sync Required</h4>
              <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                Your <span className="font-black">MONGODB_URI</span> is not set. Go to <span className="font-black italic text-primary underline">Settings &gt; Environment Variables</span> in Vercel to fix this.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {isLoading ? (
            <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Scanning MongoDB...</p>
            </div>
          ) : contents.length === 0 ? (
            <div className="col-span-2 py-20 text-center border-4 border-dashed border-slate-100 rounded-[56px]">
               <FileText className="w-20 h-20 text-slate-100 mx-auto mb-6" />
               <p className="text-xl font-black text-slate-200 uppercase">No Growth Content Found</p>
            </div>
          ) : (
            contents.map((item, idx) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="rounded-[40px] border-none shadow-xl hover:shadow-2xl transition-all bg-white group overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-purple-500 w-full" />
                  <CardContent className="p-10 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase tracking-widest">
                            {item.category}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[8px] font-black rounded-full uppercase tracking-widest">
                            {item.status || 'draft'}
                          </span>
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight uppercase leading-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(item._id)}
                        className="rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-medium">
                      {item.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-4">
                      {item.keywords?.map((k: string) => (
                        <span key={k} className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          #{k}
                        </span>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Globe className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">/{item.slug}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => { setEditingBlog(item); setIsFormOpen(true); }}
                        className="rounded-full border-2 border-slate-50 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        Edit Post <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[48px] border-none p-0 overflow-hidden shadow-4xl max-w-2xl bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="bg-primary p-8 text-white relative shrink-0 space-y-2">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Settings className="w-20 h-20" />
            </div>
            <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter text-white">
              {editingBlog ? 'Edit Blog Post' : 'New Blog Post'}
            </DialogTitle>
            <DialogDescription className="text-xs font-black text-white/60 tracking-widest uppercase">
              Publish authentic articles to public domain
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <BlogEditor 
              initialData={editingBlog} 
              onSuccess={() => {
                setIsFormOpen(false);
                fetchContent();
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BlogEditor({ 
  initialData, 
  onSuccess 
}: { 
  initialData?: any; 
  onSuccess: () => void; 
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    category: initialData?.category || 'General Health',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    keywordsText: initialData?.keywords?.join(', ') || '',
    imagesText: initialData?.images?.join('\n') || '',
    videoLink: initialData?.videoLink || '',
    attachmentsText: initialData?.attachments?.join('\n') || '',
    status: initialData?.status || 'draft'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Title and Slug are mandatory.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedKeywords = form.keywordsText
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k !== '');

      const parsedImages = form.imagesText
        .split('\n')
        .map(url => url.trim())
        .filter(url => url !== '');

      const parsedAttachments = form.attachmentsText
        .split('\n')
        .map(url => url.trim())
        .filter(url => url !== '');

      const payload = {
        id: initialData?._id,
        title: form.title,
        slug: form.slug,
        category: form.category,
        excerpt: form.excerpt,
        content: form.content,
        keywords: parsedKeywords,
        images: parsedImages,
        videoLink: form.videoLink,
        attachments: parsedAttachments,
        status: form.status
      };

      const res = await fetch('/api/marketing/content', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Success', description: initialData ? 'Blog post updated' : 'Blog post created' });
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to save blog');
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setForm(prev => {
      const next = { ...prev, title: val };
      if (!initialData) {
        next.slug = generateSlug(val);
      }
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Blog Title</Label>
          <Input 
            placeholder="e.g. Health benefits of Ashwagandha" 
            value={form.title} 
            onChange={e => handleTitleChange(e.target.value)} 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Slug (URL)</Label>
          <Input 
            placeholder="e.g. health-benefits-ashwagandha" 
            value={form.slug} 
            onChange={e => setForm({...form, slug: generateSlug(e.target.value)})} 
            disabled={!!initialData} 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold disabled:opacity-50" 
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Category</Label>
          <Input 
            placeholder="e.g. Trending Health" 
            value={form.category} 
            onChange={e => setForm({...form, category: e.target.value})} 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Publish Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {['draft', 'published'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({...form, status: s})}
                className={cn("h-14 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border-2", 
                  form.status === s ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Excerpt (SEO Summary / Meta Description)</Label>
        <Textarea 
          placeholder="Enter a brief, engaging summary of the post..." 
          value={form.excerpt} 
          onChange={e => setForm({...form, excerpt: e.target.value})}
          className="min-h-[80px] rounded-2xl bg-slate-50 border-none font-medium p-4 leading-relaxed resize-none focus:ring-2 ring-primary/10" 
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Content (HTML or plain text from copy paste)</Label>
        <Textarea 
          placeholder="Paste or write your blog content here. You can use HTML tags (e.g. <p>, <h2>, <ul>) to structure your post." 
          value={form.content} 
          onChange={e => setForm({...form, content: e.target.value})}
          className="min-h-[250px] rounded-2xl bg-slate-50 border-none font-medium p-6 leading-relaxed resize-none focus:ring-2 ring-primary/10" 
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Keywords (Comma or line separated)</Label>
        <Textarea 
          placeholder="e.g. ashwagandha, ayurveda, herbal health" 
          value={form.keywordsText} 
          onChange={e => setForm({...form, keywordsText: e.target.value})}
          className="min-h-[60px] rounded-2xl bg-slate-50 border-none font-medium p-4 leading-relaxed resize-none focus:ring-2 ring-primary/10" 
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Images (Paste URLs, one per line)</Label>
        <Textarea 
          placeholder="e.g. https://example.com/image1.jpg&#10;https://example.com/image2.jpg" 
          value={form.imagesText} 
          onChange={e => setForm({...form, imagesText: e.target.value})}
          className="min-h-[80px] rounded-2xl bg-slate-50 border-none font-medium p-4 leading-relaxed resize-none focus:ring-2 ring-primary/10" 
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Videos Link (YouTube, Vimeo, or direct MP4 URL)</Label>
        <Input 
          placeholder="e.g. https://www.youtube.com/watch?v=..." 
          value={form.videoLink} 
          onChange={e => setForm({...form, videoLink: e.target.value})}
          className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Attachments (Paste URLs, one per line)</Label>
        <Textarea 
          placeholder="e.g. https://example.com/document.pdf" 
          value={form.attachmentsText} 
          onChange={e => setForm({...form, attachmentsText: e.target.value})}
          className="min-h-[80px] rounded-2xl bg-slate-50 border-none font-medium p-4 leading-relaxed resize-none focus:ring-2 ring-primary/10" 
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full h-16 rounded-full font-black text-xs tracking-[0.3em] bg-primary text-white shadow-2xl shadow-primary/30 uppercase hover:scale-[1.02] active:scale-95 transition-all"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3" />}
        {editingBlog ? 'Commit Changes' : 'Save Blog Post'}
      </Button>
    </form>
  );
}
