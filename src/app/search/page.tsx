
"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Filter, Search as SearchIcon, SlidersHorizontal, Info, Loader2 } from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Suspense } from 'react';
import Link from 'next/link';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q')?.toLowerCase() || '';
  const c = searchParams.get('c');
  const db = useFirestore();

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db]);

  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: catsLoading } = useCollection(categoriesQuery);

  const filtered = (medicines || []).filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(q);
    const saltMatch = p.saltComposition?.toLowerCase().includes(q);
    const matchesQuery = !q || nameMatch || saltMatch;
    const matchesCategory = !c || p.category === c;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="w-full md:w-64 space-y-8 hidden md:block">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-primary" /> Filter Results
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Therapeutic Categories</label>
                  <div className="space-y-2">
                    {catsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : categories?.map(cat => (
                      <Link key={cat.id} href={`/search?c=${encodeURIComponent(cat.name)}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="block">
                        <div className={`p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${c === cat.name ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${c === cat.name ? 'bg-primary animate-pulse' : 'bg-gray-200'}`} />
                          <span className={`text-xs ${c === cat.name ? 'font-black text-primary' : 'font-bold text-gray-600'}`}>{cat.name}</span>
                        </div>
                      </Link>
                    ))}
                    {!catsLoading && categories?.length === 0 && <p className="text-[10px] text-gray-400 italic">No categories available.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary p-8 rounded-[40px] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
               <Info className="w-10 h-10 mb-6 opacity-20 group-hover:opacity-40 transition-opacity" />
               <h4 className="font-black text-lg mb-2 uppercase tracking-tight text-white">Save with Generics</h4>
               <p className="text-[10px] font-bold text-white/80 leading-relaxed uppercase tracking-wider">Bio-equivalent medicines cost up to 80% less with the exact same clinical results.</p>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black font-headline text-gray-900 uppercase tracking-tight">
                  {q ? `Results for "${q}"` : c ? `${c}` : 'Full Catalog'}
                </h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{filtered.length} products verified</p>
              </div>
              <Button variant="outline" className="md:hidden gap-2 rounded-full border-2 font-black uppercase text-[10px] tracking-widest h-12 px-6">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </Button>
            </div>

            {medsLoading ? (
              <div className="flex justify-center p-24"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(p => (
                   <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-20 text-center border shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase tracking-tight">No medicines found</h3>
                <p className="text-gray-400 font-bold mb-8 text-sm">Try broader terms or browse by categories.</p>
                <Button onClick={() => window.location.href = '/search'} className="rounded-full px-12 h-14 font-black uppercase tracking-widest shadow-lg shadow-primary/20">Clear All Filters</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
