"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import {
  Info, Baby, Milk, Car, ShieldAlert, Stethoscope, AlertTriangle, Package,
  ShoppingCart, ShoppingBag, Minus, Plus, MapPin, ChevronDown, ChevronRight,
  AlertCircle, Truck, FlaskConical, Tag, Building2, Globe, Pill,
  ClipboardList, Zap, BookOpen, ThumbsUp, Share2, Copy, Send,
  CheckCircle2, Star, ShieldCheck, Clock, HeartPulse, BadgeCheck, Eye, ZoomIn,
  ChevronLeft, Check
} from 'lucide-react';
import { useMongoDBMolecule, useMongoDBCollection } from '@/hooks/use-mongodb';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageTransition from '@/components/PageTransition';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Footer from '@/components/Footer';

// ─── Strip HTML ──────────────────────────────────────────────────────────────
function stripHtml(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\|/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Recently Viewed helpers ─────────────────────────────────────────────────
const RV_KEY = 'sahimed_recently_viewed';
function saveRecentlyViewed(product: any) {
  if (typeof window === 'undefined' || !product?.id) return;
  const existing: any[] = JSON.parse(localStorage.getItem(RV_KEY) || '[]');
  const filtered = existing.filter((p: any) => p.id !== product.id);
  const entry = { id: product.id, name: product.name, imageUrl: product.imageUrl, price: product.price, mrp: product.mrp, seoUrlSlug: product.seoUrlSlug };
  const updated = [entry, ...filtered].slice(0, 10);
  localStorage.setItem(RV_KEY, JSON.stringify(updated));
}
function getRecentlyViewed(currentId: string): any[] {
  if (typeof window === 'undefined') return [];
  const items: any[] = JSON.parse(localStorage.getItem(RV_KEY) || '[]');
  return items.filter((p: any) => p.id !== currentId).slice(0, 6);
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", accent || "text-primary")}>{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon, accent }: { label: string; value?: string | null; icon?: any; accent?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      {Icon && (
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", accent || "bg-slate-100 text-slate-500")}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-slate-800 leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ─── Warning Tile ─────────────────────────────────────────────────────────────
function WarningTile({ label, value, icon: Icon, color }: { label: string; value?: string | null; icon: any; color: string }) {
  if (!value) return null;
  return (
    <div className={cn("rounded-2xl p-4 flex gap-3 border", color)}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[11px] font-semibold leading-relaxed opacity-90">{value}</p>
      </div>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a?: string | null }) {
  const [open, setOpen] = useState(false);
  if (!a) return null;
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
        <span className="text-xs font-bold text-slate-700 pr-4">{q}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-600 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Trust Badge ─────────────────────────────────────────────────────────────
function TrustBadge({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-[140px]">
      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-800 leading-tight">{label}</p>
        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── Molecule Illustration ────────────────────────────────────────────────────
function MoleculeIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full opacity-10" fill="none">
      <circle cx="100" cy="60" r="12" fill="#10b981" />
      <circle cx="50" cy="30" r="8" fill="#6366f1" />
      <circle cx="150" cy="30" r="8" fill="#6366f1" />
      <circle cx="50" cy="90" r="8" fill="#6366f1" />
      <circle cx="150" cy="90" r="8" fill="#6366f1" />
      <circle cx="20" cy="60" r="6" fill="#10b981" />
      <circle cx="180" cy="60" r="6" fill="#10b981" />
      <line x1="100" y1="60" x2="50" y2="30" stroke="#10b981" strokeWidth="2" />
      <line x1="100" y1="60" x2="150" y2="30" stroke="#10b981" strokeWidth="2" />
      <line x1="100" y1="60" x2="50" y2="90" stroke="#10b981" strokeWidth="2" />
      <line x1="100" y1="60" x2="150" y2="90" stroke="#10b981" strokeWidth="2" />
      <line x1="50" y1="30" x2="20" y2="60" stroke="#6366f1" strokeWidth="1.5" />
      <line x1="50" y1="90" x2="20" y2="60" stroke="#6366f1" strokeWidth="1.5" />
      <line x1="150" y1="30" x2="180" y2="60" stroke="#6366f1" strokeWidth="1.5" />
      <line x1="150" y1="90" x2="180" y2="60" stroke="#6366f1" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Product Card (People Also Bought / Recently Viewed) ─────────────────────
function ProductMiniCard({ item, onAdd }: { item: any; onAdd: (item: any) => void }) {
  const price = Number(item.liveData?.sahimed_price || item.price || item.packaging?.mrp || 0);
  const mrp = Number(item.liveData?.mrp || item.mrp || item.packaging?.mrp || price);
  const disc = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const slug = item.seo?.url_slug || item.seoUrlSlug || item._id || item.id;
  return (
    <Link href={`/product/${encodeURIComponent(slug?.replace(/^\//, '') || '')}`}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group shrink-0 w-40 sm:w-44">
      <div className="relative h-32 bg-slate-50 flex items-center justify-center overflow-hidden">
        <Image src={item.images?.[0] || item.imageUrl || '/images/medicine_placeholder.png'}
          alt={item.product_name || item.name || ''} fill className="object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
        {disc > 0 && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{disc}% off</div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <p className="text-[10px] font-bold text-slate-800 leading-snug line-clamp-2">{item.product_name || item.name}</p>
        <p className="text-[9px] text-slate-400 font-medium truncate">{item.taxonomy?.marketer_name || item.manufacturer || ''}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <p className="text-sm font-black text-slate-900">₹{price}</p>
            {mrp > price && <p className="text-[9px] text-slate-400 line-through">₹{mrp}</p>}
          </div>
          <button onClick={e => { e.preventDefault(); onAdd(item); }}
            className="w-7 h-7 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProductDetailClient({ initialProduct, id, crossSellProducts = [] }: { initialProduct: any; id: string; crossSellProducts?: any[] }) {
  const { toast } = useToast();
  const { user } = useUser();
  const db_fs = useFirestore();
  const { addToCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();

  // ── State ────────────────────────────────────────────────────────────────
  const [edd, setEdd] = useState('');
  const [activePincode, setActivePincode] = useState('560068');
  const [zone, setZone] = useState('');
  const [isServiceable, setIsServiceable] = useState<boolean | null>(true);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'safety' | 'info'>('overview');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  // ── Use initialProduct DIRECTLY — never replace with raw DB doc ──────────
  // SSR normalises all keys. Client hook would return raw MongoDB doc (no
  // convenience keys). We only fetch live pricing separately if needed.
  const product = initialProduct;

  const { data: molData } = useMongoDBMolecule(product?.moleculeId);

  // People Also Bought — same category
  const { data: alsoData } = useMongoDBCollection({
    q: product?.categoryName || product?.taxonomy?.category_name || '',
    limit: 12,
  });
  const alsoBought = (alsoData || []).filter((p: any) =>
    String(p._id || p.id) !== String(product?._id || product?.id)
  ).slice(0, 8);

  // ── Save to Recently Viewed ──────────────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    saveRecentlyViewed(product);
    setRecentlyViewed(getRecentlyViewed(product.id || product._id));
  }, [product]);

  // ── Sticky bar on scroll ─────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        const bottom = heroRef.current.getBoundingClientRect().bottom;
        setShowStickyBar(bottom < 0);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Pincode / EDD ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('activePincode') : null;
      if (stored && stored.length === 6) { setActivePincode(stored); fetchEdd(stored); return; }
      if (user) {
        try {
          const snap = await getDoc(doc(db_fs, 'userProfiles', user.uid));
          if (snap.exists()) {
            const v = snap.data().pincode;
            if (v?.length === 6) { setActivePincode(v); localStorage.setItem('activePincode', v); fetchEdd(v); return; }
          }
        } catch {}
      }
      fetchEdd('560068');
    };
    load();
  }, [user, db_fs]);

  const fetchEdd = async (pin: string) => {
    try {
      const res = await fetch('/api/logistics/shipway/serviceability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toPincode: pin })
      });
      const data = await res.json();
      if (data.edd) {
        const [y, m, d] = data.edd.split('-');
        const date = new Date(+y, +m - 1, +d);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        setEdd(`${months[date.getMonth()]} ${date.getDate()}`);
        setZone(data.zone || ''); setIsServiceable(true);
      } else { setIsServiceable(false); }
    } catch { setIsServiceable(false); }
  };

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date(), c = new Date(); c.setHours(14, 0, 0, 0);
      let diff = c.getTime() - now.getTime();
      if (diff < 0) { c.setDate(c.getDate() + 1); diff = c.getTime() - now.getTime(); }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ── Generic Alternatives ─────────────────────────────────────────────────
  const isGeneric = product?.is_generic === true || product?.isGeneric === true || product?.isGeneric === "true" || (product?.medicineType || product?.medicine_type || '').toLowerCase().includes('generic');
  const { data: genericAlternatives } = useMongoDBCollection({
    moleculeId: (!isGeneric && !product?.mappedGeneric) ? product?.moleculeId : undefined, isGeneric: true, limit: 10
  });
  const genericAlt = product?.mappedGeneric || (!isGeneric
    ? genericAlternatives?.find((a: any) =>
        (a.is_generic === true || a.isGeneric === true || a.isGeneric === "true" || (a.medicine_type || '').toLowerCase().includes('generic')) &&
        String(a._id || a.id) !== String(product?._id || product?.id))
    : null);
  const showComparison = !isGeneric && !!genericAlt;

  // ── Prices ───────────────────────────────────────────────────────────────
  const unitPrice = Number(product?.liveData?.sahimed_price || product?.price || 0);
  const unitMrp   = Number(product?.liveData?.mrp || product?.mrp || (unitPrice + 20));
  const currentPrice = unitPrice * selectedQty;
  const currentMrp   = unitMrp * selectedQty;
  const altPrice  = genericAlt ? Number(genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const altMrp    = genericAlt ? Number(genericAlt.liveData?.mrp || genericAlt.mrp || (altPrice + 20)) : 0;
  const discountPct = unitMrp > 0 ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0;
  const altSavePct  = unitMrp > 0 && altPrice > 0 ? Math.round(((unitMrp - altPrice) / unitMrp) * 100) : 0;

  const images = product?.images?.length > 0 ? product.images : ['/images/medicine_placeholder.png'];
  const qty = getItemQuantity(product?._id || product?.id);

  const addCurrentToCart = (delta = 1) => {
    const units = delta === 1 ? selectedQty : delta;
    addToCart({ ...product, id: product?._id || product?.id, price: unitPrice, mrp: unitMrp }, units);
  };
  const addItemToCart = (item: any) => {
    const p = Number(item.liveData?.sahimed_price || item.price || item.packaging?.mrp || 0);
    const m = Number(item.liveData?.mrp || item.mrp || item.packaging?.mrp || p);
    addToCart({ ...item, id: item._id || item.id, price: p, mrp: m }, 1);
    toast({ title: "Added to cart" });
  };

  // ── Image zoom handler ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: HeartPulse },
    { key: 'usage',    label: 'How to Use', icon: Stethoscope },
    { key: 'safety',   label: 'Safety', icon: ShieldCheck },
    { key: 'info',     label: 'Product Info', icon: Package },
  ] as const;

  const safetyAdviseClean = stripHtml(product?.safetyAdvise || product?.safety_warnings?.interactions?.safety_advise);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F5F6FA] pb-28 lg:pb-12">
        <Navbar />

        {/* ── Trust Strip ─────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100 hidden sm:block">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-6">
              <TrustBadge icon={ShieldCheck} label="100% Genuine Medicines" sub="Licensed & verified sources" />
              <div className="w-px h-8 bg-slate-100 shrink-0" />
              <TrustBadge icon={Truck} label="Express Delivery" sub="Same day dispatch" />
              <div className="w-px h-8 bg-slate-100 shrink-0" />
              <TrustBadge icon={Star} label="Trusted by 50,000+" sub="Happy patients across India" />
              <div className="w-px h-8 bg-slate-100 shrink-0" />
              <TrustBadge icon={Clock} label="24/7 Pharmacist Support" sub="Always here to help" />
            </div>
          </div>
        </div>

        {/* Mobile Compact Trust Badges Strip */}
        <div className="sm:hidden bg-white border-b border-slate-100/80 px-4 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-600">
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Genuine</div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-sky-600" /> Express Shipping</div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> 4.8★ Rated</div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {product?.categoryName && (
              <><Link href="/medicines" className="hover:text-primary transition-colors">{product.categoryName}</Link><ChevronRight className="w-3 h-3" /></>
            )}
            <span className="text-slate-600 font-semibold line-clamp-1">{product?.name}</span>
          </nav>

          {/* ╔══════════════════════════════════════════════════════════════════════╗
              ║  WORLD-CLASS VISUAL SAHI SMART SWITCH HERO COMPARISON               ║
              ╚══════════════════════════════════════════════════════════════════════╝ */}
          {showComparison && genericAlt && (
            <div className="space-y-7 my-4 animate-in fade-in zoom-in-95 duration-500">
              
              {/* 1. Animated Glowing Top Smart Switch Header */}
              <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-5 sm:p-7 text-white shadow-2xl border-2 border-emerald-400/40">
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 text-slate-950">
                      <Zap className="w-7 h-7 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="bg-amber-300 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest shadow-xs">
                          ⚡ SAHI SMART SWITCH
                        </span>
                        <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                          100% DOCTOR APPROVED
                        </span>
                      </div>
                      <h3 className="text-base sm:text-xl font-black uppercase tracking-wide text-white leading-tight">
                        SAME ACTIVE MEDICINE, EXACT SAME SALT, <span className="text-amber-300 underline decoration-amber-400 decoration-wavy decoration-2 font-black">{altSavePct > 0 ? altSavePct : 49}% LESS COST</span>
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-emerald-100/90 mt-1">
                        Verified Bio-Equivalent Active Ingredient ({product?.composition || '100% Salt Match'}) · Exact Same Therapeutic Efficacy
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 bg-amber-400 text-slate-950 rounded-2xl p-3 sm:px-6 sm:py-3.5 text-center shadow-xl shadow-amber-400/20 border-2 border-white/80 transform hover:scale-105 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-80">INSTANT POCKET SAVINGS</span>
                    <span className="text-xl sm:text-2xl font-black font-outfit block">SAVE ₹{(unitPrice - altPrice).toFixed(0)} PER STRIP</span>
                  </div>
                </div>
              </div>

              {/* 2. Side-by-Side Dual Product Cards (100% Light Theme - Ultra-High Contrast & Clear Buttons) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* LEFT CARD: Prescribed Expensive Brand (Crisp Light Card with Rich Specs) */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 border-2 border-slate-200 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="bg-rose-50 text-rose-700 text-[10.5px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                        ❌ PRESCRIBED EXPENSIVE BRAND
                      </span>
                      <span className="text-xs font-extrabold text-slate-400">High Brand Markup</span>
                    </div>

                    {/* Image & Details Box */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-150 mb-5">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 bg-white rounded-2xl border border-slate-200 p-2.5 overflow-hidden shadow-2xs">
                        <Image src={images[currentImageIndex]} alt={product?.name || ''} fill className="object-contain p-2" priority />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                        <h4 className="text-base sm:text-xl font-black text-slate-900 uppercase leading-snug">{product?.name}</h4>
                        <p className="text-xs text-slate-500 font-bold italic">{product?.composition || 'Active Chemical Salt'}</p>
                        <p className="text-xs font-bold text-slate-600">By {product?.marketerName || product?.manufacturer || 'Sun Pharmaceutical Industries Ltd'}</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                          <span className="inline-block text-[10px] font-bold bg-white text-slate-600 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            {product?.packagingDetail || 'Strip of 10 tablets'}
                          </span>
                          <span className="inline-block text-[10px] font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-lg border border-rose-200">
                            Rx Prescription
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rich Spec Breakdown */}
                    <div className="space-y-2.5 bg-slate-50/90 rounded-2xl p-4 border border-slate-150 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold text-slate-400">Active Chemical Salt:</span>
                        <span className="font-extrabold text-slate-800 italic truncate max-w-[180px]">{product?.composition || 'Desvenlafaxine 100mg'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold text-slate-400">Dosage Form:</span>
                        <span className="font-bold text-slate-700">Extended Release Tablet</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold text-slate-400">Primary Indication:</span>
                        <span className="font-bold text-slate-700 truncate max-w-[180px]">{product?.treatment || 'Depression & Mood Management'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-400">Price Structure:</span>
                        <span className="font-extrabold text-rose-600 uppercase">Includes Marketing & Ad Markup</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-slate-150 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">EXPENSIVE BRAND PRICE</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black text-slate-950 font-outfit">₹{unitPrice}</span>
                          {unitMrp > unitPrice && <span className="text-sm text-slate-400 line-through font-bold">₹{unitMrp}</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold">₹{(unitPrice / (product?.packaging?.package_quantity || 10)).toFixed(1)} / Unit · <span className="text-slate-400">Higher Pocket Expense</span></p>
                      </div>
                    </div>

                    {/* Dual Clear Buttons */}
                    <div className="space-y-2 mt-4">
                      <Button
                        onClick={() => addCurrentToCart(1)}
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add Prescribed Medicine (₹{unitPrice})</span>
                      </Button>
                      <button
                        onClick={() => addCurrentToCart(1)}
                        className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 underline text-center block transition-colors"
                      >
                        + Add Prescribed Item To Cart
                      </button>
                    </div>

                    <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-[10.5px] font-extrabold text-slate-500">
                      🩺 Prescribed Original Brand Formulation
                    </div>
                  </div>
                </div>

                {/* RIGHT CARD: ✨ Sahi Recommended 100% Equivalent Generic (MAXIMUM HIGHLIGHTED VIP CARD) */}
                <div className="bg-gradient-to-b from-emerald-100/80 via-white to-teal-50 rounded-[32px] p-6 sm:p-8 border-4 border-emerald-500 shadow-[0_25px_60px_rgba(16,185,129,0.35)] flex flex-col justify-between space-y-6 relative overflow-hidden group">
                  
                  {/* Floating Gold Best Value Ribbon */}
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 via-amber-500 to-amber-400 text-slate-950 text-xs font-black px-5 py-2 rounded-bl-2xl uppercase tracking-widest shadow-lg border-b-2 border-l-2 border-amber-300 flex items-center gap-1.5 z-20 animate-pulse">
                    <span>👑</span> RECOMMENDED CHOICE · SAVE {altSavePct}%
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 border border-emerald-400">
                        ✨ 100% CLINICALLY EQUIVALENT · SAHI RECOMMENDED
                      </span>
                    </div>

                    {/* Image & Details Box */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-md mb-5 relative">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 bg-emerald-50/90 rounded-2xl border border-emerald-200 p-2 overflow-hidden shadow-xs">
                        <Image src={genericAlt?.imageUrl || genericAlt?.images?.[0] || images[0]} alt={genericAlt?.product_name || genericAlt?.name} fill className="object-contain p-2" priority />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                        <h4 className="text-base sm:text-xl font-black text-slate-900 uppercase leading-snug">{genericAlt?.product_name || genericAlt?.name}</h4>
                        <p className="text-xs text-emerald-700 font-black italic flex items-center justify-center sm:justify-start gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Check className="w-4 h-4 bg-emerald-600 text-white rounded-full p-0.5" /> 100% Identical Active Chemical Salt
                        </p>
                        <p className="text-xs font-extrabold text-emerald-800 truncate">By {genericAlt?.taxonomy?.marketer_name || genericAlt?.manufacturer || 'Licensed WHO-GMP Quality Manufacturer'}</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                          <span className="inline-block text-[10px] font-bold bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                            {genericAlt?.packaging?.packaging_detail || 'Strip of 10 tablets'}
                          </span>
                          <span className="inline-block text-[10px] font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-lg shadow-2xs">
                            SAVE ₹{(unitPrice - altPrice).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rich Spec Breakdown */}
                    <div className="space-y-2.5 bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200 text-xs">
                      <div className="flex justify-between items-center text-emerald-950">
                        <span className="font-extrabold text-emerald-700">Quality Standard:</span>
                        <span className="font-black text-emerald-900 uppercase flex items-center gap-1">🛡️ WHO-GMP & US-FDA Certified</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-950">
                        <span className="font-extrabold text-emerald-700">Therapeutic Action:</span>
                        <span className="font-black text-emerald-900 uppercase flex items-center gap-1">⚡ 100% Same Efficacy & Speed</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-950">
                        <span className="font-extrabold text-emerald-700">Unit Cost:</span>
                        <span className="font-black text-emerald-900">₹{(altPrice / (genericAlt?.packaging?.package_quantity || 10)).toFixed(1)} / tablet (vs ₹{(unitPrice / (product?.packaging?.package_quantity || 10)).toFixed(1)})</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-emerald-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">SAHI SMART PRICE</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-outfit">₹{altPrice}</span>
                          {unitPrice > altPrice && <span className="text-base text-slate-400 line-through font-bold">₹{unitPrice}</span>}
                        </div>
                        <p className="text-xs text-emerald-900 font-bold mt-1">
                          ₹{(altPrice / (genericAlt?.packaging?.package_quantity || 10)).toFixed(1)} / Unit · <span className="text-emerald-700 font-black underline decoration-emerald-500">YOU SAVE ₹{(unitPrice - altPrice).toFixed(0)} ({altSavePct}% OFF)</span>
                        </p>
                      </div>
                    </div>

                    {/* Dual High-Converting Clear Buttons */}
                    <div className="space-y-2.5 mt-4">
                      <Button
                        onClick={() => addToCart({ ...genericAlt, id: genericAlt._id || genericAlt.id, price: altPrice, mrp: altMrp })}
                        className="w-full h-15 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-lg uppercase tracking-wider shadow-2xl shadow-emerald-600/40 active:scale-98 transition-all flex items-center justify-center gap-2 border-2 border-emerald-300 hover:scale-[1.02]"
                      >
                        <ShoppingCart className="w-6 h-6" />
                        <span>🚀 Switch To Generic & Save ₹{(unitPrice - altPrice).toFixed(0)}</span>
                      </Button>
                      <button
                        onClick={() => addToCart({ ...genericAlt, id: genericAlt._id || genericAlt.id, price: altPrice, mrp: altMrp })}
                        className="w-full py-2.5 bg-emerald-100/90 hover:bg-emerald-200 text-emerald-900 rounded-xl font-extrabold text-xs text-center block transition-colors border border-emerald-300"
                      >
                        🛒 Add Generic Substitute To Cart (₹{altPrice})
                      </button>
                    </div>

                    <div className="mt-3 bg-amber-100/90 border border-amber-300 rounded-xl p-3 text-center flex items-center justify-center gap-2 text-xs font-black text-amber-950 shadow-xs">
                      <span className="text-base">🔥</span>
                      <span>Over 50,000+ Patients Switched To Generic & Saved On SahiMed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Assurance Badges Row */}
              <div className="grid grid-cols-3 gap-3 text-center bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
                <div className="flex flex-col items-center space-y-1.5 p-1">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-900 leading-tight">100% Bio-Equivalent Quality</span>
                  <span className="text-[10px] text-slate-500 font-semibold hidden sm:block">Identical therapeutic action</span>
                </div>
                <div className="flex flex-col items-center space-y-1.5 p-1 border-x border-slate-200">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-900 leading-tight">WHO-GMP & US-FDA Certified</span>
                  <span className="text-[10px] text-slate-500 font-semibold hidden sm:block">Manufactured in approved labs</span>
                </div>
                <div className="flex flex-col items-center space-y-1.5 p-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-900 leading-tight">Fresh Batch & Long Expiry</span>
                  <span className="text-[10px] text-slate-500 font-semibold hidden sm:block">Directly from distributor</span>
                </div>
              </div>

              {/* 4. Clinical Bio-Equivalence Comparison Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
                  <h3 className="text-xs sm:text-base font-black uppercase tracking-wider flex items-center gap-2">
                    <Check className="w-5 h-5 bg-white/20 rounded-full p-0.5" /> Clinical Bio-Equivalence Match · 100% Exact Salt Match
                  </h3>
                  <span className="text-xs font-black bg-white/20 px-3.5 py-1 rounded-full uppercase">100% Identical Efficacy</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {/* Row 1: Product Name */}
                  <div className="grid grid-cols-2 p-4 sm:p-5 bg-slate-50/60">
                    <div className="space-y-1 pr-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Original Brand</span>
                      <p className="font-black text-slate-900 uppercase text-xs sm:text-base">{product?.name}</p>
                    </div>
                    <div className="space-y-1 pl-3 border-l border-slate-200">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Sahi Equivalent Generic</span>
                      <p className="font-black text-emerald-800 uppercase text-xs sm:text-base">{genericAlt?.product_name || genericAlt?.name}</p>
                    </div>
                  </div>

                  {/* Row 2: Active Salt Composition */}
                  <div className="grid grid-cols-2 p-4 sm:p-5">
                    <div className="space-y-1 pr-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Salt Ingredient</span>
                      <p className="font-extrabold text-slate-700 italic">{product?.composition || 'Desvenlafaxine 100mg'}</p>
                    </div>
                    <div className="space-y-1 pl-3 border-l border-slate-200">
                      <span className="text-[10.5px] font-black uppercase text-emerald-600 tracking-wider">Active Salt Ingredient</span>
                      <p className="font-extrabold text-emerald-700 italic flex items-center gap-1">
                        ✓ {product?.composition || 'Desvenlafaxine 100mg'} (100% Identical Match)
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Manufacturer */}
                  <div className="grid grid-cols-2 p-4 sm:p-5 bg-slate-50/60">
                    <div className="space-y-1 pr-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manufacturer</span>
                      <p className="font-bold text-slate-700">{product?.marketerName || product?.manufacturer || 'Sun Pharmaceutical'}</p>
                    </div>
                    <div className="space-y-1 pl-3 border-l border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manufacturer</span>
                      <p className="font-bold text-slate-900">{genericAlt?.taxonomy?.marketer_name || genericAlt?.manufacturer || 'Licensed WHO-GMP Manufacturer'}</p>
                    </div>
                  </div>

                  {/* Row 4: Quality & Regulatory Approval */}
                  <div className="grid grid-cols-2 p-4">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Quality Standard</span>
                      <p className="font-bold text-slate-700 flex items-center gap-1">🛡️ WHO & FDA Approved Brand</p>
                    </div>
                    <div className="space-y-0.5 pl-2 border-l border-slate-200">
                      <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Quality Standard</span>
                      <p className="font-bold text-emerald-700 flex items-center gap-1">🛡️ WHO-GMP Certified Facilities</p>
                    </div>
                  </div>

                  {/* Row 5: Price & Net Savings */}
                  <div className="grid grid-cols-2 p-4 bg-emerald-50/50">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Unit Cost</span>
                      <p className="font-black text-slate-900 text-sm">₹{(unitPrice / (product?.packaging?.package_quantity || 10)).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">/ unit</span></p>
                    </div>
                    <div className="space-y-0.5 pl-2 border-l border-emerald-200">
                      <span className="text-[9.5px] font-black uppercase text-emerald-700 tracking-wider">Unit Cost & Savings</span>
                      <div className="flex items-baseline gap-2">
                        <p className="font-black text-emerald-700 text-sm">₹{(altPrice / (genericAlt?.packaging?.package_quantity || 10)).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">/ unit</span></p>
                        <span className="bg-emerald-600 text-white font-black text-[9.5px] px-2.5 py-0.5 rounded-full uppercase">Save {altSavePct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 📱 MOBILE FIRST-FRAME HERO CARD — Rendered ONLY if no generic substitute comparison */}
          {!showComparison && (
            <>
              <div className="sm:hidden bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm space-y-3">
            <div className="flex gap-3.5 items-start">
              {/* Product Thumbnail */}
              <div className="relative w-28 h-28 shrink-0 bg-slate-50/80 rounded-xl border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                <Image
                  src={images[currentImageIndex]}
                  alt={product?.name || 'Medicine'}
                  fill
                  className="object-contain p-1"
                  priority
                />
                {discountPct > 0 && (
                  <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                    {discountPct}% OFF
                  </span>
                )}
                {product?.prescriptionRequired && (
                  <span className="absolute bottom-1 right-1 bg-rose-500 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    Rx
                  </span>
                )}
              </div>

              {/* Title, Composition & Brand */}
              <div className="flex-1 min-w-0 space-y-1">
                {(product?.is_generic === true || product?.isGeneric === true || (product?.medicineType || '').toLowerCase().includes('generic')) && (
                  <span className="inline-block bg-emerald-600 text-white text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                    ✨ Branded Generic
                  </span>
                )}
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight uppercase line-clamp-2">
                  {product?.name}
                </h1>
                {product?.composition && (
                  <p className="text-[10.5px] text-slate-500 font-medium italic line-clamp-1">
                    {product.composition}
                  </p>
                )}
                <p className="text-[10.5px] font-bold text-primary truncate">
                  By {product?.marketerName || product?.manufacturer || 'SahiMed'}
                </p>
                {(product?.packagingDetail || product?.packaging?.packaging_detail) && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100">
                    <Package className="w-3 h-3 text-primary" />
                    {product.packagingDetail || product.packaging?.packaging_detail}
                  </span>
                )}
              </div>
            </div>

            {/* Price & Immediate Add To Cart Row */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-950 font-outfit">₹{currentPrice}</span>
                  {currentMrp > currentPrice && (
                    <span className="text-xs text-slate-400 line-through font-bold">₹{currentMrp}</span>
                  )}
                </div>
                {discountPct > 0 && (
                  <p className="text-[9.5px] font-bold text-emerald-600">Save ₹{(currentMrp - currentPrice).toFixed(0)}</p>
                )}
              </div>

              {qty > 0 ? (
                <div className="flex items-center h-10 bg-slate-50 rounded-full border border-slate-200 px-1 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => updateQuantity(product?._id || product?.id, -1)} className="h-8 w-8 rounded-full bg-white text-slate-700 shadow-xs">
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs font-bold text-slate-800 px-2">{qty}</span>
                  <Button size="icon" variant="ghost" onClick={() => updateQuantity(product?._id || product?.id, 1)} className="h-8 w-8 rounded-full bg-white text-slate-700 shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => addCurrentToCart(1)}
                  className="h-10 px-5 rounded-full font-black text-xs bg-primary text-white hover:bg-primary/90 shadow-md uppercase tracking-wider flex-1 max-w-[170px]"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
                </Button>
              )}
            </div>
          </div>

          {/* ╔══════════════════════════════════════════════╗
              ║  HERO (DESKTOP & EXPANDED)                   ║
              ╚══════════════════════════════════════════════╝ */}
          <div ref={heroRef} className="hidden sm:grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* ── Image Gallery with Zoom ──────────────────── */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Main image with zoom */}
                <div
                  className="relative aspect-square bg-gradient-to-br from-slate-50 via-white to-primary/5 overflow-hidden cursor-zoom-in"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  {/* hex grid bg */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                      <defs><pattern id="hex" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
                        <polygon points="20,2 38,11 38,35 20,44 2,35 2,11" fill="none" stroke="#10b981" strokeWidth="1"/>
                      </pattern></defs>
                      <rect width="400" height="400" fill="url(#hex)" />
                    </svg>
                  </div>

                  {/* Zoomed image */}
                  <div
                    className={cn("absolute inset-0 transition-opacity duration-200", isZoomed ? "opacity-100" : "opacity-0")}
                    style={{ backgroundImage: `url(${images[currentImageIndex]})`, backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`, backgroundSize: '250%', backgroundRepeat: 'no-repeat' }}
                  />
                  {/* Normal image */}
                  <Image src={images[currentImageIndex]} alt={product?.name || 'Medicine'}
                    fill className={cn("object-contain p-8 relative z-10 transition-opacity duration-200", isZoomed ? "opacity-0" : "opacity-100")} priority />

                  {discountPct > 0 && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-200 z-20">
                      {discountPct}% Off
                    </div>
                  )}
                  {product?.prescriptionRequired && (
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider z-20">
                      Rx Required
                    </div>
                  )}
                  {/* Zoom hint */}
                  <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[9px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 z-20 opacity-60">
                    <ZoomIn className="w-3 h-3" /> Hover to zoom
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto border-t border-slate-50">
                    {images.map((img: string, i: number) => (
                      <button key={i} onClick={() => setCurrentImageIndex(i)}
                        className={cn("relative w-14 h-14 rounded-xl border-2 bg-slate-50 overflow-hidden shrink-0 transition-all",
                          i === currentImageIndex ? "border-primary shadow-sm" : "border-slate-100 hover:border-slate-300")}>
                        <Image src={img} alt="" fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Authenticity Seal ──────────────────────────── */}
              <div className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-emerald-100">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-7 h-7 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-xs font-black uppercase tracking-widest mb-0.5">Verified Genuine Product</p>
                  <p className="text-[10px] text-white/80 font-medium">Sourced directly from licensed distributors · Quality checked by our pharmacists</p>
                </div>
              </div>
            </div>

            {/* ── Buy Box ──────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(product?.is_generic === true || product?.isGeneric === true || (product?.medicineType || '').toLowerCase().includes('generic')) ? (
                    <Badge className="bg-emerald-600 text-white border-none text-[9.5px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-xs flex items-center gap-1">
                      ✨ 100% Branded Generic (Save 61%)
                    </Badge>
                  ) : (
                    product?.medicineType && <Badge className="bg-violet-100 text-violet-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">{product.medicineType}</Badge>
                  )}
                  {product?.subCategory && <Badge className="bg-sky-100 text-sky-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">{product.subCategory}</Badge>}
                  {product?.salableStatus && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">{product.salableStatus}</Badge>}
                </div>

                {/* Name */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{product?.name}</h1>
                  {product?.composition && <p className="mt-1 text-xs text-slate-400 font-medium italic">{product.composition}</p>}
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    By <span className="text-primary font-semibold">{product?.marketerName || product?.manufacturer || '—'}</span>
                    {product?.categoryName && <span className="text-slate-400"> · {product.categoryName}</span>}
                  </p>
                </div>

                {/* Pack chip — show packaging_detail (e.g. "strip of 10 tablets") */}
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  {(product?.packagingDetail || product?.packaging?.packaging_detail) && (
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      {product.packagingDetail || product.packaging?.packaging_detail}
                    </span>
                  )}
                  {product?.storage_instructions && (
                    <span className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-sky-700 font-semibold px-3 py-1.5 rounded-xl">
                      {/* Snowflake / temp SVG */}
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M17 17l-5 5-5-5"/>
                        <line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l5 5 5-5"/><path d="M7 17l5-5 5 5"/>
                      </svg>
                      {product.storage_instructions}
                    </span>
                  )}
                  {product?.countryOfOrigin && (
                    <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold px-3 py-1.5 rounded-xl">
                      <Globe className="w-3.5 h-3.5" />Made in {product.countryOfOrigin}
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-50" />

                {/* Pricing */}
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Our Price</p>
                    <p className="text-4xl font-black text-slate-900">₹{currentPrice}</p>
                  </div>
                  {currentMrp > currentPrice && (
                    <div className="pb-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">MRP</p>
                      <p className="text-sm font-medium text-slate-400 line-through">₹{currentMrp}</p>
                    </div>
                  )}
                  {discountPct > 0 && (
                    <div className="pb-1">
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                        Save {discountPct}% · ₹{(currentMrp - currentPrice).toFixed(0)} off
                      </span>
                    </div>
                  )}
                </div>

                {/* Add to Cart + inline qty dropdown */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {qty > 0 ? (
                    <div className="flex items-center h-12 bg-slate-50 rounded-full border border-slate-100 p-1 shadow-inner gap-1">
                      <Button variant="ghost" onClick={() => updateQuantity(product?._id || product?.id, -1)} className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                        <Minus className="w-4 h-4 text-slate-600" />
                      </Button>
                      <span className="min-w-[80px] text-center text-xs font-bold text-slate-800">{qty} in cart</span>
                      <Button variant="ghost" onClick={() => updateQuantity(product?._id || product?.id, 1)} className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                        <Plus className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button onClick={() => addCurrentToCart(1)}
                        className="h-12 px-8 rounded-full font-black text-sm bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-xl shadow-primary/25 uppercase tracking-wider">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                      </Button>
                    </div>
                  )}
                  <Button variant="outline" size="icon" onClick={() => setIsShareOpen(true)} className="h-12 w-12 rounded-full border-slate-200 hover:bg-slate-50">
                    <Share2 className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>

              </div>

              {/* Delivery Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/8 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Delivering to</p>
                      <p className="text-sm font-black text-slate-900 tracking-wider mt-0.5">{activePincode}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditingPincode(!isEditingPincode)} className="text-xs font-black text-primary hover:underline uppercase tracking-wide">
                    {isEditingPincode ? 'Cancel' : 'Change'}
                  </button>
                </div>
                {isEditingPincode && (
                  <div className="flex gap-2">
                    <input type="text" value={activePincode}
                      onChange={e => setActivePincode(e.target.value.replace(/\D/, '').slice(0, 6))}
                      placeholder="Enter 6-digit pincode"
                      className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-semibold focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" />
                    <Button onClick={() => { fetchEdd(activePincode); setIsEditingPincode(false); }} className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-black">Check</Button>
                  </div>
                )}
                {isServiceable ? (
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-emerald-800">{edd ? `Express delivery by ${edd}` : 'Delivery available'}</p>
                        {zone && <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">{zone} zone · Free shipping</p>}
                      </div>
                    </div>
                    {edd && timeLeft && <p className="text-[10px] text-slate-500 font-medium px-1">Order within <span className="text-primary font-black">{timeLeft}</span> to get it by {edd}</p>}
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-xs font-semibold text-rose-700">Delivery not available to this pincode</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}



          {/* ╔══════════════════════════════════════════════╗
              ║  TABBED PANEL                                ║
              ╚══════════════════════════════════════════════╝ */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={cn(
                      "flex-1 min-w-[90px] py-4 px-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex flex-col items-center gap-1.5",
                      activeTab === t.key ? "text-primary border-b-2 border-primary bg-primary/3" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}>
                    <Icon className="w-4 h-4" />{t.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 sm:p-8">

              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {(product?.composition || molData?.molecule || molData?.name) && (
                    <div className="flex items-center gap-4 bg-[#2f3542] rounded-xl px-5 py-4">
                      {/* DNA double helix SVG */}
                      <div className="shrink-0 w-10 h-10">
                        <svg viewBox="0 0 40 60" fill="none" className="w-full h-full">
                          <path d="M8 4 Q20 15 32 4" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                          <path d="M8 14 Q20 25 32 14" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                          <path d="M8 24 Q20 35 32 24" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                          <path d="M8 34 Q20 45 32 34" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                          <path d="M8 44 Q20 55 32 44" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                          <line x1="8" y1="4" x2="8" y2="44" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2 3"/>
                          <line x1="32" y1="4" x2="32" y2="44" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="2 3"/>
                          <circle cx="8" cy="4" r="2.5" fill="#a78bfa"/>
                          <circle cx="32" cy="4" r="2.5" fill="#6ee7b7"/>
                          <circle cx="8" cy="14" r="2" fill="#6ee7b7"/>
                          <circle cx="32" cy="14" r="2" fill="#a78bfa"/>
                          <circle cx="8" cy="24" r="2.5" fill="#a78bfa"/>
                          <circle cx="32" cy="24" r="2.5" fill="#6ee7b7"/>
                          <circle cx="8" cy="34" r="2" fill="#6ee7b7"/>
                          <circle cx="32" cy="34" r="2" fill="#a78bfa"/>
                          <circle cx="8" cy="44" r="2.5" fill="#a78bfa"/>
                          <circle cx="32" cy="44" r="2.5" fill="#6ee7b7"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Composition</p>
                        <p className="text-sm font-black text-white leading-snug truncate">{product?.composition || molData?.molecule || molData?.name}</p>
                        {(product?.primaryUse || product?.medical_info?.primary_use) && (
                          <p className="text-[10px] text-slate-400 font-medium mt-1">Used for: <span className="text-emerald-400 font-semibold">{product.primaryUse || product.medical_info?.primary_use}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {(product?.description || product?.introduction) && (() => {
                    const desc = product.description || product.introduction || '';
                    const parts = desc.split(/(?<=\.)\s+/).filter(Boolean);
                    const isLong = parts.length > 2;
                    const visibleParts = showFullDesc ? parts : parts.slice(0, 2);

                    return (
                      <div>
                        <SectionLabel>About this Medicine</SectionLabel>
                        <div className="space-y-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
                          {visibleParts.map((p, i) => (
                            <p key={i} className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">{p}</p>
                          ))}
                          {isLong && (
                            <button
                              onClick={() => setShowFullDesc(!showFullDesc)}
                              className="mt-2 text-xs font-black text-primary hover:underline flex items-center gap-1 transition-all"
                            >
                              {showFullDesc ? 'Show Less ▲' : 'Read Full Description ▾'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {(product?.treatment || product?.uses) && (
                    <div><SectionLabel>Treatment & Uses</SectionLabel>
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
                        <p className="text-sm font-medium text-sky-900 leading-relaxed">{product.treatment || product.uses}</p>
                      </div>
                    </div>
                  )}

                  {(product?.benefits || product?.medical_info?.benefits) && (() => {
                    const benefitList = stripHtml(product.benefits || product.medical_info?.benefits)
                      .split(/(?:\n|\||(?<=\.)\s+)/).map(b => b.trim()).filter(b => b.length > 4);
                    if (!benefitList.length) return null;
                    return (
                      <div><SectionLabel>Key Benefits</SectionLabel>
                        <div className="space-y-2 sm:space-y-3">
                          {benefitList.map((b, i) => (
                            <div key={i} className="flex items-start gap-2.5 sm:gap-3 bg-emerald-50/70 border border-emerald-100 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm font-semibold text-emerald-900 leading-relaxed">{b}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Side effects — Warning Box with Chips */}
                  {((product?.sideEffectsArray?.length > 0) || product?.sideEffects) && (() => {
                    const effects: string[] = product.sideEffectsArray?.length > 0
                      ? product.sideEffectsArray
                      : (product.sideEffects?.split(/\n|\|/).filter(Boolean) || []);
                    if (!effects.length) return null;

                    return (
                      <div>
                        <SectionLabel>Possible Side Effects</SectionLabel>
                        <div className="relative overflow-hidden bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 sm:p-5">
                          {/* Watermark */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                            <AlertTriangle className="w-40 h-40" />
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3 relative z-10">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-amber-800">Common Side Effects</h4>
                          </div>

                          <div className="flex flex-wrap gap-1.5 sm:gap-2 relative z-10">
                            {effects.map((s: string, i: number) => (
                              <span key={i} className="bg-white border border-amber-200 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* How It Works — mechanism of action */}
                  {(product?.howItWorks || product?.medical_info?.how_it_works) && (
                    <div><SectionLabel>How it Works</SectionLabel>
                      <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 sm:p-5">
                        <div className="absolute top-3 right-3 opacity-10"><FlaskConical className="w-16 h-16 text-violet-500" /></div>
                        <div className="flex gap-3 relative z-10">
                          <FlaskConical className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm font-medium text-violet-900 leading-relaxed">{product.howItWorks || product.medical_info?.how_it_works}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fact Box — parse "Key :: Value|Key :: Value" */}
                  {(product?.factBox || product?.medical_info?.fact_box) && (() => {
                    const raw: string = product.factBox || product.medical_info?.fact_box || '';
                    const pairs = raw.split('|').map(s => s.trim()).filter(Boolean).map(s => {
                      const [k, ...v] = s.split('::');
                      let cleanV = (v.join('::') || '').trim();
                      cleanV = cleanV.replace(/\d+-[A-Za-z0-9\-/\s&]+besomartks/gi, '').replace(/\s+/g, ' ').trim();
                      return { key: k?.trim(), val: cleanV };
                    }).filter(p => p.key && p.val && p.val.length > 0);
                    if (!pairs.length) return null;
                    return (
                      <div><SectionLabel>Quick Facts</SectionLabel>
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 space-y-1">
                          {pairs.map((p, i) => (
                            <div key={i} className="flex justify-between items-start gap-4 border-b border-slate-100/80 py-2.5 last:border-0">
                              <span className="text-xs font-bold text-slate-500 w-1/3">{p.key}</span>
                              <span className="text-xs font-extrabold text-slate-900 w-2/3 text-right leading-snug">{p.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Manufacturer Details */}
                  {(product?.marketerName || product?.manufacturer || product?.marketerAddress) && (
                    <div><SectionLabel>Manufacturer Details</SectionLabel>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <p className="text-xs font-black text-slate-800 mb-1">{product?.marketerName || product?.manufacturer}</p>
                        {product?.marketerAddress && <p className="text-xs font-medium text-slate-500">{product.marketerAddress}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── HOW TO USE ── */}
              {activeTab === 'usage' && (
                <div className="space-y-8">
                  {product?.howToUse ? (
                    <div><SectionLabel>Directions for Use</SectionLabel>
                      <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-6">
                        <div className="absolute top-3 right-3 opacity-10"><Stethoscope className="w-16 h-16 text-sky-500" /></div>
                        <div className="flex gap-3 relative z-10"><Stethoscope className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" /><p className="text-sm font-medium text-sky-900 leading-relaxed">{product.howToUse}</p></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10"><BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400 font-medium">Usage directions not available. Consult your doctor.</p></div>
                  )}
                  {product?.storage_instructions && (
                    <div><SectionLabel>Storage Instructions</SectionLabel>
                      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex gap-3"><Package className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" /><p className="text-sm font-medium text-teal-900 leading-relaxed">{product.storage_instructions}</p></div>
                    </div>
                  )}
                  {/* Dynamic Q&A from DB — all items */}
                  {((product?.qaList?.length > 0) || product?.medical_info?.q_a?.length > 0) && (
                    <div className="space-y-3"><SectionLabel>Frequently Asked Questions</SectionLabel>
                      {(product.qaList || product.medical_info?.q_a || []).map((item: any, i: number) => (
                        <FaqItem key={i} q={item.question} a={item.answer} />
                      ))}
                      {/* Extra fallback clinical FAQs if not already in q_a */}
                      {!product?.ifMiss && <FaqItem q="What should I do if I miss a dose?" a="Take the missed dose as soon as you remember. If the next dose is close, skip it. Never double-dose." />}
                      {(product?.ifOverdose || product?.medical_info?.if_overdose) && <FaqItem q="What if I overdose?" a={product.ifOverdose || product.medical_info?.if_overdose} />}
                      {(product?.stopAdvice || product?.medical_info?.stop_advice) && <FaqItem q="Can I stop this medicine suddenly?" a={product.stopAdvice || product.medical_info?.stop_advice} />}
                    </div>
                  )}
                  {/* If no q_a at all, show minimal fallback */}
                  {!(product?.qaList?.length > 0) && !(product?.medical_info?.q_a?.length > 0) && (
                    <div className="space-y-3"><SectionLabel>Common Questions</SectionLabel>
                      <FaqItem q="What should I do if I miss a dose?" a={product?.ifMiss || product?.medical_info?.if_miss || "Take the missed dose as soon as you remember. If the next scheduled dose is close, skip it. Never double-dose."} />
                      <FaqItem q="What happens if I overdose?" a={product?.ifOverdose || product?.medical_info?.if_overdose || "Seek immediate emergency medical attention."} />
                      <FaqItem q="Can I stop taking this medicine suddenly?" a={product?.stopAdvice || product?.medical_info?.stop_advice || "Do not stop without consulting your doctor."} />
                    </div>
                  )}
                </div>
              )}

              {/* ── SAFETY ── */}
              {activeTab === 'safety' && (() => {
                // ── Parse severity badge from text ─────────────────────────
                // ── Parse severity badge from text ─────────────────────────
                function getSeverity(text?: string | null): { label: string; cls: string } {
                  if (!text) return { label: '', cls: '' };
                  const t = text.toLowerCase();
                  if (t.includes('unsafe') || t.includes('not recommended') || t.includes('avoid'))
                    return { label: 'UNSAFE', cls: 'bg-rose-100 text-rose-700' };
                  if (t.includes('caution') || t.includes('with caution') || t.includes('dose adjustment'))
                    return { label: 'CAUTION', cls: 'bg-orange-100 text-orange-700' };
                  if (t.includes('consult') || t.includes('ask your doctor') || t.includes('tell your doctor'))
                    return { label: 'CONSULT YOUR DOCTOR', cls: 'bg-teal-100 text-teal-700' };
                  if (t.includes('safe') || t.includes('generally safe') || t.includes('no risk'))
                    return { label: 'SAFE', cls: 'bg-emerald-100 text-emerald-700' };
                  return { label: 'INFO', cls: 'bg-slate-100 text-slate-600' };
                }

                // Parse missing fields from the raw safetyAdvise blob
                function extractFromAdvise(key: string) {
                  if (!safetyAdviseClean) return undefined;
                  const regex = new RegExp(`(?:-|\\s|^)${key}\\s*:\\s*(.*?)(?=\\n\\s*-|\\n\\s*[A-Z][a-z]+\\s*:|$)`, 'i');
                  const match = safetyAdviseClean.match(regex);
                  return match ? match[1].trim() : undefined;
                }

                const rows = [
                  {
                    key: 'alcohol',
                    label: 'Alcohol',
                    value: product?.alcoholInteraction || product?.safety_warnings?.interactions?.alcohol || extractFromAdvise('Alcohol'),
                    svg: (
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <rect x="16" y="4" width="16" height="6" rx="3" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/>
                        <path d="M18 10 L14 40 Q14 44 24 44 Q34 44 34 40 L30 10Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/>
                        <path d="M20 20 Q24 24 28 20" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        <circle cx="24" cy="30" r="3" fill="#fca5a5"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'pregnancy',
                    label: 'Pregnancy',
                    value: product?.pregnancyInteraction || product?.safety_warnings?.interactions?.pregnancy || extractFromAdvise('Pregnancy'),
                    svg: (
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <circle cx="24" cy="10" r="6" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/>
                        <ellipse cx="24" cy="32" rx="12" ry="14" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/>
                        <ellipse cx="24" cy="34" rx="7" ry="8" fill="#fca5a5" opacity="0.5"/>
                        <path d="M14 24 Q12 20 16 18" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M34 24 Q36 20 32 18" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'lactation',
                    label: 'Breast Feeding',
                    value: product?.lactationInteraction || product?.safety_warnings?.interactions?.lactation || extractFromAdvise('Breast feeding') || extractFromAdvise('Lactation'),
                    svg: (
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <circle cx="24" cy="10" r="6" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/>
                        <path d="M14 22 Q10 30 14 38 Q18 44 24 44 Q32 44 34 36 L36 26 Q30 20 24 20 Q18 20 14 22Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/>
                        <circle cx="32" cy="28" r="4" fill="#fca5a5" stroke="#f87171" strokeWidth="1"/>
                        <circle cx="33" cy="27" r="1.5" fill="#f87171"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'driving',
                    label: 'Driving',
                    value: product?.drivingInteraction || product?.safety_warnings?.interactions?.driving || extractFromAdvise('Driving'),
                    svg: (
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <circle cx="24" cy="24" r="18" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/>
                        <circle cx="24" cy="24" r="10" fill="none" stroke="#f87171" strokeWidth="1.5"/>
                        <circle cx="24" cy="24" r="3" fill="#f87171"/>
                        <line x1="24" y1="6" x2="24" y2="14" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="24" y1="34" x2="24" y2="42" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="6" y1="24" x2="14" y2="24" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="34" y1="24" x2="42" y2="24" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="24" y1="24" x2="18" y2="16" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'kidney',
                    label: 'Kidney',
                    value: product?.kidneyInteraction || product?.safety_warnings?.interactions?.kidney || extractFromAdvise('Kidney'),
                    svg: (
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <path d="M18 8 C10 8 8 18 10 26 C12 34 16 42 22 42 C26 42 26 36 24 30 C22 24 24 20 28 18 C34 14 36 8 30 6 C26 4 22 8 18 8Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/>
                        <path d="M30 8 C38 8 40 18 38 26 C36 34 32 42 26 42" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                      </svg>
                    ),
                  },
                  {
                    key: 'liver',
                    label: 'Liver',
                    value: product?.liverInteraction || product?.safety_warnings?.interactions?.liver || extractFromAdvise('Liver'),
                    svg: (
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <path d="M8 20 C8 10 16 6 24 8 C32 6 42 12 40 24 C38 36 30 44 20 40 C12 36 8 30 8 20Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/>
                        <path d="M16 20 Q20 16 26 20 Q32 24 30 32" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        <circle cx="22" cy="26" r="3" fill="#fca5a5"/>
                      </svg>
                    ),
                  },
                ].filter(r => !!r.value);

                if (rows.length === 0) {
                  return (
                    <div className="text-center py-14">
                      <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-medium">No specific interaction warnings listed. Always consult a doctor.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* 1mg-style interaction rows */}
                    <div className="divide-y divide-slate-100">
                      {rows.map((row, i) => {
                        const { label: sevLabel, cls: sevCls } = getSeverity(row.value);
                        return (
                          <div key={row.key} className="flex items-start gap-5 py-5 first:pt-0 last:pb-0">
                            {/* Illustrated organ icon */}
                            <div className="shrink-0 w-11 flex items-center justify-center mt-0.5">
                              {row.svg}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <p className="text-sm font-black text-slate-800">{row.label}</p>
                                {sevLabel && (
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sevCls}`}>
                                    {sevLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">{row.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Rx + Controlled */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <div className={cn("flex-1 rounded-2xl p-4 flex items-center gap-4 border", product?.prescriptionRequired ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", product?.prescriptionRequired ? "bg-rose-100" : "bg-emerald-100")}>
                          <ClipboardList className={cn("w-4 h-4", product?.prescriptionRequired ? "text-rose-600" : "text-emerald-600")} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Prescription Status</p>
                          <p className={cn("text-xs font-bold", product?.prescriptionRequired ? "text-rose-700" : "text-emerald-700")}>
                            {product?.prescriptionRequired ? "Prescription required (Rx only)" : "Over-the-counter (OTC)"}
                          </p>
                        </div>
                      </div>
                      {(product?.isControlledSubstance !== undefined || product?.safety_warnings?.is_controlled_substance !== undefined) && (
                        <div className={cn("flex-1 rounded-2xl p-4 flex items-center gap-4 border", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100")}>
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "bg-red-100" : "bg-slate-100")}>
                            <ShieldAlert className={cn("w-4 h-4", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "text-red-600" : "text-slate-400")} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Controlled Substance</p>
                            <p className={cn("text-xs font-bold", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "text-red-700" : "text-slate-500")}>
                              {(product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "Scheduled / Controlled substance" : "Not a controlled substance"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── PRODUCT INFO ── */}
              {activeTab === 'info' && (
                <div className="space-y-8">
                  <div><SectionLabel>Manufacturer & Classification</SectionLabel>
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Marketer Name" value={product?.marketerName || product?.taxonomy?.marketer_name} icon={Building2} accent="bg-primary/10 text-primary" />
                      <InfoRow label="Category" value={product?.categoryName || product?.taxonomy?.category_name} icon={Tag} accent="bg-amber-100 text-amber-600" />
                      <InfoRow label="Sub-Category" value={product?.subCategory || product?.taxonomy?.sub_category} icon={Tag} accent="bg-amber-50 text-amber-500" />
                      <InfoRow label="Medicine Type" value={product?.medicineType || product?.medicine_type} icon={Pill} accent="bg-sky-100 text-sky-600" />
                      <InfoRow label="Salable Status" value={product?.salableStatus || product?.salable_status} icon={ThumbsUp} accent="bg-emerald-100 text-emerald-600" />
                      <InfoRow label="Molecule Code" value={product?.moleculeCode || product?.molecule_code} icon={FlaskConical} accent="bg-violet-100 text-violet-600" />
                    </div>
                  </div>
                  <div><SectionLabel>Packaging Details</SectionLabel>
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Product Form" value={product?.productForm || product?.packaging?.product_form} icon={Pill} accent="bg-sky-100 text-sky-600" />
                      <InfoRow label="Package Type" value={product?.packageType || product?.packaging?.package_type} icon={Package} accent="bg-indigo-100 text-indigo-600" />
                      <InfoRow label="Package Quantity" value={product?.packageQuantity?.toString() || product?.packaging?.package_quantity?.toString()} icon={Tag} accent="bg-slate-100 text-slate-500" />
                      <InfoRow label="Storage" value={product?.storage_instructions || product?.packaging?.storage} icon={Package} accent="bg-teal-100 text-teal-600" />
                      <InfoRow label="Country of Origin" value={product?.countryOfOrigin || product?.country_of_origin} icon={Globe} accent="bg-amber-100 text-amber-600" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ╔══════════════════════════════════════════════╗
              ║  PEOPLE ALSO BOUGHT                          ║
              ╚══════════════════════════════════════════════╝ */}
          {alsoBought.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-slate-800">People Also Bought</h2>
                <Link href={`/medicines?category=${encodeURIComponent(product?.categoryName || '')}`} className="text-xs font-black text-primary hover:underline uppercase tracking-wide">View All</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {alsoBought.map((item: any) => (
                  <ProductMiniCard key={item._id || item.id} item={item} onAdd={addItemToCart} />
                ))}
              </div>
            </div>
          )}

          {/* ╔══════════════════════════════════════════════╗
              ║  CROSS-SELL (from product mapping)           ║
              ╚══════════════════════════════════════════════╝ */}
          {crossSellProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-black text-slate-800">You May Also Need</h2>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {crossSellProducts.map((item: any) => (
                  <ProductMiniCard key={item._id || item.id} item={item} onAdd={addItemToCart} />
                ))}
              </div>
            </div>
          )}

          {/* ╔══════════════════════════════════════════════╗
              ║  RECENTLY VIEWED                             ║
              ╚══════════════════════════════════════════════╝ */}
          {recentlyViewed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-slate-400" />
                <h2 className="text-base font-black text-slate-800">Recently Viewed</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {recentlyViewed.map((item: any) => {
                  const p = Number(item.price || 0);
                  const m = Number(item.mrp || p);
                  const slug = item.seoUrlSlug || item.id;
                  return (
                    <Link key={item.id} href={`/product/${encodeURIComponent(slug?.replace(/^\//, '') || '')}`}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col shrink-0 w-40 sm:w-44 group">
                      <div className="relative h-32 bg-slate-50 flex items-center justify-center">
                        <Image src={item.imageUrl || '/images/medicine_placeholder.png'} alt={item.name || ''} fill className="object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-bold text-slate-800 line-clamp-2 mb-1">{item.name}</p>
                        <p className="text-sm font-black text-slate-900">₹{p}</p>
                        {m > p && <p className="text-[9px] text-slate-400 line-through">₹{m}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Marketer Card */}
          {(product?.marketerName || product?.taxonomy?.marketer_name) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 sm:px-8 py-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Manufactured & Marketed By</p>
                  <p className="text-lg font-black text-white leading-tight">{product?.marketerName || product?.taxonomy?.marketer_name}</p>
                </div>
              </div>
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</p><p className="text-sm font-bold text-slate-700 mt-1">{product?.categoryName || '—'}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Country of Origin</p><p className="text-sm font-bold text-slate-700 mt-1">{product?.countryOfOrigin || 'India'}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Medicine Type</p><p className="text-sm font-bold text-slate-700 mt-1">{product?.medicineType || '—'}</p></div>
                {(product?.taxonomy?.marketer_address || product?.marketerAddress) && (
                  <div className="sm:col-span-3 pt-4 border-t border-slate-50 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Registered Address</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{product?.taxonomy?.marketer_address || product?.marketerAddress}</p></div>
                  </div>
                )}
                <div className="sm:col-span-3 pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 leading-relaxed"><span className="font-black text-slate-500">Disclaimer: </span>The information provided here is for educational purposes only. Always consult your doctor or pharmacist before starting, stopping, or changing any medication. SahiMed sources all products directly from licensed distributors and manufacturers.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ╔══════════════════════════════════════════════╗
            ║  STICKY MOBILE BUY BAR                       ║
            ╚══════════════════════════════════════════════╝ */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300",
          showStickyBar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}>
          <div className="bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl px-4 py-3 safe-bottom">
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{product?.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">₹{unitPrice * selectedQty}</span>
                  {unitMrp > unitPrice && <span className="text-xs text-slate-400 line-through">₹{unitMrp * selectedQty}</span>}
                  {discountPct > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{discountPct}% off</span>}
                </div>
              </div>
              {qty > 0 ? (
                <div className="flex items-center h-11 bg-slate-50 rounded-full border border-slate-100 p-0.5 gap-1">
                  <button onClick={() => addCurrentToCart(-1)} className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm"><Minus className="w-3.5 h-3.5 text-slate-600" /></button>
                  <span className="text-xs font-black px-2">{qty}</span>
                  <button onClick={() => addCurrentToCart(1)} className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm"><Plus className="w-3.5 h-3.5 text-slate-600" /></button>
                </div>
              ) : (
                <Button onClick={() => addCurrentToCart()}
                  className="h-11 px-7 rounded-full font-black text-xs bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 uppercase tracking-wider whitespace-nowrap">
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8">
          <Footer />
        </div>
      </div>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-none p-8 shadow-2xl">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-1">Share this product</DialogTitle>
          <DialogDescription className="text-xs text-slate-400 mb-5">{product?.name}</DialogDescription>
          <div className="space-y-3">
            <Button className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-sm gap-2"
              onClick={() => { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product?.name} on SahiMed: ${window.location.href}`)}`,'_blank'); setIsShareOpen(false); }}>
              <Send className="w-4 h-4" /> Share on WhatsApp
            </Button>
            <Button className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm gap-2"
              onClick={() => { navigator?.clipboard?.writeText(window.location.href); toast({ title: "Link copied!" }); setIsShareOpen(false); }}>
              <Copy className="w-4 h-4" /> Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </PageTransition>
  );
}
