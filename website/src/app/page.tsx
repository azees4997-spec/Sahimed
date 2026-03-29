"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShieldCheck, ChevronRight, Phone, FileText, Star, HeartPulse, Zap, ShieldPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/CartContext';
import { useMongoDBCollection } from '@/hooks/use-mongodb';
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

export default function Home() {
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

  const [categories, setCategories] = React.useState<any[]>([]);
  const [isCatsLoading, setIsCatsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/categories?limit=12')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
        setIsCatsLoading(false);
      });
  }, []);

  const { data: medicines, isLoading, refetch } = useMongoDBCollection({ limit: 50 });
  const { data: bestSellers, isLoading: isBestLoading } = useMongoDBCollection({ limit: 20, isBestSeller: 'true' });

  React.useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    refetch(); 
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 py-4 sm:py-10 space-y-6 sm:space-y-16 pb-24 sm:pb-40">
          
          {/* Main Banner */}
          <section className="relative w-full">
            <Carousel setApi={setApi} plugins={[plugin.current]} className="w-full">
              <CarouselContent>
                <CarouselItem>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden p-8 sm:p-20 flex flex-col justify-center min-h-[220px] sm:min-h-[460px] rounded-[40px] sm:rounded-[64px] bg-lavender text-slate-800 shadow-xl border border-white"
                  >
                    <div className="space-y-4 sm:space-y-8 relative z-10 max-w-2xl">
                      <h1 className="text-3xl sm:text-7xl font-black leading-[1.1] tracking-tighter text-slate-900">
                        Affordable medicines<br />across India
                      </h1>
                      <p className="text-primary font-bold text-sm sm:text-3xl tracking-tight">Sahi Dawai, Sahi Daam pe</p>
                    </div>
                    <div className="absolute right-[-20px] sm:right-20 top-1/2 -translate-y-1/2 opacity-20 sm:opacity-100">
                      <motion.div
                        animate={{ scale: [1, 1.02, 1], rotate: [0, 1, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="text-primary"
                      >
                        <HeartPulse size={340} strokeWidth={1} />
                      </motion.div>
                    </div>
                  </motion.div>
                </CarouselItem>

                <CarouselItem>
                  <div className="relative overflow-hidden p-8 sm:p-20 flex flex-col justify-center min-h-[220px] sm:min-h-[460px] rounded-[40px] sm:rounded-[64px] bg-sahi-pink text-slate-900 shadow-xl border border-white">
                    <div className="space-y-4 max-w-2xl relative z-10">
                      <Badge className="bg-primary/20 text-primary border-primary/30 font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">Matrix AI</Badge>
                      <h2 className="text-3xl sm:text-7xl font-black leading-[1.1] tracking-tighter">Save up to 80% on<br />Clinical Generics</h2>
                      <p className="text-slate-600 font-bold text-sm sm:text-2xl">Verified molecules with guaranteed efficacy.</p>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </section>

          {/* Quick Actions Grid - MATCHING REFERENCE IMAGE */}
          <section className="grid grid-cols-3 gap-2 sm:gap-8">
            {[
              { label: 'Upload prescription', href: '/prescription', color: 'bg-lavender', iconColor: 'bg-primary text-white', icon: FileText },
              { label: 'Order Via WhatsApp', href: 'https://wa.me/91XXXXXXXXXX', color: 'bg-sahi-green', iconColor: 'bg-green-600 text-white', icon: MessageCircle },
              { label: 'Call for Medicines', href: 'tel:+91XXXXXXXXXX', color: 'bg-sahi-pink', iconColor: 'bg-rose-500 text-white', icon: Phone }
            ].map((action, i) => (
              <motion.div key={i} whileTap={{ scale: 0.96 }}>
                <Link href={action.href} className={cn("group h-full p-4 sm:p-12 rounded-[32px] sm:rounded-[56px] flex flex-col items-center text-center gap-3 sm:gap-6 transition-all border border-white shadow-sm overflow-hidden", action.color)}>
                  <div className={cn("w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center rounded-[18px] sm:rounded-[40px] shadow-lg", action.iconColor)}>
                    <action.icon className="w-6 h-6 sm:w-12 sm:h-12" />
                  </div>
                  <h3 className="font-outfit font-bold text-slate-700 text-[10px] sm:text-2xl tracking-tight leading-tight">{action.label}</h3>
                </Link>
              </motion.div>
            ))}
          </section>

          {/* Most Popular Brands (Best Sellers) */}
          {(isBestLoading || (bestSellers && bestSellers.length > 0)) && (
            <section className="space-y-6 sm:space-y-12">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Our Most Popular Brands</h2>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700 border-none font-black px-3 py-1 rounded-full uppercase tracking-widest text-[8px] sm:text-[10px]">Best Sellers</Badge>
                </div>
              </div>
              <div className="flex gap-6 sm:gap-10 overflow-x-auto scrollbar-hide pb-12 px-2">
                {isBestLoading ? (
                  [...Array(4)].map((_, i) => <Skeleton className="min-w-[190px] sm:min-w-[320px] aspect-[4/5] rounded-[48px]" key={i} />)
                ) : bestSellers?.map((p: any) => (
                  <div key={p.id} className="min-w-[190px] sm:min-w-[320px]">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories Horizontal Scroll */}
          <section className="space-y-6 sm:space-y-12">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Shop by category</h2>
              <Link href="/categories" className="text-[10px] sm:text-sm font-black tracking-widest text-primary uppercase flex items-center gap-2">Explore All <ChevronRight className="w-4 h-4" /></Link>
            </div>
            <div className="flex gap-4 sm:gap-12 overflow-x-auto scrollbar-hide pb-6 px-2">
              {isCatsLoading ? (
                [...Array(6)].map((_, i) => <Skeleton className="w-24 h-24 sm:w-48 sm:h-48 rounded-[32px] shrink-0" key={i} />)
              ) : categories?.map((cat: any, i) => (
                <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-4 shrink-0">
                  <motion.div 
                    whileHover={{ y: -8 }}
                    className={cn(
                      "w-24 h-24 sm:w-48 sm:h-48 rounded-[32px] sm:rounded-[56px] flex items-center justify-center border border-white shadow-sm p-3",
                      i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                    )}>
                    <Image src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} alt={cat.name} width={192} height={192} className="object-contain w-full h-full" />
                  </motion.div>
                  <span className="text-[10px] sm:text-lg font-black text-slate-500 tracking-tight uppercase">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Top Sellers */}
          <section className="space-y-8">
            <h2 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit px-2">Top Clinical Sellers</h2>
            <div className="flex gap-6 sm:gap-10 overflow-x-auto scrollbar-hide pb-12 px-2">
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton className="min-w-[180px] aspect-[4/5] rounded-[48px]" key={i} />)
              ) : medicines?.map((p: any) => (
                <div key={p.id} className="min-w-[190px] sm:min-w-[320px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>

          {/* Clinical Assurance Banner */}
          <section className="bg-slate-900 p-10 sm:p-24 rounded-[48px] sm:rounded-[80px] text-white flex flex-col items-center text-center gap-8 shadow-3xl relative overflow-hidden">
            <div className="w-24 h-24 bg-primary/20 rounded-[40px] flex items-center justify-center relative z-10">
               <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-4 relative z-10 max-w-3xl">
               <h3 className="text-3xl sm:text-6xl font-black tracking-tighter uppercase leading-tight">Verified Clinical Pharmacy</h3>
               <p className="text-sm sm:text-2xl font-bold text-white/60 uppercase tracking-widest">Always Lab Certified • India's Clinical Registry Interface</p>
            </div>
            <Link href="/search" className="w-full sm:w-auto px-16 py-6 bg-primary text-white font-black text-xs sm:text-base uppercase tracking-widest rounded-full relative z-10 hover:scale-105 transition-all shadow-xl">
              Start Clinic Search
            </Link>
            <div className="absolute top-0 right-0 p-10 opacity-5">
               <FlaskConical size={400} />
            </div>
          </section>
        </main>
      </div>
    </PageTransition>
  );
}

// Add the missing FlaskConical icon import if not found
import { FlaskConical } from 'lucide-react';