"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Filter, Search as SearchIcon, SlidersHorizontal, Info, Loader2, TrendingDown, Zap, ArrowRight } from 'lucide-react';
import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useMongoDBCollection } from '@/hooks/use-mongodb';

function SearchResults() {
  const searchParams = useSearchParams();
  const rawQ = searchParams.get('q')?.trim() || '';
  const c = searchParams.get('c');
  
  const db = useFirestore();

  // Fetch medicines from MongoDB
  const { data: medicines, isLoading: isMedsLoading } = useMongoDBCollection({ 
    q: rawQ, 
    category: c || undefined, 
    limit: 60 
  });

  // Since useMongoDBCollection already handles search and category on the server,
  // we don't need the client-side filter anymore.
  const filteredMedicines = medicines;

  const isSearching = isMedsLoading;

  // Categories for the sidebar
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(20));
  }, [db]);

  const { data: categories, isLoading: catsLoading } = useCollection(categoriesQuery);

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 space-y-6 hidden md:block">
            <div className="clay-card !p-6">
              <h3 className="font-black text-[9px] tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-primary" /> Filter results
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black tracking-widest text-gray-400 mb-3 block px-1">Therapeutic category</label>
                  <div className="space-y-1.5">
                    {catsLoading ? (
                      <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-xl" />)}</div>
                    ) : categories?.map(cat => (
                      <Link key={cat.id} href={`/search?c=${encodeURIComponent(cat.name)}${rawQ ? `&q=${encodeURIComponent(rawQ)}` : ''}`} className="block">
                        <div className={`px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${c === cat.name ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${c === cat.name ? 'bg-primary animate-pulse' : 'bg-gray-200'}`} />
                          <span className={`text-[10px] tracking-tight ${c === cat.name ? 'font-black text-primary' : 'font-bold text-gray-600'}`}>{cat.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden"><Info className="w-8 h-8 mb-4 opacity-20" /><h4 className="font-black text-sm mb-1.5 tracking-tight">Clinical precision</h4><p className="text-[9px] font-bold text-white/70 leading-relaxed tracking-widest">Verified supply chain for all SKUs.</p></div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter">
                  {rawQ ? `"${rawQ}"` : c ? `${c}` : 'Full catalog'}
                </h2>
                <p className="text-[8px] font-black text-gray-400 tracking-widest mt-1">
                  {isSearching ? 'Analyzing clinical data...' : `${filteredMedicines?.length || 0} products found`}
                </p>
              </div>
              <Button variant="outline" className="md:hidden gap-2 rounded-full border-2 font-black text-[9px] h-10 px-5"><SlidersHorizontal className="w-3 h-3" /> Filters</Button>
            </div>

            {rawQ && <SaveMoreStrip query={rawQ} />}

            {isSearching ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {[...Array(6)].map((_, i) => (<Skeleton key={i} className="aspect-square rounded-[32px]" />))}
              </div>
            ) : (filteredMedicines && filteredMedicines.length > 0) ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredMedicines.map(p => (<ProductCard key={p.id} product={p} />))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-16 text-center border shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  {rawQ.length > 0 && rawQ.length < 3 ? <Info className="w-6 h-6 text-orange-400" /> : <SearchIcon className="w-6 h-6 text-gray-300" />}
                </div>
                <h3 className="text-lg font-black mb-1.5 tracking-tight">
                  {rawQ.length > 0 && rawQ.length < 1 ? "Keep typing..." : "No medicines found"}
                </h3>
                <p className="text-gray-400 font-bold mb-8 text-[10px] tracking-widest">
                  {rawQ.length > 0 && rawQ.length < 1 ? "Enter at least 1 character for a clinical search." : "Try broader terms or browse by categories."}
                </p>
                <Button onClick={() => window.location.href = '/search'} className="rounded-full px-10 h-14 font-black tracking-widest shadow-xl">Clear filters</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SaveMoreStrip({ query: rawQ }: { query: string }) {
  const [genericAlt, setGenericAlt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    if (rawQ.length < 3) return;

    const findGeneric = async () => {
      setLoading(true);
      try {
        // 1. Find the main product from MongoDB to get its moleculeId
        const resMain = await fetch(`/api/products?q=${encodeURIComponent(rawQ)}&limit=5`);
        const mainProducts = await resMain.json();
        const mainProduct = mainProducts.find((p: any) => p.name.toLowerCase().includes(rawQ.toLowerCase()));
        
        let targetMolId = mainProduct?.moleculeId;

        if (targetMolId) {
          // 2. Find generic alternatives with the same moleculeId from MongoDB
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
    <Card className="mb-8 overflow-hidden border-none shadow-2xl bg-gradient-to-r from-accent to-accent/90 animate-in slide-in-from-top-4 duration-700">
      <div className="p-1 px-4 bg-white/10 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <TrendingDown className="w-3 h-3 text-white" />
            <span className="text-[8px] font-black text-white tracking-[0.2em] uppercase">Save more with SahiMed</span>
         </div>
         <Badge variant="outline" className="text-[7px] font-black text-white border-white/20 px-2 py-0 border-none bg-white/10">Clinical recommended</Badge>
      </div>
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-white text-center sm:text-left">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20">
             <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight leading-tight">Switch to generic alternative</h3>
            <p className="text-[10px] font-bold text-white/70 tracking-widest mt-1">Same clinical composition, upto 60% lower price.</p>
          </div>
        </div>
        
        <Link href={`/product/${genericAlt.id}`} className="w-full sm:w-auto">
          <Button className="bg-white text-accent hover:bg-white/90 rounded-full h-14 px-10 font-black tracking-widest text-[11px] gap-3 w-full shadow-2xl border-none">
            View {genericAlt.name} <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function SearchPage() {
  return (<Suspense fallback={<div className="p-8 text-center"><Skeleton className="h-10 w-64 mx-auto rounded-full" /></div>}><SearchResults /></Suspense>);
}
