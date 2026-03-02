
"use client"

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, ShieldPlus, Sparkles, Wind, Loader2, ShieldCheck, Upload, ChevronRight, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';

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
    if (n.includes('diabet')) return <Activity className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (n.includes('heart')) return <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (n.includes('stomach')) return <Zap className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (n.includes('liver')) return <ShieldPlus className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (n.includes('skin') || n.includes('derma')) return <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (n.includes('resp')) return <Wind className="w-6 h-6 sm:w-8 sm:h-8" />;
    return <Activity className="w-6 h-6 sm:w-8 sm:h-8" />;
  };

  return (
    <div className="min-h-screen flex flex-col pb-32 sm:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[32px] overflow-hidden aspect-[16/9] sm:aspect-[21/7] bg-primary shadow-xl">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent flex items-center p-6 sm:p-12">
                <div className="max-w-md text-white">
                  <span className="inline-block bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-widest shadow-lg">Save up to 80%</span>
                  <h1 className="text-2xl sm:text-4xl font-bold font-headline mb-2 leading-tight">Your Health,<br/>Delivered Home.</h1>
                  <p className="text-white/80 mb-6 text-sm hidden sm:block">Verified generic alternatives with exact same clinical benefits at lower costs.</p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/search">
                      <Button size="lg" className="rounded-full bg-white text-primary hover:bg-gray-100 font-bold px-8 h-12 text-sm sm:h-14 sm:text-lg shadow-xl shadow-black/10">Shop Now</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prescription Quick Access */}
        <section className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <Link href="/prescription">
                <Card className="rounded-[40px] border-none shadow-2xl shadow-primary/5 bg-gradient-to-br from-primary/5 to-white border border-primary/10 hover:border-primary/30 transition-all group active:scale-95">
                  <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-primary text-white rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                        <Camera className="w-10 h-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">Prescription Portal</h2>
                        <p className="text-sm text-gray-400 font-bold">Upload prescription & let AI handle your clinical needs.</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-primary font-black uppercase tracking-widest gap-3 hover:bg-primary/5 rounded-full px-8 h-14 border-2 border-primary/10">
                      Start Analysis <ChevronRight className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
             </Link>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-headline text-gray-900 uppercase tracking-tight">Therapeutic Hubs</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">See All</Link>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-6">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center text-center active:scale-95 transition-all">
                    <div className="w-full aspect-square bg-white rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-primary/20">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-bold text-[10px] sm:text-xs text-gray-700 truncate w-full px-1">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 bg-white/50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-headline text-gray-900 uppercase tracking-tight">Top Recommendations</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">Explore All</Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {medicines?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {!medsLoading && medicines?.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-[40px] border border-dashed">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Activity className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Catalog Empty</h3>
                <p className="text-gray-400 font-bold mb-8">Please seed the product master in the Supervisor Console.</p>
                <Link href="/admin">
                  <Button className="rounded-full px-12 h-14 font-black uppercase tracking-widest">Supervisor Console</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-12 bg-gray-50 mb-16 sm:mb-0">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">100% Genuine Medicines</span>
            </div>
            <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto">Sourced from certified labs. Guaranteed fast delivery within 2-3 days.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
