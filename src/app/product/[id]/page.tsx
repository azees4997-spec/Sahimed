
"use client"

import React, { use, useState, useEffect } from 'react';
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
  Maximize2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogTitle
} from "@/components/ui/dialog";
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where, limit, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, getItemQuantity } = useCart();

  // 1. Fetch Static Clinical Profile
  const productRef = useMemoFirebase(() => (!db || !id) ? null : doc(db, 'medicines', id), [db, id]);
  const { data: staticProduct, isLoading: productLoading } = useDoc(productRef);

  // 2. Dynamic Price/Stock Sync for Branded
  const [liveData, setLiveData] = useState<{ mrp: number, price: number, stock: number } | null>(null);

  useEffect(() => {
    const sku = staticProduct?.sku || staticProduct?.id;
    if (db && sku) {
      const liveRef = doc(db, 'product_live_data', sku);
      const unsubscribe = onSnapshot(liveRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ 
            mrp: Number(d.mrp) || 0, 
            price: Number(d.sahimed_price) || 0, 
            stock: Number(d.stock_quantity) ?? 0 
          });
        }
      });
      return () => unsubscribe();
    }
  }, [db, staticProduct?.sku, staticProduct?.id]);

  // 3. Clinical Molecule Metadata
  const molRef = useMemoFirebase(() => (!db || !staticProduct?.moleculeId) ? null : doc(db, 'moleculeMaster', staticProduct.moleculeId), [db, staticProduct?.moleculeId]);
  const { data: molData } = useDoc(molRef);

  // 4. Alternatives Logic (Generic Selection)
  const alternativesQuery = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId || staticProduct?.isGeneric) return null;
    return query(collection(db, 'medicines'), where('moleculeId', '==', staticProduct.moleculeId), where('isGeneric', '==', true), limit(1));
  }, [db, staticProduct?.moleculeId, staticProduct?.isGeneric]);
  
  const { data: genericAlternatives } = useCollection(alternativesQuery);
  const genericAlt = genericAlternatives?.[0];

  // 5. Dynamic Price/Stock Sync for Generic Card
  const [altLiveData, setAltLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);

  useEffect(() => {
    const altSku = genericAlt?.sku || genericAlt?.id;
    if (db && altSku) {
      const liveRef = doc(db, 'product_live_data', altSku);
      const unsubscribe = onSnapshot(liveRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setAltLiveData({ 
            price: Number(d.sahimed_price) || 0, 
            mrp: Number(d.mrp) || 0, 
            stock: Number(d.stock_quantity) ?? 0 
          });
        }
      });
      return () => unsubscribe();
    }
  }, [db, genericAlt?.sku, genericAlt?.id]);

  if (productLoading || !staticProduct) {
    return (<div className="min-h-screen bg-[#F8F8F8]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[40px]" /></main></div>);
  }

  // --- PDP VIEW MODES ---
  const isBranded = !staticProduct.isGeneric;
  const hasGenericAlt = !!genericAlt;
  const showComparison = isBranded && hasGenericAlt;

  // Recalibrated Savings Base: Use Branded MRP as the global benchmark
  const brandedMrp = (liveData?.mrp && liveData.mrp > 0) ? liveData.mrp : (staticProduct.mrp || staticProduct.price + 50);
  const genericPrice = (altLiveData?.price && altLiveData.price > 0) ? altLiveData.price : (genericAlt?.price || 0);
  
  const switchSavingsAmt = Math.max(0, brandedMrp - genericPrice);
  const switchSavingsPct = brandedMrp > 0 ? Math.round((switchSavingsAmt / brandedMrp) * 100) : 0;

  const ComparisonCard = ({ product, live, label, isAlt = false }: { product: any, live: any, label: string, isAlt?: boolean }) => {
    const qty = getItemQuantity(product.id);
    
    // Tiered Recovery Logic: Instant Static, Async Live
    const pPrice = (live?.price && live.price > 0) ? live.price : product.price;
    const pMrp = (live?.mrp && live.mrp > 0) ? live.mrp : (product.mrp || product.price + 50);
    
    // DYNAMIC SAVINGS CALCULATION
    // If it's the Generic card in a comparison, show savings relative to the Branded MRP
    let displaySavingsAmt = Math.max(0, pMrp - pPrice);
    let displaySavingsPct = pMrp > 0 ? Math.round((displaySavingsAmt / pMrp) * 100) : 0;

    if (isAlt && showComparison) {
      displaySavingsAmt = Math.max(0, brandedMrp - pPrice);
      displaySavingsPct = brandedMrp > 0 ? Math.round((displaySavingsAmt / brandedMrp) * 100) : 0;
    }

    // Unit Price Parsing from pack size string (e.g., "Strip of 10")
    const unitMatch = product.packSize?.match(/(\d+)/);
    const unitCount = (unitMatch && parseInt(unitMatch[1]) > 0) ? parseInt(unitMatch[1]) : 1;
    const unitPrice = pPrice / unitCount;

    const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
      ? product.imageUrl
      : `https://picsum.photos/seed/${product.id}/300/300`;

    return (
      <Card className={cn(
        "rounded-[20px] sm:rounded-[32px] p-2.5 sm:p-6 flex flex-col h-full border shadow-sm transition-all overflow-hidden relative",
        isAlt ? "bg-accent/5 border-dashed border-accent/20" : "bg-white border-gray-100",
        !showComparison && "max-w-md mx-auto w-full"
      )}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest block">{label}</span>
          {displaySavingsPct > 0 && (
            <Badge className="bg-accent text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
              SAVE {displaySavingsPct}%
            </Badge>
          )}
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative aspect-square w-full max-h-[120px] sm:max-h-none bg-white rounded-xl mb-2 overflow-hidden border border-gray-50 flex items-center justify-center p-2 cursor-zoom-in group/img">
              <Image src={safeImageUrl} alt={product.name} fill sizes="(max-width: 768px) 45vw, 30vw" className="object-contain p-1 transition-transform group-hover/img:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center">
                 <Maximize2 className="w-4 h-4 text-primary opacity-0 group-hover/img:opacity-100 transition-opacity" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl border-none p-0 bg-transparent shadow-none">
            <DialogTitle className="sr-only">{product.name}</DialogTitle>
            <div className="relative aspect-square w-full bg-white rounded-[40px] overflow-hidden p-8 flex items-center justify-center shadow-3xl">
               <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-10" />
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-100 shadow-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-black text-[10px] uppercase tracking-widest text-gray-900">{product.name}</span>
               </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex-1 space-y-0.5">
          <h3 className="font-black text-[11px] sm:text-[15px] text-gray-900 uppercase leading-tight line-clamp-2 min-h-[2.2rem]">
            {product.name}
          </h3>
          <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
            {product.packSize || "N/A"}
          </p>
          <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase truncate">
            {product.manufacturer}
          </p>

          <div className="pt-1.5 border-t border-dashed mt-1.5">
            <div className="flex items-baseline gap-1">
              <p className="text-lg sm:text-2xl font-black tracking-tighter text-accent">
                ₹{pPrice}
              </p>
              {pMrp > pPrice && (
                <span className="text-[8px] sm:text-[10px] text-red-400 line-through font-bold">₹{pMrp}</span>
              )}
            </div>
            {/* DYNAMIC SAVINGS DISPLAY: Shows comparison-aware savings */}
            {displaySavingsAmt > 0 && (
              <p className="text-[8px] sm:text-[10px] font-black text-accent uppercase tracking-tighter">
                Save ₹{displaySavingsAmt.toFixed(0)} ({displaySavingsPct}%)
              </p>
            )}
            <p className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
              ₹{unitPrice.toFixed(2)} per unit
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Button 
            onClick={() => addToCart({ ...product, price: pPrice, mrp: pMrp })} 
            className={cn("w-full h-9 sm:h-12 rounded-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest gap-2 shadow-lg active:scale-95 transition-all", isAlt ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}
          >
            {qty > 0 ? `IN BAG (${qty})` : "ADD"} <ShoppingCart className="w-3 sm:w-4 h-3 sm:h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-32 pharma-bg-pattern page-transition-wrapper">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-3 sm:px-10 py-4 sm:py-6">
        
        {/* COMPACT CLINICAL HEADER */}
        <div className="flex flex-row items-center justify-center mb-4 gap-2">
           <div className="inline-flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 shadow-sm">
              <Dna className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-base font-black text-primary uppercase tracking-[0.1em]">
                {molData?.molecule || staticProduct.name}
              </span>
           </div>
           {staticProduct.prescriptionRequired && (
             <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[8px] px-2.5 py-1.5 uppercase tracking-widest flex items-center gap-1.5 shadow-sm shrink-0">
               <AlertTriangle className="w-3 h-3" /> RX
             </Badge>
           )}
        </div>

        {/* SWITCH & SAVE BANNER (Calculated: Branded MRP - Generic Price) */}
        {showComparison && switchSavingsAmt > 0 && (
          <div className="mb-4 animate-in slide-in-from-top-4 duration-700">
            <div className="bg-accent text-white py-2 px-4 rounded-[16px] shadow-lg flex items-center justify-center gap-2 text-center border-b-2 border-accent-foreground/10">
               <TrendingDown className="w-4 h-4" />
               <h2 className="text-[9px] sm:text-lg font-black uppercase tracking-tight">
                 Switch to Generic & Save ₹{switchSavingsAmt.toFixed(0)} ({switchSavingsPct}% off Branded MRP)
               </h2>
               <Zap className="w-4 h-4 fill-white" />
            </div>
          </div>
        )}

        {/* DYNAMIC VIEW AREA */}
        <div className="mb-8">
          {showComparison ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-10 items-stretch">
              <ComparisonCard 
                product={staticProduct} 
                live={liveData} 
                label="CURRENT SELECTION" 
              />
              <ComparisonCard 
                product={genericAlt} 
                live={altLiveData} 
                label="RECOMMENDED CHOICE" 
                isAlt 
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <ComparisonCard 
                product={staticProduct} 
                live={liveData} 
                label={isBranded ? "BRANDED SELECTION" : "GENERIC CHOICE"} 
              />
            </div>
          )}
        </div>

        {/* CLINICAL DATA TABS */}
        <section className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-16 shadow-xl border border-gray-100 overflow-hidden">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-full h-10 sm:h-16 w-full max-w-[600px] flex mx-auto mb-8 sm:mb-16">
              <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-xs uppercase tracking-[0.1em]">Clinical</TabsTrigger>
              <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-xs uppercase tracking-[0.1em]">Safety</TabsTrigger>
              <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-xs uppercase tracking-[0.1em]">Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-6 space-y-2">
                     <div className="flex items-center gap-3"><ClipboardList className="w-4 h-4 text-primary" /><h3 className="text-xs sm:text-lg font-black uppercase text-gray-900 tracking-tight">Primary Treatment</h3></div>
                     <p className="text-[10px] sm:text-[14px] font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.treatment || "Precision clinical protocol."}</p>
                  </div>
                  <div className="pt-6 space-y-2">
                     <div className="flex items-center gap-3"><Info className="w-4 h-4 text-primary" /><h3 className="text-xs sm:text-lg font-black uppercase text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-[10px] sm:text-[14px] font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.description || "Active clinical formulation."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-orange-50/50 p-5 rounded-[24px] border border-orange-100 flex gap-3">
                 <div className="w-10 h-10 sm:w-16 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
                 <div><h4 className="text-[9px] sm:text-sm font-black uppercase text-orange-600 mb-0.5">Clinical Caution</h4><p className="text-[9px] sm:text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{staticProduct.safetyAdvice || "Follow professional clinical guidance."}</p></div>
               </div>
               <div className="bg-blue-50/50 p-5 rounded-[24px] border border-blue-100 flex gap-3">
                 <div className="w-10 h-10 sm:w-16 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-5 h-5 text-blue-600" /></div>
                 <div><h4 className="text-[9px] sm:text-sm font-black uppercase text-blue-600 mb-0.5">Usage Protocol</h4><p className="text-[9px] sm:text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{staticProduct.howToUse || "Follow clinical instructions carefully."}</p></div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2">
              {[
                { icon: Dna, title: "Clinical Composition", text: staticProduct.saltComposition },
                { icon: Baby, title: "Pregnancy Protocol", text: staticProduct.pregnancyInteraction },
                { icon: Milk, title: "Lactation Caution", text: staticProduct.lactationInteraction },
                { icon: Car, title: "Driving Stability", text: staticProduct.drivingInteraction },
                { icon: Package, title: "Renal Safety", text: staticProduct.kidneyInteraction },
                { icon: ShieldAlert, title: "Hepatic Protocol", text: staticProduct.liverInteraction }
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-[20px] border border-gray-100 flex items-start gap-3 hover:shadow-md transition-all">
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0"><item.icon className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <h4 className="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400 mb-0.5">{item.title}</h4>
                    <p className="text-[9px] font-bold text-gray-700 leading-relaxed uppercase">{item.text || "Clinical standards apply"}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
