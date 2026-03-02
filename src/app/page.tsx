"use client"

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Loader2, ShieldCheck, Camera, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';

export default function Home() {
  const db = useFirestore();

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(12));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db]);

  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: catsLoading } = useCollection(categoriesQuery);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    const props = { className: "w-3 h-3" };
    if (n.includes('diabet')) return <Activity {...props} />;
    if (n.includes('heart')) return <HeartPulse {...props} />;
    if (n.includes('gastro')) return <Zap {...props} />;
    if (n.includes('derma')) return <Sparkles {...props} />;
    return <Activity {...props} />;
  };

  return (
    <div className="min-h-screen flex flex-col pb-8 bg-[#F8F8F8]">
      <Navbar />

      <main className="flex-1">
        {/* Compact Hero Section */}
        <section className="bg-white py-2">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative rounded-xl overflow-hidden aspect-[21/6] bg-primary shadow-sm">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-60"
                data-ai-hint="pharmacy medical"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/20 to-transparent flex items-center p-4">
                <div className="max-w-[140px] text-white">
                  <span className="inline-block bg-accent text-white text-[5px] font-black px-1 py-0.5 rounded-full mb-1 uppercase tracking-widest">Save 80%</span>
                  <h1 className="text-xs sm:text-2xl font-black font-headline mb-1 uppercase tracking-tighter leading-tight">Clinical Care,<br/>Delivered.</h1>
                  <Link href="/search">
                    <Button size="sm" className="rounded-full bg-white text-primary h-6 px-3 text-[7px] font-black uppercase tracking-widest">Shop</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scan Prescription */}
        <section className="py-1">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-10 rounded-xl bg-white border border-primary/5 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center shadow-md">
                      <Camera className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[8px] uppercase tracking-tight text-gray-900 leading-none">Scan Prescription</p>
                      <p className="text-[6px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Fast Review</p>
                    </div>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 text-primary/20" />
                </Button>
             </Link>
          </div>
        </section>

        {/* Therapy Hub */}
        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[8px] font-black text-gray-900 uppercase tracking-widest">Therapy Hub</h2>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-2"><Loader2 className="w-3 h-3 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center">
                    <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center text-primary mb-1 shadow-sm border border-gray-50 p-1.5">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-bold text-[6px] text-gray-500 truncate w-full text-center px-0.5">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-3 bg-white/50 border-t border-gray-100/50 mt-1">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[8px] font-black text-gray-900 uppercase tracking-widest">Top Deals</h2>
              <Link href="/search" className="text-[6px] font-black text-primary uppercase tracking-widest">See All</Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {medicines?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Clinical Trust */}
        <section className="py-3">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full mb-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span className="text-[5px] font-black uppercase tracking-widest">Verified Medicines</span>
            </div>
            <p className="text-[6px] text-gray-400 font-bold uppercase tracking-wide opacity-50">Certified clinical supply chain</p>
          </div>
        </section>
      </main>
    </div>
  );
}