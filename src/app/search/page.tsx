
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
    // Show all items (even out of stock) as requested
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 space-y-6 hidden md:block">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="font-black text-[9px] uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-primary" /> Filter Results
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block px-1">Therapeutic Category</label>
                  <div className="space-y-1.5">
                    {catsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : categories?.map(cat => (
                      <Link key={cat.id} href={`/search?c=${encodeURIComponent(cat.name)}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="block">
                        <div className={`px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${c === cat.name ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${c === cat.name ? 'bg-primary animate-pulse' : 'bg-gray-200'}`} />
                          <span className={`text-[10px] uppercase tracking-tight ${c === cat.name ? 'font-black text-primary' : 'font-bold text-gray-600'}`}>{cat.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary p-8 rounded-[40px] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
               <Info className="w-8 h-8 mb-4 opacity-20" />
               <h4 className="font-black text-sm mb-1.5 uppercase tracking-tight">Save with Generics</h4>
               <p className="text-[9px] font-bold text-white/70 leading-relaxed uppercase tracking-widest">Bio-equivalent medicines cost up to 80% less.</p>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                  {q ? `"${q}"` : c ? `${c}` : 'Full Catalog'}
                </h2>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{filtered.length} products found</p>
              </div>
              <Button variant="outline" className="md:hidden gap-2 rounded-full border-2 font-black uppercase text-[9px] tracking-widest h-10 px-5 active:scale-95">
                <SlidersHorizontal className="w-3 h-3" /> Filters
              </Button>
            </div>

            {medsLoading ? (
              <div className="flex justify-center p-24"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filtered.map(p => (
                   <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-16 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-black mb-1.5 uppercase tracking-tight">No medicines found</h3>
                <p className="text-gray-400 font-bold mb-8 text-[10px] uppercase tracking-widest">Try broader terms or browse by categories.</p>
                <Button onClick={() => window.location.href = '/search'} className="rounded-full px-10 h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95">Clear Filters</Button>
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
