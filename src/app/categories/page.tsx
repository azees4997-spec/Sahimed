"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ChevronRight, Dna, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { CATEGORIES as LOCAL_CATEGORIES } from '@/lib/data';
import { Button } from '@/components/ui/button';

export default function CategoriesPage() {
  const db = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(50));
  }, [db]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);
  const displayCategories = categories?.length ? categories : LOCAL_CATEGORIES;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:scale-110 transition-transform">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Health Categories</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Therapeutic Directory</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {displayCategories.map((cat: any, i) => (
            <Link 
              key={i} 
              href={`/search?c=${encodeURIComponent(cat.name)}`} 
              className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center gap-4 active:scale-95"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-50 overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500">
                {cat.imageUrl ? (
                  <Image 
                    src={cat.imageUrl} 
                    alt={cat.name} 
                    fill 
                    className="object-cover p-4"
                  />
                ) : (
                  <Activity className="w-8 h-8 text-gray-200" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight leading-tight block">
                  {cat.name}
                </span>
                <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest">Shop All</span>
                  <ChevronRight className="w-2.5 h-2.5 text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 p-10 rounded-[48px] border border-primary/10 text-center max-w-2xl mx-auto">
           <Dna className="w-10 h-10 text-primary mx-auto mb-4" />
           <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-2">Need a Specific Formula?</h2>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed mb-8">
             Our clinical database contains thousands of molecules. Use the search bar above if you can't find your therapeutic category.
           </p>
           <Link href="/search">
             <Button className="rounded-full px-10 h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20">
               Browse Full Catalog
             </Button>
           </Link>
        </div>
      </main>
    </div>
  );
}
