
"use client"

import * as React from 'react';
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
    const props = { className: "w-3.5 h-3.5" };
    if (n.includes('diabet')) return <Activity {...props} />;
    if (n.includes('heart')) return <HeartPulse {...props} />;
    if (n.includes('gastro')) return <Zap {...props} />;
    if (n.includes('derma')) return <Sparkles {...props} />;
    return <Activity {...props} />;
  };

  // Filter out products with zero stock for storefront display
  const availableMedicines = medicines?.filter(p => (p.availableQuantity || 0) > 0).slice(0, 12);

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
                    <div className="relative rounded-[24px] overflow-hidden aspect-[21/9] sm:aspect-[21/9] bg-primary shadow-sm border border-gray-100">
                      <Image 
                        src={banner.imageUrl} 
                        alt={banner.description} 
                        fill 
                        className="object-cover opacity-60"
                        data-ai-hint={banner.imageHint}
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent flex items-end p-4 sm:p-12">
                        <div className="max-w-full text-white space-y-1 sm:space-y-4">
                          <span className="hidden sm:inline-block bg-accent text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                            {index === 0 ? 'Switch & Save' : index === 1 ? 'Fast Delivery' : 'Clinical Trust'}
                          </span>
                          <h1 className="text-[14px] sm:text-4xl font-black font-headline uppercase tracking-tighter leading-none text-balance">
                            {banner.description}
                          </h1>
                          <div className="pt-1 sm:pt-4">
                            <Link href="/search">
                              <Button size="sm" className="rounded-full bg-white text-primary h-7 sm:h-14 px-4 sm:px-12 text-[8px] sm:text-[12px] font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-xl">
                                Browse
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

        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4">
             <Link href="/prescription">
                <Button className="w-full h-16 rounded-2xl bg-white border border-gray-100 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-between px-5 group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[11px] uppercase tracking-tight text-gray-900">Scan Prescription</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Verified Review in 15 Mins</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-2 rounded-full">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                </Button>
             </Link>
          </div>
        </section>

        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Therapy Hub</h2>
            </div>
            {catsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center active:scale-90 transition-transform">
                    <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-50 p-3 group-hover:shadow-lg transition-all">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-black text-[8px] text-gray-400 uppercase tracking-tighter truncate w-full text-center px-0.5">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-8 bg-white border-t border-gray-100 mt-4 rounded-t-[40px] shadow-2xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Clinical Top Deals</h2>
              <Link href="/search" className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">View All <ChevronRight className="w-3 h-3" /></Link>
            </div>
            {medsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {availableMedicines?.map((p: any) => (
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
