
"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Camera, ChevronRight, Wind, ShieldPlus, Phone, Dna, Truck } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORIES as LOCAL_CATEGORIES, PRODUCTS as LOCAL_PRODUCTS } from '@/lib/data';

export default function Home() {
  const db = useFirestore();
  const autoplayRef = React.useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false })
  );

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(12));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(12));
  }, [db]);

  // SIMPLIFIED QUERY: Removed 'where' to avoid composite index requirements during development
  const bannersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'), limit(5));
  }, [db]);

  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: catsLoading } = useCollection(categoriesQuery);
  const { data: dbBanners, isLoading: bannersLoading } = useCollection(bannersQuery);

  const displayBanners = React.useMemo(() => {
    // 1. If we have database banners, filter for active ones and return
    if (dbBanners && dbBanners.length > 0) {
      const activeBanners = dbBanners.filter(b => b.isActive !== false);
      if (activeBanners.length > 0) return activeBanners;
    }
    
    // 2. Fallback to premium static design if no dynamic banners exist or are still loading
    return PlaceHolderImages.filter(img => img.id.startsWith('hero-')).slice(0, 3).map((b, idx) => ({
      id: b.id,
      imageUrl: b.imageUrl,
      title: "UPTO 81% DISCOUNT",
      subtitle: "On All Medicines & Health Products",
      hindiTagline: "सही दवा, सही दाम"
    }));
  }, [dbBanners]);

  const displayMedicines = React.useMemo(() => {
    if (medicines && medicines.length > 0) return medicines;
    return LOCAL_PRODUCTS.slice(0, 12);
  }, [medicines]);

  const displayCategories = React.useMemo(() => {
    if (categories && categories.length > 0) return categories;
    return LOCAL_CATEGORIES.map((cat, idx) => ({
      id: `local-cat-${idx}`,
      name: cat.name,
      imageUrl: `https://picsum.photos/seed/cat-${cat.name.toLowerCase().replace(/\s/g, '-')}/300/300`
    }));
  }, [categories]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F6] pharma-bg-pattern page-transition-wrapper">
      <Navbar />
      <main className="flex-1 relative overflow-hidden pb-12">
        <div className="absolute top-40 right-10 opacity-5 pointer-events-none rotate-12 hidden lg:block"><Dna size={400} /></div>

        <section className="py-2 sm:py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-10">
            <Carousel className="w-full" opts={{ loop: true, align: 'start' }} plugins={[autoplayRef.current]}>
              <CarouselContent>
                {displayBanners.map((banner, index) => {
                  const isFallback = banner.id.startsWith('hero-');
                  
                  return (
                    <CarouselItem key={banner.id}>
                      <div className="relative rounded-[32px] sm:rounded-[48px] overflow-hidden aspect-[16/9] sm:aspect-[24/9] bg-white shadow-2xl border group">
                        
                        {isFallback ? (
                          <div className="flex h-full w-full relative">
                            {/* Banner Left: Premium Typography (Only for Fallbacks) */}
                            <div className="relative z-20 flex-1 flex flex-col justify-center p-6 sm:p-16">
                              <div className="max-w-2xl space-y-3 sm:space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                   <div className="bg-primary p-1.5 sm:p-2 rounded-xl shadow-lg shadow-primary/20">
                                     <div className="text-white font-black text-[10px] sm:text-sm">SM</div>
                                   </div>
                                   <span className="text-primary font-black text-xl sm:text-4xl tracking-tighter uppercase">SahiMed</span>
                                </div>
                                
                                <div className="space-y-1 sm:space-y-2">
                                  <h1 className="text-3xl sm:text-[84px] font-black uppercase tracking-tighter leading-[0.85] text-[#FF4D00] drop-shadow-sm whitespace-pre-line">
                                    {banner.title}
                                  </h1>
                                  <p className="text-[10px] sm:text-2xl font-black text-[#1E3A8A] uppercase tracking-tight leading-tight">
                                    {banner.subtitle}
                                  </p>
                                </div>

                                <div className="pt-4">
                                  <Link href="/search">
                                    <Button size="lg" className="rounded-full bg-primary text-white h-10 sm:h-16 px-8 sm:px-12 text-[10px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-primary/90 shadow-2xl shadow-primary/20">
                                      Explore Store
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Banner Right: Clinical Image with Masking */}
                            <div className="absolute top-0 right-0 bottom-0 w-1/2 sm:w-[65%] z-10">
                              <Image 
                                src={banner.imageUrl} 
                                alt={banner.title || "Promotion"} 
                                fill 
                                sizes="(max-width: 768px) 50vw, 65vw"
                                className="object-cover object-center group-hover:scale-105 transition-transform duration-[2000ms]"
                                priority={index === 0}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
                            </div>

                            {/* Global Hindi Tagline: Bottom Anchored */}
                            <div className="absolute bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                              <span className="text-[#1E3A8A] font-black text-xs sm:text-3xl uppercase tracking-widest whitespace-nowrap drop-shadow-sm">
                                {banner.hindiTagline}
                              </span>
                              <div className="w-12 sm:w-20 h-1 bg-primary rounded-full mt-1 opacity-20" />
                            </div>
                          </div>
                        ) : (
                          /* CUSTOM BANNER: FULL WIDTH IMAGE ONLY (Resolves Overlap & Cutting) */
                          <Link href="/search" className="block w-full h-full relative">
                            <Image 
                              src={banner.imageUrl} 
                              alt={banner.title || "Promotion"} 
                              fill 
                              sizes="100vw"
                              className="object-cover object-center transition-all duration-500"
                              priority={index === 0}
                            />
                          </Link>
                        )}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* PAN-INDIA MOTIVATIONAL LINES */}
        <section className="py-2 sm:py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[32px] border-2 border-primary/5 shadow-xl flex items-center gap-5 group transition-all hover:border-primary/20">
                <div className="w-14 h-14 bg-primary/10 rounded-[20px] flex items-center justify-center shrink-0 shadow-lg shadow-primary/5 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-sm sm:text-base text-gray-900 uppercase tracking-tight leading-none">Pan-India Delivery</h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                    Order online, get delivered fast to your doorstep anywhere in India.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-[32px] border-2 border-accent/5 shadow-xl flex items-center gap-5 group transition-all hover:border-accent/20">
                <div className="w-14 h-14 bg-accent/10 rounded-[20px] flex items-center justify-center shrink-0 shadow-lg shadow-accent/5 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-accent" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-sm sm:text-base text-accent uppercase tracking-tight leading-none">Affordable Medicines Pan-India</h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                    Switch to Quality Generics & Save Big!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-2 sm:py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12 flex flex-col gap-3">
             <Link href="/prescription">
                <Button className="w-full h-14 sm:h-16 rounded-[24px] bg-white border-2 border-primary/5 text-primary hover:bg-primary/5 shadow-md flex items-center justify-between px-6 group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Camera className="w-4 sm:w-5 h-4 sm:h-5" /></div>
                    <div className="text-left"><p className="font-black text-[12px] sm:text-sm uppercase tracking-tight text-gray-900">Upload Prescription</p><p className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Pharmacist Review System</p></div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-40" />
                </Button>
             </Link>
             <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" className="h-14 rounded-[24px] border-2 border-green-200 bg-white text-[#22C55E] font-black uppercase text-[9px] sm:text-[10px] tracking-widest gap-2 shadow-sm"><Activity className="w-4 h-4" /> WhatsApp</Button>
               <Button variant="outline" className="h-14 rounded-[24px] border-2 border-blue-200 bg-white text-[#1E3A8A] font-black uppercase text-[9px] sm:text-[10px] tracking-widest gap-2 shadow-sm"><Phone className="w-4 h-4" /> Call Store</Button>
             </div>
          </div>
        </section>

        <section className="py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-[0.3em]">Health Categories</h2>
              <Link href="/search" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-6">
              {displayCategories.map((cat: any) => {
                const categoryImage = cat.imageUrl || `https://picsum.photos/seed/cat-${cat.name.toLowerCase().replace(/\s/g, '-')}/300/300`;
                return (
                  <Link key={cat.id} href={`/search?c=${cat.name}`} className="group flex flex-col items-center">
                    <div className="w-full aspect-square bg-white rounded-[24px] flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-100 p-0 group-hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                      <Image 
                        src={categoryImage} 
                        alt={cat.name} 
                        fill 
                        sizes="(max-width: 768px) 30vw, 15vw" 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                    </div>
                    <h3 className="font-black text-[8px] sm:text-[10px] text-gray-700 uppercase tracking-tighter truncate w-full text-center">{cat.name}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-10 bg-white border-t mt-6 rounded-t-[40px] shadow-lg relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="space-y-1"><h2 className="text-[12px] sm:text-[13px] font-black text-gray-900 uppercase tracking-[0.3em]">Best Sellers</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Targeted Clinical Stock</p></div>
              <Link href="/search" className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">All Products <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayMedicines.map((p: any) => (<ProductCard key={p.id} product={p} />))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
