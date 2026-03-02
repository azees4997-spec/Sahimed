
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
    if (n.includes('diabet')) return <Activity className="w-6 h-6" />;
    if (n.includes('heart')) return <HeartPulse className="w-6 h-6" />;
    if (n.includes('stomach')) return <Zap className="w-6 h-6" />;
    if (n.includes('liver')) return <ShieldPlus className="w-6 h-6" />;
    if (n.includes('skin') || n.includes('derma')) return <Sparkles className="w-6 h-6" />;
    if (n.includes('resp')) return <Wind className="w-6 h-6" />;
    return <Activity className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen flex flex-col pb-32 sm:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white py-2 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden aspect-[16/9] sm:aspect-[21/7] bg-primary shadow-xl">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-60"
                data-ai-hint="pharmacy medical"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent flex items-center p-6 sm:p-12">
                <div className="max-w-md text-white">
                  <span className="inline-block bg-accent text-white text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded-full mb-2 uppercase tracking-widest shadow-lg">Save up to 80%</span>
                  <h1 className="text-xl sm:text-4xl font-bold font-headline mb-2 leading-tight">Your Health,<br/>Delivered Home.</h1>
                  <p className="text-white/80 mb-4 text-xs hidden sm:block">Verified generic alternatives with exact same clinical benefits at lower costs.</p>
                  <Link href="/search">
                    <Button size="sm" className="rounded-full bg-white text-primary hover:bg-gray-100 font-bold px-6 h-10 sm:h-14 sm:px-10 sm:text-lg shadow-xl">Shop Now</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ULTRA SIMPLE PRESCRIPTION BUTTON */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-16 rounded-2xl bg-white border-2 border-primary/10 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-between px-6 group active:scale-95 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-xs uppercase tracking-tight text-gray-900">Upload Prescription</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Send to Pharmacist</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary/40" />
                </Button>
             </Link>
          </div>
        </section>

        {/* Categories Grid - Mobile Side-by-Side */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black font-headline text-gray-900 uppercase tracking-tight">Therapy Hubs</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">See All</Link>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-6">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center text-center active:scale-95 transition-all">
                    <div className="w-full aspect-square bg-white rounded-[20px] sm:rounded-[32px] flex items-center justify-center text-primary mb-1 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-primary/20">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-bold text-[9px] sm:text-xs text-gray-700 truncate w-full px-1">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products - Mobile Side-by-Side */}
        <section className="py-6 bg-white/50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black font-headline text-gray-900 uppercase tracking-tight">Top Deals</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">Explore All</Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {medicines?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {!medsLoading && medicines?.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-[32px] border border-dashed mx-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Activity className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-lg font-black mb-2 uppercase tracking-tight">Catalog Empty</h3>
                <Link href="/admin">
                  <Button className="rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest">Supervisor Console</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-8 bg-gray-50 mb-16 sm:mb-0">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full mb-3">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">100% Genuine Medicines</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium max-w-[200px] mx-auto uppercase tracking-wide">Sourced from certified labs. Guaranteed fast delivery.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
