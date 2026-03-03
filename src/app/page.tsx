"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Loader2, ShieldCheck, Camera, ChevronRight, Wind, ShieldPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const db = useFirestore();
  const autoplayRef = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
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
    const props = { className: "w-6 h-6 sm:w-8 sm:h-8" };
    if (n.includes('diabet')) return <Activity {...props} />;
    if (n.includes('heart')) return <HeartPulse {...props} />;
    if (n.includes('gastro')) return <Zap {...props} />;
    if (n.includes('derma')) return <Sparkles {...props} />;
    if (n.includes('liver')) return <ShieldPlus {...props} />;
    if (n.includes('respi')) return <Wind {...props} />;
    return <Activity {...props} />;
  };

  const displayMedicines = medicines?.slice(0, 24);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />

      <main className="flex-1 pb-10">
        <section className="bg-white py-2">
          <div className="max-w-7xl mx-auto px-4">
            <Carousel 
              className="w-full" 
              opts={{ loop: true, align: 'start' }}
              plugins={[autoplayRef.current]}
            >
              <CarouselContent>
                {heroBanners.map((banner, index) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative rounded-[32px] overflow-hidden aspect-[16/8] sm:aspect-[21/8] bg-primary shadow-2xl border border-gray-100">
                      <Image 
                        src={banner.imageUrl} 
                        alt={banner.description} 
                        fill 
                        className="object-cover opacity-70"
                        data-ai-hint={banner.imageHint}
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent flex items-end p-6 sm:p-14">
                        <div className="max-w-full text-white space-y-2 sm:space-y-6">
                          <span className="bg-accent text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg inline-block">
                            {index === 0 ? 'Switch & Save' : index === 1 ? 'Fast Delivery' : 'Clinical Trust'}
                          </span>
                          <h1 className="text-lg sm:text-5xl font-black font-headline uppercase tracking-tighter leading-[1.1] text-balance">
                            {banner.description}
                          </h1>
                          <div className="pt-2 sm:pt-6">
                            <Link href="/search">
                              <Button size="lg" className="rounded-full bg-white text-primary h-10 sm:h-16 px-8 sm:px-14 text-[10px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-2xl">
                                Shop Now
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

        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-20 rounded-[32px] bg-white border-2 border-primary/10 text-primary hover:bg-primary/5 shadow-xl shadow-primary/5 flex items-center justify-between px-6 group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[13px] uppercase tracking-tight text-gray-900">Scan Prescription</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Verified Review in 15 Mins</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Button>
             </Link>
          </div>
        </section>

        <section className="py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em]">Shop by Category</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">See All</Link>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-6">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center active:scale-95 transition-transform">
                    <div className="w-full aspect-square bg-white rounded-[28px] flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-100 p-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-black text-[8px] sm:text-[10px] text-gray-700 uppercase tracking-tighter truncate w-full text-center px-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-10 bg-white border-t border-gray-100 mt-6 rounded-t-[50px] shadow-2xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="space-y-1">
                <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.25em]">Clinical Best Sellers</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verified quality medicines</p>
              </div>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
                {displayMedicines?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
