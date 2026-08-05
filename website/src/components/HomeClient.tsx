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
    { name: "Women's Health" }
  ];
  const moreCats = categories.slice(8, 20);

  return (
    <div className="space-y-8 sm:space-y-14 pb-0 sm:pb-16 overflow-x-hidden max-w-full">

      {/* ════════════════════════════════════════════════
          SHOP BY CATEGORY  —  Rich HD Medical Cards
          ════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════
          SHOP BY CATEGORY  —  Clean White Section with Round Circular Category Images
          ════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm space-y-6"
      >
        {/* Section Header */}
        <div className="flex items-end justify-between px-1">
          <div>

            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-none text-slate-900">
              Top Medical{' '}
              <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Categories</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Sahi Dawai, Sahi Daam Pe — Genuine stock up to 61% OFF</p>
          </div>
          <Link href="/search" className="text-[11px] font-black uppercase tracking-wider flex items-center gap-0.5 hover:underline px-3.5 py-1.5 rounded-full border transition-all"
            style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Featured Category Cards — Clean White Cards with Circular Round Images ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {featuredCats.map((cat: any, i: number) => {
            const style = getCategoryStyle(cat.name || '');
            const imgSrc = (cat.imageUrl && !cat.imageUrl.includes('picsum')) ? cat.imageUrl : style.image;
            
            const cardAccents = [
              { color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.2)' },
              { color: '#db2777', bg: 'rgba(219,39,119,0.06)', border: 'rgba(219,39,119,0.2)' },
              { color: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.2)' },
              { color: '#d97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)' },
              { color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)' },
              { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)' },
              { color: '#14b8a6', bg: 'rgba(20,184,166,0.06)', border: 'rgba(20,184,166,0.2)' },
              { color: '#a855f7', bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.2)' },
            ];
            const accent = cardAccents[i % cardAccents.length];

            return (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center"
                >
                  {/* Round Circular Image Container */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-full overflow-hidden p-1 shadow-sm border border-slate-200/80 group-hover:scale-105 transition-transform duration-300 bg-white"
                    style={{ boxShadow: `0 4px 14px ${accent.color}20` }}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        priority={i < 4}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mt-2.5 space-y-1 w-full">
                    <h3 className="text-xs sm:text-[13px] font-black tracking-tight text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <span 
                      className="inline-block text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: accent.bg, color: accent.color, border: `1px solid ${accent.border}` }}
                    >
                      UP TO 61% OFF
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── More categories — horizontal pill scroll ── */}
        {moreCats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-2 pb-1 px-1">
            {moreCats.map((cat: any, i: number) => {
              const style = getCategoryStyle(cat.name || '');
              return (
                <Link
                  key={i}
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className="group flex items-center gap-2 shrink-0 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full hover:border-primary hover:bg-white hover:shadow-2xs transition-all duration-200"
                >
                  <span className="text-sm leading-none">{style.emoji}</span>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors whitespace-nowrap">{cat.name}</span>
                </Link>
              );
            })}
            <Link href="/search" className="flex items-center gap-1.5 shrink-0 px-4 py-1.5 bg-primary text-white border border-primary rounded-full text-xs font-black shadow-2xs">
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
