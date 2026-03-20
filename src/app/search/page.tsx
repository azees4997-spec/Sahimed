
"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Filter, Search as SearchIcon, SlidersHorizontal, Info, Loader2 } from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, where, limit, getDocs } from 'firebase/firestore';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function SearchResults() {
  const searchParams = useSearchParams();
  const rawQ = searchParams.get('q')?.trim() || '';
  const c = searchParams.get('c');
  const db = useFirestore();

  const [filteredMedicines, setFilteredMedicines] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!db) return;

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const resultsMap = new Map();

        // 1. If search term is provided, execute targeted prefix queries for name and saltComposition
        if (rawQ.length >= 3) {
          const vProper = rawQ.replace(/(^|[\s-])\S/g, (match) => match.toUpperCase());
          const vUpper = rawQ.toUpperCase();
          const vRaw = rawQ;
          const variants = Array.from(new Set([vProper, vUpper, vRaw])).filter(v => v.length >= 3);

          const queries = variants.flatMap(v => {
            const base = collection(db, 'medicines');
            const qName = query(base, where('name', '>=', v), where('name', '<=', v + '\uf8ff'), limit(40));
            const qComp = query(base, where('saltComposition', '>=', v), where('saltComposition', '<=', v + '\uf8ff'), limit(40));
            return [qName, qComp];
          });

          const snaps = await Promise.all(queries.map(q => getDocs(q)));
          snaps.forEach(snap => {
            snap.forEach(doc => {
              resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
          });
        } 
        // 2. If no query but category is selected, fetch by category
        else if (c) {
          const q = query(collection(db, 'medicines'), where('category', '==', c), limit(60));
          const snap = await getDocs(q);
          snap.forEach(doc => {
            resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        } 
        // 3. Default view: show best sellers or general catalog
        else {
          const q = query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(24));
          const snap = await getDocs(q);
          snap.forEach(doc => {
            resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        }

        let finalResults = Array.from(resultsMap.values());

        // Apply category filter client-side if a search term was used
        if (c && rawQ.length >= 3) {
          finalResults = finalResults.filter(m => m.category === c);
        }

        // Sort by name for consistency
        finalResults.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setFilteredMedicines(finalResults);
      } catch (err) {
        console.error("Clinical search failure:", err);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [db, rawQ, c]);

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
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
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
                  {rawQ.length > 0 && rawQ.length < 3 ? "Keep typing..." : "No medicines found"}
                </h3>
                <p className="text-gray-400 font-bold mb-8 text-[10px] tracking-widest">
                  {rawQ.length > 0 && rawQ.length < 3 ? "Enter at least 3 characters for a clinical search." : "Try broader terms or browse by categories."}
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

export default function SearchPage() {
  return (<Suspense fallback={<div className="p-8 text-center"><Skeleton className="h-10 w-64 mx-auto rounded-full" /></div>}><SearchResults /></Suspense>);
}
