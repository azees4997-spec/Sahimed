
"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Loader2, Camera, ChevronRight, Wind, ShieldPlus } from 'lucide-react';
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
import Autoplay from "embla-carousel-autoplay";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const db = useFirestore();
  const autoplayRef = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(50));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db]);

  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: catsLoading } = useCollection(categoriesQuery);

  const heroBanners = PlaceHolderImages.filter(img => img.id.startsWith('hero-')).slice(0, 3);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    const props = { className: "w-5 h-5 sm:w-7 sm:h-7" };
    if (n.includes('diabet')) return <Activity {...props} />;
    if (n.includes('heart')) return <HeartPulse {...props} />;
    if (n.includes('gastro')) return <Zap {...props} />;
    if (n.includes('derma')) return <Sparkles {...props} />;
    if (n.includes('liver')) return <ShieldPlus {...props} />;
    if (n.includes('respi')) return <Wind {...props} />;
    return <Activity {...props} />;
  };

  const displayMedicines = medicines?.slice(0, 30);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />

      <main className="flex-1 pb-10">
        <section className="bg-white py-4">
          <div className="max-w-7xl mx-auto px-6 sm:px-12">
            <Carousel 
              className="w-full" 
              opts={{ loop: true, align: 'start' }}
              plugins={[autoplayRef.current]}
            >
              <CarouselContent>
                {heroBanners.map((banner, index) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative rounded-[40px] overflow-hidden aspect-[16/7] sm:aspect-[24/8] bg-primary shadow-2xl border border-gray-100 group">
                      <Image 
                        src={banner.imageUrl} 
                        alt={banner.description} 
                        fill 
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                        data-ai-hint={banner.imageHint}
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex items-end p-8 sm:p-16">
                        <div className="max-w-2xl text-white space-y-4 sm:space-y-6">
                          <span className="bg-accent text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg inline-block">
                            {index === 0 ? 'Switch & Save' : index === 1 ? 'Express Delivery' : 'Verified Quality'}
                          </span>
                          <h1 className="text-2xl sm:text-5xl font-black font-headline uppercase tracking-tighter leading-tight text-balance">
                            {banner.description.replace('HealthLink', 'SahiMed')}
                          </h1>
                          <div className="pt-2 sm:pt-6">
                            <Link href="/search">
                              <Button size="lg" className="rounded-full bg-white text-primary h-12 sm:h-16 px-10 sm:px-16 text-[11px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all shadow-2xl">
                                Discover More
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        <section className="py-6">
          <div className="max-w-7xl mx-auto px-6 sm:px-12">
             <Link href="/prescription">
                <Button className="w-full h-24 rounded-[40px] bg-white border-2 border-primary/5 text-primary hover:bg-primary/5 shadow-xl shadow-primary/5 flex items-center justify-between px-8 group active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[15px] uppercase tracking-tight text-gray-900">Scan & Upload Prescription</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Get pharmacist review in 15 mins</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </Button>
             </Link>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6 sm:px-12">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.3em]">Health Categories</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Catalog</Link>
            </div>
            {catsLoading ? (
              <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <Skeleton className="w-full aspect-square rounded-[32px] shimmer" />
                    <Skeleton className="h-3 w-16 rounded shimmer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center active:scale-95 transition-transform">
                    <div className="w-full aspect-square bg-white rounded-[32px] flex items-center justify-center text-primary mb-3 shadow-sm border border-gray-100 p-5 group-hover:bg-primary group-hover:text-white transition-all duration-500 hover:shadow-xl">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-black text-[9px] sm:text-[11px] text-gray-700 uppercase tracking-tighter truncate w-full text-center px-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-white border-t border-gray-100 mt-10 rounded-t-[60px] shadow-2xl overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-12">
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="space-y-1.5">
                <h2 className="text-[15px] font-black text-gray-900 uppercase tracking-[0.3em]">Our Best Sellers</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer favorite healthcare essentials</p>
              </div>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-full hover:bg-primary/10 transition-colors shadow-sm">
                Shop Full Catalog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {medsLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-[200px] shrink-0 space-y-4">
                    <Skeleton className="aspect-square rounded-[32px] shimmer" />
                    <Skeleton className="h-4 w-3/4 shimmer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-10 gap-6 scrollbar-hide snap-x">
                <div className="grid grid-rows-2 grid-flow-col gap-6">
                  {displayMedicines?.map((p: any) => (
                    <div key={p.id} className="w-[200px] sm:w-[260px] snap-start">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t border-gray-100 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-primary p-2 rounded-xl">
              <div className="text-white font-black text-sm tracking-tighter uppercase">SM</div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black text-gray-900 uppercase tracking-[0.4em]">SahiMed Pharmacy</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Professional Healthcare • Express Delivery • Clinical Excellence
              </p>
            </div>
            <div className="w-full max-w-sm h-px bg-gray-50 my-4" />
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
              © Sahimed 2026. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
