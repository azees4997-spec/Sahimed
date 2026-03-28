"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
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

  const { data: medicines, isLoading } = useMongoDBCollection({ limit: 50 });

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-12 pb-24">
          
          {/* Hero Section */}
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
                    className="relative overflow-hidden p-8 sm:p-12 flex flex-col justify-center min-h-[260px] sm:min-h-[380px] rounded-[48px] bg-gradient-to-br from-primary via-primary/90 to-accent text-white shadow-2xl shadow-primary/20"
                  >
                    <div className="space-y-4 relative z-10 max-w-lg">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20"
                      >
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Certified Clinical Health</span>
                      </motion.div>
                      <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight">
                        Premium care<br />at honest prices.
                      </h1>
                      <p className="text-white/80 text-sm sm:text-base font-medium max-w-sm">
                        Get authentic medicines delivered to your doorstep across India. Experience healthcare simplified.
                      </p>
                      <div className="pt-4 flex flex-wrap gap-4">
                        <Link href="/search" className="bg-white text-primary px-8 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2 group">
                          Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                    <motion.div 
                      animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none"
                    >
                      <Activity size={320} className="text-white" strokeWidth={0.5} />
                    </motion.div>
                  </motion.div>
                </CarouselItem>

                <CarouselItem>
                  <div className="relative overflow-hidden p-8 sm:p-12 flex flex-col justify-center min-h-[260px] sm:min-h-[380px] rounded-[48px] bg-gradient-to-br from-slate-900 to-primary text-white shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10 w-full">
                      <div className="space-y-4 flex-1">
                        <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30">
                          <Zap className="w-4 h-4 text-primary fill-current" />
                          <span className="text-[10px] font-bold tracking-widest uppercase">Smart Savings Choice</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight">
                          Save up to 60% on<br />Clinical Substitutes
                        </h2>
                        <p className="text-white/70 text-sm sm:text-base font-medium max-w-sm">
                          Switch to verified clinical alternatives with the same composition and save thousands.
                        </p>
                        <div className="flex gap-4 pt-2">
                           <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                              <ShieldPlus className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-bold uppercase">GMP Certified</span>
                           </div>
                           <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                              <FlaskConical className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-bold uppercase">Lab Verified</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    <motion.div 
                      animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-[-20px] top-[-20px] opacity-10 pointer-events-none"
                    >
                      <HeartPulse size={300} className="text-primary" strokeWidth={0.5} />
                    </motion.div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>

            <div className="flex justify-center gap-3 mt-6">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    current === index 
                      ? "w-10 bg-primary shadow-lg shadow-primary/20" 
                      : "w-2 bg-slate-200 hover:bg-slate-300"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions - Docly Styled */}
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <motion.div variants={itemVariants}>
              <Link href="/prescription" className="group relative overflow-hidden bg-white border border-slate-100 p-8 rounded-[48px] flex flex-col items-center text-center gap-6 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                <div className="bg-pastel-purple p-6 rounded-[32px] text-primary transition-all duration-500 scale-110">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 tracking-tight text-lg">Upload Prescription</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed">AI-powered medical digitization<br />and fast home delivery</p>
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[48px]" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="https://wa.me/91XXXXXXXXXX" className="group relative overflow-hidden bg-white border border-slate-100 p-8 rounded-[48px] flex flex-col items-center text-center gap-6 transition-all hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-2">
                <div className="bg-pastel-green p-6 rounded-[32px] text-green-600 transition-all duration-500 scale-110">
                  <MessageCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 tracking-tight text-lg">Order via WhatsApp</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed">Direct clinical chat with our<br />certified pharmacists</p>
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-bl-[48px]" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="tel:+91XXXXXXXXXX" className="group relative overflow-hidden bg-white border border-slate-100 p-8 rounded-[48px] flex flex-col items-center text-center gap-6 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                <div className="bg-pastel-peach p-6 rounded-[32px] text-rose-500 transition-all duration-500 scale-110">
                  <Phone className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 tracking-tight text-lg">Call for Medicines</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed">Instant order support and<br />doorstep consulting</p>
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-[48px]" />
              </Link>
            </motion.div>
          </motion.section>

          {/* Categories Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">Shop by Categories</h2>
                <p className="text-sm font-medium text-slate-400">Find everything you need for your healthcare</p>
              </div>
              <Link href="/categories" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-colors flex items-center gap-2">
                Browse All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="flex gap-8 overflow-x-auto scrollbar-hide pb-8 px-2"
            >
              {isCatsLoading ? (
                [...Array(6)].map((_, i) => <Skeleton className="w-32 h-32 rounded-full shrink-0" key={i} />)
              ) : categories?.map((cat: any, i) => (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="flex flex-col items-center gap-4 shrink-0 transition-all duration-300"
                >
                  <Link href={`/search?c=${encodeURIComponent(cat.name)}`} className="group">
                    <div className={cn(
                      "w-32 h-32 rounded-[40px] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/10 border-2 border-transparent group-hover:border-white p-2 relative",
                      categoryColors[i % categoryColors.length]
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
                  <span className="text-[10px] font-black text-slate-600 tracking-widest text-center leading-tight transition-colors group-hover:text-primary uppercase">{cat.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Banner Section */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary p-8 sm:p-12 rounded-[56px] flex flex-col sm:flex-row items-center gap-8 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 scale-110">
              <Truck className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center sm:text-left space-y-2 relative z-10">
              <h3 className="text-3xl font-extrabold tracking-tight">Fast & Free Delivery</h3>
              <p className="text-sm font-medium text-white/70 max-w-sm">
                Complimentary express delivery on all orders above <span className="text-white font-bold">1000</span> across India!
              </p>
            </div>
            <div className="sm:ml-auto">
               <Link href="/search" className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-white/90 transition-all flex items-center gap-2 shadow-xl">
                 Show Nearby Pharmacy <MapPin className="w-4 h-4 text-primary" />
               </Link>
            </div>
          </motion.section>

          {/* Best Sellers */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">Best Sellers</h2>
                <p className="text-sm font-medium text-slate-400">The most trusted healthcare products</p>
              </div>
              <Link href="/search" className="text-[10px] font-black tracking-widest text-primary group flex items-center gap-2 hover:opacity-80 transition-all uppercase">
                Explore All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-12 px-2"
            >
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton className="min-w-[200px] aspect-[4/5] rounded-[48px]" key={i} />)
              ) : medicines?.map((p: any) => (
                <motion.div key={p.id} variants={itemVariants} className="min-w-[200px] sm:min-w-[260px]">
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Values Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12 px-2">
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-10 rounded-[48px] flex items-center gap-8 border border-slate-100 shadow-sm"
            >
              <div className="w-20 h-20 bg-pastel-purple text-primary rounded-[32px] flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 tracking-tight text-lg leading-snug">100% Authentic<br />Medicines</h3>
                <p className="text-[12px] font-medium text-slate-400 leading-relaxed max-w-xs">
                  Sourced directly from certified distributors and manufacturers.
                </p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-10 rounded-[48px] flex items-center gap-8 border border-slate-100 shadow-sm"
            >
              <div className="w-20 h-20 bg-pastel-green text-green-600 rounded-[32px] flex items-center justify-center shrink-0 shadow-inner">
                <Star className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 tracking-tight text-lg leading-snug">Top Rated<br />Clinical Pharmacy</h3>
                <p className="text-[12px] font-medium text-slate-400 leading-relaxed max-w-xs">
                  Trusted by thousands of customers for verified clinical needs.
                </p>
              </div>
            </motion.div>
          </section>

        </main>
      </div>
    </PageTransition>
  );
}