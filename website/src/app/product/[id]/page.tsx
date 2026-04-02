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
  Maximize2,
  Loader2,
  TrendingUp,
  FlaskConical
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

  const isGeneric = product.isGeneric === true || product.isGeneric === "true";

  return (
    <motion.div 
      initial={{ x: isAlt ? 40 : -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card className={cn(
        "h-full rounded-[40px] sm:rounded-[64px] p-4 sm:p-14 flex flex-col justify-between border-2 transition-all duration-700 relative overflow-hidden",
        isAlt 
          ? "bg-gradient-to-br from-accent/[0.08] to-accent/[0.02] border-accent/30 ring-8 ring-accent/5 shadow-2xl shadow-accent/20" 
          : "bg-white border-slate-100 shadow-2xl shadow-slate-200/40"
      )}>
        {isAlt && (
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        )}
        
        <div className="space-y-4 sm:space-y-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Badge className={cn(
                "rounded-full font-black text-[7px] sm:text-[11px] px-3 sm:px-6 py-1.5 sm:py-2 uppercase tracking-[0.2em] shadow-lg", 
                isAlt ? "bg-accent text-white" : "bg-slate-900 text-white"
              )}>
                {label}
              </Badge>
              {isGeneric && (
                <span className="text-[6px] sm:text-[9px] font-black text-accent tracking-widest uppercase ml-1 animate-pulse">
                  Verified Sahi Generic
                </span>
              )}
            </div>
            {displaySavingsPct > 0 && (
              <div className={cn(
                "flex flex-col items-end",
                isAlt ? "scale-110" : ""
              )}>
                <Badge className="bg-primary text-white text-[8px] sm:text-xs font-black px-2 sm:px-4 py-1 rounded-full shadow-xl border-2 border-white">
                  -{displaySavingsPct}% OFF
                </Badge>
              </div>
            )}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <div className={cn(
                "relative aspect-square w-full rounded-[32px] sm:rounded-[48px] flex items-center justify-center overflow-hidden h-40 sm:h-80 p-4 sm:p-12 border shadow-inner group/img cursor-zoom-in transition-all duration-500",
                isAlt ? "bg-white border-accent/10" : "bg-slate-50/50 border-slate-100"
              )}>
                <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-4 sm:p-12 transition-transform duration-1000 group-hover/img:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center">
                   <div className="bg-white/80 backdrop-blur-md rounded-full p-4 opacity-0 group-hover/img:opacity-100 transition-all scale-50 group-hover/img:scale-100 shadow-xl">
                    <Maximize2 className="w-6 h-6 text-primary" />
                   </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl border-none p-0 bg-transparent shadow-none">
              <DialogTitle className="sr-only">{product.name}</DialogTitle>
              <DialogDescription className="sr-only">Detailed view of {product.name}</DialogDescription>
              <div className="relative aspect-square w-full bg-white rounded-[48px] overflow-hidden p-10 flex items-center justify-center shadow-3xl">
                 <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-12" />
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3 sm:space-y-6 text-center sm:text-left">
            <h3 className={cn(
              "font-extrabold text-[13px] sm:text-3xl tracking-tighter text-slate-800 leading-[1.1] line-clamp-2 min-h-[2.5rem] sm:min-h-[4.5rem] font-outfit uppercase",
              isAlt ? "text-accent" : ""
            )}>
              {product.name}
            </h3>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1">
                <Package className="w-3 h-3 text-slate-400" />
                <span className="text-[8px] sm:text-[11px] font-black text-slate-500 tracking-widest uppercase">
                  {product.packSize || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1">
                <FlaskConical className="w-3 h-3 text-slate-400" />
                <span className="text-[8px] sm:text-[11px] font-black text-slate-500 tracking-widest uppercase truncate max-w-[100px]">
                  {product.manufacturer}
                </span>
              </div>
            </div>

            <div className={cn(
              "pt-6 sm:pt-12 border-t-2 border-dashed mt-4 sm:mt-10 space-y-2",
              isAlt ? "border-accent/20" : "border-slate-100"
            )}>
              <div className="flex items-baseline justify-center sm:justify-start gap-3 sm:gap-6">
                <p className={cn(
                  "text-2xl sm:text-7xl font-black tracking-tighter font-outfit",
                  isAlt ? "text-accent drop-shadow-sm" : "text-primary"
                )}>
                  ₹{Number(pPrice).toFixed(0)}
                </p>
                {pMrp > pPrice && (
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-2xl text-slate-300 line-through font-bold decoration-[3px]">₹{Number(pMrp).toFixed(0)}</span>
                    <span className={cn(
                      "text-[8px] sm:text-base font-black uppercase px-3 py-1 rounded-full mt-1",
                      isAlt ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    )}>
                      {isAlt ? 'SMART PRICE' : 'SPECIAL PRICE'}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[9px] sm:text-sm font-black text-slate-400 tracking-[0.2em] uppercase opacity-60">
                ₹{unitPrice.toFixed(2)} PER UNIT COST
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-14">
          <Button 
            onClick={() => addToCart({ ...product, id: product._id || product.id, price: pPrice, mrp: pMrp })} 
            className={cn(
              "w-full h-12 sm:h-24 rounded-[24px] sm:rounded-[40px] font-black text-[10px] sm:text-xl tracking-[0.2em] sm:tracking-[0.3em] uppercase gap-3 sm:gap-6 shadow-2xl active:scale-95 transition-all border-4 group",
              isAlt 
                ? "bg-accent text-white hover:bg-accent/90 shadow-accent/40 border-accent/20" 
                : "bg-primary text-white hover:bg-primary/90 shadow-primary/40 border-primary/20"
            )}
          >
            {qty > 0 ? `IN CART (${qty})` : "ADD TO CART"} 
            <ShoppingCart className="w-4 h-4 sm:w-8 sm:h-8 transition-all group-hover:translate-x-1 group-hover:-rotate-12" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const { toast } = useToast();
  const { addToCart, getItemQuantity } = useCart();

  const { data: rawProduct, isLoading: productLoading } = useMongoDBDoc(id);
  const product = rawProduct;
  const { data: molData } = useMongoDBMolecule(product?.moleculeId);

  const isGeneric = product?.isGeneric === true || product?.isGeneric === "true";
  const isBranded = !isGeneric;
  
  // Rule: Only fetch generics if this is a branded product
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
  
  // Rule: Show comparison ONLY if branded AND has a mapped generic
  const showComparison = isBranded && hasGenericAlt;

  const pPriceRaw = product?.liveData?.sahimed_price || product?.price || 0;
  const pMrpRaw = product?.liveData?.mrp || product?.mrp || (Number(pPriceRaw) + 20);

  const brandedPrice = Number(pPriceRaw) || 0;
  const brandedMrp = Number(pMrpRaw) || (brandedPrice + 20);
  
  const genPriceRaw = genericAlt ? (genericAlt.liveData?.sahimed_price || genericAlt.price || 0) : 0;
  const genericPrice = Number(genPriceRaw) || 0;
  
  const switchSavingsAmt = Math.max(0, brandedMrp - genericPrice);
  const switchSavingsPct = brandedMrp > 0 ? Math.round((switchSavingsAmt / brandedMrp) * 100) : 0;

  if (productLoading) {
    return (<div className="min-h-screen bg-[#F8FAFC]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[48px]" /></main></div>);
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <PageTransition>
            <div className="bg-white rounded-[48px] p-16 shadow-sm border border-slate-100 max-w-lg mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Info className="w-8 h-8 text-orange-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter mb-4 font-outfit uppercase">Medicine not found</h1>
              <p className="text-slate-400 font-bold text-[10px] mb-10 leading-relaxed uppercase tracking-widest">The requested medicine entry could not be found.</p>
              <Button onClick={() => window.location.href = '/search'} className="rounded-full h-16 px-12 font-black tracking-widest uppercase bg-slate-900 text-white shadow-xl">Back to Catalog</Button>
            </div>
          </PageTransition>
        </main>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] pb-32">
        <Navbar />
        <main className="max-w-[1200px] mx-auto px-2 sm:px-10 py-0 sm:py-6">
          
          <div className="flex flex-row items-center justify-center mb-1 sm:mb-4 gap-4 px-2 pt-2">
             {(product.prescriptionRequired || product.rxRequired) && (
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                 <Badge className="bg-rose-500 text-white border-none rounded-full font-black text-[7px] sm:text-[9px] px-2 py-0.5 sm:py-1 tracking-widest shadow-lg shadow-rose-500/20 uppercase shrink-0">
                    RX REQUIRED
                 </Badge>
               </motion.div>
             )}
          </div>

          <div className="flex flex-col items-center justify-center mb-6 sm:mb-12 text-center px-2">
             <motion.div 
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex flex-col items-center gap-1.5"
             >
                <h2 className="text-[10px] sm:text-xs font-black text-slate-400 tracking-[0.3em] uppercase">Composition Matrix</h2>
                <span className="text-[14px] sm:text-2xl font-black text-slate-900 tracking-tighter font-outfit uppercase leading-tight max-w-2xl px-2 line-clamp-2">
                   {molData?.molecule || molData?.name || product.saltComposition || product.composition || "Molecular formulation info Pending"}
                </span>
             </motion.div>
          </div>

          {showComparison && switchSavingsAmt > 0 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, type: "spring" }}
              className="mb-8 sm:mb-16 px-2"
            >
              <div className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x text-white py-4 sm:py-8 px-6 sm:px-12 rounded-[24px] sm:rounded-[48px] shadow-3xl flex items-center justify-center gap-4 sm:gap-8 text-center border-b-8 border-black/20 group relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <TrendingDown className="w-6 h-6 sm:w-10 sm:h-10 animate-bounce" />
                 <div className="flex flex-col gap-0.5 sm:gap-1">
                  <h2 className="text-[11px] sm:text-2xl font-black tracking-[0.15em] sm:tracking-[0.3em] uppercase drop-shadow-md">
                    Switch and Save ₹{Number(switchSavingsAmt).toFixed(0)} PER PACK
                  </h2>
                  <p className="text-[7px] sm:text-xs font-black uppercase tracking-widest opacity-80 decoration-accent decoration-2 underline-offset-4 underline">
                    100% Identical molecular formulation • clinically verified
                  </p>
                 </div>
                 <TrendingDown className="w-6 h-6 sm:w-10 sm:h-10 animate-bounce invisible sm:visible" />
              </div>
            </motion.div>
          )}

          <div className="mb-12 sm:mb-20 px-1">
            {showComparison ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-12 items-stretch">
                <ComparisonCard 
                  product={product} 
                  label="Original Branded" 
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
                <ComparisonCard 
                  product={genericAlt} 
                  label="Smart Switch Alternative" 
                  isAlt 
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-full sm:max-w-xl">
                  <ComparisonCard 
                    product={product} 
                    label={isBranded ? "Verified Brand" : "Verified Generic"} 
                    getItemQuantity={getItemQuantity}
                    addToCart={addToCart}
                    showComparison={showComparison}
                    brandedMrp={brandedMrp}
                  />
                </div>
              </div>
            )}
          </div>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[32px] sm:rounded-[56px] p-6 sm:p-20 shadow-sm border border-slate-100 overflow-hidden"
          >
            <Tabs defaultValue="clinical" className="w-full">
              <TabsList className="bg-slate-50 p-1.5 rounded-full h-14 sm:h-18 w-full max-w-[600px] flex mx-auto mb-16 border border-slate-100 shadow-inner">
                <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-[11px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all">Intelligence</TabsTrigger>
                <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-[11px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all">Protocol</TabsTrigger>
                <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-[11px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all">Matrix</TabsTrigger>
              </TabsList>

              <TabsContent value="clinical" className="space-y-10 focus-visible:outline-none">
                 <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-lavender p-10 rounded-[40px] border border-white space-y-4 shadow-sm">
                       <div className="flex items-center gap-4"><ClipboardList className="w-5 h-5 text-primary" /><h3 className="text-lg font-black text-slate-800 tracking-tighter font-outfit uppercase">Clinical Indication</h3></div>
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed uppercase opacity-70 tracking-tight">{product.treatment || "Standard clinical protocol."}</p>
                    </div>
                    <div className="bg-sahi-blue p-10 rounded-[40px] border border-white space-y-4 shadow-sm">
                       <div className="flex items-center gap-4"><Info className="w-5 h-5 text-primary" /><h3 className="text-lg font-black text-slate-800 tracking-tighter font-outfit uppercase">Pharmacology</h3></div>
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed uppercase opacity-70 tracking-tight">{product.description || "Active medical formulation."}</p>
                    </div>
                  </div>
              </TabsContent>

              <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-8 focus-visible:outline-none">
                 <div className="bg-sahi-pink border border-white p-10 rounded-[40px] flex gap-6 shadow-sm">
                   <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shrink-0 shadow-lg"><AlertTriangle className="w-6 h-6 text-rose-500" /></div>
                   <div><h4 className="text-xs font-black text-rose-600 mb-2 uppercase tracking-widest">Protocol Caution</h4><p className="text-[10px] font-black text-rose-900/60 leading-relaxed uppercase tracking-tight">{product.safetyAdvice || "Follow clinical guidance."}</p></div>
                 </div>
                 <div className="bg-sahi-blue border border-white p-10 rounded-[40px] flex gap-6 shadow-sm">
                   <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shrink-0 shadow-lg"><Stethoscope className="w-6 h-6 text-primary" /></div>
                   <div><h4 className="text-xs font-black text-primary mb-2 uppercase tracking-widest">Usage Gateway</h4><p className="text-[10px] font-black text-slate-500 leading-relaxed uppercase tracking-tight">{product.howToUse || "Execute as professionally directed."}</p></div>
                 </div>
              </TabsContent>

              <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 focus-visible:outline-none">
                {[
                  { icon: FlaskConical, title: "Composition", text: product.saltComposition, color: "bg-lavender" },
                  { icon: Baby, title: "Pregnancy", text: product.pregnancyInteraction, color: "bg-sahi-pink" },
                  { icon: Milk, title: "Lactation", text: product.lactationInteraction, color: "bg-sahi-blue" },
                  { icon: Car, title: "Driving", text: product.drivingInteraction, color: "bg-sahi-green" },
                  { icon: Package, title: "Renal", text: product.kidneyInteraction, color: "bg-lavender" },
                  { icon: ShieldAlert, title: "Hepatic", text: product.liverInteraction, color: "bg-slate-50" }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    variants={fadeInVariant}
                    className={cn("p-8 rounded-[32px] flex flex-col gap-5 border border-white shadow-sm", item.color)}
                  >
                    <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-primary shrink-0 shadow-sm border border-slate-50"><item.icon className="w-5 h-5" /></div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[9px] font-black tracking-[0.2em] text-slate-500/60 uppercase">{item.title}</h4>
                      <p className="text-[11px] font-black text-slate-800 leading-tight uppercase tracking-tight">{item.text || "PROTOCOL APPLICABLE"}</p>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </motion.section>
        </main>
      </div>
    </PageTransition>
  );
}
