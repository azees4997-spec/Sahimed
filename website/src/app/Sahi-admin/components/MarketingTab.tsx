"use client"

import { useState, useEffect } from 'react';
import { 
  Rocket, 
  Search, 
  TrendingUp, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  Globe,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VideoSuite } from './VideoSuite';

export function MarketingTab({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'blog' | 'video'>('blog');
  const [currentStep, setCurrentStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [config, setConfig] = useState({ isAiConfigured: true, isDbConfigured: true });

  const generationSteps = [
    { label: 'Initializing Gemini AI Engine', icon: Sparkles },
    { label: 'Analyzing Trending Health Topics in India', icon: Search },
    { label: 'Researching Clinical Data & Symptoms', icon: FileText },
    { label: 'Drafting SEO-Optimized Article', icon: TrendingUp },
    { label: 'Finalizing & Syncing with MongoDB', icon: Rocket }
  ];

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

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setCurrentStep(0);
    setPreviewData(null);
    
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 4000);

    try {
      const res = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category: 'Trending Health' })
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        clearInterval(stepInterval);
        setCurrentStep(generationSteps.length - 1);
        
        // Show the preview immediately
        setPreviewData(result.data);
        
        if (result.warning) {
          toast({ variant: 'destructive', title: 'DB Sync Warning', description: result.warning });
        } else {
          toast({ title: 'Success', description: 'Blog generated and stored in MongoDB' });
        }

        setTopic('');
        setIsGenerating(false);
        fetchContent();
      } else {
        throw new Error(result.error || result.message || 'Generation failed');
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      toast({ 
        variant: 'destructive', 
        title: 'Gen Error', 
        description: err.message || 'AI failed to complete the task' 
      });
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
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
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase font-outfit">Marketing Hub</h2>
          <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase mt-2">AI-Driven Content & Video Suite</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-2 rounded-[24px] gap-2">
            <Button 
              onClick={() => setViewMode('blog')}
              className={cn(
                "rounded-full px-6 font-black uppercase text-[10px] transition-all",
                viewMode === 'blog' ? "bg-white text-primary shadow-lg" : "bg-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              SEO Blogs
            </Button>
            <Button 
              onClick={() => setViewMode('video')}
              className={cn(
                "rounded-full px-6 font-black uppercase text-[10px] transition-all",
                viewMode === 'video' ? "bg-white text-primary shadow-lg" : "bg-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Video Suite
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'blog' ? (
        <>
          {/* Generation Tool */}
          <Card className="rounded-[40px] border-none shadow-3xl bg-white/50 backdrop-blur-xl border border-white overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                SEO Blog Agent
              </CardTitle>
          <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Target trending topics in India</p>

          {/* Cloud Config Warning */}
          <AnimatePresence>
            {!isLoading && (!config.isAiConfigured || !config.isDbConfigured) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4 items-start"
              >
                <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <Globe className="text-white w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Cloud Sync Required</h4>
                  <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                    {!config.isAiConfigured && (
                      <>It looks like your <span className="font-black">GEMINI_API_KEY</span> is missing. </>
                    )}
                    {!config.isDbConfigured && (
                      <>Your <span className="font-black">MONGODB_URI</span> is not set. </>
                    )}
                    Go to <span className="font-black italic text-primary underline">Settings &gt; Environment Variables</span> in Vercel to fix this.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="e.g. Health benefits of Ashwagandha or Delhi Pollution Precautions"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              className="flex-1 h-20 bg-slate-100/50 rounded-[24px] px-8 font-black outline-none focus:bg-white focus:ring-4 ring-primary/5 transition-all text-sm disabled:opacity-50"
            />
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !topic}
              className="h-20 px-10 rounded-full bg-primary font-black uppercase tracking-widest text-xs gap-3 shadow-2xl shadow-primary/30 active:scale-95 transition-all"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              Generate SEO Article
            </Button>
          </div>

          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4"
              >
                <div className="flex justify-between items-end mb-2">
                   <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">AI Mission Progress</p>
                   <p className="text-[10px] font-black text-slate-300 uppercase">{Math.round(((currentStep + 1) / generationSteps.length) * 100)}% Complete</p>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / generationSteps.length) * 100}%` }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(46,91,255,0.5)]"
                  />
                </div>

                {/* Steps List */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
                  {generationSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === currentStep;
                    const isCompleted = idx < currentStep;
                    
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex flex-col items-center text-center gap-3 transition-all duration-500",
                          isActive ? "opacity-100 scale-105" : isCompleted ? "opacity-50" : "opacity-20"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          isActive ? "bg-primary text-white shadow-lg" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                           {isCompleted ? <Plus className="w-5 h-5 rotate-45" /> : <Icon className={cn("w-5 h-5", isActive && "animate-pulse")} />}
                        </div>
                        <p className={cn(
                          "text-[8px] font-black tracking-widest uppercase leading-tight px-2",
                          isActive ? "text-slate-900" : "text-slate-400"
                        )}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Live Preview Modal */}
      <AnimatePresence>
        {previewData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[56px] shadow-4xl overflow-hidden flex flex-col"
            >
              <div className="p-10 bg-primary text-white flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60 mb-1">AI Mission Accomplished</p>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Draft Review</h3>
                </div>
                <Button 
                  onClick={() => setPreviewData(null)}
                  className="rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 text-white border-none"
                >
                  <Plus className="rotate-45" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
                <div className="space-y-4">
                  <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">{previewData.title}</h1>
                  <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-4 py-2 rounded-full uppercase tracking-widest border border-primary/10">Slug: /{previewData.slug}</span>
                    <div className="flex gap-2">
                      {previewData.keywords?.map((k: string) => (
                        <span key={k} className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{k}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div 
                  className="prose prose-slate max-w-none prose-h2:text-xl prose-h2:font-black prose-h2:uppercase prose-h2:tracking-tight prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewData.content }}
                />
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Article Length: ~1200 words</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold uppercase tracking-tight" onClick={() => setPreviewData(null)}>
                    Close Preview
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-blue-600 rounded-2xl h-12 px-8 font-black uppercase tracking-tight shadow-lg shadow-primary/20"
                    onClick={() => window.open(`/blog/${previewData.slug}`, '_blank')}
                  >
                    View Live Blog
                  </Button>
                </div>
              </div>
            </motion.div>
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
                      <Button variant="outline" className="rounded-full border-2 border-slate-50 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                        Edit Draft <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </>
  ) : (
    <VideoSuite />
  )}
</div>
  );
}
