
"use client"

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Loader2, ShieldCheck, Camera, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

  const heroBanners = PlaceHolderImages.filter(img => img.id.startsWith('hero-'));

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    const props = { className: "w-3.5 h-3.5" };
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
        {/* Banner Slider */}
        <section className="bg-white py-1">
          <div className="max-w-7xl mx-auto px-4">
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                {heroBanners.map((banner, index) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/7] bg-primary shadow-sm">
                      <Image 
                        src={banner.imageUrl} 
                        alt={banner.description} 
                        fill 
                        className="object-cover opacity-70"
                        data-ai-hint={banner.imageHint}
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/10 to-transparent flex items-center p-5">
                        <div className="max-w-[180px] text-white">
                          <span className="inline-block bg-accent text-white text-[6px] font-black px-1.5 py-0.5 rounded-full mb-1.5 uppercase tracking-widest">
                            {index === 1 ? 'SWITCH & SAVE 80%' : 'TRUSTED PHARMACY'}
                          </span>
                          <h1 className="text-xl font-black font-headline mb-2 uppercase tracking-tighter leading-tight">
                            {index === 0 ? 'Professional Clinical Care.' : index === 1 ? 'Quality Generics Delivered.' : 'Pharmacist Verified Hub.'}
                          </h1>
                          <Link href="/search">
                            <Button size="sm" className="rounded-full bg-white text-primary h-8 px-5 text-[8px] font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-lg">Shop Now</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* Scan Prescription Quick Action */}
        <section className="py-1">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-14 rounded-xl bg-white border border-gray-100 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-between px-5 group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[10px] uppercase tracking-tight text-gray-900">Scan Prescription</p>
                      <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Verified Review in 30 Mins</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary/30" />
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
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center active:scale-90 transition-transform">
                    <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-50 p-2.5 group-hover:shadow-md transition-shadow">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-bold text-[7px] text-gray-400 uppercase tracking-tighter truncate w-full text-center px-0.5">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Clinical Top Deals */}
        <section className="py-6 bg-white border-t border-gray-100 mt-2 rounded-t-[40px] shadow-2xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Clinical Top Deals</h2>
              <Link href="/search" className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">View All <ChevronRight className="w-2.5 h-2.5" /></Link>
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

        {/* Clinical Trust Banner */}
        <section className="py-8 pb-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-full mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[7px] font-black uppercase tracking-widest">Pharmacist Verified Distribution</span>
            </div>
            <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest opacity-60">High-Purity Supply Chain Management</p>
          </div>
        </section>
      </main>
    </div>
  );
}
