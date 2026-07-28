"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import {
  Info,
  Baby,
  Milk,
  Car,
  ShieldAlert,
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  Package,
  ShoppingCart,
  Minus,
  Plus,
  TrendingDown,
  Maximize2,
  Loader2,
  MapPin,
  Clock,
  ArrowRight,
  Share2,
  Send,
  Copy,
  ChevronDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useMongoDBDoc, useMongoDBMolecule, useMongoDBCollection } from '@/hooks/use-mongodb';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProductDetailClient({ initialProduct, id }: { initialProduct: any, id: string }) {
  const { toast } = useToast();
  const { user } = useUser();
  const db_fs = useFirestore();
  const { addToCart, getItemQuantity } = useCart();
  
  const [edd, setEdd] = useState<string>('');
  const [activePincode, setActivePincode] = useState<string>('560068');
  const [zone, setZone] = useState<string>('');
  const [isServiceable, setIsServiceable] = useState<boolean | null>(true);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: productData, isLoading: productLoading } = useMongoDBDoc(id);
  const product = productData || initialProduct;
  const { data: molData } = useMongoDBMolecule(product?.moleculeId);

  // Sync Pincode
  useEffect(() => {
    const loadPincode = async () => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('activePincode') : null;
      if (stored && stored.length === 6) {
        setActivePincode(stored);
        fetchEdd(stored);
        return;
      }
      if (user) {
        try {
          const snap = await getDoc(doc(db_fs, 'userProfiles', user.uid));
          if (snap.exists()) {
            const val = snap.data().pincode;
            if (val && val.length === 6) {
              setActivePincode(val);
              localStorage.setItem('activePincode', val);
              fetchEdd(val);
              return;
            }
          }
        } catch (e) {}
      }
      setActivePincode('560068');
      fetchEdd('560068');
    };
    loadPincode();
  }, [user, db_fs]);

  // EDD Logistics
  const fetchEdd = async (pin: string) => {
    try {
      const res = await fetch('/api/logistics/shipway/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toPincode: pin })
      });
      const data = await res.json();
      if (data.edd) {
        const parts = data.edd.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const formatted = `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
        setEdd(`${formatted}`);
        setZone(data.zone || 'India');
        setIsServiceable(true);
      } else {
        setIsServiceable(false);
      }
    } catch (e) {
      setIsServiceable(false);
    }
  };

  // Express Shipping Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(14, 0, 0, 0);
      let diff = cutoff.getTime() - now.getTime();
      if (diff < 0) {
        cutoff.setDate(cutoff.getDate() + 1);
        diff = cutoff.getTime() - now.getTime();
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setActivePincode(val);
    if (val.length === 6) localStorage.setItem('activePincode', val);
  };

  const onCheckPincode = () => {
    if (activePincode.length === 6) {
      fetchEdd(activePincode);
      setIsEditingPincode(false);
    }
  };

  // Alternative Comparison Setup
  const isGeneric = product?.isGeneric === true || product?.isGeneric === "true";
  const { data: genericAlternatives } = useMongoDBCollection({
    moleculeId: !isGeneric ? product?.moleculeId : undefined,
    isGeneric: true,
    limit: 10
  });

  const genericAlt = !isGeneric ? genericAlternatives?.find((a: any) =>
    (a.isGeneric === true || a.isGeneric === "true") && String(a._id || a.id) !== String(product?._id || product?.id)
  ) : null;

  const showComparison = !isGeneric && !!genericAlt;

  // Price points
  const currentPrice = Number(product?.liveData?.sahimed_price || product?.price || 0);
  const currentMrp = Number(product?.liveData?.mrp || product?.mrp || (currentPrice + 20));
  const altPrice = genericAlt ? Number(genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const altMrp = genericAlt ? Number(genericAlt.liveData?.mrp || genericAlt.mrp || (altPrice + 20)) : 0;

  const savingsPct = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const compareSavingsPct = currentMrp > 0 && altPrice > 0 ? Math.round(((currentMrp - altPrice) / currentMrp) * 100) : 0;

  const images = product?.images && product.images.length > 0 ? product.images : ['/images/medicine_placeholder.png'];
  const qty = getItemQuantity(product?._id || product?.id);

  if (productLoading && !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pb-24 font-outfit">
        <Navbar />

        <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-8">
          
          {/* SEO Breadcrumbs */}
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/medicines" className="hover:text-primary transition-colors">Medicines</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">{product?.product_name || product?.name}</span>
          </div>

          {/* Main Hero Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Images Swiper & Badges */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="relative aspect-square w-full rounded-2xl bg-[#F8FAFC] flex items-center justify-center overflow-hidden border border-slate-50">
                <Image 
                  src={images[currentImageIndex] || '/images/medicine_placeholder.png'} 
                  alt={product?.name || 'product'} 
                  fill 
                  className="object-contain p-8"
                  priority
                />
                
                {savingsPct > 0 && (
                  <span className="absolute top-4 left-4 bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg">
                    {savingsPct}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "relative w-16 h-16 rounded-xl border-2 overflow-hidden bg-white p-1 shrink-0 transition-all",
                        idx === currentImageIndex ? "border-primary" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <Image src={img} alt="thumb" fill className="object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Middle & Right: Product Info & Dynamic Action Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Product Info Block */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {product?.prescriptionRequired && (
                      <Badge className="bg-rose-500 text-white border-none rounded-md font-black text-[9px] px-2.5 py-1 tracking-widest uppercase">
                        Rx Required
                      </Badge>
                    )}
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      {product?.medicine_type || 'Ethical'}
                    </span>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight pt-1">
                    {product?.product_name || product?.name}
                  </h1>

                  <p className="text-xs font-bold text-slate-400 uppercase">
                    By <span className="text-primary underline cursor-pointer">{product?.taxonomy?.marketer_name || product?.manufacturer || 'Unknown Manufacturer'}</span>
                  </p>
                </div>

                <div className="border-t border-slate-50 my-2" />

                {/* Pricing Block */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900 font-outfit">₹{currentPrice}</span>
                  {currentMrp > currentPrice && (
                    <>
                      <span className="text-sm font-bold text-slate-400 line-through">MRP ₹{currentMrp}</span>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                        SAVE ₹{Math.max(0, currentMrp - currentPrice).toFixed(1)}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">
                  Pack Size: {product?.packaging_detail || product?.packSize || '10 tablets'}
                </p>

                {/* ATC Action */}
                <div className="pt-2">
                  {qty > 0 ? (
                    <div className="flex items-center gap-2 w-full max-w-[280px] h-12 bg-slate-50 rounded-full border border-slate-150 p-1 shadow-inner">
                      <Button
                        variant="ghost"
                        onClick={() => addToCart({ ...product, id: product?._id || product?.id, price: currentPrice, mrp: currentMrp }, -1)}
                        className="h-full flex-1 rounded-full flex items-center justify-center bg-white hover:bg-slate-100 text-slate-800 shadow-sm border border-slate-100"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </Button>
                      <span className="text-xs font-black text-slate-800 flex-[1.5] text-center">
                        {qty} IN CART
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => addToCart({ ...product, id: product?._id || product?.id, price: currentPrice, mrp: currentMrp }, 1)}
                        className="h-full flex-1 rounded-full flex items-center justify-center bg-white hover:bg-slate-100 text-slate-800 shadow-sm border border-slate-100"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart({ ...product, id: product?._id || product?.id, price: currentPrice, mrp: currentMrp })}
                      className="w-full max-w-[280px] h-12 rounded-full font-black text-xs tracking-widest bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10 uppercase"
                    >
                      Add to Cart <ShoppingCart className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>

              </div>

              {/* Delivery Serviceability Block */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 tracking-wider uppercase mb-0.5">Delivering to</h4>
                      <p className="text-sm font-black text-slate-900 tracking-widest">{activePincode}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingPincode(!isEditingPincode)}
                    className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    {isEditingPincode ? "Cancel" : "Change"}
                  </button>
                </div>

                {isEditingPincode && (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                    <input 
                      type="text" 
                      value={activePincode}
                      onChange={handlePincodeChange}
                      placeholder="Enter 6-digit Pincode"
                      className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white outline-none"
                    />
                    <Button onClick={onCheckPincode} className="h-10 px-4 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold uppercase">
                      Check
                    </Button>
                  </div>
                )}

                {isServiceable ? (
                  <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/30">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      {edd ? `Express delivery by ${edd}` : 'Available in your area'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/30">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Delivery unavailable to this pincode</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Sahi Comparison Alternative Options (Brand comparison layout) */}
          {showComparison && genericAlt && (
            <div className="bg-gradient-to-br from-emerald-55 to-emerald-100/20 border border-emerald-500/20 rounded-[32px] p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <span className="bg-emerald-500 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                    Smart savings match
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight pt-1">
                    Save {compareSavingsPct}% with Sahi Recommended Solution
                  </h3>
                </div>
                
                <div className="bg-white border border-emerald-500/20 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-black text-emerald-600 uppercase">Save ₹{Math.max(0, currentMrp - altPrice).toFixed(0)} per pack</span>
                </div>
              </div>

              {/* Grid split cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Current Branded View */}
                <Card className="rounded-3xl p-5 border border-slate-100 bg-white space-y-4">
                  <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100/80 border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                    Currently Viewing (Branded)
                  </Badge>
                  <div>
                    <h4 className="text-sm font-black text-slate-850 uppercase">{product?.product_name || product?.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase pt-0.5">{product?.taxonomy?.marketer_name}</p>
                  </div>
                  <div className="border-t border-slate-50" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-800">₹{currentPrice}</span>
                    <span className="text-xs font-bold text-slate-400">MRP ₹{currentMrp}</span>
                  </div>
                </Card>

                {/* Generic Recommended View */}
                <Card className="rounded-3xl p-5 border-2 border-emerald-500 bg-white shadow-lg space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] px-3 py-1.5 rounded-bl-2xl uppercase">
                    {compareSavingsPct}% cheaper
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                    Sahi Recommended (Generic)
                  </Badge>
                  <div>
                    <h4 className="text-sm font-black text-slate-850 uppercase">{genericAlt?.product_name || genericAlt?.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase pt-0.5">{genericAlt?.taxonomy?.marketer_name || 'Generic Alternative'}</p>
                  </div>
                  <div className="border-t border-slate-50" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-600">₹{altPrice}</span>
                      {altMrp > altPrice && <span className="text-xs font-bold text-slate-450 line-through">MRP ₹{altMrp}</span>}
                    </div>
                    
                    <Button
                      onClick={() => addToCart({ ...genericAlt, id: genericAlt._id || genericAlt.id, price: altPrice, mrp: altMrp })}
                      className="h-10 px-5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-black uppercase tracking-wider active:scale-95"
                    >
                      Add match
                    </Button>
                  </div>
                </Card>

              </div>

            </div>
          )}

          {/* Full Information, safety, FAQ layout */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-10">
            
            <div className="border-b border-slate-100 pb-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Medical & Safety Guide</h3>
            </div>

            {/* Overview */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-primary tracking-widest">Introduction & Uses</h4>
              <p className="text-sm font-medium text-slate-650 leading-relaxed uppercase tracking-tight">
                {product?.description || product?.introduction || "No detailed medical overview is listed for this item yet."}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-primary tracking-widest">Specifications & Composition</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-black uppercase">Active Salt Molecule</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 uppercase leading-normal">
                    {molData?.molecule || molData?.name || product?.saltComposition || product?.composition || "Information coming soon"}
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-xs font-black uppercase">Directions for usage</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 uppercase leading-normal">
                    {product?.howToUse || "Follow exact instructions provided by your medical practitioner."}
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-black uppercase">Storage instructions</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 uppercase leading-normal">
                    {product?.storage_instructions || "Store in cool dry place away from moisture and direct sunlight."}
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-black uppercase">Country of origin</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 uppercase leading-normal">
                    {product?.country_of_origin || "India"}
                  </p>
                </div>

              </div>
            </div>

            {/* Warnings Cards */}
            {product?.safety_warnings && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-primary tracking-widest">Warnings & Precautions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.safety_warnings.pregnancy && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
                      <Baby className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-black text-slate-800 uppercase mb-0.5">Pregnancy Warnings</h5>
                        <p className="text-[9px] font-bold text-slate-550 uppercase leading-relaxed">{product.safety_warnings.pregnancy}</p>
                      </div>
                    </div>
                  )}
                  {product.safety_warnings.lactation && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
                      <Milk className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-black text-slate-800 uppercase mb-0.5">Lactation Warnings</h5>
                        <p className="text-[9px] font-bold text-slate-550 uppercase leading-relaxed">{product.safety_warnings.lactation}</p>
                      </div>
                    </div>
                  )}
                  {product.safety_warnings.driving && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
                      <Car className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-black text-slate-800 uppercase mb-0.5">Driving Precautions</h5>
                        <p className="text-[9px] font-bold text-slate-550 uppercase leading-relaxed">{product.safety_warnings.driving}</p>
                      </div>
                    </div>
                  )}
                  {product.safety_warnings.kidney && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-black text-slate-800 uppercase mb-0.5">Kidney Interaction</h5>
                        <p className="text-[9px] font-bold text-slate-550 uppercase leading-relaxed">{product.safety_warnings.kidney}</p>
                      </div>
                    </div>
                  )}
                  {product.safety_warnings.liver && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-black text-slate-800 uppercase mb-0.5">Liver Interaction</h5>
                        <p className="text-[9px] font-bold text-slate-550 uppercase leading-relaxed">{product.safety_warnings.liver}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collapsible FAQ Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-primary tracking-widest">Frequently Asked Questions</h4>
              <div className="space-y-3">
                <details className="group border border-slate-100 rounded-2xl bg-slate-50/40 p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between font-black text-xs text-slate-700 uppercase">
                    <span>What if I miss a dose of this medication?</span>
                    <span className="transition-transform group-open:rotate-180"><ChevronDown className="w-4 h-4" /></span>
                  </summary>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 leading-relaxed">
                    {product?.if_miss || "Take it as soon as you remember, unless it is close to your next scheduled dose."}
                  </p>
                </details>
                <details className="group border border-slate-100 rounded-2xl bg-slate-50/40 p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between font-black text-xs text-slate-700 uppercase">
                    <span>Can I combine this with alcohol?</span>
                    <span className="transition-transform group-open:rotate-180"><ChevronDown className="w-4 h-4" /></span>
                  </summary>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 leading-relaxed">
                    {product?.safety_warnings?.alcohol || "Combining this medication with alcohol may trigger adverse side effects. Always consult a healthcare professional first."}
                  </p>
                </details>
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
}
