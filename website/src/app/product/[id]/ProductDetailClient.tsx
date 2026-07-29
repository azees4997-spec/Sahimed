"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import {
  Info, Baby, Milk, Car, ShieldAlert, Stethoscope, AlertTriangle, Package,
  ShoppingCart, Minus, Plus, TrendingDown, MapPin, ChevronDown, ChevronRight,
  AlertCircle, Truck, FlaskConical, Tag, Building2, Globe, Pill,
  ClipboardList, Zap, BookOpen, ThumbsUp, Share2, Copy, Send
} from 'lucide-react';
import { useMongoDBDoc, useMongoDBMolecule, useMongoDBCollection } from '@/hooks/use-mongodb';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageTransition from '@/components/PageTransition';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

// ─── Section Label ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
    </div>
  );
}

// ─── Info Row (label + value) ────────────────────────────────────────────────
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

// ─── Warning Tile ────────────────────────────────────────────────────────────
function WarningTile({ label, value, icon: Icon, color }: { label: string; value?: string | null; icon: any; color: string }) {
  if (!value) return null;
  return (
    <div className={cn("rounded-2xl p-4 flex gap-3 border", color)}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[11px] font-medium leading-relaxed opacity-80">{value}</p>
      </div>
    </div>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a?: string | null }) {
  const [open, setOpen] = useState(false);
  if (!a) return null;
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ProductDetailClient({ initialProduct, id }: { initialProduct: any, id: string }) {
  const { toast } = useToast();
  const { user } = useUser();
  const db_fs = useFirestore();
  const { addToCart, getItemQuantity } = useCart();

  const [edd, setEdd] = useState('');
  const [activePincode, setActivePincode] = useState('560068');
  const [zone, setZone] = useState('');
  const [isServiceable, setIsServiceable] = useState<boolean | null>(true);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'safety' | 'info'>('overview');
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { data: productData } = useMongoDBDoc(id);
  const product = productData || initialProduct;
  const { data: molData } = useMongoDBMolecule(product?.moleculeId);

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
        setZone(data.zone || '');
        setIsServiceable(true);
      } else { setIsServiceable(false); }
    } catch { setIsServiceable(false); }
  };

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date(), c = new Date(); c.setHours(14,0,0,0);
      let diff = c.getTime() - now.getTime();
      if (diff < 0) { c.setDate(c.getDate()+1); diff = c.getTime() - now.getTime(); }
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g,'').slice(0,6);
    setActivePincode(v);
    if (v.length === 6) localStorage.setItem('activePincode', v);
  };
  const onCheckPincode = () => { if (activePincode.length === 6) { fetchEdd(activePincode); setIsEditingPincode(false); } };

  // ── Generic Comparison ───────────────────────────────────────────────────
  const isGeneric = product?.isGeneric === true || product?.isGeneric === "true";
  const { data: genericAlternatives } = useMongoDBCollection({
    moleculeId: !isGeneric ? product?.moleculeId : undefined, isGeneric: true, limit: 10
  });
  const genericAlt = !isGeneric
    ? genericAlternatives?.find((a: any) =>
        (a.isGeneric === true || a.isGeneric === "true") &&
        String(a._id || a.id) !== String(product?._id || product?.id)
      )
    : null;
  const showComparison = !isGeneric && !!genericAlt;

  // ── Prices ───────────────────────────────────────────────────────────────
  const currentPrice = Number(product?.liveData?.sahimed_price || product?.price || 0);
  const currentMrp   = Number(product?.liveData?.mrp || product?.mrp || (currentPrice + 20));
  const altPrice     = genericAlt ? Number(genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const altMrp       = genericAlt ? Number(genericAlt.liveData?.mrp || genericAlt.mrp || (altPrice + 20)) : 0;
  const discountPct  = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const altSavePct   = currentMrp > 0 && altPrice > 0 ? Math.round(((currentMrp - altPrice) / currentMrp) * 100) : 0;

  const images = product?.images?.length > 0 ? product.images : ['/images/medicine_placeholder.png'];
  const qty    = getItemQuantity(product?._id || product?.id);

  const addCurrentToCart = (delta = 1) => addToCart({ ...product, id: product?._id || product?.id, price: currentPrice, mrp: currentMrp }, delta);

  // ── Tabs config ──────────────────────────────────────────────────────────
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'usage',    label: 'How to Use' },
    { key: 'safety',   label: 'Safety' },
    { key: 'info',     label: 'Product Info' },
  ] as const;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F5F6FA] pb-28">
        <Navbar />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* ── Breadcrumb ─────────────────────────────────────────────── */}
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {product?.categoryName && (
              <><Link href="/medicines" className="hover:text-primary transition-colors">{product.categoryName}</Link><ChevronRight className="w-3 h-3" /></>
            )}
            <span className="text-slate-600 font-semibold line-clamp-1">{product?.name}</span>
          </nav>

          {/* ╔═══════════════════════════════════════════════════════════╗
              ║  HERO SECTION                                             ║
              ╚═══════════════════════════════════════════════════════════╝ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── Image Gallery ───────────────────────────────────────── */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center p-8">
                  <Image
                    src={images[currentImageIndex]}
                    alt={product?.name || 'Medicine'}
                    fill className="object-contain p-6" priority
                  />
                  {discountPct > 0 && (
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {discountPct}% Off
                    </div>
                  )}
                  {product?.prescriptionRequired && (
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                      Rx Required
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto border-t border-slate-50">
                    {images.map((img: string, i: number) => (
                      <button key={i} onClick={() => setCurrentImageIndex(i)}
                        className={cn("relative w-14 h-14 rounded-xl border-2 bg-slate-50 overflow-hidden shrink-0 transition-all",
                          i === currentImageIndex ? "border-primary shadow-sm" : "border-slate-100 hover:border-slate-300"
                        )}>
                        <Image src={img} alt="" fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Product Details & Buy Box ────────────────────────────── */}
            <div className="lg:col-span-7 space-y-4">

              {/* Product identity card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">

                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {product?.medicineType && (
                    <Badge className="bg-violet-100 text-violet-700 border-none text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.medicineType}
                    </Badge>
                  )}
                  {product?.subCategory && (
                    <Badge className="bg-sky-100 text-sky-700 border-none text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.subCategory}
                    </Badge>
                  )}
                  {product?.salableStatus && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.salableStatus}
                    </Badge>
                  )}
                </div>

                {/* Product name */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
                    {product?.name}
                  </h1>
                  {product?.composition && (
                    <p className="mt-1 text-xs text-slate-500 font-medium italic">{product.composition}</p>
                  )}
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    By{' '}
                    <span className="text-primary font-semibold">{product?.marketerName || product?.manufacturer || '—'}</span>
                    {product?.categoryName && (
                      <span className="text-slate-400"> · {product.categoryName}</span>
                    )}
                  </p>
                </div>

                {/* SKU / Product ID chips */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {product?.sku && (
                    <span className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">SKU: {product.sku}</span>
                  )}
                  {product?.moleculeCode && (
                    <span className="bg-violet-50 text-violet-600 font-semibold px-2.5 py-1 rounded-md">MOL: {product.moleculeCode}</span>
                  )}
                  {product?.countryOfOrigin && (
                    <span className="bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-md">Made in {product.countryOfOrigin}</span>
                  )}
                </div>

                <div className="border-t border-slate-50" />

                {/* Pricing */}
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Our Price</p>
                    <p className="text-4xl font-black text-slate-900 font-outfit">₹{currentPrice}</p>
                  </div>
                  {currentMrp > currentPrice && (
                    <div className="pb-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">MRP</p>
                      <p className="text-sm font-medium text-slate-400 line-through">₹{currentMrp}</p>
                    </div>
                  )}
                  {discountPct > 0 && (
                    <div className="pb-1">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl">
                        Save {discountPct}% · ₹{(currentMrp - currentPrice).toFixed(2)} off
                      </span>
                    </div>
                  )}
                </div>

                {/* Pack size info */}
                {(product?.packageType || product?.productForm || product?.packageQuantity) && (
                  <div className="flex items-center gap-3 flex-wrap text-[11px]">
                    {product.productForm && (
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl">
                        <Pill className="w-3.5 h-3.5 text-primary" />{product.productForm}
                      </span>
                    )}
                    {product.packageType && (
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl">
                        <Package className="w-3.5 h-3.5 text-primary" />{product.packageType}
                      </span>
                    )}
                    {product.packageQuantity && (
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl">
                        <Tag className="w-3.5 h-3.5 text-primary" />Qty: {product.packageQuantity}
                      </span>
                    )}
                    {product.packagingDetail && (
                      <span className="text-slate-500 font-medium">{product.packagingDetail}</span>
                    )}
                  </div>
                )}

                {/* Add to Cart / Qty Stepper */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {qty > 0 ? (
                    <div className="flex items-center h-12 bg-slate-50 rounded-full border border-slate-150 p-1 shadow-inner gap-1">
                      <Button variant="ghost" onClick={() => addCurrentToCart(-1)}
                        className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                        <Minus className="w-4 h-4 text-slate-600" />
                      </Button>
                      <span className="min-w-[80px] text-center text-xs font-bold text-slate-800">{qty} in cart</span>
                      <Button variant="ghost" onClick={() => addCurrentToCart(1)}
                        className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                        <Plus className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => addCurrentToCart()}
                      className="h-12 px-8 rounded-full font-bold text-sm bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 uppercase tracking-wider">
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                  )}
                  <Button variant="outline" size="icon"
                    onClick={() => setIsShareOpen(true)}
                    className="h-12 w-12 rounded-full border-slate-200 hover:bg-slate-50">
                    <Share2 className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>

              </div>

              {/* ── Delivery Card ────────────────────────────────────────── */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/8 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Delivering to</p>
                      <p className="text-sm font-bold text-slate-900 tracking-wider mt-0.5">{activePincode}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditingPincode(!isEditingPincode)}
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">
                    {isEditingPincode ? 'Cancel' : 'Change'}
                  </button>
                </div>

                {isEditingPincode && (
                  <div className="flex gap-2">
                    <input type="text" value={activePincode} onChange={handlePincodeChange}
                      placeholder="Enter 6-digit pincode"
                      className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-semibold focus:bg-white outline-none ring-0 focus:ring-2 focus:ring-primary/20" />
                    <Button onClick={onCheckPincode} className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-bold">Check</Button>
                  </div>
                )}

                {isServiceable ? (
                  <div className="space-y-2">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800">
                          {edd ? `Express delivery by ${edd}` : 'Delivery available'}
                        </p>
                        {zone && <p className="text-[9px] text-emerald-600 font-medium mt-0.5">{zone} zone · Free shipping</p>}
                      </div>
                    </div>
                    {edd && timeLeft && (
                      <p className="text-[10px] text-slate-500 font-medium px-1">
                        Order within <span className="text-primary font-bold">{timeLeft}</span> to get it by {edd}
                      </p>
                    )}
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

          {/* ╔═══════════════════════════════════════════════════════════╗
              ║  GENERIC COMPARISON PANEL                                 ║
              ╚═══════════════════════════════════════════════════════════╝ */}
          {showComparison && genericAlt && (
            <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Smart Switch · Same Composition</span>
              </div>
              <p className="text-base font-bold text-slate-800 mb-6">
                Switch to Sahi Recommended and save <span className="text-emerald-600 font-black">₹{(currentMrp - altPrice).toFixed(0)} per pack</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Branded card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
                  <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-bold px-2.5 py-0.5 uppercase">Current (Branded)</Badge>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{product?.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{product?.marketerName}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-2xl font-black text-slate-700">₹{currentPrice}</span>
                    <span className="text-[10px] text-slate-400 line-through">MRP ₹{currentMrp}</span>
                  </div>
                </div>
                {/* Generic recommended card */}
                <div className="bg-white rounded-2xl p-5 border-2 border-emerald-400 relative overflow-hidden space-y-3">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-2xl uppercase">
                    {altSavePct}% cheaper
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none text-[9px] font-bold px-2.5 py-0.5 uppercase">Sahi Recommended</Badge>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{genericAlt?.product_name || genericAlt?.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{genericAlt?.taxonomy?.marketer_name || 'Generic'}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-2xl font-black text-emerald-600">₹{altPrice}</span>
                    <Button size="sm" onClick={() => addToCart({ ...genericAlt, id: genericAlt._id || genericAlt.id, price: altPrice, mrp: altMrp })}
                      className="h-9 px-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold">
                      Switch & Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ╔═══════════════════════════════════════════════════════════╗
              ║  TABBED INFORMATION PANEL                                 ║
              ╚═══════════════════════════════════════════════════════════╝ */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Tab Bar */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex-1 min-w-[80px] py-4 px-6 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === t.key
                      ? "text-primary border-b-2 border-primary bg-primary/3"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8">

              {/* ══ OVERVIEW TAB ════════════════════════════════════════ */}
                  {(product?.description || product?.introduction) && (
                    <div>
                      <SectionLabel>Introduction</SectionLabel>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {product.description || product.introduction}
                      </p>
                    </div>
                  )}

                  {(product?.primaryUse || product?.medical_info?.primary_use) && (
                    <div>
                      <SectionLabel>Primary Use</SectionLabel>
                      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex gap-3">
                        <Stethoscope className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-slate-800 leading-relaxed">
                          {product.primaryUse || product.medical_info?.primary_use}
                        </p>
                      </div>
                    </div>
                  )}

                  {(product?.treatment || product?.uses) && (
                    <div>
                      <SectionLabel>Treatment & Uses</SectionLabel>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {product.treatment || product.uses}
                      </p>
                    </div>
                  )}

                  {(product?.benefits || product?.medical_info?.benefits) && (
                    <div>
                      <SectionLabel>Key Benefits</SectionLabel>
                      <div className="space-y-2">
                        {(product.benefits || product.medical_info?.benefits).split(/\n|\|/).filter(Boolean).map((b: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-white text-[10px] font-black">✓</span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-900 leading-snug">{b.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {product?.sideEffects && (
                    <div>
                      <SectionLabel>Side Effects</SectionLabel>
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-amber-900 leading-relaxed">{product.sideEffects}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Molecule */}
                  {(molData?.molecule || molData?.name || product?.composition) && (
                    <div>
                      <SectionLabel>Active Composition</SectionLabel>
                      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex gap-3">
                        <FlaskConical className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1">Salt Molecule</p>
                          <p className="text-sm font-bold text-violet-900">
                            {molData?.molecule || molData?.name || product?.composition}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ HOW TO USE TAB ══════════════════════════════════════ */}
              {activeTab === 'usage' && (
                <div className="space-y-8">
                  {product?.howToUse ? (
                    <div>
                      <SectionLabel>Directions for Use</SectionLabel>
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 flex gap-3">
                        <Stethoscope className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-sky-900 leading-relaxed">{product.howToUse}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-medium">Usage directions not available. Consult your doctor.</p>
                    </div>
                  )}

                  {product?.storage_instructions && (
                    <div>
                      <SectionLabel>Storage Instructions</SectionLabel>
                      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex gap-3">
                        <Package className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-teal-900 leading-relaxed">{product.storage_instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* FAQ-style usage questions */}
                  <div className="space-y-3">
                    <SectionLabel>Common Questions</SectionLabel>
                    <FaqItem
                      q="What should I do if I miss a dose?"
                      a={product?.ifMiss || product?.if_miss || product?.medical_info?.if_miss || "Take the missed dose as soon as you remember. If the next scheduled dose is close, skip the missed dose. Never double-dose."}
                    />
                    <FaqItem
                      q="What happens if I overdose?"
                      a={"Seek immediate emergency medical attention if you believe you have taken too much of this medication."}
                    />
                    <FaqItem
                      q="Can I stop taking this medicine suddenly?"
                      a={"Do not stop the medication without consulting your doctor, as abrupt discontinuation may cause withdrawal symptoms."}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'safety' && (
                <div className="space-y-6">
                  <SectionLabel>Drug & Interaction Warnings</SectionLabel>

                  {(product?.pregnancyInteraction || product?.safety_warnings?.interactions?.pregnancy) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <WarningTile
                        label="Pregnancy"
                        value={product?.pregnancyInteraction || product?.safety_warnings?.interactions?.pregnancy}
                        icon={Baby}
                        color="bg-rose-50 border-rose-100 text-rose-800"
                      />
                      <WarningTile
                        label="Breastfeeding / Lactation"
                        value={product?.lactationInteraction || product?.safety_warnings?.interactions?.lactation}
                        icon={Milk}
                        color="bg-sky-50 border-sky-100 text-sky-800"
                      />
                      <WarningTile
                        label="Driving & Machinery"
                        value={product?.drivingInteraction || product?.safety_warnings?.interactions?.driving}
                        icon={Car}
                        color="bg-amber-50 border-amber-100 text-amber-800"
                      />
                      <WarningTile
                        label="Kidney Function"
                        value={product?.kidneyInteraction || product?.safety_warnings?.interactions?.kidney}
                        icon={ShieldAlert}
                        color="bg-orange-50 border-orange-100 text-orange-800"
                      />
                      <WarningTile
                        label="Liver Function"
                        value={product?.liverInteraction || product?.safety_warnings?.interactions?.liver}
                        icon={AlertTriangle}
                        color="bg-red-50 border-red-100 text-red-800"
                      />
                      <WarningTile
                        label="Alcohol Interaction"
                        value={product?.alcoholInteraction || product?.safety_warnings?.interactions?.alcohol}
                        icon={AlertCircle}
                        color="bg-purple-50 border-purple-100 text-purple-800"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-medium">No specific safety warnings listed. Always consult a doctor.</p>
                    </div>
                  )}

                  {/* Full Safety Advisory */}
                  {(product?.safetyAdvise || product?.safety_warnings?.interactions?.safety_advise) && (
                    <div>
                      <SectionLabel>Safety Advisory</SectionLabel>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                            {product.safetyAdvise || product.safety_warnings?.interactions?.safety_advise}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prescription & Controlled status */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className={cn("flex-1 rounded-2xl p-5 flex items-center gap-4 border",
                      product?.prescriptionRequired ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                        product?.prescriptionRequired ? "bg-rose-100" : "bg-emerald-100")}>
                        <ClipboardList className={cn("w-5 h-5", product?.prescriptionRequired ? "text-rose-600" : "text-emerald-600")} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">Prescription Status</p>
                        <p className={cn("text-sm font-bold", product?.prescriptionRequired ? "text-rose-700" : "text-emerald-700")}>
                          {product?.prescriptionRequired ? "Prescription required (Rx only)" : "Over-the-counter (no prescription needed)"}
                        </p>
                      </div>
                    </div>
                    {(product?.isControlledSubstance !== undefined || product?.safety_warnings?.is_controlled_substance !== undefined) && (
                      <div className={cn("flex-1 rounded-2xl p-5 flex items-center gap-4 border",
                        (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                          ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                          (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                            ? "bg-red-100" : "bg-slate-100")}>
                          <ShieldAlert className={cn("w-5 h-5",
                            (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                              ? "text-red-600" : "text-slate-400")} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">Controlled Substance</p>
                          <p className={cn("text-sm font-bold",
                            (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                              ? "text-red-700" : "text-slate-500")}>
                            {(product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                              ? "Scheduled / Controlled substance" : "Not a controlled substance"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ PRODUCT INFO TAB ════════════════════════════════════ */}
              {activeTab === 'info' && (
                <div className="space-y-8">

                  <div>
                    <SectionLabel>Identification</SectionLabel>
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Product ID / SKU" value={product?.sku || product?.product_id} icon={Tag} accent="bg-slate-100 text-slate-500" />
                      <InfoRow label="Molecule Code" value={product?.moleculeCode || product?.molecule_code} icon={FlaskConical} accent="bg-violet-100 text-violet-600" />
                      <InfoRow label="Medicine Type" value={product?.medicineType || product?.medicine_type} icon={Pill} accent="bg-sky-100 text-sky-600" />
                      <InfoRow label="Salable Status" value={product?.salableStatus || product?.salable_status} icon={ThumbsUp} accent="bg-emerald-100 text-emerald-600" />
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Manufacturer / Taxonomy</SectionLabel>
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Marketer Name" value={product?.marketerName || product?.taxonomy?.marketer_name} icon={Building2} accent="bg-primary/10 text-primary" />
                      <InfoRow label="Marketer ID" value={product?.marketerId || product?.taxonomy?.marketer_id} icon={Tag} accent="bg-slate-100 text-slate-500" />
                      <InfoRow label="Category" value={product?.categoryName || product?.taxonomy?.category_name} icon={Tag} accent="bg-amber-100 text-amber-600" />
                      <InfoRow label="Category ID" value={product?.categoryId || product?.taxonomy?.category_id} icon={Tag} accent="bg-amber-50 text-amber-400" />
                      <InfoRow label="Sub-Category" value={product?.subCategory || product?.taxonomy?.sub_category} icon={Tag} accent="bg-amber-50 text-amber-500" />
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Packaging Details</SectionLabel>
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Product Form" value={product?.productForm || product?.packaging?.product_form} icon={Pill} accent="bg-sky-100 text-sky-600" />
                      <InfoRow label="Package Type" value={product?.packageType || product?.packaging?.package_type} icon={Package} accent="bg-indigo-100 text-indigo-600" />
                      <InfoRow label="Package Quantity" value={product?.packageQuantity?.toString() || product?.packaging?.package_quantity?.toString()} icon={Tag} accent="bg-slate-100 text-slate-500" />
                      <InfoRow label="Packaging Detail" value={product?.packagingDetail || product?.packaging?.packaging_detail} icon={Info} accent="bg-slate-100 text-slate-500" />
                      <InfoRow label="Storage" value={product?.storage_instructions || product?.packaging?.storage} icon={Package} accent="bg-teal-100 text-teal-600" />
                      <InfoRow label="MRP" value={`₹${product?.mrp || product?.packaging?.mrp || '—'}`} icon={Tag} accent="bg-emerald-100 text-emerald-600" />
                      <InfoRow label="Country of Origin" value={product?.countryOfOrigin || product?.country_of_origin} icon={Globe} accent="bg-amber-100 text-amber-600" />
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

        {/* ── Share Dialog ─────────────────────────────────────────────── */}
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

      </div>
    </PageTransition>
  );
}
