"use client"

import * as React from 'react';
import { ChevronRight, ShieldCheck, Truck, Star, Zap, BadgeCheck, Award, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

interface HomeClientProps {
  banners: any[];
  categories: any[];
  bestSellers: any[];
  topSelections: any[];
  medicines: any[];
}

// ─── Category Style Map ───────────────────────────────────────────────────────
function getCategoryStyle(name: string): { emoji: string; from: string; to: string; text: string } {
  const l = name.toLowerCase();
  if (l.includes('cardiac') || l.includes('heart')) return { emoji: '❤️', from: 'from-rose-400', to: 'to-pink-300', text: 'text-rose-700' };
  if (l.includes('diabet') || l.includes('sugar') || l.includes('insulin')) return { emoji: '🩸', from: 'from-blue-400', to: 'to-cyan-300', text: 'text-blue-700' };
  if (l.includes('vitamin') || l.includes('supplement') || l.includes('nutrition')) return { emoji: '💊', from: 'from-amber-400', to: 'to-yellow-300', text: 'text-amber-700' };
  if (l.includes('respi') || l.includes('lung') || l.includes('asthma')) return { emoji: '🫁', from: 'from-sky-400', to: 'to-blue-300', text: 'text-sky-700' };
  if (l.includes('pain') || l.includes('ortho') || l.includes('joint')) return { emoji: '🩹', from: 'from-orange-400', to: 'to-amber-300', text: 'text-orange-700' };
  if (l.includes('skin') || l.includes('derma') || l.includes('acne')) return { emoji: '✨', from: 'from-pink-400', to: 'to-rose-300', text: 'text-pink-700' };
  if (l.includes('gastro') || l.includes('digest') || l.includes('stomach')) return { emoji: '🌿', from: 'from-emerald-400', to: 'to-green-300', text: 'text-emerald-700' };
  if (l.includes('neuro') || l.includes('brain') || l.includes('sleep')) return { emoji: '🧠', from: 'from-violet-400', to: 'to-purple-300', text: 'text-violet-700' };
  if (l.includes('eye') || l.includes('ophthal')) return { emoji: '👁️', from: 'from-indigo-400', to: 'to-blue-300', text: 'text-indigo-700' };
  if (l.includes('dental') || l.includes('oral')) return { emoji: '🦷', from: 'from-teal-400', to: 'to-cyan-300', text: 'text-teal-700' };
  if (l.includes('immun') || l.includes('infect')) return { emoji: '🛡️', from: 'from-yellow-400', to: 'to-amber-300', text: 'text-yellow-700' };
  if (l.includes('women') || l.includes('gynae')) return { emoji: '🌸', from: 'from-fuchsia-400', to: 'to-pink-300', text: 'text-fuchsia-700' };
  if (l.includes('child') || l.includes('paed') || l.includes('baby')) return { emoji: '👶', from: 'from-blue-300', to: 'to-sky-200', text: 'text-blue-700' };
  if (l.includes('thyroid') || l.includes('hormone')) return { emoji: '⚗️', from: 'from-violet-400', to: 'to-indigo-300', text: 'text-violet-700' };
  return { emoji: '💊', from: 'from-primary', to: 'to-teal-400', text: 'text-primary' };
}

// ─── Ticker items ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { icon: '✅', text: '100% Authentic Medicines' },
  { icon: '🚚', text: 'Free Delivery Above ₹499' },
  { icon: '💊', text: 'Upto 61% OFF on Generics' },
  { icon: '⭐', text: '4.8★ Rated on Google' },
  { icon: '🩺', text: 'Expert Pharmacist Verified' },
  { icon: '📦', text: '50,000+ Medicines in Stock' },
  { icon: '⚡', text: '24-Hour Express Delivery' },
  { icon: '🇮🇳', text: 'Pan-India Shipping' },
  { icon: '🏥', text: 'Licensed Pharmacy KA-B51' },
];

// ─── Sahimed Advantage Data ───────────────────────────────────────────────────
const ADVANTAGES = [
  { icon: BadgeCheck, val: '100%', sub: 'Genuine Medicines', desc: 'Every product sourced directly from licensed manufacturers', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: Award, val: '61%', sub: 'Max Savings vs MRP', desc: 'Highest discounts on branded generics in India', color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' },
  { icon: Clock, val: '24hr', sub: 'Express Delivery', desc: 'Fastest medicine delivery across all major cities', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { icon: ShieldCheck, val: 'Licensed', sub: 'Rx Pharmacy', desc: 'Drug License No. KA-B51-286602. Pharmacist on call.', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' } })
};

export default function HomeClient({ banners, categories, bestSellers, topSelections, medicines }: HomeClientProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(Autoplay({ delay: 4500, stopOnInteraction: true }));

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const medicinesByCategory = React.useMemo(() => {
    if (!medicines || medicines.length === 0) return {};
    return medicines.reduce((acc: Record<string, any[]>, product: any) => {
      const cat = product.categoryName || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});
  }, [medicines]);

  const topDynamicCategories = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(cat => [cat.name, medicinesByCategory[cat.name] || []]);
    }
    return Object.entries(medicinesByCategory)
      .filter(([cat]) => cat !== 'Other' && cat.trim() !== '')
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6);
  }, [medicinesByCategory, categories]);

  // Split categories: first 4 are "featured", rest are in scroll row
  const featuredCats = categories.slice(0, 4);
  const moreCats = categories.slice(4, 16);

  return (
    <div className="space-y-8 sm:space-y-14 pb-0 sm:pb-16 overflow-x-hidden max-w-full">

      {/* ── Trust Ticker ── */}
      <div className="w-full overflow-hidden bg-primary/5 border-y border-primary/10 py-2.5">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 mx-6 text-[11px] font-bold text-slate-600 shrink-0">
              <span className="text-sm">{item.icon}</span>
              {item.text}
              <span className="mx-3 text-primary/30">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Banner Carousel ── */}
      {banners && banners.length > 0 && (
        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="w-full">
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
                  <Link href={banner.link || '/search'} className="block relative w-full aspect-[21/7] sm:aspect-[3/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                    <Image src={banner.imageUrl} alt={banner.title || 'Offer'} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" priority={index === 0} />
                    {banner.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-4 sm:p-8">
                        <h3 className="text-white text-base sm:text-3xl font-black uppercase tracking-tight leading-tight">{banner.title}</h3>
                        {banner.subtitle && <p className="text-white/80 text-xs sm:text-sm font-semibold mt-1">{banner.subtitle}</p>}
                      </div>
                    )}
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={cn("h-1.5 transition-all duration-300 rounded-full", current === i ? "w-8 bg-white" : "w-1.5 bg-white/40")} />
              ))}
            </div>
          </Carousel>
        </motion.section>
      )}

      {/* ════════════════════════════════════════════════
          SHOP BY CATEGORY  —  beats PlatinumRx's circles
          ════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Browse</p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                Shop by <span className="text-primary">Category</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Save up to 61% on your medicines</p>
            </div>
            <Link href="/search" className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-0.5 hover:underline">
              All Categories <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── Featured 4 — Large portrait cards ── */}
          {featuredCats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {featuredCats.map((cat: any, i: number) => {
                const style = getCategoryStyle(cat.name || '');
                const hasImg = cat.imageUrl && !cat.imageUrl.includes('picsum');
                return (
                  <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <Link
                      href={`/search?c=${encodeURIComponent(cat.name)}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 bg-white"
                    >
                      {/* Illustration area */}
                      <div className={cn("relative w-full aspect-square flex items-center justify-center overflow-hidden bg-gradient-to-br", style.from, style.to, "opacity-20")} />
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-15", style.from, style.to)} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {hasImg ? (
                          <Image
                            src={cat.imageUrl}
                            alt={cat.name}
                            width={160}
                            height={160}
                            className="w-4/5 h-4/5 object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110"
                            priority={i < 4}
                          />
                        ) : (
                          <span className="text-5xl sm:text-6xl select-none transition-transform duration-500 group-hover:scale-110 drop-shadow-md">{style.emoji}</span>
                        )}
                      </div>

                      {/* Name strip */}
                      <div className="relative z-10 px-3 py-2.5 sm:px-4 sm:py-3 bg-white border-t border-slate-100 flex items-center justify-between group-hover:bg-primary group-hover:border-primary transition-colors duration-300">
                        <span className="text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-white transition-colors line-clamp-1">{cat.name}</span>
                        <span className="text-[10px] font-black text-primary group-hover:text-white transition-colors shrink-0 ml-1">→</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── More categories — horizontal pill scroll ── */}
          {moreCats.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 px-1">
              {moreCats.map((cat: any, i: number) => {
                const style = getCategoryStyle(cat.name || '');
                return (
                  <Link
                    key={i}
                    href={`/search?c=${encodeURIComponent(cat.name)}`}
                    className="group flex items-center gap-2 shrink-0 px-3 py-2 bg-white border border-slate-100 rounded-full hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm transition-all duration-200"
                  >
                    <span className="text-base leading-none">{style.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-primary transition-colors whitespace-nowrap">{cat.name}</span>
                  </Link>
                );
              })}
              <Link href="/search" className="flex items-center gap-1.5 shrink-0 px-3 py-2 bg-primary text-white border border-primary rounded-full text-[11px] font-black">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </motion.section>
      )}

      {/* ════════════════════════════════════════════════
          BEST SELLERS
          ════════════════════════════════════════════════ */}
      {bestSellers && bestSellers.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
          className="space-y-4"
        >
          <div className="flex items-end justify-between px-1">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Trending Now</p>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">Most Popular Brands</h2>
            </div>
            <Link href="/search?sort=popular" className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-0.5 hover:underline">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
            {bestSellers.slice(0, 8).map((p: any, i: number) => (
              <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="min-w-[160px] sm:min-w-[190px]">
                <ProductCard product={p} priority={i < 4} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ════════════════════════════════════════════════
          THE SAHIMED ADVANTAGE  —  beats PlatinumRx's basic icon row
          ════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-10"
      >
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-6 sm:mb-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Sahimed</span> Advantage
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">What makes us India's most trusted online pharmacy</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
            {ADVANTAGES.map((adv, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 hover:bg-white/10 transition-colors duration-300"
              >
                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center", adv.bg)}>
                  <adv.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", adv.color)} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white leading-none">{adv.val}</p>
                  <p className="text-xs font-black text-slate-300 mt-0.5 uppercase tracking-wide">{adv.sub}</p>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-medium hidden sm:block">{adv.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Certification strip */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {[
              { icon: '🔒', label: 'Drug License', sub: 'KA-B51-286602' },
              { icon: '🌐', label: 'SSL Encrypted', sub: '256-bit Security' },
              { icon: '🏥', label: 'Licensed Pharmacist', sub: 'On Every Order' },
              { icon: '⭐', label: 'Google Verified', sub: '4.8★ Rating' },
            ].map((cert, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-lg">{cert.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wider leading-none">{cert.label}</p>
                  <p className="text-[9px] text-slate-500 font-medium">{cert.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════
          TOP SELECTIONS
          ════════════════════════════════════════════════ */}
      {topSelections && topSelections.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
          className="space-y-4"
        >
          <div className="flex items-end justify-between px-1">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-violet-500 fill-violet-500" />
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Hand Picked</p>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">Top Selections</h2>
            </div>
            <Link href="/search?sort=top" className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-0.5 hover:underline">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
            {topSelections.map((p: any, i: number) => (
              <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="min-w-[160px] sm:min-w-[190px]">
                <ProductCard product={p} priority={i < 2} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Free Delivery Strip ── */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary via-teal-500 to-primary shadow-xl shadow-primary/20 px-5 py-4 sm:px-8 sm:py-5 flex items-center gap-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="flex items-center gap-3 flex-1 relative z-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Pan India Delivery</p>
            <h3 className="text-sm sm:text-lg font-black text-white leading-tight">Free Delivery Above <span className="text-yellow-300">₹499</span></h3>
          </div>
        </div>
        <Link href="/search" className="relative z-10 bg-white text-primary px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-white/90 transition-all active:scale-95 shadow-lg whitespace-nowrap">
          Shop Now →
        </Link>
      </motion.section>

      {/* ════════════════════════════════════════════════
          DYNAMIC CATEGORY PRODUCT ROWS
          ════════════════════════════════════════════════ */}
      {topDynamicCategories.map(([categoryName, products]: any, idx: number) => {
        if (!(products as any[]).length) return null;
        const style = getCategoryStyle(categoryName as string);
        return (
          <motion.section
            key={categoryName}
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            className="space-y-4"
          >
            <div className="flex items-end justify-between px-1">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm leading-none">{style.emoji}</span>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", style.text)}>{categoryName}</p>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">Top in {categoryName}</h2>
              </div>
              <Link href={`/search?c=${encodeURIComponent(categoryName)}`} className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-0.5 hover:underline">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
              {(products as any[]).slice(0, 8).map((p: any, i: number) => (
                <motion.div key={p.id || p._id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="min-w-[160px] sm:min-w-[190px]">
                  <ProductCard product={p} priority={idx === 0 && i < 2} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })}

      {/* ── WhatsApp Order CTA ── */}
      <motion.div
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="rounded-2xl sm:rounded-3xl border border-[#25D366]/20 bg-[#f0fdf4] p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#25D366] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/30">
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-[#25D366] uppercase tracking-widest mb-0.5">Prefer ordering on WhatsApp?</p>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Send your prescription & get it delivered</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Our pharmacist replies within 5 minutes</p>
        </div>
        <Link
          href="https://wa.me/917349499898?text=Hi%2C%20I%20want%20to%20order%20medicines"
          target="_blank"
          className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-[#22c55e] transition-all active:scale-95 shadow-lg shadow-[#25D366]/30 whitespace-nowrap"
        >
          Order Now →
        </Link>
      </motion.div>

    </div>
  );
}
