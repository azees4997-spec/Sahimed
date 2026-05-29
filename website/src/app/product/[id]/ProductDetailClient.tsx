"use client"

import React, { useState, useEffect } from 'react';
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
  Dna,
  AlertTriangle,
  Package,
  ShoppingCart,
  Zap,
  TrendingDown,
  Maximize2,
  Loader2,
  TrendingUp,
  FlaskConical,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  Pencil,
  X
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import {
  scaleInVariant,
  fadeInVariant
} from '@/lib/animations';
import RibbonBadge from '@/components/RibbonBadge';

// --- SUB-COMPONENTS ---

function ExpandableInfoTile({
  icon: Icon,
  title,
  text,
  color,
  iconColor = "text-primary",
  titleColor = "text-slate-800"
}: {
  icon: any,
  title: string,
  text: string,
  color: string,
  iconColor?: string,
  titleColor?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          layout
          className={cn(
            "p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-white space-y-2 sm:space-y-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98] z-10",
            color
          )}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
            <h3 className={cn("text-[10px] sm:text-lg font-black tracking-tighter font-outfit uppercase", titleColor)}>
              {title}
            </h3>
          </div>
          <p className="text-[8px] sm:text-[11px] font-black text-slate-500 leading-tight sm:leading-relaxed uppercase tracking-tight line-clamp-3">
            {text}
          </p>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 border-none shadow-3xl">
        <div className="space-y-6 sm:space-y-8">
           <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[24px] flex items-center justify-center shadow-sm border border-slate-50", color.replace('bg-', 'text-'))}>
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <DialogTitle className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-outfit uppercase">
                {title}
              </DialogTitle>
           </div>
           <div className="bg-slate-50/80 p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-slate-100">
             <DialogDescription className="text-xs sm:text-base font-bold text-slate-600 leading-relaxed uppercase tracking-wide">
               {text}
             </DialogDescription>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InteractionCard({ item }: { item: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] flex flex-col gap-3 sm:gap-5 border border-white shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98] z-10",
            item.color
          )}
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-[12px] sm:rounded-[16px] flex items-center justify-center text-primary shrink-0 shadow-sm border border-slate-50">
            <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <h4 className="text-[7px] sm:text-[9px] font-black tracking-[0.2em] text-slate-500/60 uppercase">{item.title}</h4>
            <p className="text-[9px] sm:text-[11px] font-black text-slate-800 leading-tight uppercase tracking-tight line-clamp-2">
              {item.text || "CONSULT DOCTOR"}
            </p>
          </div>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 border-none shadow-3xl">
        <div className="space-y-6 sm:space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[24px] bg-slate-50 flex items-center justify-center shadow-sm border border-slate-100">
                <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <DialogTitle className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-outfit uppercase">
                {item.title}
              </DialogTitle>
           </div>
           <div className="bg-slate-50/80 p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-slate-100">
             <DialogDescription className="text-xs sm:text-base font-bold text-slate-600 leading-relaxed uppercase tracking-wide">
               {item.text || "NO INFORMATION AVAILABLE FOR THIS INTERACTION. PLEASE CONSULT A REGISTERED MEDICAL PRACTITIONER FOR GUIDANCE."}
             </DialogDescription>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ComparisonCard = ({
  product,
  label,
  isAlt = false,
  getItemQuantity,
  addToCart,
  showComparison,
  brandedMrp
}: {
  product: any,
  label: string,
  isAlt?: boolean,
  getItemQuantity: (id: string) => number,
  addToCart: (p: any) => void,
  showComparison: boolean,
  brandedMrp: number
}) => {
  if (!product) return null;

  const qty = getItemQuantity(product.id || product._id);
  const pPriceRaw = product.liveData?.sahimed_price || product.price || 0;
  const pMrpRaw = product.liveData?.mrp || product.mrp || (Number(pPriceRaw) + 20);

  const pPrice = Number(pPriceRaw) || 0;
  const pMrp = Number(pMrpRaw) || (pPrice + 20);

  let displaySavingsAmt = Math.max(0, pMrp - pPrice);
  let displaySavingsPct = pMrp > 0 ? Math.round((displaySavingsAmt / pMrp) * 100) : 0;

  if (isAlt && showComparison) {
    displaySavingsAmt = Math.max(0, brandedMrp - pPrice);
    displaySavingsPct = brandedMrp > 0 ? Math.round((displaySavingsAmt / brandedMrp) * 100) : 0;
  }

  const unitMatch = String(product.packSize || '').match(/(\d+)/);
  const unitCount = (unitMatch && parseInt(unitMatch[1]) > 0) ? parseInt(unitMatch[1]) : 1;
  const unitPrice = pPrice / unitCount;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : [`https://picsum.photos/seed/${product.id || 'err'}/300/300`]);

  const currentImage = images[currentImageIndex] || images[0];

  return (
    <motion.div variants={scaleInVariant} className="h-full">
      <Card className={cn(
        "h-full rounded-[24px] sm:rounded-[48px] p-3 sm:p-10 flex flex-col justify-between border shadow-sm relative overflow-hidden transition-all duration-700",
        isAlt ? "bg-lavender ring-2 ring-lavender-text/10 border-lavender-text/20" : "bg-white border-slate-100"
      )}>
        <div className="space-y-3 sm:space-y-6">
          <div className="flex items-center justify-between">
            {isAlt ? (
              <div className="bg-white border border-lavender-text/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                 <Package className="w-3.5 h-3.5 text-lavender-text" />
                 <span className="text-[9px] font-black text-lavender-text tracking-widest uppercase">SUBSTITUTE</span>
              </div>
            ) : (
              <Badge className="rounded-full font-black text-[7px] sm:text-[9px] px-2 py-0.5 uppercase tracking-widest bg-slate-100 text-slate-400 border-none">{label}</Badge>
            )}
            <RibbonBadge
              savingsPct={displaySavingsPct}
              variant={isAlt ? 'accent' : 'primary'}
              className="right-2 sm:right-6"
              size="sm"
            />
          </div>

          <div className="space-y-3">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-[3/2] w-full bg-white rounded-[20px] sm:rounded-[32px] flex items-center justify-center overflow-hidden border border-slate-50 shadow-inner group/img cursor-zoom-in">
                  <Image src={currentImage} alt={product.name} fill className="object-contain p-2 sm:p-4 transition-transform duration-700 group-hover/img:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-primary opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl border-none p-0 bg-transparent shadow-none">
                <DialogTitle className="sr-only">{product.name}</DialogTitle>
                <DialogDescription className="sr-only">Visual representation of {product.name}</DialogDescription>
                <div className="relative aspect-square w-full bg-white rounded-[40px] overflow-hidden p-8 flex items-center justify-center shadow-3xl border border-white/20">
                  <Image src={currentImage} alt={product.name} fill className="object-contain p-10" />
                </div>
              </DialogContent>
            </Dialog>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "relative w-10 h-10 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white",
                      currentImageIndex === idx ? "border-primary shadow-md scale-105" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <Image src={img} alt={`Preview ${idx + 1}`} fill className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <h3 className="font-extrabold text-[10px] sm:text-lg text-slate-800 leading-tight line-clamp-2 min-h-[1.6rem] sm:min-h-[2.4rem] font-outfit uppercase">
              {product.name}
            </h3>
            <p className="text-[7px] sm:text-[10px] font-black text-slate-500 tracking-widest uppercase">
              {product.packSize || "N/A"}
            </p>
            <p className="text-[7px] sm:text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">
              {product.manufacturer}
            </p>

            <div className="pt-1.5 sm:pt-3 border-t border-dashed mt-1.5 sm:mt-3 space-y-0.5">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <p className="text-lg sm:text-4xl font-black tracking-tighter text-primary font-outfit">
                  ₹{Number(pPrice).toFixed(0)}
                </p>
                {pMrp > pPrice && (
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-sm text-slate-400 line-through font-bold opacity-80 decoration-1">₹{Number(pMrp).toFixed(0)}</span>
                    <span className="text-[7px] sm:text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-1 py-0.5 rounded-md">SAVE ₹{Number(pMrp - pPrice).toFixed(0)}</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] font-bold text-slate-350 tracking-tight uppercase">
                ₹{unitPrice.toFixed(2)} / unit
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-4">
          {((Number(product.availableQuantity) <= 0 && (!product.liveData || Number(product.liveData.stock_quantity) <= 0))) ? (
            <Button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch('/api/inventory/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      productId: product.id || product._id,
                      platform: 'web',
                      pincode: localStorage.getItem('activePincode') || 'Unknown'
                    })
                  });
                  if (res.ok) {
                    toast({ title: "Notification Set", description: "We'll alert you when this is back!" });
                  }
                } catch (e) {
                  toast({ variant: 'destructive', title: "Error", description: "Failed to set alert." });
                }
              }}
              className="w-full h-8 sm:h-14 bg-[#FFF1F2] text-[#E11D48] font-black text-[8px] sm:text-[12px] tracking-widest uppercase rounded-full flex items-center justify-center gap-1 border border-[#FFE4E6] hover:bg-[#FFE4E6] transition-all active:scale-95 shadow-md shadow-[#E11D48]/5"
            >
              NOTIFY ME
            </Button>
          ) : (
            <Button
              onClick={() => addToCart({ ...product, id: product._id || product.id, price: pPrice, mrp: pMrp })}
              className={cn(
                "w-full h-8 sm:h-14 rounded-full font-black text-[8px] sm:text-[12px] tracking-[0.1em] sm:tracking-[0.15em] uppercase gap-1.5 sm:gap-2 shadow-md sm:shadow-lg active:scale-[0.98] transition-all border-none",
                isAlt ? "bg-sahi-green-text text-white hover:bg-sahi-green-text/90" : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {qty > 0 ? `IN CART (${qty})` : "ADD TO CART"} <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

// --- MAIN COMPONENT ---

export default function ProductDetailClient({ initialProduct, id }: { initialProduct: any, id: string }) {
  const { toast } = useToast();
  const { user } = useUser();
  const db_fs = useFirestore();
  const { addToCart, getItemQuantity } = useCart();
  const [edd, setEdd] = useState<string>('');
  const [activePincode, setActivePincode] = useState<string>('560068');
  const [zone, setZone] = useState<string>('');
  const [isServiceable, setIsServiceable] = useState<boolean | null>(true);

  useEffect(() => {
    const loadPincode = async () => {
      // 1. Try local storage first
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('activePincode')) : null;
      
      if (stored && stored.length === 6) {
        setActivePincode(stored);
        fetchEdd(stored);
        return;
      }

      // 2. Try logged in user profile
      if (user) {
        try {
          const profileRef = doc(db_fs, 'userProfiles', user.uid);
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.pincode && data.pincode.length === 6) {
              setActivePincode(data.pincode);
              localStorage.setItem('activePincode', data.pincode);
              fetchEdd(data.pincode);
              return;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch user profile pincode", e);
        }
      }

      // 3. Fallback to default
      setActivePincode('560068');
      fetchEdd('560068');
    };

    loadPincode();
  }, [user, db_fs]);

  const fetchEdd = async (pin: string) => {
    if (!pin || pin.length !== 6) return;
    
    try {
      const res = await fetch('/api/logistics/shipway/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toPincode: pin })
      });
      
      const data = await res.json();
      
      if (data.edd) {
        // Parse date string (YYYY-MM-DD) carefully to avoid timezone shifts
        const parts = data.edd.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const formattedDate = `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
        const dayName = days[date.getDay()];
        
        setEdd(`${formattedDate} ${dayName}`);
        setZone(data.zone || 'India');
        setIsServiceable(true);
      } else {
        setEdd('');
        setZone('');
        setIsServiceable(false);
        if (data.error) {
          toast({
            variant: 'destructive',
            title: "Serviceability Check",
            description: "This area might not be serviceable currently."
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch EDD", e);
      setIsServiceable(false);
      toast({
        variant: 'destructive',
        title: "Connection Error",
        description: "Failed to reach delivery servers."
      });
    }
  };

  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

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
    if (val.length === 6) {
      localStorage.setItem('activePincode', val);
    }
  };

  const onCheckPincode = () => {
    if (activePincode.length === 6) {
      fetchEdd(activePincode);
      setIsEditingPincode(false);
    } else {
      toast({
        variant: 'destructive',
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode."
      });
    }
  };

  const { data: productData, isLoading: productLoading } = useMongoDBDoc(id);
  const product = productData || initialProduct;
  const { data: molData } = useMongoDBMolecule(product?.moleculeId);

  const isGeneric = product?.isGeneric === true || product?.isGeneric === "true";
  const isBranded = !isGeneric;

  const { data: genericAlternatives } = useMongoDBCollection({
    moleculeId: isBranded ? product?.moleculeId : undefined,
    isGeneric: true,
    limit: 10
  });

  const genericAlt = isBranded ? genericAlternatives?.find((a: any) =>
    (a.isGeneric === true || a.isGeneric === "true") &&
    String(a.id || a._id) !== String(product?.id || product?._id)
  ) : null;

  const hasGenericAlt = !!genericAlt;
  const showComparison = isBranded && hasGenericAlt;

  const brandedItem = product;
  const genericItem = genericAlt;

  const pPriceRaw = product?.liveData?.sahimed_price || product?.price || 0;
  const pMrpRaw = product?.liveData?.mrp || product?.mrp || (Number(pPriceRaw) + 20);

  const brandedPrice = Number(pPriceRaw) || 0;
  const brandedMrp = Number(pMrpRaw) || (brandedPrice + 20);

  const genPriceRaw = genericAlt ? (genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const genericPrice = Number(genPriceRaw) || 0;

  const switchSavingsAmt = Math.max(0, brandedMrp - genericPrice);

  if (!product && productLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="space-y-8">
            <Skeleton className="h-[300px] rounded-[40px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-[200px] rounded-[32px]" />
              <Skeleton className="h-[200px] rounded-[32px]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] pb-32">
        <Navbar />
        <main className="max-w-[1000px] mx-auto px-2 sm:px-10 py-1 sm:py-6" key={id}>

          <div className="flex flex-row items-center justify-center mb-1 sm:mb-4 gap-4 px-2">
            {(product?.prescriptionRequired || product?.rxRequired) && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Badge className="bg-rose-500 text-white border-none rounded-full font-black text-[7px] sm:text-[9px] px-2 py-0.5 sm:py-1 tracking-widest shadow-lg shadow-rose-500/20 uppercase shrink-0">
                  RX REQUIRED
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center mb-2 sm:mb-6 text-center px-2">
            <motion.div
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex flex-col items-center gap-0.5 sm:gap-1"
            >
              <h2 className="text-[8px] sm:text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-0">Salt Composition</h2>
              <span className="text-xs md:text-xl font-black text-slate-900 tracking-tighter font-outfit uppercase leading-tight max-w-2xl px-2 line-clamp-1">
                {molData?.molecule || molData?.name || product?.saltComposition || product?.composition || product?.salt || product?.molecule || "Information coming soon"}
              </span>
            </motion.div>
          </div>

          {showComparison && switchSavingsAmt > 0 && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: -5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="mb-2 sm:mb-6 px-2"
            >
              <div className="bg-gradient-to-r from-primary to-accent text-white py-1.5 sm:py-2.5 px-4 sm:px-8 rounded-[12px] sm:rounded-[20px] shadow-lg flex items-center justify-center gap-2 text-center">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
                <h2 className="text-[8px] sm:text-[11px] font-black tracking-widest uppercase line-clamp-1">
                  Switch and save ₹{Number(switchSavingsAmt).toFixed(0)} • Same Medicine
                </h2>
              </div>
            </motion.div>
          )}

          <div className="mb-8 sm:mb-16 px-1 relative">
            {showComparison ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-12 items-stretch relative">
                {/* Removed 100% match floating badge */}

                <ComparisonCard
                  product={brandedItem}
                  label="BRANDED VERSION"
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
                <ComparisonCard
                  product={genericItem}
                  label="SAHI RECOMMENDED"
                  isAlt
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-full sm:w-[480px]">
                  <ComparisonCard
                    product={product}
                    label={isBranded ? "Branded" : "Generic Solution"}
                    getItemQuantity={getItemQuantity}
                    addToCart={addToCart}
                    showComparison={showComparison}
                    brandedMrp={brandedMrp}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delivery Information & Pincode Checker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-10 px-1"
          >
            <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm space-y-4">
              
              {/* Delivering To Panel */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/8 text-primary rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 tracking-[0.12em] uppercase leading-none mb-1">
                      DELIVERING TO
                    </h4>
                    <p className="text-base font-black text-slate-900 font-outfit uppercase leading-none">
                      {activePincode}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsEditingPincode(!isEditingPincode)}
                  className="text-primary font-black text-xs uppercase tracking-widest px-4 py-2 hover:bg-primary/5 rounded-full transition-all"
                >
                  {isEditingPincode ? "CANCEL" : "CHANGE"}
                </button>
              </div>

              {/* Inline Edit Input Field */}
              {isEditingPincode && (
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-[16px] animate-in fade-in duration-200">
                  <input
                    type="text"
                    maxLength={6}
                    value={activePincode}
                    onChange={handlePincodeChange}
                    placeholder="Enter 6-digit Pincode"
                    className="bg-transparent border-none outline-none text-sm font-bold tracking-[0.1em] px-3 py-1 flex-1 text-slate-800 placeholder:text-slate-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onCheckPincode();
                      }
                    }}
                  />
                  <button
                    onClick={onCheckPincode}
                    className="w-8 h-8 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center transition-all active:scale-95 shadow-md shadow-primary/10 shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-100/80 my-1" />

              {/* Serviceability Status Banner */}
              {isServiceable ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-100/50 rounded-[20px] p-4 flex items-center gap-3 shadow-sm w-full">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-emerald-50">
                      <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-emerald-900 tracking-tight uppercase font-outfit mb-0.5">
                        {edd ? `DELIVERY BY ${edd}` : "CHECK SERVICEABILITY"}
                      </h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-emerald-700/70 uppercase tracking-widest leading-none">
                        {edd ? (zone ? `EXPRESS SHIPPING TO ${zone.toUpperCase()}` : "Guaranteed express shipping") : "Enter pincode to see delivery date"}
                      </p>
                    </div>
                  </div>

                  {edd && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-inner">
                          <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          FREE DELIVERY BY <span className="text-emerald-600 font-black">{edd}</span> IF YOU ORDER WITHIN <span className="text-emerald-600 font-black tabular-nums">{timeLeft}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 rounded-[20px] p-4 flex items-center gap-3 shadow-sm w-full animate-in shake duration-300">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-rose-50">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-rose-900 tracking-tight uppercase font-outfit mb-0.5">
                      NOT SERVICEABLE
                    </h3>
                    <p className="text-[9px] sm:text-[10px] font-bold text-rose-700/70 uppercase tracking-widest leading-none">
                      DELIVERY IS NOT AVAILABLE TO THIS PINCODE
                    </p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[24px] sm:rounded-[48px] p-4 sm:p-12 shadow-sm border border-slate-100 overflow-hidden relative z-10"
          >
            <Tabs defaultValue="medical" className="w-full">
              <TabsList className="bg-slate-50 p-1 rounded-full h-10 sm:h-14 w-full max-w-[500px] flex mx-auto mb-8 border border-slate-100 shadow-inner">
                <TabsTrigger value="medical" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Information</TabsTrigger>
                <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Safety Advice</TabsTrigger>
                <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Interactions</TabsTrigger>
              </TabsList>

              <TabsContent value="medical" className="space-y-10 focus-visible:outline-none">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-8">
                  <ExpandableInfoTile
                    icon={ClipboardList}
                    title="Medical Uses"
                    text={product?.treatment || "Standard medical use."}
                    color="bg-lavender"
                  />
                  <ExpandableInfoTile
                    icon={Info}
                    title="Product Info"
                    text={product?.description || "Medicine details."}
                    color="bg-sahi-blue"
                  />
                </div>
              </TabsContent>

              <TabsContent value="safety" className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-8 focus-visible:outline-none">
                <ExpandableInfoTile
                  icon={AlertTriangle}
                  title="Safety Advice"
                  text={product?.safetyAdvice || "Follow medical guidance."}
                  color="bg-sahi-pink"
                  iconColor="text-rose-500"
                  titleColor="text-rose-600"
                />
                <ExpandableInfoTile
                  icon={Stethoscope}
                  title="How to Use"
                  text={product?.howToUse || "Take as directed by your doctor."}
                  color="bg-sahi-blue"
                />
              </TabsContent>

              <TabsContent value="interactions" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 focus-visible:outline-none">
                {[
                  { icon: FlaskConical, title: "Composition", text: product?.saltComposition, color: "bg-lavender" },
                  { icon: Baby, title: "Pregnancy", text: product?.pregnancyInteraction, color: "bg-sahi-pink" },
                  { icon: Milk, title: "Lactation", text: product?.lactationInteraction, color: "bg-sahi-blue" },
                  { icon: Car, title: "Driving", text: product?.drivingInteraction, color: "bg-sahi-green" },
                  { icon: Package, title: "Renal", text: product?.kidneyInteraction, color: "bg-lavender" },
                  { icon: ShieldAlert, title: "Hepatic", text: product?.liverInteraction, color: "bg-slate-50" }
                ].map((item, i) => (
                  <InteractionCard key={i} item={item} />
                ))}
              </TabsContent>
            </Tabs>
          </motion.section>
        </main>
      </div>
    </PageTransition>
  );
}
