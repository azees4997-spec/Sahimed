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
    <div className="space-y-12 sm:space-y-24 pb-24 sm:pb-40">
      {/* Hero Content Section (Client side parts) */}
      {/* Note: The main structure is in page.tsx, this component handles interactive sections */}
      
      {/* Most Popular Brands (Best Sellers) */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg sm:text-2xl font-black text-primary tracking-tighter uppercase font-outfit">Our Most Popular Brands</h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-700 border-none font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-[7px] sm:text-[9px]">Best Sellers</Badge>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-10 overflow-x-auto scrollbar-hide pb-2 sm:pb-8 px-2">
            {bestSellers.slice(0, 3).map((p: any) => (
              <div key={p.id} className="min-w-[140px] sm:min-w-[280px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 sm:space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg sm:text-2xl font-black text-primary tracking-tighter uppercase font-outfit">Top Categories</h2>
          <Link href="/categories" className="text-[9px] sm:text-[11px] font-black tracking-widest text-primary uppercase flex items-center gap-1.5">Explore All <ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="grid grid-cols-3 sm:flex gap-3 sm:gap-10 pb-4 px-2">
            <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2 group/cat">
              <div 
                className={cn(
                  "w-20 h-20 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[48px] flex items-center justify-center border border-white shadow-sm overflow-hidden p-0 transition-all duration-300 group-hover/cat:-translate-y-1.5",
                  i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                )}>
                <Image 
                  src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} 
                  alt={cat.name} 
                  width={128} 
                  height={128} 
                  className="object-cover w-full h-full" 
                  loading="lazy"
                />
              </div>
              <span className="text-[8px] sm:text-xs font-black text-slate-500 tracking-tight uppercase text-center line-clamp-1 h-3">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Free Delivery Banner */}
      <section className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 px-5 py-5 sm:px-12 sm:py-10 rounded-[28px] sm:rounded-[48px] text-white flex flex-row items-center justify-between gap-4 border border-white/20 shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="space-y-1 relative z-10 max-w-xl text-left flex-1 min-w-0">
           <h3 className="text-lg sm:text-3xl font-black tracking-tighter uppercase leading-tight">
             Pan India Free Delivery<br className="max-sm:hidden"/> Above ₹499
           </h3>
           <p className="text-[8px] sm:text-xs font-bold text-white/80 uppercase tracking-widest truncate">
             Order Now & Save More
           </p>
           <Link href="/search" className="inline-block mt-2 px-5 py-2.5 bg-white text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl shadow-black/10">
             Shop Now
           </Link>
        </div>
        <div className="relative z-10 shrink-0">
           <div className="w-14 h-14 sm:w-28 sm:h-28 bg-white rounded-[20px] sm:rounded-[40px] flex items-center justify-center border border-white shadow-xl shadow-slate-200/10">
             <Package className="w-7 h-7 sm:w-16 sm:h-16 text-primary" />
           </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="space-y-6">
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter uppercase font-outfit px-2">Best Sellers</h2>
        <div className="flex gap-4 sm:gap-10 overflow-x-auto scrollbar-hide pb-8 px-2">
          {medicines.map((p: any) => (
            <div key={p.id} className="min-w-[140px] sm:min-w-[280px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
