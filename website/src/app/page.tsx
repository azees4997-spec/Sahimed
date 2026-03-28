"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShieldCheck, ChevronRight, Truck, Phone, FileText, Star, Activity, HeartPulse, MapPin, ArrowRight, Zap, ShieldPlus, FlaskConical } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", damping: 15, stiffness: 100 }
  }
};

const categoryColors = [
  "bg-pastel-purple",
  "bg-pastel-peach",
  "bg-pastel-blue",
  "bg-pastel-green"
];

export default function Home() {
  const { location, setLocation } = useCart();
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
        setCategories(data);
        setIsCatsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
        setIsCatsLoading(false);
      });
  }, []);

  const { data: medicines, isLoading, refetch } = useMongoDBCollection({ limit: 50 });

  React.useEffect(() => {
    // Smart refetch on mount and window focus to solve "page not refreshing" bug
    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    refetch(); 
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-10 pb-24">
          
          {/* Hero Section - Lavender Alignment */}
          <section className="relative w-full">
            <Carousel
              setApi={setApi}
              plugins={[plugin.current]}
              className="w-full"
            >
              <CarouselContent>
                <CarouselItem>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden p-8 sm:p-14 flex flex-col justify-center min-h-[300px] sm:min-h-[420px] rounded-[48px] bg-lavender text-lavender shadow-2xl shadow-primary/5 border border-white"
                  >
                    <div className="space-y-6 relative z-10 max-w-xl">
                      <h1 className="text-4xl sm:text-6xl font-black leading-[1] tracking-tighter text-slate-800">
                        Affordable medicines<br />across India
                      </h1>
                      <p className="text-lavender-text font-black text-lg sm:text-2xl tracking-tight opacity-80">
                        Sahi Dawai, Sahi Daam pe
                      </p>
                    </div>
                    {/* Pulse Icon on Right */}
                    <div className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 opacity-20 sm:opacity-100">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-primary/40 sm:text-primary"
                      >
                        <HeartPulse size={240} strokeWidth={1.5} />
                      </motion.div>
                    </div>
                  </motion.div>
                </CarouselItem>

                <CarouselItem>
                  <div className="relative overflow-hidden p-8 sm:p-14 flex flex-col justify-center min-h-[300px] sm:min-h-[420px] rounded-[48px] bg-slate-900 text-white shadow-2xl">
                    <div className="space-y-4 max-w-lg relative z-10">
                      <Badge className="bg-primary/20 text-primary border-primary/30 font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">Smart choice</Badge>
                      <h2 className="text-4xl sm:text-6xl font-black leading-[1] tracking-tighter">
                        Save up to 80% with<br />Generic Matrix
                      </h2>
                      <p className="text-white/60 text-lg font-bold">
                        Clinical substitutes with verified composition.
                      </p>
                    </div>
                    <div className="absolute right-[-40px] bottom-[-40px] opacity-10">
                      <ShieldPlus size={320} strokeWidth={0.5} />
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>

            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    current === index 
                      ? "w-8 bg-accent shadow-lg shadow-accent/20" 
                      : "w-2 bg-slate-200 hover:bg-slate-300"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions - Design Aligned */}
          <motion.section 
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              { 
                label: 'Upload prescription', 
                sub: 'Verified medical orders', 
                href: '/prescription', 
                color: 'bg-lavender', 
                iconColor: 'bg-primary text-white', 
                icon: FileText 
              },
              { 
                label: 'Order Via WhatsApp', 
                sub: 'Direct clinical support', 
                href: 'https://wa.me/91XXXXXXXXXX', 
                color: 'bg-sahi-green', 
                iconColor: 'bg-green-600 text-white', 
                icon: MessageCircle 
              },
              { 
                label: 'Call for Medicines', 
                sub: 'Immediate pharmacy help', 
                href: 'tel:+91XXXXXXXXXX', 
                color: 'bg-sahi-pink', 
                iconColor: 'bg-rose-500 text-white', 
                icon: Phone 
              }
            ].map((action, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link href={action.href} className={cn("group relative overflow-hidden p-8 rounded-[48px] flex flex-col items-center text-center gap-6 transition-all border border-white shadow-sm", action.color)}>
                  <div className={cn("p-6 rounded-[32px] transition-all duration-500 scale-110 shadow-lg", action.iconColor)}>
                    <action.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-black text-slate-900 text-lg tracking-tight uppercase">{action.label}</h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest opacity-60">{action.sub}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.section>

          {/* Categories Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Shop by Categories</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global healthcare registry</p>
              </div>
              <Link href="/categories" className="text-[10px] font-black tracking-widest text-primary flex items-center gap-2 group transition-all uppercase">
                Explore All <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
              </Link>
            </div>
            
            <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-8 px-2">
              {isCatsLoading ? (
                [...Array(6)].map((_, i) => <Skeleton className="w-32 h-32 rounded-full shrink-0" key={i} />)
              ) : categories?.map((cat: any, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="flex flex-col items-center gap-4 shrink-0"
                >
                  <Link href={`/search?c=${encodeURIComponent(cat.name)}`} className="group">
                    <div className={cn(
                      "w-32 h-32 rounded-[40px] flex items-center justify-center overflow-hidden transition-all duration-500 border border-white shadow-sm relative p-2",
                      i % 4 === 0 ? "bg-lavender" : i % 4 === 1 ? "bg-sahi-pink" : i % 4 === 2 ? "bg-sahi-blue" : "bg-sahi-green"
                    )}>
                      <Image 
                        src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} 
                        alt={cat.name} 
                        width={128} 
                        height={128} 
                        className="object-contain w-full h-full p-2 group-hover:rotate-[8deg] transition-transform duration-500"
                      />
                    </div>
                  </Link>
                  <span className="text-[9px] font-black text-slate-500 tracking-widest text-center uppercase">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Featured Products */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Top Sellers</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Certified for clinical excellence</p>
              </div>
            </div>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-12 px-2">
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton className="min-w-[200px] aspect-[4/5] rounded-[48px]" key={i} />)
              ) : medicines?.map((p: any) => (
                <motion.div key={p.id} className="min-w-[180px] sm:min-w-[240px]">
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Trust Banner */}
          <section className="bg-sahi-blue p-10 rounded-[56px] border border-white flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500">
               <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <div className="relative z-10 flex-1 text-center md:text-left">
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Verified SahiMed Quality</h3>
               <p className="text-xs font-bold text-sahi-blue-text uppercase tracking-widest opacity-70">Sahi Dawai, Sahi Daam pe • Always Lab Certified</p>
            </div>
            <Link href="/search" className="relative z-10 px-10 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl active:scale-95">
              Shop Locally
            </Link>
          </section>

        </main>
      </div>
    </PageTransition>
  );
}