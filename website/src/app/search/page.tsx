"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Filter, Search as SearchIcon, SlidersHorizontal, Info, Loader2, TrendingDown, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMongoDBCollection } from '@/hooks/use-mongodb';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

function SearchResults() {
  const searchParams = useSearchParams();
  const rawQ = searchParams.get('q')?.trim() || '';
  const c = searchParams.get('c');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  const { data: medicines, isLoading: isMedsLoading } = useMongoDBCollection({ 
    q: rawQ, 
    category: c || undefined, 
    limit: 60 
  });

  const filteredMedicines = medicines;
  const isSearching = isMedsLoading;

  useEffect(() => {
    fetch('/api/categories?limit=20')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setCatsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
        setCatsLoading(false);
      });
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
          <div className="flex flex-col md:flex-row gap-12">
            <aside className="w-full md:w-80 space-y-8 hidden md:block">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[40px] p-8 shadow-xl"
              >
                <h3 className="font-black text-[10px] tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3 uppercase">
                  <Filter className="w-4 h-4 text-primary" /> Filter Matrix
                </h3>
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 mb-4 block px-1 uppercase opacity-60">Clinical category</label>
                    <div className="space-y-2">
                      {catsLoading ? (
                        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-2xl" />)}</div>
                      ) : categories?.map((cat, idx) => (
                        <motion.div
                          key={cat.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                        >
                          <Link href={`/search?c=${encodeURIComponent(cat.name)}${rawQ ? `&q=${encodeURIComponent(rawQ)}` : ''}`} className="block">
                            <div className={`px-4 py-3 rounded-2xl flex items-center gap-4 transition-all group ${c === cat.name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white hover:shadow-md'}`}>
                              <div className={`w-2 h-2 rounded-full ${c === cat.name ? 'bg-white animate-pulse' : 'bg-slate-200 group-hover:bg-primary/40'}`} />
                              <span className={`text-xs tracking-tight uppercase font-black ${c === cat.name ? 'text-white' : 'text-slate-600'}`}>{cat.name}</span>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-primary p-10 rounded-[48px] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-45 transition-transform duration-700">
                  <Sparkles className="w-12 h-12" />
                </div>
                <Info className="w-10 h-10 mb-6 opacity-40" />
                <h4 className="font-black text-lg mb-3 tracking-tight font-outfit">SahiMed Assurance</h4>
                <p className="text-[10px] font-bold text-white/70 leading-relaxed tracking-widest uppercase">Every clinical record is verified against global pharmaceutical standards.</p>
              </motion.div>
            </aside>

            <div className="flex-1">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between mb-10 px-2"
              >
                <div>
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter font-outfit">
                    {rawQ ? `"${rawQ}"` : c ? `${c}` : 'Global Catalog'}
                  </h2>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                      {isSearching ? 'Analyzing clinical data...' : `${filteredMedicines?.length || 0} Record(s) found`}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="md:hidden gap-3 rounded-full border-white/50 bg-white/50 backdrop-blur-md shadow-xl font-black text-[10px] h-12 px-6 uppercase tracking-widest"><SlidersHorizontal className="w-4 h-4" /> Filters</Button>
              </motion.div>

              <AnimatePresence mode="wait">
                {rawQ && <SaveMoreStrip key="save-more" query={rawQ} />}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div 
                    key="skeleton-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10"
                  >
                    {[...Array(6)].map((_, i) => (<Skeleton key={i} className="aspect-square rounded-[48px]" />))}
                  </motion.div>
                ) : (filteredMedicines && filteredMedicines.length > 0) ? (
                  <motion.div 
                    key="results-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10"
                  >
                    {filteredMedicines.map(p => (
                      <motion.div key={p.id} variants={itemVariants}>
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty-state"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/40 backdrop-blur-md rounded-[48px] p-20 text-center border border-white/50 shadow-2xl"
                  >
                    <div className="w-24 h-24 bg-white/60 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/50">
                      {rawQ.length > 0 && rawQ.length < 3 ? <Info className="w-10 h-10 text-orange-400" /> : <SearchIcon className="w-10 h-10 text-slate-300" />}
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tight font-outfit">
                      {rawQ.length > 0 && rawQ.length < 1 ? "Keep typing..." : "No records found"}
                    </h3>
                    <p className="text-slate-500 font-bold mb-10 text-sm tracking-tight max-w-sm mx-auto">
                      {rawQ.length > 0 && rawQ.length < 1 ? "Enter clinical identifiers for a verified search." : "Our clinical database didn't return any matches for your query. Try searching by Salt or Category."}
                    </p>
                    <Button onClick={() => window.location.href = '/search'} className="rounded-full px-12 h-16 font-black tracking-widest uppercase bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20">Reset Search Matrix</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

function SaveMoreStrip({ query: rawQ }: { query: string }) {
  const [genericAlt, setGenericAlt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rawQ.length < 3) return;

    const findGeneric = async () => {
      setLoading(true);
      try {
        const resMain = await fetch(`/api/products?q=${encodeURIComponent(rawQ)}&limit=5`);
        const mainProducts = await resMain.json();
        const mainProduct = mainProducts.find((p: any) => p.name.toLowerCase().includes(rawQ.toLowerCase()));
        
        let targetMolId = mainProduct?.moleculeId;

        if (targetMolId) {
          const resGen = await fetch(`/api/products?moleculeId=${encodeURIComponent(targetMolId)}&isGeneric=true&limit=10`);
          const alternatives = await resGen.json();
          const gen = alternatives.find((a: any) => 
            (a.isGeneric === true || a.isGeneric === "true") && 
            (a._id || a.id) !== (mainProduct?._id || mainProduct?.id)
          );
          if (gen) {
            setGenericAlt({ ...gen, id: gen._id || gen.id });
          }
        }
      } catch (err) {
        console.warn("Substitute search error:", err);
      } finally {
        setLoading(false);
      }
    };

    findGeneric();
  }, [rawQ]);

  if (loading || !genericAlt) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <Card className="mb-12 overflow-hidden border border-white/20 shadow-[0_32px_64px_-16px_rgba(244,63,94,0.3)] bg-gradient-to-br from-accent to-rose-600 rounded-[48px]">
        <div className="p-2 px-8 bg-white/10 flex items-center justify-between border-b border-white/10">
           <div className="flex items-center gap-3">
              <TrendingDown className="w-4 h-4 text-white animate-bounce" />
              <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">SahiMed Intelligence Switch</span>
           </div>
           <Badge variant="outline" className="text-[9px] font-black text-white border-white/20 px-3 py-1 bg-white/10 uppercase tracking-widest">Precision Alternative</Badge>
        </div>
        <div className="p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8 text-white text-center sm:text-left">
            <div className="bg-white/20 p-5 rounded-[24px] border border-white/30 shadow-inner group transition-transform hover:scale-110">
               <Zap className="w-10 h-10 fill-white" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight font-outfit uppercase">Save ₹{Math.round(genericAlt.mrp - genericAlt.price + 50)} instantly</h3>
              <p className="text-xs sm:text-sm font-bold text-white/70 tracking-tight mt-2 opacity-90 leading-relaxed uppercase">Clinical composition is identical. Your budget is prioritized.</p>
            </div>
          </div>
          
          <Link href={`/product/${genericAlt.id}`} className="w-full sm:w-auto">
            <Button className="bg-white text-accent hover:bg-white/90 rounded-full h-16 sm:h-20 px-12 font-black tracking-widest text-sm gap-4 w-full shadow-2xl border-none uppercase group">
              View {genericAlt.name} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}

export default function SearchPage() {
  return (<Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary opacity-20" /></div>}><SearchResults /></Suspense>);
}
