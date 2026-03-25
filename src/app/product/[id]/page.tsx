
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
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id || 'err'}/300/300`;

  return (
    <Card className={cn(
      "rounded-[20px] sm:rounded-[32px] p-2.5 sm:p-6 flex flex-col h-full border shadow-sm transition-all overflow-hidden relative",
      isAlt ? "bg-accent/5 border-dashed border-accent/20" : "bg-white border-gray-100",
      !showComparison && "max-w-md mx-auto w-full"
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[7px] sm:text-[9px] font-black text-gray-400 tracking-widest block">{label}</span>
        {displaySavingsPct > 0 && (
          <Badge className="bg-accent text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-tighter">
            Save {displaySavingsPct}%
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
                <span className="font-black text-[10px] tracking-widest text-gray-900">{product.name}</span>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 space-y-0.5">
        <h3 className="font-black text-[11px] sm:text-[15px] text-gray-900 leading-tight line-clamp-2 min-h-[2.2rem]">
          {product.name}
        </h3>
        <p className="text-[8px] sm:text-[10px] font-black text-gray-400 tracking-tighter">
          {product.packSize || "N/A"}
        </p>
        <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 truncate">
          {product.manufacturer}
        </p>

        <div className="pt-1.5 border-t border-dashed mt-1.5">
          <div className="flex items-baseline gap-1">
            <p className="text-lg sm:text-2xl font-black tracking-tighter text-accent">
              ₹{Number(pPrice).toFixed(2)}
            </p>
            {pMrp > pPrice && (
              <span className="text-[8px] sm:text-[10px] text-red-400 line-through font-bold">₹{Number(pMrp).toFixed(2)}</span>
            )}
          </div>
          {displaySavingsAmt > 0 && (
            <p className="text-[8px] sm:text-[10px] font-black text-accent tracking-tighter">
              Save ₹{Number(displaySavingsAmt).toFixed(2)} ({displaySavingsPct}%)
            </p>
          )}
          <p className="text-[7px] sm:text-[9px] font-bold text-gray-400 tracking-tighter">
            ₹{unitPrice.toFixed(2)} per unit
          </p>
        </div>
      </div>

      <div className="mt-3">
        <Button 
          onClick={() => addToCart({ ...product, id: product._id || product.id, price: pPrice, mrp: pMrp })} 
          className={cn("w-full h-9 sm:h-12 rounded-full font-black text-[8px] sm:text-[10px] tracking-widest gap-2 shadow-lg active:scale-95 transition-all", isAlt ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}
        >
          {qty > 0 ? `In bag (${qty})` : "Add"} <ShoppingCart className="w-3 sm:w-4 h-3 sm:h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, getItemQuantity } = useCart();

  // 1. Fetch main product
  const productRef = useMemoFirebase(() => id ? doc(db, 'medicines', id) : null, [db, id]);
  const { data: rawProduct, isLoading: productLoading } = useDoc(productRef);
  
  // 2. Fetch live pricing data (SKU-based)
  const liveRef = useMemoFirebase(() => rawProduct?.sku ? doc(db, 'product_live_data', rawProduct.sku) : null, [db, rawProduct?.sku]);
  const { data: liveDataDoc } = useDoc(liveRef);

  // Combine product with live data
  const product = React.useMemo(() => {
    if (!rawProduct) return null;
    return {
      ...rawProduct,
      liveData: liveDataDoc ? {
        mrp: liveDataDoc.mrp,
        sahimed_price: liveDataDoc.sahimed_price,
        stock_quantity: liveDataDoc.stock_quantity
      } : null
    };
  }, [rawProduct, liveDataDoc]);

  // 3. Fetch molecule data
  const molRef = useMemoFirebase(() => product?.moleculeId ? doc(db, 'moleculeMaster', product.moleculeId) : null, [db, product?.moleculeId]);
  const { data: molData } = useDoc(molRef);

  // 4. Fetch generic alternatives
  const genericQuery = useMemoFirebase(() => {
    if (!product?.moleculeId) return null;
    return query(collection(db, 'medicines'), where('moleculeId', '==', product.moleculeId), limit(10));
  }, [db, product?.moleculeId]);
  
  const { data: rawAlternatives } = useCollection(genericQuery);

  // We need live data for alternatives too to show correct "Save" badges
  // However, fetching live data for 10 items in a loop with hooks is not ideal.
  // For now, we'll use the static price in alternatives or assume they'll load when navigated to.
  const genericAlternatives = rawAlternatives;

  if (productLoading) {
    return (<div className="min-h-screen bg-[#F8F8F8]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[40px]" /></main></div>);
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-[40px] p-16 shadow-sm border border-gray-100 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Medicine not found</h1>
            <p className="text-gray-500 font-bold text-sm mb-8">The requested clinical record could not be retrieved from our secure database.</p>
            <Button onClick={() => window.location.href = '/search'} className="rounded-full h-14 px-10 font-black tracking-widest">Browse catalog</Button>
          </div>
        </main>
      </div>
    );
  }

  const isGeneric = product.isGeneric === true || product.isGeneric === "true";
  const isBranded = !isGeneric;
  
  const genericAlt = genericAlternatives?.find((a: any) => 
    (a.isGeneric === true || a.isGeneric === "true") && 
    String(a.id) !== String(product.id)
  );

  const hasGenericAlt = !!genericAlt;
  
  // Logic: Show comparison ONLY if:
  // 1. Current product is BRANDED
  // 2. A GENERIC alternative exists
  const showComparison = isBranded && hasGenericAlt;

  // Defensive pricing logic
  const pPriceRaw = product.liveData?.sahimed_price || product.price || 0;
  const pMrpRaw = product.liveData?.mrp || product.mrp || (pPriceRaw + 20);

  const brandedPrice = Number(pPriceRaw) || 0;
  const brandedMrp = Number(pMrpRaw) || (brandedPrice + 20);
  
  const genPriceRaw = genericAlt ? (genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const genericPrice = Number(genPriceRaw) || 0;
  
  // Savings calculations
  const switchSavingsAmt = Math.max(0, brandedMrp - genericPrice);
  const switchSavingsPct = brandedMrp > 0 ? Math.round((switchSavingsAmt / brandedMrp) * 100) : 0;

  useEffect(() => {
    console.log("[ProductPage Debug]", {
      id,
      productName: product.name,
      brandedPrice,
      brandedMrp,
      genericFound: hasGenericAlt,
      genericPrice,
      showComparison
    });
  }, [id, product.name, brandedPrice, brandedMrp, hasGenericAlt, genericPrice, showComparison]);

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-32 pharma-bg-pattern page-transition-wrapper">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-3 sm:px-10 py-4 sm:py-6">
        
        <div className="flex flex-row items-center justify-center mb-4 gap-2">
           <div className="inline-flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 shadow-sm">
              <Dna className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-base font-black text-primary tracking-[0.1em]">
                {molData?.molecule || product.name}
              </span>
           </div>
           {product.prescriptionRequired && (
             <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[8px] px-2.5 py-1.5 tracking-widest flex items-center gap-1.5 shadow-sm shrink-0">
               <AlertTriangle className="w-3 h-3" /> Rx
             </Badge>
           )}
        </div>

        {showComparison && switchSavingsAmt > 0 && (
          <div className="mb-4 animate-in slide-in-from-top-4 duration-700">
            <div className="bg-accent text-white py-2 px-4 rounded-[16px] shadow-lg flex items-center justify-center gap-2 text-center border-b-2 border-accent-foreground/10">
               <TrendingDown className="w-4 h-4" />
               <h2 className="text-[9px] sm:text-lg font-black tracking-tight">
                 Switch to generic & save ₹{Number(switchSavingsAmt).toFixed(2)} ({switchSavingsPct}% off branded MRP)
               </h2>
               <Zap className="w-4 h-4 fill-white" />
            </div>
          </div>
        )}

        <div className="mb-8">
          {showComparison ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-10 items-stretch">
              <ComparisonCard 
                product={product} 
                label="Current selection" 
                getItemQuantity={getItemQuantity}
                addToCart={addToCart}
                showComparison={showComparison}
                brandedMrp={brandedMrp}
              />
              <ComparisonCard 
                product={genericAlt} 
                label="Recommended choice" 
                isAlt 
                getItemQuantity={getItemQuantity}
                addToCart={addToCart}
                showComparison={showComparison}
                brandedMrp={brandedMrp}
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <ComparisonCard 
                product={product} 
                label={isBranded ? "Branded selection" : "Generic choice"} 
                getItemQuantity={getItemQuantity}
                addToCart={addToCart}
                showComparison={showComparison}
                brandedMrp={brandedMrp}
              />
            </div>
          )}
        </div>

        <section className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-16 shadow-xl border border-gray-100 overflow-hidden">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-full h-10 sm:h-16 w-full max-w-[600px] flex mx-auto mb-8 sm:mb-16">
              <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-xs tracking-[0.1em]">Clinical</TabsTrigger>
              <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-xs tracking-[0.1em]">Safety</TabsTrigger>
              <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-xs tracking-[0.1em]">Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-6 space-y-2">
                     <div className="flex items-center gap-3"><ClipboardList className="w-4 h-4 text-primary" /><h3 className="text-xs sm:text-lg font-black text-gray-900 tracking-tight">Primary treatment</h3></div>
                     <p className="text-[10px] sm:text-[14px] font-bold text-gray-500 leading-relaxed">{product.treatment || "Precision clinical protocol."}</p>
                  </div>
                  <div className="pt-6 space-y-2">
                     <div className="flex items-center gap-3"><Info className="w-4 h-4 text-primary" /><h3 className="text-xs sm:text-lg font-black text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-[10px] sm:text-[14px] font-bold text-gray-500 leading-relaxed">{product.description || "Active clinical formulation."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-orange-50/50 p-5 rounded-[24px] border border-orange-100 flex gap-3">
                 <div className="w-10 h-10 sm:w-16 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
                 <div><h4 className="text-[9px] sm:text-sm font-black text-orange-600 mb-0.5">Clinical caution</h4><p className="text-[9px] sm:text-[13px] font-bold text-orange-900/70 leading-relaxed">{product.safetyAdvice || "Follow professional clinical guidance."}</p></div>
               </div>
               <div className="bg-blue-50/50 p-5 rounded-[24px] border border-blue-100 flex gap-3">
                 <div className="w-10 h-10 sm:w-16 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-5 h-5 text-blue-600" /></div>
                 <div><h4 className="text-[9px] sm:text-sm font-black text-blue-600 mb-0.5">Usage protocol</h4><p className="text-[9px] sm:text-[13px] font-bold text-blue-900/70 leading-relaxed">{product.howToUse || "Follow clinical instructions carefully."}</p></div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2">
              {[
                { icon: Dna, title: "Clinical composition", text: product.saltComposition },
                { icon: Baby, title: "Pregnancy protocol", text: product.pregnancyInteraction },
                { icon: Milk, title: "Lactation caution", text: product.lactationInteraction },
                { icon: Car, title: "Driving stability", text: product.drivingInteraction },
                { icon: Package, title: "Renal safety", text: product.kidneyInteraction },
                { icon: ShieldAlert, title: "Hepatic protocol", text: product.liverInteraction }
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-[20px] border border-gray-100 flex items-start gap-3 hover:shadow-md transition-all">
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0"><item.icon className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <h4 className="text-[8px] font-black tracking-[0.1em] text-gray-400 mb-0.5">{item.title}</h4>
                    <p className="text-[9px] font-bold text-gray-700 leading-relaxed">{item.text || "Clinical standards apply"}</p>
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
