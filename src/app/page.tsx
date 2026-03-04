"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Camera, ChevronRight, Wind, ShieldPlus, Phone, MessageCircle, Dna } from 'lucide-react';
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
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(20));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(12));
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

  const displayMedicines = medicines?.slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F6] pharma-bg-pattern page-transition-wrapper">
      <Navbar />

      <main className="flex-1 relative overflow-hidden pb-12">
        <div className="absolute top-40 right-10 opacity-5 pointer-events-none rotate-12 hidden lg:block">
           <Dna size={400} />
        </div>

        <section className="py-2 sm:py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <Carousel 
              className="w-full" 
              opts={{ loop: true, align: 'start' }}
              plugins={[autoplayRef.current]}
            >
              <CarouselContent>
                {heroBanners.map((banner, index) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden aspect-[16/9] sm:aspect-[24/8] bg-primary shadow-2xl border border-gray-100 group">
                      <Image 
                        src={banner.imageUrl} 
                        alt={banner.description} 
                        fill 
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                        data-ai-hint={banner.imageHint}
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 1200px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex items-end p-6 sm:p-16">
                        <div className="max-w-2xl text-white space-y-3 sm:space-y-6">
                          <span className="bg-accent text-white text-[8px] sm:text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg inline-block">
                            {index === 0 ? 'Switch & Save' : index === 1 ? 'Express Delivery' : 'Verified Quality'}
                          </span>
                          <h1 className="text-lg sm:text-5xl font-black font-headline uppercase tracking-tighter leading-tight text-balance">
                            {banner.description}
                          </h1>
                          <div className="pt-1 sm:pt-6">
                            <Link href="/search">
                              <Button size="lg" className="rounded-full bg-white text-primary h-10 sm:h-16 px-6 sm:px-16 text-[9px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all shadow-2xl">
                                Explore Store
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

        <section className="py-2 sm:py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12 flex flex-col gap-3">
             <Link href="/prescription">
                <Button className="w-full h-14 sm:h-16 rounded-[24px] bg-white border-2 border-primary/5 text-primary hover:bg-primary/5 shadow-md flex items-center justify-between px-6 group active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-4 sm:w-5 h-4 sm:h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[12px] sm:text-sm uppercase tracking-tight text-gray-900">Upload Prescription</p>
                      <p className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Pharmacist Review System</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-40" />
                </Button>
             </Link>

             <div className="grid grid-cols-2 gap-3">
               <Button 
                variant="outline" 
                className="h-14 rounded-[24px] border-2 border-green-200 bg-white text-[#22C55E] hover:bg-green-50 active:bg-green-100 font-black uppercase text-[9px] sm:text-[10px] tracking-widest gap-2 transition-all shadow-sm active:scale-95"
                onClick={() => window.open('https://wa.me/91XXXXXXXXXX', '_blank')}
               >
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                 </svg> WhatsApp
               </Button>
               <Button 
                variant="outline" 
                className="h-14 rounded-[24px] border-2 border-blue-200 bg-white text-[#1E3A8A] hover:bg-blue-50 active:bg-blue-100 font-black uppercase text-[9px] sm:text-[10px] tracking-widest gap-2 transition-all shadow-sm active:scale-95"
                onClick={() => window.location.href = 'tel:+91XXXXXXXXXX'}
               >
                 <Phone className="w-4 h-4" /> Call Store
               </Button>
             </div>
          </div>
        </section>

        <section className="py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-[0.3em]">Health Categories</h2>
              <Link href="/search" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
            </div>
            {catsLoading ? (
              <div className="grid grid-cols-3 gap-3 sm:gap-4 sm:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-[24px]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:gap-4 sm:grid-cols-6">
                {categories?.map((cat: any) => (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center active:scale-95 transition-transform">
                    <div className="w-full aspect-square bg-white rounded-[24px] flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-100 p-4 sm:p-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 hover:shadow-lg">
                      {getIcon(cat.name)}
                    </div>
                    <h3 className="font-black text-[8px] sm:text-[10px] text-gray-700 uppercase tracking-tighter truncate w-full text-center group-hover:text-primary transition-colors">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-6 sm:py-10 bg-white border-t border-gray-100 mt-6 rounded-t-[40px] shadow-lg relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="space-y-1">
                <h2 className="text-[12px] sm:text-[13px] font-black text-gray-900 uppercase tracking-[0.3em]">Best Sellers</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Most trusted by patients</p>
              </div>
              <Link href="/search" className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                All Products <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            {medsLoading || !displayMedicines ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                     <Skeleton className="aspect-[5/4] rounded-[24px] shimmer" />
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 shimmer" />
                        <Skeleton className="h-2 w-1/2 shimmer" />
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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