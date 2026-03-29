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
        <div className="bg-[#FFF8F8] w-full border-b border-rose-100/30">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-2 sm:pt-6 pb-4 sm:pb-12">
            {/* Main Banner */}
            <section className="relative w-full">
              <Carousel setApi={setApi} plugins={[plugin.current]} className="w-full">
                <CarouselContent>
                  {isBannersLoading ? (
                    <CarouselItem>
                       <Skeleton className="w-full min-h-[220px] sm:min-h-[460px] rounded-[32px] sm:rounded-[48px]" />
                    </CarouselItem>
                  ) : (banners && banners.length > 0) ? (
                    banners.map((b) => (
                      <CarouselItem key={b.id}>
                        <div className="relative overflow-hidden p-8 sm:p-20 flex flex-col justify-center min-h-[220px] sm:min-h-[460px] rounded-[32px] sm:rounded-[48px] bg-slate-900 border border-white shadow-xl group">
                          {b.imageUrl && <Image src={b.imageUrl} alt={b.title || 'Banner'} fill className="object-cover absolute inset-0 opacity-50 group-hover:scale-105 transition-transform duration-700" />}
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
                          <div className="space-y-4 max-w-2xl relative z-10 pointer-events-none">
                            <Badge className="bg-primary/20 text-primary border-primary/30 font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">Sahimed Exclusive</Badge>
                            <h2 className="text-3xl sm:text-7xl font-black leading-[1.1] tracking-tighter text-white">{b.title}</h2>
                            {b.subtitle && <p className="text-slate-300 font-bold text-sm sm:text-2xl">{b.subtitle}</p>}
                            {b.hindiTagline && <p className="text-primary font-black text-xs sm:text-lg tracking-widest mt-4 uppercase">{b.hindiTagline}</p>}
                          </div>
                        </div>
                      </CarouselItem>
                    ))
                  ) : (
                    <>
                      <CarouselItem>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-between min-h-[380px] sm:min-h-[500px] bg-transparent sm:px-10 sm:py-0 group"
                        >
                           <div className="relative z-10 w-full sm:w-1/2 flex flex-col items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 pt-4 sm:pt-0">
                              <h1 className="text-[1.75rem] sm:text-[4rem] font-black leading-[1.1] tracking-tighter text-slate-900 font-outfit uppercase">
                                 Affordable Solutions for <br className="hidden sm:block" />
                                 <span className="text-primary">Everyday Care</span>
                              </h1>

                              <div className="flex flex-col gap-2 sm:gap-3 mt-1 sm:mt-4 w-full items-center sm:items-start">
                                 <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                                       <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                    <span className="text-slate-800 font-extrabold uppercase tracking-widest text-[9px] sm:text-[11px]">Trusted by 10L+ users</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                                       <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                    <span className="text-slate-800 font-extrabold uppercase tracking-widest text-[9px] sm:text-[11px]">Save Upto 80%</span>
                                 </div>
                              </div>

                              <div 
                                 onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => document.querySelector('input')?.focus(), 500); }}
                                 className="w-full max-w-md mt-6 sm:mt-8 bg-white rounded-full p-1.5 shadow-2xl shadow-primary/10 flex items-center border border-slate-100 relative group/search cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                              >
                                 <div className="pl-4">
                                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                 </div>
                                 <div className="flex-1 bg-transparent border-none px-4 text-[10px] sm:text-sm font-bold text-slate-400">
                                    Search for Healthcare Products
                                 </div>
                                 <button className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] sm:text-xs tracking-widest uppercase px-6 py-3 sm:py-4 rounded-full transition-all shadow-lg shrink-0">
                                    Search
                                 </button>
                              </div>
                           </div>

                           <div className="relative z-10 w-full sm:w-5/12 flex justify-center mt-10 sm:mt-0">
                              <div className="relative w-48 h-48 sm:w-[480px] sm:h-[480px] rounded-[48px] sm:rounded-[80px] border-[8px] sm:border-[16px] border-white shadow-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
                                 <Image 
                                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Healthcare Professional" 
                                    fill
                                    priority
                                    className="object-cover object-top hover:scale-110 transition-transform duration-1000" 
                                 />
                              </div>
                           </div>
                        </motion.div>
                      </CarouselItem>
                    </>
                  )}
                </CarouselContent>
              </Carousel>
            </section>
          </div>
        </div>

        {/* Place Your Order Via Call Strip - Full Width Strip */}
        <div className="w-full bg-white border-b border-slate-100 shadow-sm relative z-20">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 flex flex-col sm:flex-row items-center justify-between">
             <div className="flex flex-col text-center sm:text-left mb-6 sm:mb-0">
                <span className="text-[10px] sm:text-sm font-black text-slate-400 tracking-[0.3em] uppercase mb-1">Place</span>
                <span className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Your Order Via</span>
             </div>
             
             <div className="flex flex-row items-center justify-center gap-4 sm:gap-8 w-full sm:w-auto">
                <div className="w-14 h-14 sm:w-[84px] sm:h-[84px] rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0 border border-[#10B981]/20">
                   <Phone className="w-6 h-6 sm:w-10 sm:h-10 text-[#10B981] animate-pulse" />
                </div>
                <div className="flex flex-col border-l-2 border-slate-100 pl-4 sm:pl-8 text-left">
                   <span className="text-[10px] sm:text-xs font-black text-slate-400 tracking-[0.2em] uppercase mb-1">Call Us On</span>
                   <span className="text-lg sm:text-4xl font-black text-slate-800 tracking-tighter hover:text-primary transition-colors cursor-pointer">+91 96069 73757</span>
                </div>
             </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 py-12 sm:py-24 space-y-16 sm:space-y-32 pb-24 sm:pb-40">
          
          {/* Quick Actions Grid */}
          <section className="grid grid-cols-3 gap-2 sm:gap-8">
            {[
              { label: 'Upload prescription', href: '/prescription', color: 'bg-lavender', iconColor: 'bg-primary text-white', icon: FileText },
              { label: 'Order Via WhatsApp', href: 'https://wa.me/91XXXXXXXXXX', color: 'bg-green-50', iconColor: 'bg-[#25D366] text-white', icon: () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-12 sm:h-12"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg> },
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

          {/* Free Delivery Banner (Moved below Categories) */}
          <section className="bg-slate-900 p-6 sm:p-16 rounded-[32px] sm:rounded-[64px] text-white flex flex-row items-center justify-between gap-4 shadow-3xl relative overflow-hidden">
            <div className="space-y-2 sm:space-y-4 relative z-10 max-w-xl text-left flex-1 min-w-0">
               <h3 className="text-xl sm:text-5xl font-black tracking-tighter uppercase leading-tight text-white">
                 Pan India Free Delivery<br className="max-sm:hidden"/> Above ₹499
               </h3>
               <p className="text-[10px] sm:text-lg font-bold text-white/60 uppercase tracking-widest truncate">
                 Order Now & Save More
               </p>
               <Link href="/search" className="inline-block mt-2 sm:mt-6 px-6 sm:px-12 py-3 sm:py-5 bg-primary text-white font-black text-[10px] sm:text-base uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl">
                 Shop Now
               </Link>
            </div>
            <div className="relative z-10 shrink-0 right-[-10px] sm:right-6">
               <div className="w-20 h-20 sm:w-40 sm:h-40 bg-primary/20 rounded-[28px] sm:rounded-[56px] flex items-center justify-center border border-primary/30">
                 <Package className="w-10 h-10 sm:w-20 sm:h-20 text-primary" />
               </div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-10 opacity-5 pointer-events-none">
               <Package className="w-64 h-64 sm:w-[400px] sm:h-[400px]" />
            </div>
          </section>

          {/* Top Sellers */}
          <section className="space-y-8">
            <h2 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit px-2">Best Sellers</h2>
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