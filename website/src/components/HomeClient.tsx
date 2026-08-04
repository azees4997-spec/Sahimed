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

      {/* ══════════════════════════════════════════════════════
          PREMIUM PASTEL HERO — Full-Bleed Edge-to-Edge
          ══════════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible"
        className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden my-0"
      >
        {/* Hero Background: soft lavender-peach gradient */}
        <div className="relative w-full min-h-[400px] sm:min-h-[460px] lg:min-h-[500px] overflow-hidden flex items-center"
          style={{ background: 'linear-gradient(135deg, #fdf6ff 0%, #fff0f7 35%, #f0fffe 70%, #fffbeb 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-40 pointer-events-none blur-3xl" style={{ background: 'radial-gradient(circle, #d8b4fe, #a78bfa)' }} />
          <div className="absolute -bottom-16 -right-10 w-80 h-80 rounded-full opacity-30 pointer-events-none blur-3xl" style={{ background: 'radial-gradient(circle, #6ee7b7, #34d399)' }} />
          <div className="absolute top-10 right-1/3 w-40 h-40 rounded-full opacity-20 pointer-events-none blur-2xl" style={{ background: 'radial-gradient(circle, #fda4af, #fb7185)' }} />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-10 sm:py-14 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">

            {/* ── Left: Typography + Bullets + CTAs ── */}
            <div className="space-y-6 text-center md:text-left max-w-2xl">

              {/* Label pill */}
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm"
                style={{ background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.4)', color: '#7c3aed' }}
              >
                🏥 India&apos;s Trusted Pharmacy
              </span>

              {/* Headline with gradient text */}
              <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.06]">
                <span className="text-slate-900">Switch to</span><br />
                <span className="text-slate-900">Branded </span>
                <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Generics
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base text-slate-500 font-medium max-w-md">
                Same formula as branded drugs — certified quality, verified by pharmacists, delivered to your door.
              </p>

              {/* 3 Premium Checkmark Bullets */}
              <div className="space-y-3 pt-1">
                {[
                  { text: 'Trusted by thousands of customers', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
                  { text: 'WHO & FDA Certified', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
                  { text: 'Save upto 60% on MRP', color: '#db2777', bg: 'rgba(219,39,119,0.12)' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center justify-center md:justify-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-md"
                      style={{ background: b.bg, color: b.color, border: `1.5px solid ${b.color}30` }}
                    >
                      ✓
                    </div>
                    <span className="text-base sm:text-lg font-bold text-slate-800">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2 flex-wrap">
                <Link
                  href="/search"
                  className="px-7 py-3.5 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
                >
                  Shop Now <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/prescription"
                  className="px-7 py-3.5 bg-white/80 backdrop-blur-sm hover:bg-white border border-purple-200 text-slate-800 font-black text-sm uppercase tracking-wider rounded-2xl shadow-sm transition-all"
                >
                  Upload Rx
                </Link>
              </div>

              {/* Tiny trust stats row */}
              <div className="flex items-center justify-center md:justify-start gap-4 pt-1 flex-wrap">
                {[
                  { val: '10K+', label: 'Customers' },
                  { val: '4.8★', label: 'Rating' },
                  { val: '60%', label: 'Max Savings' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <p className="text-lg font-black" style={{ color: '#7c3aed' }}>{s.val}</p>
                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                    {i < 2 && <div className="w-px h-4 bg-slate-200 ml-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Hero Image with floating badges ── */}
            <div className="relative shrink-0 w-72 sm:w-80 md:w-[420px] lg:w-[500px] h-[360px] sm:h-[420px] lg:h-[470px] flex items-end justify-center">
              {/* Soft glow ring behind image */}
              <div className="absolute inset-8 rounded-full blur-2xl opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #a78bfa 0%, #f9a8d4 50%, #6ee7b7 100%)' }}
              />
              <Image
                src="/images/hero_generics_ambassador.jpg"
                alt="SahiMed Certified Doctor Brand Ambassador"
                fill
                className="object-cover object-center"
                priority
              />

              {/* Floating badge: Savings */}
              <div className="absolute top-4 left-0 sm:-left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl border border-pink-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)' }}>💊</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Save upto</p>
                  <p className="text-base font-black" style={{ color: '#db2777' }}>60% OFF</p>
                </div>
              </div>

              {/* Floating badge: Certification */}
              <div className="absolute bottom-10 right-0 sm:-right-4 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl border border-purple-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>🏅</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certified</p>
                  <p className="text-sm font-black" style={{ color: '#7c3aed' }}>WHO & FDA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pastel Trust Ticker Strip ── */}
        <div className="w-full overflow-hidden py-3 border-y"
          style={{ background: 'linear-gradient(90deg, #f5f3ff, #fdf2f8, #ecfdf5, #fffbeb, #f5f3ff)', borderColor: 'rgba(167,139,250,0.2)' }}
        >
          <div className="flex gap-0 animate-marquee w-max">
            {[
              ...[
                { icon: '✅', text: 'Trusted by Thousands' },
                { icon: '🏅', text: 'WHO & FDA Certified' },
                { icon: '💊', text: 'Save upto 60% on MRP' },
                { icon: '🚚', text: 'Free Delivery ₹499+' },
                { icon: '🏥', text: 'Licensed Pharmacy KA-B51' },
                { icon: '⭐', text: '4.8 Star Rating' },
                { icon: '📦', text: '50,000+ Medicines' },
                { icon: '⚡', text: '24hr Express Delivery' },
              ],
              ...[
                { icon: '✅', text: 'Trusted by Thousands' },
                { icon: '🏅', text: 'WHO & FDA Certified' },
                { icon: '💊', text: 'Save upto 60% on MRP' },
                { icon: '🚚', text: 'Free Delivery ₹499+' },
                { icon: '🏥', text: 'Licensed Pharmacy KA-B51' },
                { icon: '⭐', text: '4.8 Star Rating' },
                { icon: '📦', text: '50,000+ Medicines' },
                { icon: '⚡', text: '24hr Express Delivery' },
              ],
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 mx-6 shrink-0">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{item.text}</span>
                <span className="text-slate-300 mx-1">·</span>
              </div>
            ))}
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
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm mb-2"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              💊 Explore Healthcare
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-none text-slate-900">
              Top Medical{' '}
              <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Categories</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Sahi Dawai, Sahi Daam Pe — Genuine stock up to 61% OFF</p>
          </div>
          <Link href="/search" className="text-[11px] font-black uppercase tracking-wider flex items-center gap-0.5 hover:underline px-3 py-1.5 rounded-full border"
            style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Featured 8 Category Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
          {featuredCats.map((cat: any, i: number) => {
            const style = getCategoryStyle(cat.name || '');
            const imgSrc = (cat.imageUrl && !cat.imageUrl.includes('picsum')) ? cat.imageUrl : style.image;
            // Per-category pastel accent colors for card footer
            const cardAccents = [
              { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', glow: 'rgba(124,58,237,0.15)' },
              { bg: 'rgba(219,39,119,0.1)', color: '#db2777', glow: 'rgba(219,39,119,0.15)' },
              { bg: 'rgba(5,150,105,0.1)', color: '#059669', glow: 'rgba(5,150,105,0.15)' },
              { bg: 'rgba(217,119,6,0.1)', color: '#d97706', glow: 'rgba(217,119,6,0.15)' },
              { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
              { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', glow: 'rgba(239,68,68,0.15)' },
              { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6', glow: 'rgba(20,184,166,0.15)' },
              { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
            ];
            const accent = cardAccents[i % cardAccents.length];

            return (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 hover:-translate-y-2 bg-white"
                  style={{ border: `1.5px solid ${accent.color}30`, boxShadow: `0 4px 20px ${accent.glow}` }}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                    {/* Discount badge */}
                    <div className="absolute top-2.5 left-2.5 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md"
                      style={{ background: `linear-gradient(135deg, ${accent.color}, ${accent.color}cc)` }}
                    >
                      UP TO 61% OFF
                    </div>
                  </div>

                  {/* Name and Action */}
                  <div className="p-3 sm:p-4 flex items-center justify-between transition-all duration-300"
                    style={{ background: `${accent.bg}` }}
                  >
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight leading-tight line-clamp-1" style={{ color: accent.color }}>
                        {cat.name}
                      </h3>
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                        Pharmacist Verified
                      </p>
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center font-black text-xs shadow-sm shrink-0 ml-2"
                      style={{ color: accent.color }}
                    >
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

      {/* ══════════════════════════════════════════════════════
          THE SAHIMED ADVANTAGE — Premium Pastel Cards
          ══════════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10"
        style={{ background: 'linear-gradient(135deg, #fdf6ff 0%, #fff0f7 50%, #f0fffe 100%)', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, #d8b4fe, #a78bfa)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6ee7b7, #34d399)' }} />

        <div className="relative z-10">
          <div className="text-center mb-7 sm:mb-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              ✨ Why Choose SahiMed
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight text-slate-900">
              The <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SahiMed</span> Advantage
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">What makes us India&apos;s most trusted online pharmacy</p>
          </div>

          {/* Pastel advantage cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
            {[
              { icon: BadgeCheck, val: '100%', sub: 'Genuine Medicines', desc: 'Sourced from licensed manufacturers', emoji: '💊', bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '#6ee7b7', color: '#059669' },
              { icon: Award, val: '61%', sub: 'Max Savings', desc: 'Highest discounts on branded generics', emoji: '🏷️', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '#a78bfa', color: '#7c3aed' },
              { icon: Clock, val: '24hr', sub: 'Express Delivery', desc: 'Fastest medicine delivery in India', emoji: '🚚', bg: 'linear-gradient(135deg,#fff0f7,#fce7f3)', border: '#f9a8d4', color: '#db2777' },
              { icon: ShieldCheck, val: 'Licensed', sub: 'Rx Pharmacy', desc: 'Drug License No. KA-B51-286602', emoji: '🔒', bg: 'linear-gradient(135deg,#fffbeb,#fef9c3)', border: '#fde68a', color: '#d97706' },
            ].map((adv, i) => (
              <motion.div
                key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:-translate-y-1.5 transition-all duration-300 cursor-default"
                style={{ background: adv.bg, border: `1.5px solid ${adv.border}60`, boxShadow: `0 4px 20px ${adv.border}30` }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm text-xl">
                    {adv.emoji}
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black leading-none" style={{ color: adv.color }}>{adv.val}</p>
                  <p className="text-xs font-black text-slate-700 mt-1 uppercase tracking-wide">{adv.sub}</p>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-medium hidden sm:block">{adv.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Certification pills */}
          <div className="mt-6 pt-5 border-t border-white/60 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { icon: '🔒', label: 'Drug Lic. KA-B51-286602', color: '#d97706' },
              { icon: '🌐', label: '256-bit SSL Encrypted', color: '#059669' },
              { icon: '🏥', label: 'Licensed Pharmacist', color: '#7c3aed' },
              { icon: '⭐', label: 'Google Verified 4.8★', color: '#db2777' },
            ].map((cert, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" style={{ border: `1px solid ${cert.color}30` }}>
                <span className="text-sm">{cert.icon}</span>
                <p className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap" style={{ color: cert.color }}>{cert.label}</p>
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

      {/* ── 4 Premium Pastel Promise Cards ── */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            icon: '🚚',
            bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
            border: '#6ee7b7',
            color: '#059669',
            title: 'Free Delivery',
            sub: 'On orders above ₹499',
            badge: '₹0 Delivery',
          },
          {
            icon: '🏅',
            bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
            border: '#a78bfa',
            color: '#7c3aed',
            title: 'Certified Medicines',
            sub: 'Licensed pharmacy · Drug Lic. KA-B51',
            badge: 'Govt Certified',
          },
          {
            icon: '📦',
            bg: 'linear-gradient(135deg,#fff0f7,#fce7f3)',
            border: '#f9a8d4',
            color: '#db2777',
            title: 'Long Expiry',
            sub: 'Min 6 months expiry on every product',
            badge: 'Fresh Stock',
          },
          {
            icon: '🔒',
            bg: 'linear-gradient(135deg,#fffbeb,#fef9c3)',
            border: '#fde68a',
            color: '#d97706',
            title: 'Secure Payments',
            sub: '256-bit SSL · UPI · Cards · COD',
            badge: '100% Safe',
          },
        ].map((card, i) => (
          <motion.div
            key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl hover:-translate-y-1 transition-all duration-300 cursor-default"
            style={{ background: card.bg, border: `1.5px solid ${card.border}60`, boxShadow: `0 4px 20px ${card.border}30` }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center text-xl shadow-sm">
                {card.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-white/70"
                style={{ color: card.color }}
              >
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
