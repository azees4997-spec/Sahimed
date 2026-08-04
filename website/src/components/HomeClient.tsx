"use client"

import * as React from 'react';
import { ChevronRight, ShieldCheck, Star, Zap, BadgeCheck, Award, Clock } from 'lucide-react';
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

// ─── Category Style Map with HD Medical Images ────────────────────────────────
function getCategoryStyle(name: string): { emoji: string; image: string; from: string; to: string; text: string } {
  const l = name.toLowerCase();
  if (l.includes('cardiac') || l.includes('heart')) return { emoji: '❤️', image: '/images/cat_cardiac.jpg', from: 'from-rose-400', to: 'to-pink-300', text: 'text-rose-700' };
  if (l.includes('diabet') || l.includes('sugar') || l.includes('insulin')) return { emoji: '🩸', image: '/images/cat_diabetes.jpg', from: 'from-blue-400', to: 'to-cyan-300', text: 'text-blue-700' };
  if (l.includes('vitamin') || l.includes('supplement') || l.includes('nutrition')) return { emoji: '💊', image: '/images/cat_vitamins.jpg', from: 'from-amber-400', to: 'to-yellow-300', text: 'text-amber-700' };
  if (l.includes('respi') || l.includes('lung') || l.includes('asthma')) return { emoji: '🫁', image: '/images/cat_respiratory.jpg', from: 'from-sky-400', to: 'to-blue-300', text: 'text-sky-700' };
  if (l.includes('pain') || l.includes('ortho') || l.includes('joint')) return { emoji: '🩹', image: '/images/cat_pain_ortho.jpg', from: 'from-orange-400', to: 'to-amber-300', text: 'text-orange-700' };
  if (l.includes('skin') || l.includes('derma') || l.includes('acne')) return { emoji: '✨', image: '/images/cat_skin_derma.jpg', from: 'from-pink-400', to: 'to-rose-300', text: 'text-pink-700' };
  if (l.includes('gastro') || l.includes('digest') || l.includes('stomach')) return { emoji: '🌿', image: '/images/cat_gastro.jpg', from: 'from-emerald-400', to: 'to-green-300', text: 'text-emerald-700' };
  if (l.includes('neuro') || l.includes('brain') || l.includes('sleep')) return { emoji: '🧠', image: '/images/cat_neuro.jpg', from: 'from-violet-400', to: 'to-purple-300', text: 'text-violet-700' };
  if (l.includes('women') || l.includes('gynae')) return { emoji: '🌸', image: '/images/cat_womens.jpg', from: 'from-fuchsia-400', to: 'to-pink-300', text: 'text-fuchsia-700' };
  return { emoji: '💊', image: '/images/cat_vitamins.jpg', from: 'from-primary', to: 'to-teal-400', text: 'text-primary' };
}

// Default Mega Banners
const DEFAULT_BANNERS = [
  {
    imageUrl: '/images/mega_banner_1.jpg',
    title: 'Up to 61% OFF Chronic Care Medicines',
    subtitle: '100% Genuine Branded Generics Delivered Fast Across India',
    link: '/search'
  },
  {
    imageUrl: '/images/mega_banner_2.jpg',
    title: 'Licensed Prescription Pharmacy',
    subtitle: 'Every Order Verified By Registered Pharmacists',
    link: '/prescription'
  }
];

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

  const displayBanners = (banners && banners.length > 0) ? banners : DEFAULT_BANNERS;

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

  // Featured 8 categories for primary grid
  const featuredCats = (categories && categories.length > 0) ? categories.slice(0, 8) : [
    { name: 'Cardiac Care' },
    { name: 'Diabetes Care' },
    { name: 'Vitamins & Supplements' },
    { name: 'Respiratory Care' },
    { name: 'Pain & Ortho' },
    { name: 'Skin & Derma' },
    { name: 'Gastro Care' },
    { name: 'Women\'s Health' }
  ];
  const moreCats = categories.slice(8, 20);

  return (
    <div className="space-y-8 sm:space-y-14 pb-0 sm:pb-16 overflow-x-hidden max-w-full">

      {/* ── PlatinumRx-Style 100% Seamless Hero Banner (100vw Full-Bleed Edge-to-Edge) ── */}
      <motion.section 
        variants={fadeUp} initial="hidden" animate="visible" 
        className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden my-0"
      >
        <div className="relative w-full min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] bg-[#fdebeb] overflow-hidden flex items-center">
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-8 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
            
            {/* Left Column: Bold PlatinumRx Style Typography & Checkmarks */}
            <div className="space-y-6 text-center md:text-left max-w-2xl">
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08]">
                Switch to Branded <br />
                <span className="text-[#f43f5e] font-black">Generics</span>
              </h1>

              {/* 3 Green Checkmark Bullets */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center justify-center md:justify-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    ✓
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">
                    Trusted by 10L+ users
                  </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    ✓
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">
                    Save upto 60%
                  </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    ✓
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">
                    Doctor Approved
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-4 pt-4 flex-wrap">
                <Link 
                  href="/search" 
                  className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  Browse Generics Now <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/prescription" 
                  className="px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-sm transition-all"
                >
                  Upload Prescription
                </Link>
              </div>
            </div>

            {/* Right Column: 100% Seamless Person Image matching bg-[#fdebeb] */}
            <div className="relative shrink-0 w-72 sm:w-86 md:w-[460px] lg:w-[540px] h-[340px] sm:h-[400px] lg:h-[460px] flex items-end justify-center">
              <Image 
                src="/images/hero_generics_ambassador.jpg" 
                alt="SahiMed Certified Doctor Brand Ambassador" 
                fill 
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════
          SHOP BY CATEGORY  —  Rich HD Medical Cards
          ════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        className="space-y-4"
      >
        {/* Section Header */}
        <div className="flex items-end justify-between px-1">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
              Explore Healthcare
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-2">
              Top Medical <span className="text-primary">Categories</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Sahi Dawai, Sahi Daam Pe — Genuine stock up to 61% OFF</p>
          </div>
          <Link href="/search" className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-0.5 hover:underline bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
            View All Categories <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Featured 8 Category Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
          {featuredCats.map((cat: any, i: number) => {
            const style = getCategoryStyle(cat.name || '');
            const imgSrc = (cat.imageUrl && !cat.imageUrl.includes('picsum')) ? cat.imageUrl : style.image;

            return (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 shadow-md hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:-translate-y-1.5 bg-white"
                >
                  {/* Category Image Header */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-50">
                    <Image
                      src={imgSrc}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={i < 4}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Discount badge */}
                    <div className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                      UP TO 61% OFF
                    </div>
                  </div>

                  {/* Name and Action */}
                  <div className="p-3 sm:p-4 bg-white flex items-center justify-between border-t border-slate-100 group-hover:bg-primary transition-colors duration-300">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-white transition-colors line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[9px] font-medium text-slate-400 group-hover:text-white/80 transition-colors mt-0.5">
                        Pharmacist Verified
                      </p>
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 group-hover:bg-white text-primary group-hover:text-primary flex items-center justify-center font-black text-xs transition-colors shrink-0 ml-2">
                      →
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

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
          THE SAHIMED ADVANTAGE — light, colorful version
          ════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/5 via-white to-violet-50 border border-primary/10 p-5 sm:p-10"
      >
        {/* Soft decorations */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-6 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/10 px-3 py-1 rounded-full mb-3">
              Why Choose Sahimed
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              The <span className="text-primary">Sahimed</span> Advantage
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium">What makes us India's most trusted online pharmacy</p>
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
                className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center", adv.bg)}>
                  <adv.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", adv.color)} />
                </div>
                <div>
                  <p className={cn("text-xl sm:text-2xl font-black leading-none", adv.color)}>{adv.val}</p>
                  <p className="text-xs font-black text-slate-700 mt-0.5 uppercase tracking-wide">{adv.sub}</p>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-medium hidden sm:block">{adv.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Certification pills */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { icon: '🔒', label: 'Drug Lic. KA-B51-286602' },
              { icon: '🌐', label: '256-bit SSL Encrypted' },
              { icon: '🏥', label: 'Licensed Pharmacist' },
              { icon: '⭐', label: 'Google Verified 4.8★' },
            ].map((cert, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                <span className="text-sm">{cert.icon}</span>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">{cert.label}</p>
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

      {/* ── 4 Promise Cards (replaces old dark strip) ── */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            icon: '🚚',
            bg: 'bg-teal-50',
            border: 'border-teal-100',
            iconBg: 'bg-teal-100',
            title: 'Free Delivery',
            sub: 'On orders above ₹499',
            badge: '₹0 Delivery',
            badgeCls: 'bg-teal-100 text-teal-700',
          },
          {
            icon: '✅',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            iconBg: 'bg-emerald-100',
            title: 'Certified Medicines',
            sub: 'Licensed pharmacy · Drug Lic. KA-B51',
            badge: 'Govt Certified',
            badgeCls: 'bg-emerald-100 text-emerald-700',
          },
          {
            icon: '📅',
            bg: 'bg-violet-50',
            border: 'border-violet-100',
            iconBg: 'bg-violet-100',
            title: 'Long Expiry',
            sub: 'Min 6 months expiry on every product',
            badge: 'Freshness Assured',
            badgeCls: 'bg-violet-100 text-violet-700',
          },
          {
            icon: '🔒',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            iconBg: 'bg-blue-100',
            title: 'Secure Payments',
            sub: '256-bit SSL · UPI · Cards · COD',
            badge: '100% Safe',
            badgeCls: 'bg-blue-100 text-blue-700',
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={cn(
              'flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',
              card.bg, card.border
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl', card.iconBg)}>
                {card.icon}
              </div>
              <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full', card.badgeCls)}>
                {card.badge}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-tight">{card.title}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-snug">{card.sub}</p>
            </div>
          </motion.div>
        ))}
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
