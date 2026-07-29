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
  ShoppingCart, Minus, Plus, MapPin, ChevronDown, ChevronRight,
  AlertCircle, Truck, FlaskConical, Tag, Building2, Globe, Pill,
  ClipboardList, Zap, BookOpen, ThumbsUp, Share2, Copy, Send,
  CheckCircle2, Star, ShieldCheck, Clock, HeartPulse, Sparkles
} from 'lucide-react';
import { useMongoDBDoc, useMongoDBMolecule, useMongoDBCollection } from '@/hooks/use-mongodb';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageTransition from '@/components/PageTransition';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// ─── Strip HTML tags from advisory text ──────────────────────────────────────
function stripHtml(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\|/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

// ─── Info Row ────────────────────────────────────────────────────────────────
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
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
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

// ─── Molecule SVG Illustration ────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProductDetailClient({ initialProduct, id }: { initialProduct: any; id: string }) {
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

  const isGeneric = product?.isGeneric === true || product?.isGeneric === "true";
  const { data: genericAlternatives } = useMongoDBCollection({
    moleculeId: !isGeneric ? product?.moleculeId : undefined, isGeneric: true, limit: 10
  });
  const genericAlt = !isGeneric
    ? genericAlternatives?.find((a: any) =>
        (a.isGeneric === true || a.isGeneric === "true") &&
        String(a._id || a.id) !== String(product?._id || product?.id))
    : null;
  const showComparison = !isGeneric && !!genericAlt;

  const currentPrice = Number(product?.liveData?.sahimed_price || product?.price || 0);
  const currentMrp = Number(product?.liveData?.mrp || product?.mrp || (currentPrice + 20));
  const altPrice = genericAlt ? Number(genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const altMrp = genericAlt ? Number(genericAlt.liveData?.mrp || genericAlt.mrp || (altPrice + 20)) : 0;
  const discountPct = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const altSavePct = currentMrp > 0 && altPrice > 0 ? Math.round(((currentMrp - altPrice) / currentMrp) * 100) : 0;

  const images = product?.images?.length > 0 ? product.images : ['/images/medicine_placeholder.png'];
  const qty = getItemQuantity(product?._id || product?.id);
  const addCurrentToCart = (delta = 1) => addToCart({ ...product, id: product?._id || product?.id, price: currentPrice, mrp: currentMrp }, delta);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: HeartPulse },
    { key: 'usage',    label: 'How to Use', icon: Stethoscope },
    { key: 'safety',   label: 'Safety', icon: ShieldCheck },
    { key: 'info',     label: 'Product Info', icon: Package },
  ] as const;

  // Clean safety advisory
  const safetyAdviseClean = stripHtml(product?.safetyAdvise || product?.safety_warnings?.interactions?.safety_advise);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F5F6FA] pb-32">
        <Navbar />

        {/* ── Trust Strip ─────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
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

          {/* ╔════════════════════════════════════════════════╗
              ║  HERO                                          ║
              ╚════════════════════════════════════════════════╝ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Image Gallery */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="relative aspect-square bg-gradient-to-br from-slate-50 via-white to-primary/5 flex items-center justify-center p-8">
                  {/* Decorative hex rings */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                      <defs>
                        <pattern id="hex" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
                          <polygon points="20,2 38,11 38,35 20,44 2,35 2,11" fill="none" stroke="#10b981" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="400" height="400" fill="url(#hex)" />
                    </svg>
                  </div>
                  <Image src={images[currentImageIndex]} alt={product?.name || 'Medicine'}
                    fill className="object-contain p-8 relative z-10" priority />
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
            </div>

            {/* Buy Box */}
            <div className="lg:col-span-7 space-y-4">

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {product?.medicineType && (
                    <Badge className="bg-violet-100 text-violet-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.medicineType}
                    </Badge>
                  )}
                  {product?.subCategory && (
                    <Badge className="bg-sky-100 text-sky-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.subCategory}
                    </Badge>
                  )}
                  {product?.salableStatus && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.salableStatus}
                    </Badge>
                  )}
                </div>

                {/* Name */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
                    {product?.name}
                  </h1>
                  {product?.composition && (
                    <p className="mt-1 text-xs text-slate-400 font-medium italic leading-snug">{product.composition}</p>
                  )}
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    By <span className="text-primary font-semibold">{product?.marketerName || product?.manufacturer || '—'}</span>
                    {product?.categoryName && <span className="text-slate-400"> · {product.categoryName}</span>}
                  </p>
                </div>

                {/* Pack info chips — form, type, quantity only */}
                {(product?.productForm || product?.packageType || product?.packageQuantity) && (
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
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
                    {product.countryOfOrigin && (
                      <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold px-3 py-1.5 rounded-xl">
                        <Globe className="w-3.5 h-3.5" />Made in {product.countryOfOrigin}
                      </span>
                    )}
                  </div>
                )}

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

                {/* Add to Cart */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {qty > 0 ? (
                    <div className="flex items-center h-13 bg-slate-50 rounded-full border border-slate-150 p-1 shadow-inner gap-1">
                      <Button variant="ghost" onClick={() => addCurrentToCart(-1)}
                        className="h-11 w-11 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                        <Minus className="w-4 h-4 text-slate-600" />
                      </Button>
                      <span className="min-w-[90px] text-center text-xs font-bold text-slate-800">{qty} in cart</span>
                      <Button variant="ghost" onClick={() => addCurrentToCart(1)}
                        className="h-11 w-11 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                        <Plus className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => addCurrentToCart()}
                      className="h-13 px-10 rounded-full font-black text-sm bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-xl shadow-primary/25 uppercase tracking-wider">
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => setIsShareOpen(true)}
                    className="h-12 w-12 rounded-full border-slate-200 hover:bg-slate-50 ml-1">
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
                  <button onClick={() => setIsEditingPincode(!isEditingPincode)}
                    className="text-xs font-black text-primary hover:underline uppercase tracking-wide">
                    {isEditingPincode ? 'Cancel' : 'Change'}
                  </button>
                </div>
                {isEditingPincode && (
                  <div className="flex gap-2">
                    <input type="text" value={activePincode}
                      onChange={e => setActivePincode(e.target.value.replace(/\D/,'').slice(0,6))}
                      placeholder="Enter 6-digit pincode"
                      className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-semibold focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" />
                    <Button onClick={() => { fetchEdd(activePincode); setIsEditingPincode(false); }}
                      className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-black">Check</Button>
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
                    {edd && timeLeft && (
                      <p className="text-[10px] text-slate-500 font-medium px-1">
                        Order within <span className="text-primary font-black">{timeLeft}</span> to get it by {edd}
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

          {/* Generic Comparison */}
          {showComparison && genericAlt && (
            <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Smart Switch · Same Composition</span>
              </div>
              <p className="text-base font-bold text-slate-800 mb-6">
                Switch to Sahi Recommended and save <span className="text-emerald-600 font-black">₹{(currentMrp - altPrice).toFixed(0)} per pack</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
                  <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black px-2.5 py-0.5 uppercase">Current (Branded)</Badge>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{product?.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{product?.marketerName}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-2xl font-black text-slate-700">₹{currentPrice}</span>
                    <span className="text-[10px] text-slate-400 line-through">MRP ₹{currentMrp}</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-emerald-400 relative overflow-hidden space-y-3">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-2xl uppercase">
                    {altSavePct}% cheaper
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black px-2.5 py-0.5 uppercase">Sahi Recommended</Badge>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{genericAlt?.product_name || genericAlt?.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{genericAlt?.taxonomy?.marketer_name || 'Generic'}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-2xl font-black text-emerald-600">₹{altPrice}</span>
                    <Button size="sm" onClick={() => addToCart({ ...genericAlt, id: genericAlt._id || genericAlt.id, price: altPrice, mrp: altMrp })}
                      className="h-9 px-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black">
                      Switch & Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ╔════════════════════════════════════════════════╗
              ║  TABBED INFORMATION PANEL                      ║
              ╚════════════════════════════════════════════════╝ */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Tab Bar */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={cn(
                      "flex-1 min-w-[90px] py-4 px-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex flex-col items-center gap-1.5",
                      activeTab === t.key
                        ? "text-primary border-b-2 border-primary bg-primary/3"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}>
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 sm:p-8">

              {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <div className="space-y-8">

                  {/* Composition — illustrated card */}
                  {(product?.composition || molData?.molecule || molData?.name) && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white">
                      <div className="absolute inset-0 opacity-20">
                        <MoleculeIllustration />
                      </div>
                      {/* hexagon grid overlay */}
                      <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
                        <svg viewBox="0 0 200 200"><defs><pattern id="hexa" x="0" y="0" width="30" height="34" patternUnits="userSpaceOnUse"><polygon points="15,2 28,9 28,26 15,33 2,26 2,9" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="200" height="200" fill="url(#hexa)"/></svg>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <FlaskConical className="w-5 h-5 text-violet-200" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">Active Composition</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black leading-snug mb-2">
                          {product?.composition || molData?.molecule || molData?.name}
                        </p>
                        {(product?.primaryUse || product?.medical_info?.primary_use) && (
                          <p className="text-sm text-violet-200 font-medium mt-2">
                            Primarily used for: <span className="text-white font-semibold">{product.primaryUse || product.medical_info?.primary_use}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Introduction */}
                  {(product?.description || product?.introduction) && (
                    <div>
                      <SectionLabel>About this Medicine</SectionLabel>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {product.description || product.introduction}
                      </p>
                    </div>
                  )}

                  {/* Treatment / Uses */}
                  {(product?.treatment || product?.uses) && (
                    <div>
                      <SectionLabel>Treatment & Uses</SectionLabel>
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
                        <p className="text-sm font-medium text-sky-900 leading-relaxed">
                          {product.treatment || product.uses}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Key Benefits */}
                  {(product?.benefits || product?.medical_info?.benefits) && (
                    <div>
                      <SectionLabel>Key Benefits</SectionLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(product.benefits || product.medical_info?.benefits)
                          .split(/\n|\|/)
                          .filter(Boolean)
                          .map((b: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              </div>
                              <p className="text-xs font-semibold text-emerald-900 leading-snug">{b.trim()}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Side Effects */}
                  {product?.sideEffects && (
                    <div>
                      <SectionLabel>Possible Side Effects</SectionLabel>
                      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
                        <div className="absolute top-3 right-3 opacity-10">
                          <AlertTriangle className="w-16 h-16 text-amber-500" />
                        </div>
                        <div className="flex gap-3 relative z-10">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-amber-900 leading-relaxed">{product.sideEffects}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ HOW TO USE TAB ════════════════════════════════════════ */}
              {activeTab === 'usage' && (
                <div className="space-y-8">
                  {product?.howToUse ? (
                    <div>
                      <SectionLabel>Directions for Use</SectionLabel>
                      <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-6">
                        <div className="absolute top-3 right-3 opacity-10">
                          <Stethoscope className="w-16 h-16 text-sky-500" />
                        </div>
                        <div className="flex gap-3 relative z-10">
                          <Stethoscope className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-sky-900 leading-relaxed">{product.howToUse}</p>
                        </div>
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

                  <div className="space-y-3">
                    <SectionLabel>Common Questions</SectionLabel>
                    <FaqItem
                      q="What should I do if I miss a dose?"
                      a={product?.ifMiss || product?.if_miss || product?.medical_info?.if_miss || "Take the missed dose as soon as you remember. If the next scheduled dose is close, skip the missed dose. Never double-dose."}
                    />
                    <FaqItem q="What happens if I overdose?"
                      a="Seek immediate emergency medical attention if you believe you have taken too much of this medication." />
                    <FaqItem q="Can I stop taking this medicine suddenly?"
                      a="Do not stop the medication without consulting your doctor, as abrupt discontinuation may cause withdrawal symptoms." />
                  </div>
                </div>
              )}

              {/* ══ SAFETY TAB ════════════════════════════════════════════ */}
              {activeTab === 'safety' && (
                <div className="space-y-6">
                  <SectionLabel>Drug & Interaction Warnings</SectionLabel>

                  {(product?.pregnancyInteraction || product?.safety_warnings?.interactions?.pregnancy) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <WarningTile label="Pregnancy"
                        value={product?.pregnancyInteraction || product?.safety_warnings?.interactions?.pregnancy}
                        icon={Baby} color="bg-rose-50 border-rose-100 text-rose-800" />
                      <WarningTile label="Breastfeeding / Lactation"
                        value={product?.lactationInteraction || product?.safety_warnings?.interactions?.lactation}
                        icon={Milk} color="bg-sky-50 border-sky-100 text-sky-800" />
                      <WarningTile label="Driving & Machinery"
                        value={product?.drivingInteraction || product?.safety_warnings?.interactions?.driving}
                        icon={Car} color="bg-amber-50 border-amber-100 text-amber-800" />
                      <WarningTile label="Kidney Function"
                        value={product?.kidneyInteraction || product?.safety_warnings?.interactions?.kidney}
                        icon={ShieldAlert} color="bg-orange-50 border-orange-100 text-orange-800" />
                      <WarningTile label="Liver Function"
                        value={product?.liverInteraction || product?.safety_warnings?.interactions?.liver}
                        icon={AlertTriangle} color="bg-red-50 border-red-100 text-red-800" />
                      <WarningTile label="Alcohol Interaction"
                        value={product?.alcoholInteraction || product?.safety_warnings?.interactions?.alcohol}
                        icon={AlertCircle} color="bg-purple-50 border-purple-100 text-purple-800" />
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-medium">No specific warnings listed. Always consult a doctor.</p>
                    </div>
                  )}

                  {/* Safety Advisory — HTML stripped, rendered cleanly */}
                  {safetyAdviseClean && (
                    <div>
                      <SectionLabel>Safety Advisory</SectionLabel>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                            {safetyAdviseClean}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prescription & Controlled */}
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
                          {product?.prescriptionRequired ? "Prescription required (Rx only)" : "Over-the-counter (OTC)"}
                        </p>
                      </div>
                    </div>
                    {(product?.isControlledSubstance !== undefined || product?.safety_warnings?.is_controlled_substance !== undefined) && (
                      <div className={cn("flex-1 rounded-2xl p-5 flex items-center gap-4 border",
                        (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                          ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                          (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "bg-red-100" : "bg-slate-100")}>
                          <ShieldAlert className={cn("w-5 h-5",
                            (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "text-red-600" : "text-slate-400")} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">Controlled Substance</p>
                          <p className={cn("text-sm font-bold",
                            (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "text-red-700" : "text-slate-500")}>
                            {(product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance)
                              ? "Scheduled / Controlled substance" : "Not a controlled substance"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ PRODUCT INFO TAB ══════════════════════════════════════ */}
              {activeTab === 'info' && (
                <div className="space-y-8">

                  {/* Manufacturer & Classification */}
                  <div>
                    <SectionLabel>Manufacturer & Classification</SectionLabel>
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Marketer Name" value={product?.marketerName || product?.taxonomy?.marketer_name} icon={Building2} accent="bg-primary/10 text-primary" />
                      <InfoRow label="Category" value={product?.categoryName || product?.taxonomy?.category_name} icon={Tag} accent="bg-amber-100 text-amber-600" />
                      <InfoRow label="Sub-Category" value={product?.subCategory || product?.taxonomy?.sub_category} icon={Tag} accent="bg-amber-50 text-amber-500" />
                      <InfoRow label="Medicine Type" value={product?.medicineType || product?.medicine_type} icon={Pill} accent="bg-sky-100 text-sky-600" />
                      <InfoRow label="Salable Status" value={product?.salableStatus || product?.salable_status} icon={ThumbsUp} accent="bg-emerald-100 text-emerald-600" />
                      <InfoRow label="Molecule Code" value={product?.moleculeCode || product?.molecule_code} icon={FlaskConical} accent="bg-violet-100 text-violet-600" />
                    </div>
                  </div>

                  {/* Packaging */}
                  <div>
                    <SectionLabel>Packaging Details</SectionLabel>
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

          {/* ╔════════════════════════════════════════════════╗
              ║  MARKETER / MANUFACTURER CARD (bottom)         ║
              ╚════════════════════════════════════════════════╝ */}
          {(product?.marketerName || product?.taxonomy?.marketer_name) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header strip */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 sm:px-8 py-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Manufactured & Marketed By</p>
                  <p className="text-lg font-black text-white leading-tight">
                    {product?.marketerName || product?.taxonomy?.marketer_name}
                  </p>
                </div>
              </div>
              {/* Details */}
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Marketer ID</p>
                  <p className="text-sm font-bold text-slate-700">{product?.marketerId || product?.taxonomy?.marketer_id || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</p>
                  <p className="text-sm font-bold text-slate-700">{product?.categoryName || product?.taxonomy?.category_name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Country of Origin</p>
                  <p className="text-sm font-bold text-slate-700">{product?.countryOfOrigin || product?.country_of_origin || 'India'}</p>
                </div>
                {(product?.taxonomy?.marketer_address || product?.marketerAddress) && (
                  <div className="sm:col-span-3 pt-4 border-t border-slate-50 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Registered Address</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {product?.taxonomy?.marketer_address || product?.marketerAddress}
                      </p>
                    </div>
                  </div>
                )}
                {/* Disclaimer */}
                <div className="sm:col-span-3 pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <span className="font-black text-slate-500">Disclaimer: </span>
                    The information provided here is for educational purposes only. Always consult your doctor or pharmacist before starting, stopping, or changing any medication. SahiMed sources all products directly from licensed distributors and manufacturers.
                  </p>
                </div>
              </div>
            </div>
          )}

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

      </div>
    </PageTransition>
  );
}
