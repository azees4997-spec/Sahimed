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
        
        {/* Mega Banner Hero Section */}
        <section className="relative w-full bg-[#FFF9F9] overflow-hidden pb-10 sm:pb-20 pt-4 sm:pt-16 border-b border-rose-50/50">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col gap-6 sm:gap-12">
              
              {/* Row 1: Side-by-Side Text & Image */}
              <div className="flex items-center justify-between gap-4 sm:gap-12">
                <div className="flex-1 space-y-3 sm:space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1 sm:space-y-3"
                  >
                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 w-fit shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-slate-800 font-black uppercase tracking-[0.1em] text-[8.5px] sm:text-[10px]">Trusted by 10L+ users</span>
                    </div>
                    <h1 className="text-2xl sm:text-6xl font-black leading-[1.1] tracking-tighter text-slate-900 font-outfit uppercase">
                      Affordable <br/>
                      Solutions for <br/>
                      <span className="text-primary italic">Everyday Care</span>
                    </h1>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-2/5 sm:w-5/12 flex justify-end"
                >
                  <div className="relative w-full aspect-square max-w-[140px] sm:max-w-[400px] rounded-2xl sm:rounded-[40px] border-[6px] sm:border-[10px] border-white shadow-2xl overflow-hidden bg-white">
                    <Image 
                      src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
                      alt="Healthcare Professional" 
                      fill
                      priority
                      className="object-cover object-top" 
                    />
                  </div>
                </motion.div>
              </div>

              {/* Row 2: Properly Aligned Search Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full"
              >
                <div 
                  onClick={() => { 
                    if (window.innerWidth < 1024) {
                      window.dispatchEvent(new CustomEvent('open-mobile-search'));
                    } else {
                      document.querySelector('input')?.focus();
                    }
                  }}
                  className="w-full bg-white text-slate-900 rounded-full p-1 shadow-2xl shadow-slate-200/50 flex items-center border border-slate-100 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all group"
                >
                  <div className="flex-1 px-5 text-left text-[11px] sm:text-[14px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Search Medicines...
                  </div>
                  <div className="bg-primary p-2.5 sm:p-4 rounded-full shadow-lg shadow-primary/20">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Row 3: Quick Action Buttons (Integrated with previous colours) */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-2.5 sm:gap-6"
              >
                {[
                  { label: 'Upload Rx', href: '/prescription', color: 'bg-lavender', icon: FileText, iconColor: 'bg-primary' },
                  { label: 'WhatsApp', href: 'https://wa.me/91XXXXXXXXXX', color: 'bg-green-50', icon: MessageCircle, iconColor: 'bg-[#25D366]' },
                  { label: 'Order on Call', href: 'tel:+91XXXXXXXXXX', color: 'bg-sahi-pink', icon: Phone, iconColor: 'bg-rose-500' }
                ].map((action, i) => (
                  <Link key={i} href={action.href} className={cn("group p-3 sm:p-6 rounded-2xl border border-white shadow-xl shadow-slate-200/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all active:scale-95", action.color)}>
                    <div className={cn("w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-md", action.iconColor)}>
                      <action.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-black text-[8px] sm:text-[11px] tracking-tight text-slate-900 uppercase leading-none whitespace-nowrap">{action.label}</span>
                  </Link>
                ))}
              </motion.div>
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
              <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-10 overflow-x-hidden sm:overflow-x-auto sm:scrollbar-hide pb-2 sm:pb-8 px-2">
                {isBestLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton className="w-full aspect-[4/5] rounded-[24px] sm:rounded-[48px]" key={i} />)
                ) : bestSellers?.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="w-full sm:min-w-[280px]">
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
            <div className="grid grid-cols-3 sm:flex gap-3 sm:gap-10 pb-4 px-2">
              {isCatsLoading ? (
                [...Array(6)].map((_, i) => <Skeleton className="w-full aspect-square rounded-[24px] shrink-0" key={i} />)
              ) : categories?.slice(0, 9).map((cat: any, i) => (
                <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className={cn(
                      "w-20 h-20 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[48px] flex items-center justify-center border border-white shadow-sm overflow-hidden p-0",
                      i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                    )}>
                    <Image src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} alt={cat.name} width={128} height={128} className="object-cover w-full h-full" />
                  </motion.div>
                  <span className="text-[8px] sm:text-xs font-black text-slate-500 tracking-tight uppercase text-center line-clamp-1 h-3">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Free Delivery Banner (Moved below Categories) */}
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