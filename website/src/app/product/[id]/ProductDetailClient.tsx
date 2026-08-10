"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart, Minus, Plus, Share2, Copy, Send,
  ShieldCheck, Truck, Star, Clock, ChevronRight,
  Package, MapPin,
} from 'lucide-react';
import { useMongoDBMolecule, useMongoDBCollection } from '@/hooks/use-mongodb';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// ─── Instant sub-components ──────────────────────────────────────────────────
import ImageGallery from './components/ImageGallery';
import PricingCard from './components/PricingCard';
import GenericSwitchCard from './components/GenericSwitchCard';

// ─── Lazy sub-components ─────────────────────────────────────────────────────
const DrugInfoTabs = dynamic(() => import('./components/DrugInfoTabs'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100">
        {['Overview', 'How to Use', 'Safety', 'Product Info'].map(label => (
          <div key={label} className="flex-1 min-w-[90px] py-4 px-5 flex flex-col items-center gap-1.5">
            <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="h-2 w-12 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="p-6 sm:p-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
      </div>
    </div>
  ),
});

const RecentlyViewed = dynamic(() => import('./components/RecentlyViewed'), {
  ssr: false,
  loading: () => null,
});

// ─── Recently Viewed helpers ──────────────────────────────────────────────────
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

// ─── Trust Badge (used in trust strip) ───────────────────────────────────────
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

// ─── Mobile First-Frame Hero (no generic compare) ─────────────────────────────
function MobileHeroCard({
  product, images, currentImageIndex, discountPct, currentPrice, currentMrp,
  qty, onAdd, onUpdateQty,
}: any) {
  return (
    <div className="sm:hidden bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm space-y-3">
      <div className="flex gap-3.5 items-start">
        <div className="relative w-28 h-28 shrink-0 bg-slate-50/80 rounded-xl border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
          <Image src={images[currentImageIndex]} alt={product?.name || 'Medicine'} fill className="object-contain p-1" priority />
          {discountPct > 0 && (
            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs">{discountPct}% OFF</span>
          )}
          {product?.prescriptionRequired && (
            <span className="absolute bottom-1 right-1 bg-rose-500 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full uppercase">Rx</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {(product?.is_generic === true || product?.isGeneric === true || (product?.medicineType || '').toLowerCase().includes('generic')) && (
            <span className="inline-block bg-emerald-600 text-white text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">✨ Branded Generic</span>
          )}
          <h1 className="text-sm font-extrabold text-slate-900 leading-tight uppercase line-clamp-2">{product?.name}</h1>
          {product?.composition && <p className="text-[10.5px] text-slate-500 font-medium italic line-clamp-1">{product.composition}</p>}
          <p className="text-[10.5px] font-bold text-primary truncate">By {product?.marketerName || product?.manufacturer || 'SahiMed'}</p>
          {(product?.packagingDetail || product?.packaging?.packaging_detail) && (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100">
              <Package className="w-3 h-3 text-primary" />{product.packagingDetail || product.packaging?.packaging_detail}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-950 font-outfit">₹{currentPrice}</span>
            {currentMrp > currentPrice && <span className="text-xs text-slate-400 line-through font-bold">₹{currentMrp}</span>}
          </div>
          {discountPct > 0 && <p className="text-[9.5px] font-bold text-emerald-600">Save ₹{(currentMrp - currentPrice).toFixed(0)}</p>}
        </div>
        {qty > 0 ? (
          <div className="flex items-center h-10 bg-slate-50 rounded-full border border-slate-200 px-1 gap-1">
            <Button size="icon" variant="ghost" onClick={() => onUpdateQty(product?._id || product?.id, -1)} className="h-8 w-8 rounded-full bg-white text-slate-700 shadow-xs"><Minus className="w-3.5 h-3.5" /></Button>
            <span className="text-xs font-bold text-slate-800 px-2">{qty}</span>
            <Button size="icon" variant="ghost" onClick={() => onUpdateQty(product?._id || product?.id, 1)} className="h-8 w-8 rounded-full bg-white text-slate-700 shadow-xs"><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        ) : (
          <Button onClick={() => onAdd(1)} className="h-10 px-5 rounded-full font-black text-xs bg-primary text-white hover:bg-primary/90 shadow-md uppercase tracking-wider flex-1 max-w-[170px]">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Marketer Card ────────────────────────────────────────────────────────────
function MarketerCard({ product }: { product: any }) {
  if (!product?.marketerName && !product?.taxonomy?.marketer_name) return null;
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 sm:px-8 py-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Manufactured &amp; Marketed By</p>
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
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Registered Address</p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">{product?.taxonomy?.marketer_address || product?.marketerAddress}</p>
            </div>
          </div>
        )}
        <div className="sm:col-span-3 pt-4 border-t border-slate-50">
          <p className="text-[10px] text-slate-400 leading-relaxed"><span className="font-black text-slate-500">Disclaimer: </span>The information provided here is for educational purposes only. Always consult your doctor or pharmacist before starting, stopping, or changing any medication. SahiMed sources all products directly from licensed distributors and manufacturers.</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ProductDetailClient({
  initialProduct,
  id,
  crossSellProducts = [],
}: {
  initialProduct: any;
  id: string;
  crossSellProducts?: any[];
}) {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();
  const { db: db_fs } = useFirestore();
  const { user } = useUser();

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
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [tabsLoaded, setTabsLoaded] = useState(false);
  const [bottomLoaded, setBottomLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const product = initialProduct;
  const { data: molData } = useMongoDBMolecule(product?.moleculeId);

  // People Also Bought
  const { data: alsoData } = useMongoDBCollection({
    q: product?.categoryName || product?.taxonomy?.category_name || '',
    limit: 12,
  });
  const alsoBought = (alsoData || []).filter((p: any) =>
    String(p._id || p.id) !== String(product?._id || product?.id)
  ).slice(0, 8);

  // ── Recently Viewed ──────────────────────────────────────────────────────
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

  // ── IntersectionObserver: load RecentlyViewed on scroll ──────────────────
  useEffect(() => {
    if (!bottomSentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setBottomLoaded(true); obs.disconnect(); } },
      { rootMargin: '200px' }
    );
    obs.observe(bottomSentinelRef.current);
    return () => obs.disconnect();
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
        body: JSON.stringify({ toPincode: pin }),
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

  // ── Countdown timer ──────────────────────────────────────────────────────
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

  // ── Generic alternatives ─────────────────────────────────────────────────
  const isGeneric = product?.is_generic === true || product?.isGeneric === true || product?.isGeneric === "true" || (product?.medicineType || product?.medicine_type || '').toLowerCase().includes('generic');

  // Only search for a generic alternative when:
  // 1. Current product is NOT itself generic
  // 2. No manual mappedGeneric is set (manual mapping takes priority)
  // 3. The product actually HAS a moleculeId (without it the query returns random generics)
  const canSearchGeneric = !isGeneric && !product?.mappedGeneric && !!product?.moleculeId;
  const { data: genericAlternatives } = useMongoDBCollection({
    moleculeId: canSearchGeneric ? product.moleculeId : undefined,
    isGeneric: canSearchGeneric ? true : undefined,   // don't send isGeneric if not searching
    limit: canSearchGeneric ? 10 : 0,
  });

  const genericAlt = product?.mappedGeneric || (!isGeneric
    ? genericAlternatives?.find((a: any) =>
        // Must be a generic
        (a.is_generic === true || a.isGeneric === true || a.isGeneric === "true" || (a.medicine_type || '').toLowerCase().includes('generic')) &&
        // Must NOT be the same product
        String(a._id || a.id) !== String(product?._id || product?.id) &&
        // Must share the same moleculeId — prevents random generic from appearing
        !!product?.moleculeId &&
        (a.moleculeId === product.moleculeId || a.molecule_code === product.molecule_code || a.moleculeId === product.molecule_code))
    : null);

  // Show comparison ONLY when:
  // - current product is a brand (not generic)
  // - we found a real matching generic with the same molecule
  const showComparison = !isGeneric && !!genericAlt;

  // ── Prices ───────────────────────────────────────────────────────────────
  const unitPrice = Number(product?.liveData?.sahimed_price || product?.price || 0);
  const unitMrp   = Number(product?.liveData?.mrp || product?.mrp || (unitPrice + 20));
  const currentPrice = unitPrice * selectedQty;
  const currentMrp   = unitMrp * selectedQty;
  const altPrice  = genericAlt ? Number(genericAlt.liveData?.sahimed_price || genericAlt.selling_price || genericAlt.price || 0) : 0;
  const altMrp    = genericAlt ? Number(genericAlt.liveData?.mrp || genericAlt.mrp || genericAlt.packaging?.mrp || (unitPrice > 0 ? unitPrice : altPrice)) : 0;
  const discountPct = unitMrp > 0 ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0;
  const genericProductDiscountPct = altMrp > 0 && altMrp > altPrice ? Math.round(((altMrp - altPrice) / altMrp) * 100) : (unitPrice > altPrice ? Math.round(((unitPrice - altPrice) / unitPrice) * 100) : 0);
  const altSavePct  = unitMrp > 0 && altPrice > 0 ? Math.round(((unitMrp - altPrice) / unitMrp) * 100) : 0;
  const switchSavingsAmount = unitPrice > altPrice ? (unitPrice - altPrice) : 0;

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

  // ── Tab click → load DrugInfoTabs ────────────────────────────────────────
  const handleTabChange = (tab: 'overview' | 'usage' | 'safety' | 'info') => {
    setActiveTab(tab);
    if (!tabsLoaded) setTabsLoaded(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F5F6FA] pb-28 lg:pb-12">
        <Navbar />

        {/* Trust Strip */}
        <div className="bg-white border-b border-slate-100 hidden sm:block">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <TrustBadge icon={ShieldCheck} label="100% Genuine" sub="Licensed sources" />
              <div className="w-px h-6 bg-slate-100 shrink-0" />
              <TrustBadge icon={Truck} label="Express Delivery" sub="Same day dispatch" />
              <div className="w-px h-6 bg-slate-100 shrink-0" />
              <TrustBadge icon={Star} label="Trusted by 50k+" sub="Happy patients" />
              <div className="w-px h-6 bg-slate-100 shrink-0" />
              <TrustBadge icon={Clock} label="24/7 Support" sub="Always here to help" />
            </div>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div ref={heroRef} className="h-0 w-0" />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {product?.categoryName && (
              <><Link href="/medicines" className="hover:text-primary transition-colors">{product.categoryName}</Link><ChevronRight className="w-3 h-3" /></>
            )}
            <span className="text-slate-600 font-semibold line-clamp-1">{product?.name}</span>
          </nav>

          {/* ═══ GENERIC SWITCH COMPARISON (instant) ════════════════════════ */}
          {showComparison && genericAlt && (
            <GenericSwitchCard
              product={product}
              genericAlt={genericAlt}
              images={images}
              currentImageIndex={currentImageIndex}
              unitPrice={unitPrice}
              unitMrp={unitMrp}
              altPrice={altPrice}
              altMrp={altMrp}
              switchSavingsAmount={switchSavingsAmount}
              genericProductDiscountPct={genericProductDiscountPct}
              altSavePct={altSavePct}
              onImageChange={setCurrentImageIndex}
              onAddBrand={() => addCurrentToCart(1)}
              onSwitchSave={() => addToCart({ ...genericAlt, id: genericAlt._id || genericAlt.id, price: altPrice, mrp: altMrp })}
            />
          )}

          {/* ═══ MOBILE HERO CARD (no comparison) ══════════════════════════ */}
          {!showComparison && (
            <MobileHeroCard
              product={product}
              images={images}
              currentImageIndex={currentImageIndex}
              discountPct={discountPct}
              currentPrice={currentPrice}
              currentMrp={currentMrp}
              qty={qty}
              onAdd={addCurrentToCart}
              onUpdateQty={updateQuantity}
            />
          )}

          {/* ═══ DESKTOP HERO (instant) ═════════════════════════════════════ */}
          <div className="hidden sm:grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <ImageGallery
              images={images}
              productName={product?.name}
              discountPct={discountPct}
              prescriptionRequired={product?.prescriptionRequired}
              currentImageIndex={currentImageIndex}
              onImageChange={setCurrentImageIndex}
            />
            <PricingCard
              product={product}
              unitPrice={unitPrice}
              unitMrp={unitMrp}
              currentPrice={currentPrice}
              currentMrp={currentMrp}
              discountPct={discountPct}
              selectedQty={selectedQty}
              qty={qty}
              edd={edd}
              zone={zone}
              isServiceable={isServiceable}
              activePincode={activePincode}
              isEditingPincode={isEditingPincode}
              timeLeft={timeLeft}
              onQtyChange={setSelectedQty}
              onAddToCart={addCurrentToCart}
              onUpdateQty={updateQuantity}
              onShareOpen={() => setIsShareOpen(true)}
              onPincodeEdit={() => setIsEditingPincode(!isEditingPincode)}
              onPincodeChange={setActivePincode}
              onPincodeCheck={() => { fetchEdd(activePincode); setIsEditingPincode(false); }}
            />
          </div>

          {/* ═══ DRUG INFO TABS (lazy — loads on first tab click) ═══════════ */}
          {/* Tab bar is always shown; only content lazy-loads */}
          {tabsLoaded ? (
            <DrugInfoTabs
              product={product}
              molData={molData}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          ) : (
            // Static tab bar before JS loads — clicking triggers lazy load
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100 overflow-x-auto">
                {(['overview', 'usage', 'safety', 'info'] as const).map((key, i) => {
                  const labels = ['Overview', 'How to Use', 'Safety', 'Product Info'];
                  return (
                    <button
                      key={key}
                      onClick={() => handleTabChange(key)}
                      className={cn(
                        "flex-1 min-w-[90px] py-4 px-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex flex-col items-center gap-1.5",
                        activeTab === key ? "text-primary border-b-2 border-primary bg-primary/[0.03]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-4 h-4 bg-slate-100 rounded" />
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
              <div className="p-6 sm:p-8 text-center text-xs text-slate-400 font-medium py-12">
                Click a tab to view information
              </div>
            </div>
          )}

          {/* ═══ BOTTOM SECTION SENTINEL — lazy trigger ════════════════════ */}
          <div ref={bottomSentinelRef} className="h-1 w-full" />

          {/* ═══ RECENTLY VIEWED / ALSO BOUGHT (lazy on scroll) ════════════ */}
          {bottomLoaded && (
            <RecentlyViewed
              alsoBought={alsoBought}
              crossSellProducts={crossSellProducts}
              recentlyViewed={recentlyViewed}
              categoryName={product?.categoryName}
              onAdd={addItemToCart}
            />
          )}

          {/* Marketer Card */}
          <MarketerCard product={product} />
        </div>

        {/* ═══ STICKY MOBILE BUY BAR (stays in shell) ════════════════════ */}
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

      </div>

      {/* Share Dialog */}
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
