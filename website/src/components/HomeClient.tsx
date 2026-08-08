"use client"

import * as React from 'react';
import { ChevronRight, ShieldCheck, Star, Zap, BadgeCheck, Award, Clock, Package, Truck } from 'lucide-react';
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

// ─── Category Style Map with HD Medical Images & Themes ────────────────────────
function getCategoryStyle(name: string): { 
  emoji: string; 
  image: string; 
  from: string; 
  to: string; 
  text: string; 
  bg: string;
  border: string;
  badge: string;
} {
  const l = name.toLowerCase();

  // 1. Mental Well-being (Teal: Brain icon & gentle calming waves)
  if (l.includes('mental') || l.includes('well-being') || l.includes('wellbeing') || l.includes('neuro') || l.includes('brain') || l.includes('sleep') || l.includes('mind')) {
    return { 
      emoji: '🧠', 
      image: '/images/cat_mental_wellbeing.jpg', 
      from: 'from-teal-400', 
      to: 'to-cyan-300', 
      text: 'text-teal-700',
      bg: 'rgba(13,148,136,0.08)',
      border: 'rgba(13,148,136,0.25)',
      badge: 'Mental Well-being'
    };
  }

  // 2. Cardiovascular Health (Gentle Blue: Heart icon & pulse line)
  if (l.includes('cardio') || l.includes('cardiac') || l.includes('heart') || l.includes('pulse') || l.includes('hypertension')) {
    return { 
      emoji: '🫀', 
      image: '/images/cat_cardio_health.jpg', 
      from: 'from-blue-400', 
      to: 'to-indigo-300', 
      text: 'text-blue-700',
      bg: 'rgba(37,99,235,0.08)',
      border: 'rgba(37,99,235,0.25)',
      badge: 'Cardiovascular'
    };
  }

  // 3. Diabetes Care (Fresh Green: Glucose structure & test)
  if (l.includes('diabet') || l.includes('sugar') || l.includes('glucose') || l.includes('insulin')) {
    return { 
      emoji: '🩸', 
      image: '/images/cat_diabetes_care.jpg', 
      from: 'from-emerald-400', 
      to: 'to-green-300', 
      text: 'text-emerald-700',
      bg: 'rgba(5,150,105,0.08)',
      border: 'rgba(5,150,105,0.25)',
      badge: 'Diabetes Care'
    };
  }

  // 4. Digestive Wellness (Warm Orange: Healthy digestive tract)
  if (l.includes('digest') || l.includes('gastro') || l.includes('stomach') || l.includes('gut') || l.includes('acidity') || l.includes('liver')) {
    return { 
      emoji: '🌿', 
      image: '/images/cat_digestive_wellness.jpg', 
      from: 'from-orange-400', 
      to: 'to-amber-300', 
      text: 'text-orange-700',
      bg: 'rgba(234,88,12,0.08)',
      border: 'rgba(234,88,12,0.25)',
      badge: 'Digestive'
    };
  }

  // 5. Immune Defense & Allergies (Light Purple: Protective shield)
  if (l.includes('immune') || l.includes('defense') || l.includes('allerg') || l.includes('immunity') || l.includes('respi') || l.includes('cold')) {
    return { 
      emoji: '🛡️', 
      image: '/images/cat_immune_defense.jpg', 
      from: 'from-purple-400', 
      to: 'to-violet-300', 
      text: 'text-purple-700',
      bg: 'rgba(124,58,237,0.08)',
      border: 'rgba(124,58,237,0.25)',
      badge: 'Immune Defense'
    };
  }

  // 6. Bone & Joint Strength (Cheerful Yellow: Knee joint & bones)
  if (l.includes('bone') || l.includes('joint') || l.includes('ortho') || l.includes('strength') || l.includes('calcium') || l.includes('knee') || l.includes('pain')) {
    return { 
      emoji: '🦴', 
      image: '/images/cat_bone_joint.jpg', 
      from: 'from-amber-400', 
      to: 'to-yellow-300', 
      text: 'text-amber-800',
      bg: 'rgba(217,119,6,0.08)',
      border: 'rgba(217,119,6,0.25)',
      badge: 'Bone & Joint'
    };
  }

  // Skin & Derma
  if (l.includes('skin') || l.includes('derma') || l.includes('acne')) {
    return { 
      emoji: '✨', 
      image: '/images/cat_skin_derma.webp', 
      from: 'from-pink-400', 
      to: 'to-rose-300', 
      text: 'text-pink-700',
      bg: 'rgba(219,39,119,0.08)',
      border: 'rgba(219,39,119,0.25)',
      badge: 'Derma Care'
    };
  }

  // Women's Health
  if (l.includes('women') || l.includes('gynae')) {
    return { 
      emoji: '🌸', 
      image: '/images/cat_womens.webp', 
      from: 'from-fuchsia-400', 
      to: 'to-pink-300', 
      text: 'text-fuchsia-700',
      bg: 'rgba(192,38,211,0.08)',
      border: 'rgba(192,38,211,0.25)',
      badge: 'Women Health'
    };
  }

  return { 
    emoji: '💊', 
    image: '/images/cat_vitamins.webp', 
    from: 'from-primary', 
    to: 'to-teal-400', 
    text: 'text-primary',
    bg: 'rgba(0,159,156,0.08)',
    border: 'rgba(0,159,156,0.25)',
    badge: 'Upto 61% OFF'
  };
}

// Default Mega Banners
const DEFAULT_BANNERS = [
  {
    imageUrl: '/images/mega_banner_1.webp',
    title: 'Up to 61% OFF Chronic Care Medicines',
    subtitle: '100% Genuine Branded Generics Delivered Fast Across India',
    link: '/search'
  },
  {
    imageUrl: '/images/mega_banner_2.webp',
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

  // Deduplicate MongoDB categories by name
  const uniqueCategories = React.useMemo(() => {
    const seen = new Set<string>();
    return (categories || []).filter((cat: any) => {
      const nameKey = (cat.name || cat.category || '').trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });
  }, [categories]);

  // Render ONLY categories selected in MongoDB Category Master
  const featuredCats = React.useMemo(() => {
    return uniqueCategories.slice(0, 12);
  }, [uniqueCategories]);

  const moreCats = (uniqueCategories || []).slice(12, 30);

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
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-none text-slate-900">
              Top Medical{' '}
              <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Categories</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Sahi Dawai, Sahi Daam Pe — Genuine stock up to 61% OFF</p>
          </div>
          <Link href="/search" className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 hover:shadow-md px-4 py-2 rounded-full border transition-all active:scale-95 shadow-xs shrink-0"
            style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.25)' }}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── 8 Featured Medical Category Icon Cards ── */}
        <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible scrollbar-hide py-1 px-0.5 sm:px-0 items-center">
          {featuredCats.map((cat: any, i: number) => {
            const style = getCategoryStyle(cat.name || '');
            const isValidUrl = cat.imageUrl && (cat.imageUrl.startsWith('/') || cat.imageUrl.startsWith('http')) && !cat.imageUrl.includes('picsum') && !cat.imageUrl.includes('Diabetology');
            const imgSrc = isValidUrl ? cat.imageUrl : style.image;
            
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
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="shrink-0 sm:shrink">
                <Link
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center text-center p-1 transition-transform duration-200 sm:hover:-translate-y-1 w-20 sm:w-auto"
                >
                  {/* Small Round Circular Image Container */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-full overflow-hidden p-0.5 shadow-xs border border-slate-200/80 sm:group-hover:scale-105 sm:group-hover:shadow-md transition-all duration-300 bg-white shrink-0"
                    style={{ boxShadow: `0 3px 10px ${accent.color}18` }}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-50">
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        priority={i < 4}
                      />
                    </div>
                  </div>

                  {/* Category Name & Compact Tag */}
                  <h3 className="text-[11px] sm:text-xs font-black tracking-tight text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mt-1.5">
                    {cat.name}
                  </h3>
                  <span 
                    className="inline-block text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: accent.bg, color: accent.color, border: `1px solid ${accent.border}` }}
                  >
                    UP TO 61% OFF
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── More categories — horizontal pill scroll ── */}
        {moreCats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide overscroll-x-contain touch-pan-x transform-gpu pt-2 pb-1 px-1">
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
            <Link href="/search" className="flex items-center gap-1.5 shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-purple-600 rounded-full text-xs font-black shadow-xs hover:shadow-md transition-all active:scale-95">
              <span>View All Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </motion.section>

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

      {/* ── Section Page Breaker ── */}
      <div className="w-full my-6 flex items-center justify-center gap-2">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200 flex-1 max-w-xs" />
        <div className="w-1.5 h-1.5 rounded-full bg-teal-500/60" />
        <div className="h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200 flex-1 max-w-xs" />
      </div>

      {/* ══════════════════════════════════════════════════════
          CATEGORY BLOCK 2 — Health & Wellness Categories (Clean White Background)
          ══════════════════════════════════════════════════════ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm space-y-6"
      >
        {/* Section Header */}
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-none text-slate-900">
              Wellness & OTC{' '}
              <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Categories</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Personal Care, Healthcare Devices & Everyday Essentials</p>
          </div>
          <Link href="/search?c=OTC" className="text-[11px] font-black uppercase tracking-wider flex items-center gap-0.5 hover:underline px-3.5 py-1.5 rounded-full border transition-all"
            style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Category 2 Grid — Compact Circular Avatar Icons ── */}
        <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible scrollbar-hide py-1 px-0.5 sm:px-0">
          {[
            { name: 'Personal Care', emoji: '✨', bg: 'rgba(124,58,237,0.06)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)' },
            { name: 'Baby Care', emoji: '👶', bg: 'rgba(219,39,119,0.06)', color: '#db2777', border: 'rgba(219,39,119,0.2)' },
            { name: 'Health Devices', emoji: '🩺', bg: 'rgba(5,150,105,0.06)', color: '#059669', border: 'rgba(5,150,105,0.2)' },
            { name: 'Ayurveda', emoji: '🌿', bg: 'rgba(217,119,6,0.06)', color: '#d97706', border: 'rgba(217,119,6,0.2)' },
            { name: 'Fitness & Protein', emoji: '🏋️‍♂️', bg: 'rgba(59,130,246,0.06)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
            { name: 'Eye & Ear Care', emoji: '👁️', bg: 'rgba(239,68,68,0.06)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
            { name: 'First Aid', emoji: '🩹', bg: 'rgba(20,184,166,0.06)', color: '#14b8a6', border: 'rgba(20,184,166,0.2)' },
            { name: 'Diabetes Devices', emoji: '🩸', bg: 'rgba(168,85,247,0.06)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' },
          ].map((cat: any, i: number) => {
            const style = getCategoryStyle(cat.name || '');
            const imgSrc = style.image;

            return (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="shrink-0 sm:shrink">
                <Link
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center text-center p-1 transition-transform duration-200 hover:-translate-y-1 w-20 sm:w-auto"
                >
                  {/* Small Round Circular Image Container */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-full overflow-hidden p-0.5 shadow-xs border border-slate-200/80 group-hover:scale-105 group-hover:shadow-md transition-all duration-300 bg-white shrink-0"
                    style={{ boxShadow: `0 3px 10px ${cat.color}18` }}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-50 flex items-center justify-center">
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Name & Tag */}
                  <h3 className="text-[11px] sm:text-xs font-black tracking-tight text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mt-1.5">
                    {cat.name}
                  </h3>
                  <span 
                    className="inline-block text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                  >
                    UP TO 50% OFF
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
