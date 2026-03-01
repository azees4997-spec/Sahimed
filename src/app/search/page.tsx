
"use client"

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PRODUCTS } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Filter, Search as SearchIcon, SlidersHorizontal, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const category = searchParams.get('c');

  const filtered = PRODUCTS.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query) || p.saltComposition.toLowerCase().includes(query);
    const matchesCategory = category ? p.category === category : true;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="w-full md:w-64 space-y-8 hidden md:block">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Categories</label>
                  <div className="space-y-2">
                    {['Chronic', 'Wellness', 'Baby Care'].map(c => (
                      <div key={c} className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${category === c ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {category === c && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className={`text-sm ${category === c ? 'font-bold text-primary' : 'text-gray-600'}`}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary p-6 rounded-2xl text-white shadow-lg">
               <Info className="w-8 h-8 mb-4 opacity-50" />
               <h4 className="font-bold text-lg mb-2">Save with Generics</h4>
               <p className="text-xs text-white/80 leading-relaxed">Generic medicines have the exact same chemical composition but can cost 80% less. Look for the "Save More" banner.</p>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold font-headline text-gray-900">
                  {query ? `Search results for "${query}"` : category ? `${category} Products` : 'All Products'}
                </h2>
                <p className="text-muted-foreground">{filtered.length} products found</p>
              </div>
              <Button variant="outline" className="md:hidden gap-2 rounded-full">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </Button>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filtered.map(p => (
                   <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-8">Try adjusting your search terms or filters.</p>
                <Button onClick={() => window.location.href = '/search'} className="rounded-full px-8">Clear all filters</Button>
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
    <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
