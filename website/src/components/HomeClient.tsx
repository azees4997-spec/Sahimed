"use client"

import * as React from 'react';
import { ChevronRight, Phone, MessageCircle, FileText, Search, Package, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeClientProps {
  banners: any[];
  categories: any[];
  bestSellers: any[];
  medicines: any[];
}

export default function HomeClient({ banners, categories, bestSellers, medicines }: HomeClientProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="space-y-6 sm:space-y-12 pb-20 sm:pb-32 overflow-x-hidden max-w-full">
      {/* Banner Carousel */}
      {banners && banners.length > 0 && (
        <section className="w-full">
          <Carousel
            setApi={setApi}
            plugins={[plugin.current]}
            className="w-full relative group"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {banners.map((banner, index) => (
                <CarouselItem key={index}>
                  <Link href={banner.link || '/search'} className="block relative w-full aspect-[21/9] sm:aspect-[3/1] rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/20 shadow-lg">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || 'Special Offer'}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority={index === 0}
                    />
                    {banner.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 sm:p-8">
                        <h3 className="text-white text-lg sm:text-3xl font-black uppercase tracking-tight leading-none">{banner.title}</h3>
                        {banner.subtitle && <p className="text-white/80 text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1 sm:mt-2">{banner.subtitle}</p>}
                      </div>
                    )}
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Progress Dots */}
            <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 sm:h-1.5 transition-all duration-300 rounded-full",
                    current === i ? "w-6 sm:w-10 bg-white" : "w-1.5 sm:w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
          </Carousel>
        </section>
      )}

      {/* Most Popular Brands (Best Sellers) */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="space-y-3 sm:space-y-5 max-w-full">
          <div className="flex items-center justify-between px-1 sm:px-2">
            <h2 className="text-base sm:text-lg font-black text-primary tracking-tighter uppercase font-outfit">Most Popular Brands</h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge className="bg-yellow-100 text-yellow-700 border-none font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest text-[6px] sm:text-[8px]">Best Sellers</Badge>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide pb-2 sm:pb-4 px-1 sm:px-2">
            {bestSellers.slice(0, 5).map((p: any) => (
              <div key={p.id} className="min-w-[120px] sm:min-w-[180px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
 
      <section className="space-y-3 sm:space-y-5 max-w-full">
        <div className="flex items-center justify-between px-1 sm:px-2">
          <h2 className="text-base sm:text-lg font-black text-primary tracking-tighter uppercase font-outfit">Top Categories</h2>
          <Link href="/categories" className="text-[8px] sm:text-[10px] font-black tracking-widest text-primary uppercase flex items-center gap-1">Explore All <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-3 sm:flex sm:overflow-x-auto sm:scrollbar-hide gap-3 sm:gap-6 pb-2 sm:pb-4 px-1 sm:px-2 max-w-full">
          {categories.slice(0, 12).map((cat: any, i: number) => (
            <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-1.5 sm:gap-2 group/cat shrink-0 sm:w-24">
              <div 
                className={cn(
                  "w-20 h-20 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden p-0 transition-all duration-300 group-hover/cat:-translate-y-1",
                  i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                )}>
                <Image 
                  src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} 
                  alt={cat.name} 
                  width={120} 
                  height={120} 
                  className="object-cover w-full h-full transition-transform duration-700 group-hover/cat:scale-110" 
                  loading="lazy"
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-700 tracking-tight uppercase text-center line-clamp-1 h-4 px-1">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
 
      {/* Free Delivery Banner */}
      <section className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 px-4 py-4 sm:px-8 sm:py-6 rounded-[24px] sm:rounded-[32px] text-white flex flex-row items-center justify-between gap-3 sm:gap-6 border border-white/20 shadow-xl shadow-orange-500/10 relative overflow-hidden group max-w-full">
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        <div className="space-y-0.5 sm:space-y-1 relative z-10 max-w-xl text-left flex-1 min-w-0">
           <h3 className="text-base sm:text-xl font-black tracking-tighter uppercase leading-tight">
             Pan India Free Delivery<br className="max-sm:hidden"/> Above ₹499
           </h3>
           <p className="text-[7px] sm:text-[9px] font-bold text-white/80 uppercase tracking-widest truncate">
             Order Now & Save More
           </p>
           <Link href="/search" className="inline-block mt-1.5 sm:mt-2 px-4 py-2 sm:px-5 sm:py-2 bg-white text-primary font-black text-[8px] sm:text-[9px] uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl shadow-black/10">
             Shop Now
           </Link>
        </div>
        <div className="relative z-10 shrink-0">
           <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-[14px] sm:rounded-[28px] flex items-center justify-center border border-white shadow-xl shadow-slate-200/10">
             <Package className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
           </div>
        </div>
      </section>
 
      {/* Best Sellers */}
      <section className="space-y-3 sm:space-y-5 max-w-full">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tighter uppercase font-outfit px-1 sm:px-2">Top Selections</h2>
        <div className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide pb-4 sm:pb-6 px-1 sm:px-2">
          {medicines.map((p: any) => (
            <div key={p.id} className="min-w-[120px] sm:min-w-[180px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
