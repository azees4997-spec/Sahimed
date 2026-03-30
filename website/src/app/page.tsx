"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShieldCheck, ChevronRight, Phone, FileText, Star, HeartPulse, Zap, ShieldPlus, Package, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/CartContext';
import { useMongoDBCollection } from '@/hooks/use-mongodb';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
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

  const db = useFirestore();
  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'banners'), where('isActive', '==', true), orderBy('order', 'asc')) : null, [db]);
  const { data: banners, isLoading: isBannersLoading } = useCollection(bannersQuery);

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
        
        {/* Full Width Hero HeroSection (Outside main container) */}
        <section className="relative w-full bg-[#FFF9F9] border-b border-rose-50/50">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
            <Carousel setApi={setApi} plugins={[plugin.current]} className="w-full">
              <CarouselContent>
                {isBannersLoading ? (
                  <CarouselItem>
                     <Skeleton className="w-full min-h-[200px] sm:min-h-[360px] rounded-[24px]" />
                  </CarouselItem>
                ) : (banners && banners.length > 0) ? (
                  banners.map((b) => (
                    <CarouselItem key={b.id}>
                      <div className="relative overflow-hidden p-5 sm:p-10 flex flex-col justify-center min-h-[200px] sm:min-h-[360px] rounded-[24px] bg-slate-900 shadow-xl group">
                        {b.imageUrl && <Image src={b.imageUrl} alt={b.title || 'Banner'} fill className="object-cover absolute inset-0 opacity-40 group-hover:scale-105 transition-transform duration-700" />}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />
                        <div className="space-y-2 max-w-xl relative z-10 pointer-events-none">
                          <Badge className="bg-primary/20 text-primary border-primary/30 font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-[7px]">Sahimed Exclusive</Badge>
                          <h2 className="text-xl sm:text-3xl font-black leading-tight tracking-tighter text-white uppercase font-outfit">{b.title}</h2>
                          {b.subtitle && <p className="text-slate-300 font-bold text-[10px] sm:text-base">{b.subtitle}</p>}
                        </div>
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <>
                    <CarouselItem>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-between min-h-[220px] sm:h-[360px] group"
                      >
                          <div className="relative z-10 w-full sm:w-1/2 flex flex-col items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5">
                            <h1 className="text-3xl sm:text-4xl font-black leading-[1.05] tracking-tighter text-slate-900 font-outfit uppercase">
                                Affordable Solutions for <br className="hidden sm:block" />
                                <span className="text-primary italic">Everyday Care</span>
                            </h1>

                            <div className="flex flex-col gap-2 sm:gap-2 w-full items-center sm:items-start">
                               <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-white/50">
                                  <div className="w-4 h-4 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                                     <ShieldCheck className="w-2.5 h-2.5 text-white" />
                                  </div>
                                  <span className="text-slate-800 font-black uppercase tracking-[0.1em] text-[9px] sm:text-[10px]">Trusted by 10L+ users</span>
                               </div>
                            </div>

                            <button 
                               onClick={() => { 
                                 if (window.innerWidth < 640) {
                                   const searchBtn = document.querySelector('button[onClick*="setIsSearchOverlayOpen"]');
                                   if (searchBtn instanceof HTMLElement) searchBtn.click();
                                 } else {
                                   window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                   document.querySelector('input')?.focus();
                                 }
                               }}
                               className="w-full max-w-[280px] sm:max-w-sm mt-2 bg-primary text-white rounded-full p-1 shadow-2xl shadow-primary/30 flex items-center border border-white/20 active:scale-95 transition-all group"
                            >
                               <div className="flex-1 px-4 text-left text-[11px] sm:text-[12px] font-black uppercase tracking-widest">
                                  Search Medicines
                               </div>
                               <div className="bg-white/20 p-2.5 rounded-full group-hover:bg-white/30 transition-colors">
                                  <Search className="w-4 h-4 text-white" />
                               </div>
                            </button>
                         </div>

                         <div className="relative z-10 w-full sm:w-5/12 flex justify-center mt-6 sm:mt-0">
                            <div className="relative w-36 h-36 sm:w-[300px] sm:h-[300px] rounded-full border-[6px] sm:border-[10px] border-white shadow-2xl overflow-hidden bg-white">
                               <Image 
                                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
                                  alt="Healthcare Professional" 
                                  fill
                                  priority
                                  className="object-cover object-top" 
                               />
                            </div>
                         </div>
                      </motion.div>
                    </CarouselItem>
                  </>
                )}
              </CarouselContent>
            </Carousel>

            {/* QUICK ACTIONS INTEGRATED INTO HERO CONTAINER */}
            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6">
              {[
                { label: 'Upload Rx', href: '/prescription', sub: 'Easy Upload', color: 'bg-lavender', iconColor: 'bg-primary text-white', icon: FileText },
                { label: 'WhatsApp', href: 'https://wa.me/91XXXXXXXXXX', sub: 'Chat & Order', color: 'bg-green-50', iconColor: 'bg-[#25D366] text-white', icon: () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" className="w-4 h-4 sm:w-6 sm:h-6"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a5 5 0 1 1 5 5h-1a.5.5 0 0 0 0 1h1a5 5 0 1 1 5 5" /></svg> },
                { label: 'Call Order', href: 'tel:+91XXXXXXXXXX', sub: 'Direct Call', color: 'bg-sahi-pink', iconColor: 'bg-rose-500 text-white', icon: Phone }
              ].map((action, i) => (
                <motion.div key={i} whileTap={{ scale: 0.96 }}>
                  <Link href={action.href} className={cn("group h-full p-4 sm:p-7 rounded-[28px] sm:rounded-[36px] flex flex-col items-center text-center gap-2 sm:gap-4 transition-all border border-white shadow-xl shadow-slate-200/40 overflow-hidden", action.color)}>
                     <div className={cn("w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-[14px] sm:rounded-[18px] shadow-lg", action.iconColor)}>
                        <action.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                     </div>
                     <div className="space-y-0.5">
                        <h3 className="font-outfit font-black text-slate-900 text-[10px] sm:text-[12px] tracking-tight leading-tight uppercase line-clamp-1">{action.label}</h3>
                        <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">{action.sub}</p>
                     </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:py-16 space-y-12 sm:space-y-24 pb-24 sm:pb-40">

          {/* Most Popular Brands (Best Sellers) */}
          {(isBestLoading || (bestSellers && bestSellers.length > 0)) && (
            <section className="space-y-4 sm:space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Our Most Popular Brands</h2>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700 border-none font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-[7px] sm:text-[9px]">Best Sellers</Badge>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-10 overflow-x-auto scrollbar-hide pb-8 px-2">
                {isBestLoading ? (
                  [...Array(4)].map((_, i) => <Skeleton className="min-w-[140px] sm:min-w-[280px] aspect-[4/5] rounded-[32px] sm:rounded-[48px]" key={i} />)
                ) : bestSellers?.map((p: any) => (
                  <div key={p.id} className="min-w-[140px] sm:min-w-[280px]">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4 sm:space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Shop by category</h2>
              <Link href="/categories" className="text-[9px] sm:text-[11px] font-black tracking-widest text-primary uppercase flex items-center gap-1.5">Explore All <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="flex gap-4 sm:gap-10 overflow-x-auto scrollbar-hide pb-4 px-2">
              {isCatsLoading ? (
                [...Array(6)].map((_, i) => <Skeleton className="w-20 h-20 sm:w-32 sm:h-32 rounded-[24px] shrink-0" key={i} />)
              ) : categories?.map((cat: any, i) => (
                <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-3 shrink-0">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className={cn(
                      "w-20 h-20 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[48px] flex items-center justify-center border border-white shadow-sm p-4",
                      i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                    )}>
                    <Image src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} alt={cat.name} width={128} height={128} className="object-contain w-full h-full" />
                  </motion.div>
                  <span className="text-[9px] sm:text-xs font-black text-slate-500 tracking-tight uppercase">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Free Delivery Banner (Moved below Categories) */}
          <section className="bg-slate-900 px-6 py-6 sm:px-12 sm:py-10 rounded-[24px] sm:rounded-[48px] text-white flex flex-row items-center justify-between gap-4 shadow-3xl relative overflow-hidden">
            <div className="space-y-2 relative z-10 max-w-xl text-left flex-1 min-w-0">
               <h3 className="text-lg sm:text-3xl font-black tracking-tighter uppercase leading-tight text-white">
                 Pan India Free Delivery<br className="max-sm:hidden"/> Above ₹499
               </h3>
               <p className="text-[9px] sm:text-xs font-bold text-white/60 uppercase tracking-widest truncate">
                 Order Now & Save More
               </p>
               <Link href="/search" className="inline-block mt-3 px-6 py-2.5 sm:py-3.5 bg-primary text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl">
                 Shop Now
               </Link>
            </div>
            <div className="relative z-10 shrink-0 right-0 sm:right-4">
               <div className="w-16 h-16 sm:w-28 sm:h-28 bg-primary/20 rounded-[20px] sm:rounded-[40px] flex items-center justify-center border border-primary/30">
                 <Package className="w-8 h-8 sm:w-16 sm:h-16 text-primary" />
               </div>
            </div>
          </section>

          {/* Top Sellers */}
          <section className="space-y-6">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter uppercase font-outfit px-2">Best Sellers</h2>
            <div className="flex gap-4 sm:gap-10 overflow-x-auto scrollbar-hide pb-8 px-2">
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton className="min-w-[140px] sm:min-w-[280px] aspect-[4/5] rounded-[32px] sm:rounded-[48px]" key={i} />)
              ) : medicines?.map((p: any) => (
                <div key={p.id} className="min-w-[140px] sm:min-w-[280px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </PageTransition>
  );
}

// Add the missing FlaskConical icon import if not found
import { FlaskConical } from 'lucide-react';