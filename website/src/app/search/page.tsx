"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search as SearchIcon, SlidersHorizontal, Info, Loader2, TrendingDown, Zap, ArrowRight, Sparkles, X, ChevronDown } from 'lucide-react';
import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMongoDBCollection } from '@/hooks/use-mongodb';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

import { cn } from '@/lib/utils';
import { 
  containerVariants, 
  fadeInVariant, 
  hoverVariant, 
  springTransition, 
  tapVariant 
} from '@/lib/animations';

function SearchResults() {
  const searchParams = useSearchParams();
  const rawQ = searchParams.get('q')?.trim() || '';
  const c = searchParams.get('c');
  const moleculeId = searchParams.get('moleculeId');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [moleculeName, setMoleculeName] = useState<string | null>(null);

  // Advanced filter state
  const [filterMarketer, setFilterMarketer] = useState<string[]>([]);
  const [filterDosageForm, setFilterDosageForm] = useState<string[]>([]);
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [availableMarketers, setAvailableMarketers] = useState<string[]>([]);
  const [availableDosageForms, setAvailableDosageForms] = useState<string[]>([]);
  const [marketerExpanded, setMarketerExpanded] = useState(false);
  const [dosageExpanded, setDosageExpanded] = useState(false);

  useEffect(() => {
    if (moleculeId) {
      fetch(`/api/molecules/${moleculeId}`)
        .then(res => res.json())
        .then(data => setMoleculeName(data.molecule || data.name))
        .catch(err => console.error("Failed to fetch molecule name", err));
    }
  }, [moleculeId]);

  const { data: medicines, isLoading: isMedsLoading } = useMongoDBCollection({ 
    q: rawQ, 
    category: c || undefined, 
    moleculeId: moleculeId || undefined,
    marketerName: filterMarketer.length > 0 ? filterMarketer.join(',') : undefined,
    dosageForm: filterDosageForm.length > 0 ? filterDosageForm.join(',') : undefined,
    minPrice: filterMinPrice || undefined,
    maxPrice: filterMaxPrice || undefined,
    limit: 60 
  });

  const filteredMedicines = medicines;
  const isSearching = isMedsLoading;

  useEffect(() => {
    fetch('/api/categories?limit=20')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Categories API did not return an array", data);
          setCategories([]);
        }
        setCatsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
        setCatsLoading(false);
      });
  }, []);

  // Fetch distinct marketer names and dosage forms for filter panel
  useEffect(() => {
    fetch('/api/products/filters')
      .then(res => res.ok ? res.json() : { marketers: [], dosageForms: [] })
      .then(data => {
        if (data.marketers) setAvailableMarketers(data.marketers.filter(Boolean).sort());
        if (data.dosageForms) setAvailableDosageForms(data.dosageForms.filter(Boolean).sort());
      })
      .catch(() => {});
  }, []);

  const toggleMarketer = (name: string) => {
    setFilterMarketer(prev => prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]);
  };

  const toggleDosageForm = (form: string) => {
    setFilterDosageForm(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };

  const clearAllFilters = () => {
    setFilterMarketer([]);
    setFilterDosageForm([]);
    setFilterMinPrice('');
    setFilterMaxPrice('');
  };

  const activeFilterCount = filterMarketer.length + filterDosageForm.length + (filterMinPrice ? 1 : 0) + (filterMaxPrice ? 1 : 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
          <div className="flex flex-col md:flex-row gap-12">
            <aside className="w-full md:w-80 space-y-8 hidden md:block">
              {/* Matching Molecules Section (New Priority) */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-[10px] tracking-[0.2em] text-slate-400 flex items-center gap-3 uppercase">
                    <Sparkles className="w-4 h-4 text-primary" /> Matching Molecules
                  </h3>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {isSearching ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}</div>
                  ) : (
                    // We can derive matching molecules from the products or fetch them
                    // For now, let's show a list of unique molecules from the results
                    Array.from(new Set(medicines?.map(m => m.moleculeId).filter(Boolean)))
                      .slice(0, 10)
                      .map((mId: any, idx) => {
                        const product = medicines?.find(m => m.moleculeId === mId);
                        const mName = product?.saltComposition || product?.composition || 'Unknown Salt';
                        return (
                          <motion.div
                            key={mId}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                          >
                            <Link href={`/search?moleculeId=${mId}${rawQ ? `&q=${encodeURIComponent(rawQ)}` : ''}`} className="block">
                              <div className={cn(
                                "px-4 py-3 rounded-2xl flex items-center gap-3 transition-all group border border-transparent",
                                moleculeId === mId ? 'bg-primary/5 border-primary/20 text-primary' : 'hover:bg-slate-50'
                              )}>
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                  moleculeId === mId ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                )}>
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-[10px] font-black uppercase tracking-tight truncate",
                                    moleculeId === mId ? 'text-primary' : 'text-slate-600'
                                  )}>{mName}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">View Combinations</p>
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })
                  )}
                  {!isSearching && (!medicines || medicines.length === 0) && (
                    <p className="text-[10px] font-bold text-slate-400 text-center py-4 uppercase">No molecules found</p>
                  )}
                </div>
              </motion.div>

              {/* Advanced Filters (Collapsible) */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-[10px] tracking-[0.2em] text-slate-400 flex items-center gap-3 uppercase">
                    <Filter className="w-4 h-4 text-primary" /> Refine Results
                  </h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="space-y-8">
                  {/* Price Range */}
                  <div>
                    <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 mb-3 block px-1 uppercase opacity-60">Price Range (₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterMinPrice}
                        onChange={e => setFilterMinPrice(e.target.value)}
                        className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-100 px-3 text-xs font-bold outline-none focus:border-primary/30 transition-colors"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterMaxPrice}
                        onChange={e => setFilterMaxPrice(e.target.value)}
                        className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-100 px-3 text-xs font-bold outline-none focus:border-primary/30 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Dosage Form */}
                  {availableDosageForms.length > 0 && (
                    <div>
                      <button
                        onClick={() => setDosageExpanded(p => !p)}
                        className="w-full flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-slate-400 mb-3 px-1 uppercase opacity-60 hover:opacity-100 transition-opacity"
                      >
                        Dosage Form
                        <ChevronDown className={cn("w-3 h-3 transition-transform", dosageExpanded && "rotate-180")} />
                      </button>
                      {dosageExpanded && (
                        <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-hide pt-2">
                          {availableDosageForms.map(form => (
                            <button
                              key={form}
                              onClick={() => toggleDosageForm(form)}
                              className={cn(
                                "w-full px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left",
                                filterDosageForm.includes(form) ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-50'
                              )}
                            >
                              <span className={cn("text-[9px] uppercase font-black tracking-wide truncate", filterDosageForm.includes(form) ? 'text-white' : 'text-slate-500')}>{form}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clinical Category */}
                  <div>
                    <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 mb-3 block px-1 uppercase opacity-60">Clinical category</label>
                    <div className="space-y-1">
                      {catsLoading ? (
                        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-2xl" />)}</div>
                      ) : categories?.slice(0, 6).map((cat, idx) => (
                        <Link key={cat.id} href={`/search?c=${encodeURIComponent(cat.name)}${rawQ ? `&q=${encodeURIComponent(rawQ)}` : ''}`} className="block">
                          <div className={cn(
                            "px-4 py-3 rounded-2xl flex items-center gap-3 transition-all group",
                            c === cat.name ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'
                          )}>
                            <span className="text-[9px] uppercase font-black truncate">{cat.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-sahi-blue p-10 rounded-[48px] border border-white shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-45 transition-all duration-700">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <Info className="w-8 h-8 mb-6 text-primary opacity-40" />
                <h4 className="font-black text-lg mb-2 tracking-tighter font-outfit uppercase text-slate-900 leading-tight">SahiMed Assurance</h4>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed tracking-widest uppercase opacity-70">Verified clinical pharmaceutical standards.</p>
              </motion.div>
            </aside>

            <div className="flex-1">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between mb-10 px-2"
              >
                <div>
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter font-outfit uppercase">
                    {moleculeName ? `${moleculeName}` : rawQ ? `"${rawQ}"` : c ? `${c}` : 'Global Catalog'}
                  </h2>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                      {isSearching ? 'Finding best medicines...' : `${filteredMedicines?.length || 0} items found`}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="md:hidden gap-3 rounded-full border-slate-200 bg-white shadow-xl font-black text-[10px] h-12 px-6 uppercase tracking-widest"><SlidersHorizontal className="w-4 h-4" /> Filters</Button>
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
                    animate="visible"
                    className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-10"
                  >
                    {filteredMedicines.map(p => (
                      <motion.div key={p.id} variants={fadeInVariant}>
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty-state"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-slate-100 rounded-[56px] p-20 text-center shadow-sm"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
                      {rawQ.length > 0 && rawQ.length < 3 ? <Info className="w-8 h-8 text-orange-400" /> : <SearchIcon className="w-8 h-8 text-slate-300" />}
                    </div>
                    <h3 className="text-2xl font-black mb-3 tracking-tighter font-outfit uppercase">
                      {rawQ.length > 0 && rawQ.length < 3 ? "Minimum Input Required" : "No clinical matches"}
                    </h3>
                    <p className="text-slate-400 font-bold mb-10 text-[10px] uppercase tracking-[0.2em] max-w-xs mx-auto opacity-70">
                      Our database couldn't find matches for your query. Try searching by Salt or Therapeutic category.
                    </p>
                    <Button onClick={() => window.location.href = '/search'} className="rounded-full px-10 h-16 font-black tracking-widest uppercase bg-slate-900 text-white shadow-xl active:scale-95 transition-all">Clear All Filters</Button>
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
        // 1. Find the best matching brand/product
        const resMain = await fetch(`/api/products?q=${encodeURIComponent(rawQ)}&limit=10`);
        const mainProducts = await resMain.json();
        if (!mainProducts || mainProducts.length === 0) return;

        // Try to find a branded product (not generic) or just the first result
        const mainProduct = mainProducts.find((p: any) => !p.isGeneric) || mainProducts[0];
        
        let targetMolId = mainProduct?.moleculeId;

        if (targetMolId) {
          // 2. Find a cheaper generic alternative for that molecule
          const resGen = await fetch(`/api/products?moleculeId=${encodeURIComponent(targetMolId)}&isGeneric=true&limit=10`);
          const alternatives = await resGen.json();
          if (!Array.isArray(alternatives)) return;

          const gen = alternatives.find((a: any) => 
            (a.isGeneric === true || String(a.isGeneric) === "true") && 
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
      initial={{ scale: 0.98, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.98, opacity: 0, y: 10 }}
      transition={springTransition as any}
    >
      <Card className="mb-12 overflow-hidden border border-white shadow-xl bg-gradient-to-br from-primary to-accent rounded-[48px]">
        <div className="p-2 px-8 bg-white/10 flex items-center justify-between border-b border-white/10">
           <div className="flex items-center gap-3">
              <TrendingDown className="w-4 h-4 text-white animate-bounce" />
               <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Smart Savings</span>
           </div>
           <Badge variant="outline" className="text-[9px] font-black text-white border-white/20 px-3 py-1 bg-white/10 uppercase tracking-widest">Identical Composition</Badge>
        </div>
        <div className="p-10 flex flex-col sm:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8 text-white text-center sm:text-left">
            <div className="bg-white/20 p-5 rounded-[24px] border border-white/30 shadow-inner group transition-transform hover:scale-110">
               <Zap className="w-8 h-8 fill-white" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight font-outfit uppercase">Save ₹{Math.round(genericAlt.mrp - genericAlt.price)} instantly</h3>
              <p className="text-[10px] font-black text-white/70 tracking-widest mt-2 uppercase">Your medical budget is prioritized.</p>
            </div>
          </div>
          
          <Link href={`/product/${genericAlt.id}`} className="w-full sm:w-auto">
            <Button className="bg-white text-primary hover:bg-white/90 rounded-full h-16 px-10 font-black tracking-widest text-[10px] gap-4 w-full shadow-2xl border-none uppercase group">
              Switch to {genericAlt.name} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary opacity-20" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
