"use client"

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, ShieldPlus, Sparkles, Wind, Loader2, ShieldCheck, Camera, ChevronRight } from 'lucide-react';
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
    const props = { className: "w-4 h-4" };
    if (n.includes('diabet')) return <Activity {...props} />;
    if (n.includes('heart')) return <HeartPulse {...props} />;
    if (n.includes('stomach')) return <Zap {...props} />;
    if (n.includes('liver')) return <ShieldPlus {...props} />;
    if (n.includes('skin') || n.includes('derma')) return <Sparkles {...props} />;
    if (n.includes('resp')) return <Wind {...props} />;
    return <Activity {...props} />;
  };

  return (
    <div className="min-h-screen flex flex-col pb-8">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section - Optimized for height */}
        <section className="bg-white py-1 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-xl sm:rounded-[32px] overflow-hidden aspect-[16/6] sm:aspect-[21/6] bg-primary shadow-lg">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-60"
                data-ai-hint="pharmacy medical"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent flex items-center p-4 sm:p-12">
                <div className="max-w-[150px] sm:max-w-md text-white">
                  <span className="inline-block bg-accent text-white text-[6px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full mb-1 sm:mb-2 uppercase tracking-widest shadow-lg">Save up to 80%</span>
                  <h1 className="text-sm sm:text-4xl font-black font-headline mb-1 leading-tight uppercase tracking-tighter">Your Health,<br/>Delivered.</h1>
                  <p className="text-white/80 mb-2 text-[8px] sm:text-xs hidden sm:block">Verified generic alternatives with exact same clinical benefits at lower costs.</p>
                  <Link href="/search">
                    <Button size="sm" className="rounded-full bg-white text-primary hover:bg-gray-100 font-black px-4 h-7 sm:h-12 sm:px-8 text-[8px] sm:text-base shadow-xl uppercase tracking-widest">Shop Now</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ULTRA SIMPLE PRESCRIPTION BUTTON */}
        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-12 rounded-xl bg-white border border-primary/5 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-between px-4 group active:scale-95 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[9px] uppercase tracking-tight text-gray-900">Scan Prescription</p>
                      <p className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Fast Clinical Review</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-primary/30" />
                </Button>
             </Link>
          </div>
        </section>

        {/* Categories Grid - Optimized Spacing */}
        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-black font-headline text-gray-900 uppercase tracking-widest">Therapy Hubs</h2>
              <Link href="/search" className="text-[8px] font-black text-primary uppercase tracking-widest opacity-60 hover:opacity-100">See All</Link>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center text-center active:scale-95 transition-all">
                    <div className="w-full aspect-square bg-white rounded-xl sm:rounded-[24px] flex items-center justify-center text-primary mb-1 shadow-sm border border-gray-50 group-hover:shadow-md group-hover:border-primary/10 p-2">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-bold text-[7px] sm:text-[11px] text-gray-600 truncate w-full px-1">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-4 bg-white/40 border-t border-gray-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black font-headline text-gray-900 uppercase tracking-widest">Top Deals</h2>
              <Link href="/search" className="text-[8px] font-black text-primary uppercase tracking-widest opacity-60 hover:opacity-100">Explore All</Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {medicines?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {!medsLoading && medicines?.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-[32px] border border-dashed mx-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Activity className="w-6 h-6 text-gray-200" />
                </div>
                <h3 className="text-base font-black mb-2 uppercase tracking-tight">Catalog Empty</h3>
                <Link href="/admin">
                  <Button className="rounded-full px-6 h-10 font-black uppercase text-[9px] tracking-widest">Supervisor Console</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-4 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-2 py-0.5 rounded-full mb-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span className="text-[6px] font-black uppercase tracking-widest">100% Genuine Medicines</span>
            </div>
            <p className="text-[7px] text-gray-400 font-bold max-w-[150px] mx-auto uppercase tracking-wide opacity-60">Verified clinical provenance. Certified labs only.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
