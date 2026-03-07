
"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Activity, HeartPulse, Zap, Sparkles, Camera, ChevronRight, Wind, ShieldPlus, Phone, Dna } from 'lucide-react';
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

  // Optimization: 30 unique clinical items grid
  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(60));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(12));
  }, [db]);

  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: catsLoading } = useCollection(categoriesQuery);

  const uniqueMedicines = React.useMemo(() => {
    if (!medicines) return [];
    const seen = new Set();
    return medicines.filter(m => {
      const sku = m.sku || m.id;
      if (seen.has(sku)) return false;
      seen.add(sku);
      return true;
    }).slice(0, 30); 
  }, [medicines]);

  const heroBanners = PlaceHolderImages.filter(img => img.id.startsWith('hero-')).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F6] pharma-bg-pattern page-transition-wrapper">
      <Navbar />
      <main className="flex-1 relative overflow-hidden pb-12">
        <div className="absolute top-40 right-10 opacity-5 pointer-events-none rotate-12 hidden lg:block"><Dna size={400} /></div>

        <section className="py-2 sm:py-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <Carousel className="w-full" opts={{ loop: true, align: 'start' }} plugins={[autoplayRef.current]}>
              <CarouselContent>
                {heroBanners.map((banner, index) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden aspect-[16/9] sm:aspect-[24/8] bg-primary shadow-2xl border group">
                      <Image 
                        src={banner.imageUrl && banner.imageUrl.startsWith('http') ? banner.imageUrl : `https://picsum.photos/seed/hero${index}/1200/400`} 
                        alt={banner.description} 
                        fill 
                        sizes="100vw"
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex items-end p-6 sm:p-16">
                        <div className="max-w-2xl text-white space-y-3 sm:space-y-6">
                          <span className="bg-accent text-white text-[8px] sm:text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg inline-block">CLINICAL PRECISION</span>
                          <h1 className="text-lg sm:text-5xl font-black uppercase tracking-tighter leading-tight">{banner.description}</h1>
                          <Link href="/search"><Button size="lg" className="rounded-full bg-white text-primary h-10 sm:h-16 px-6 sm:px-16 text-[9px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-gray-100 shadow-2xl">Explore Store</Button></Link>
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
            {catsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <Skeleton className="w-full aspect-square rounded-[24px]" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-6">
                {categories?.map((cat: any) => {
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
            )}
          </div>
        </section>

        <section className="py-6 sm:py-10 bg-white border-t mt-6 rounded-t-[40px] shadow-lg relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-12">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="space-y-1"><h2 className="text-[12px] sm:text-[13px] font-black text-gray-900 uppercase tracking-[0.3em]">Best Sellers</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Targeted Clinical Stock</p></div>
              <Link href="/search" className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">All Products <ChevronRight className="w-3 h-3" /></Link>
            </div>
            {medsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[24px] border border-gray-100 p-4 space-y-4">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded-full" />
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">{uniqueMedicines.map((p: any) => (<ProductCard key={p.id} product={p} />))}</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
