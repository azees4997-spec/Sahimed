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
                         {/* Background Blob removed or reduced to avoid clutter */}

                         <div className="relative z-10 w-full sm:w-1/2 flex flex-col items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4">
                            <h1 className="text-2xl sm:text-4xl font-black leading-[1.1] tracking-tighter text-slate-900 font-outfit uppercase">
                               Affordable Solutions for <br className="hidden sm:block" />
                               <span className="text-primary">Everyday Care</span>
                            </h1>

                            <div className="flex flex-col gap-1.5 sm:gap-2 w-full items-center sm:items-start">
                               <div className="flex items-center gap-2">
                                  <div className="w-4.5 h-4.5 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                                     <ShieldCheck className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-slate-800 font-bold uppercase tracking-[0.1em] text-[9px] sm:text-[10px]">Trusted by 10L+ users</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="w-4.5 h-4.5 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                                     <ShieldCheck className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-slate-800 font-bold uppercase tracking-[0.1em] text-[9px] sm:text-[10px]">Save Upto 80%</span>
                               </div>
                            </div>

                            <div 
                               onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); document.querySelector('input')?.focus(); }}
                               className="w-full max-w-sm mt-3 bg-white rounded-full p-1 shadow-lg flex items-center border border-slate-100 cursor-pointer hover:shadow-xl transition-all"
                            >
                               <div className="pl-3">
                                  <Search className="w-3.5 h-3.5 text-primary" />
                               </div>
                               <div className="flex-1 px-3 text-[9px] sm:text-[11px] font-bold text-slate-400">
                                  Search for Healthcare Products
                               </div>
                               <button className="bg-primary hover:bg-primary/90 text-white font-black text-[8px] sm:text-[9.5px] tracking-widest uppercase px-4 py-2 sm:py-2.5 rounded-full shadow-md">
                                  Search
                               </button>
                            </div>
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
          </div>
        </section>

        {/* Place Your Order Via Call Strip (Thinner for Above-The-Fold) */}
        <section className="w-full bg-white border-b border-slate-100 shadow-sm">
           <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-14">
              <div className="flex items-center gap-2">
                 <span className="text-[9.5px] font-black text-slate-400 tracking-[0.2em] uppercase">Place Your Order Via</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-green-50 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8.5px] font-bold text-slate-400 tracking-widest uppercase leading-none mb-0.5">Call Us On</span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">+91 96069 73757</span>
                 </div>
              </div>
           </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8 sm:space-y-16 pb-24 sm:pb-40">
          <section className="grid grid-cols-3 gap-2 sm:gap-4 px-1">
            {[
              { label: 'Upload Rx', href: '/prescription', color: 'bg-lavender', iconColor: 'bg-primary text-white', icon: FileText },
              { label: 'WhatsApp', href: 'https://wa.me/91XXXXXXXXXX', color: 'bg-green-50', iconColor: 'bg-[#25D366] text-white', icon: () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.5" fill="none" className="w-4 h-4 sm:w-6 sm:h-6"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg> },
              { label: 'Call Now', href: 'tel:+91XXXXXXXXXX', color: 'bg-sahi-pink', iconColor: 'bg-rose-500 text-white', icon: Phone }
            ].map((action, i) => (
              <motion.div key={i} whileTap={{ scale: 0.96 }}>
                <Link href={action.href} className={cn("group h-full p-2.5 sm:p-5 rounded-[16px] sm:rounded-[24px] flex flex-col items-center text-center gap-1.5 sm:gap-2.5 transition-all border border-white shadow-sm overflow-hidden", action.color)}>
                  <div className={cn("w-7 h-7 sm:w-11 sm:h-11 flex items-center justify-center rounded-[8px] sm:rounded-[12px] shadow-md", action.iconColor)}>
                    <action.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-outfit font-bold text-slate-700 text-[8px] sm:text-[9.5px] tracking-tight leading-tight uppercase line-clamp-1">{action.label}</h3>
                </Link>
              </motion.div>
            ))}
          </section>

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

          <section className="space-y-3 sm:space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tighter uppercase font-outfit">Shop by category</h2>
              <Link href="/categories" className="text-[8px] sm:text-[9.5px] font-black tracking-widest text-primary uppercase flex items-center gap-1">Explore All <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide pb-2 px-2">
              {isCatsLoading ? (
                [...Array(6)].map((_, i) => <Skeleton className="w-14 h-14 sm:w-20 sm:h-20 rounded-[12px] shrink-0" key={i} />)
              ) : categories?.map((cat: any, i) => (
                <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2 shrink-0">
                  <motion.div 
                    whileHover={{ y: -3 }}
                    className={cn(
                      "w-14 h-14 sm:w-20 sm:h-20 rounded-[12px] sm:rounded-[20px] flex items-center justify-center border border-white shadow-sm p-1.5",
                      i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                    )}>
                    <Image src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} alt={cat.name} width={80} height={80} className="object-contain w-full h-full" />
                  </motion.div>
                  <span className="text-[8px] sm:text-[9.5px] font-black text-slate-500 tracking-tight uppercase line-clamp-1">{cat.name}</span>
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