"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { MessageCircle, ShieldCheck, ChevronRight, Truck, Phone, FileText, Star, TrendingDown, Dna, ShieldPlus, FlaskConical, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/CartContext';
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

export default function Home() {
  const db = useFirestore();
  const { location, setLocation } = useCart();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  // Automatic Location Capture (Swiggy/Blinkit style)
  React.useEffect(() => {
    const savedLoc = localStorage.getItem('hl_location');
    if (!savedLoc || savedLoc === 'Mumbai, MH') {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude: lat, longitude: lng } = position.coords;
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
              const data = await response.json();
              if (data && data.address) {
                const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.city || data.address.town || 'Current Location';
                setLocation(neighborhood);
              }
            } catch (e) {
              console.warn("Reverse geocoding failed for auto-location", e);
            }
          },
          (error) => {
            console.log("User declined or browser blocked automatic location access", error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [setLocation]);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(10));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(12));
  }, [db]);

  const { data: medicines, isLoading: isMedsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: isCatsLoading } = useCollection(categoriesQuery);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6 pb-6">
        
        {/* Scrolling Hero Section */}
        <section className="relative w-full">
          <Carousel
            setApi={setApi}
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {/* Slide 1: Affordable Medicines */}
              <CarouselItem>
                <div className="relative rounded-[24px] bg-gradient-to-br from-[#10b981] to-[#059669] overflow-hidden p-8 flex flex-col justify-center min-h-[220px]">
                  <div className="space-y-3 relative z-10">
                    <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight uppercase tracking-tight">
                      Affordable Medicines<br />Across India
                    </h1>
                    <div className="w-16 h-0.5 bg-white/20" />
                    <p className="text-white/90 text-sm font-bold pt-1 uppercase tracking-widest">Sahi Dawai, Sahi Daam pe</p>
                  </div>
                  <div className="absolute right-[-30px] bottom-[-30px] opacity-10 rotate-12">
                    <ShieldCheck size={220} className="text-white" strokeWidth={1} />
                  </div>
                </div>
              </CarouselItem>

              {/* Slide 2: Smarter Clinical Choice (Substitutes) */}
              <CarouselItem>
                <div className="relative rounded-[24px] bg-gradient-to-br from-[#10b981] to-[#064e3b] overflow-hidden p-8 flex flex-col justify-center min-h-[220px]">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                        <Zap className="w-3 h-3 text-[#EAB308] fill-current" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Smarter clinical choice</span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-black text-white leading-tight uppercase tracking-tight">
                        Save Upto 60%<br />on Clinical Substitutes
                      </h2>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                        <div className="flex items-center gap-1.5">
                          <ShieldPlus className="w-3.5 h-3.5 text-white/80" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest">GMP & FDA Certified medicines</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-white/80" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest">Same composition & strength</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-center justify-center text-center p-4 bg-white/10 backdrop-blur rounded-[24px] border border-white/20 shrink-0">
                       <Star className="w-5 h-5 text-[#EAB308] fill-current mb-1.5" />
                       <p className="text-[8px] font-black text-white uppercase tracking-tighter leading-tight max-w-[120px]">
                         All substitutes are from India's leading manufacturers.
                       </p>
                    </div>
                  </div>
                  <div className="absolute left-[-20px] top-[-20px] opacity-10">
                    <Dna size={180} className="text-white" strokeWidth={1} />
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  current === index 
                    ? "w-8 bg-primary shadow-sm" 
                    : "w-1.5 bg-gray-200 hover:bg-gray-300"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Action Row - 3 Column Grid */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          <Link href="/prescription" className="flex flex-col items-center justify-center gap-2 bg-[#ecfdf5] p-3 sm:p-6 rounded-[20px] sm:rounded-[24px] group active:scale-95 transition-all shadow-sm text-center">
            <div className="bg-[#10b981] p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg">
              <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[12px] font-black text-[#10b981] uppercase tracking-tight leading-tight">Upload<br/>Prescription</span>
            </div>
          </Link>

          <Link href="https://wa.me/91XXXXXXXXXX" className="flex flex-col items-center justify-center gap-2 bg-[#f0fdf4] p-3 sm:p-6 rounded-[20px] sm:rounded-[24px] group active:scale-95 transition-all shadow-sm text-center">
            <div className="bg-[#10b981] p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg">
              <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[12px] font-black text-[#10b981] uppercase tracking-tight leading-tight">Order via<br/>WhatsApp</span>
            </div>
          </Link>

          <Link href="tel:+91XXXXXXXXXX" className="flex flex-col items-center justify-center gap-2 bg-[#ecfdf5] p-3 sm:p-6 rounded-[20px] sm:rounded-[24px] group active:scale-95 transition-all shadow-sm text-center">
            <div className="bg-[#10b981] p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg">
              <Phone className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[12px] font-black text-[#10b981] uppercase tracking-tight leading-tight">Call For<br/>Medicines</span>
            </div>
          </Link>
        </section>

        {/* Categories - Side Scroll */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Shop by Category</h2>
            <Link href="/categories" className="text-[11px] font-black text-[#10b981] uppercase tracking-widest">See All</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-1">
            {isCatsLoading ? (
              [...Array(6)].map((_, i) => <Skeleton className="w-24 h-24 rounded-full shrink-0" key={i} />)
            ) : categories?.map((cat: any, i) => (
              <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2 group shrink-0">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden group-active:scale-90 transition-transform">
                  <Image 
                    src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} 
                    alt={cat.name} 
                    width={96} 
                    height={96} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Free Delivery Banner */}
        <section className="bg-gradient-to-r from-[#064e3b] to-[#065f46] p-5 rounded-[24px] flex items-center gap-4 text-white shadow-xl shadow-emerald-900/20 border-b-4 border-black/10">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">FREE Delivery</h3>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">On all orders above ₹1000 across India!</p>
          </div>
        </section>

        {/* Best Sellers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Best Sellers</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
            {isMedsLoading ? (
              [...Array(4)].map((_, i) => <Skeleton className="min-w-[140px] aspect-[2/3] rounded-[16px]" key={i} />)
            ) : medicines?.map((p: any) => (
              <div key={p.id} className="min-w-[140px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Quality Medicines Card */}
        <section className="bg-gray-100/50 p-3 rounded-[24px] text-center space-y-1.5 border border-gray-200/50">
          <div className="w-8 h-8 bg-[#10b981]/10 text-[#10b981] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight leading-none">Best Quality Medicines</h2>
          <p className="text-[9px] font-bold text-gray-500 leading-normal max-w-xs mx-auto uppercase tracking-widest opacity-80">
            You deserve the best – premium medicines from India’s leading brands
          </p>
        </section>

      </main>
    </div>
  );
}
