
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
    const props = { className: "w-4 h-4" };
    if (n.includes('diabet')) return <Activity {...props} />;
    if (n.includes('heart')) return <HeartPulse {...props} />;
    if (n.includes('gastro')) return <Zap {...props} />;
    if (n.includes('derma')) return <Sparkles {...props} />;
    return <Activity {...props} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />

      <main className="flex-1 pb-10">
        {/* Compact Hero Section */}
        <section className="bg-white py-3">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[21/7] bg-primary shadow-sm">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-60"
                data-ai-hint="pharmacy medical"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/20 to-transparent flex items-center p-6">
                <div className="max-w-[180px] text-white">
                  <span className="inline-block bg-accent text-white text-[6px] font-black px-1.5 py-0.5 rounded-full mb-1.5 uppercase tracking-widest">SWITCH & SAVE 80%</span>
                  <h1 className="text-lg sm:text-2xl font-black font-headline mb-2 uppercase tracking-tighter leading-tight">Professional Clinical Care.</h1>
                  <Link href="/search">
                    <Button size="sm" className="rounded-full bg-white text-primary h-8 px-5 text-[8px] font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">Shop Catalog</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scan Prescription */}
        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-14 rounded-2xl bg-white border border-primary/5 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-between px-4 group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[10px] uppercase tracking-tight text-gray-900">Upload Prescription</p>
                      <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">30 Min Pharmacist Review</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-primary/20" />
                </Button>
             </Link>
          </div>
        </section>

        {/* Therapy Hub */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Therapeutic Specialities</h2>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center active:scale-90 transition-transform">
                    <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center text-primary mb-1.5 shadow-sm border border-gray-50 p-2 group-hover:shadow-md transition-shadow">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-bold text-[7px] text-gray-500 uppercase tracking-tighter truncate w-full text-center px-0.5">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-6 bg-white border-t border-gray-100 mt-2 rounded-t-[40px] shadow-2xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Clinical Top Deals</h2>
              <Link href="/search" className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">View All <ChevronRight className="w-2.5 h-2.5" /></Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {medicines?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Clinical Trust */}
        <section className="py-6 pb-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[7px] font-black uppercase tracking-widest">Pharmacist Verified</span>
            </div>
            <p className="text-[7px] text-gray-400 font-bold uppercase tracking-wide opacity-60">Professional Medical Distribution Chain</p>
          </div>
        </section>
      </main>
    </div>
  );
}
