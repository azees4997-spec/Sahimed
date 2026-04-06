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

  return (
    <motion.div variants={scaleInVariant} className="h-full">
      <Card className={cn(
        "h-full rounded-[24px] sm:rounded-[40px] p-3 sm:p-7 flex flex-col justify-between border shadow-sm relative overflow-hidden transition-all duration-700",
        isAlt ? "bg-accent/[0.03] ring-2 ring-accent/10 border-accent/20" : "bg-white border-slate-100"
      )}>
        <div className="space-y-3 sm:space-y-6">
          <div className="flex items-center justify-between">
            <Badge className={cn("rounded-full font-black text-[7px] sm:text-[9px] px-2 py-0.5 uppercase tracking-widest", isAlt ? "bg-accent text-white" : "bg-slate-100 text-slate-400")}>{label}</Badge>
            {displaySavingsPct > 0 && (
              <Badge className="bg-primary text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">-{displaySavingsPct}%</Badge>
            )}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-square w-full bg-white rounded-[20px] sm:rounded-[28px] flex items-center justify-center overflow-hidden h-20 sm:h-42 p-1.5 sm:p-4 border border-slate-50 shadow-inner group/img cursor-zoom-in">
                <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-2 sm:p-4 transition-transform duration-700 group-hover/img:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center">
                   <Maximize2 className="w-4 h-4 text-primary opacity-0 group-hover/img:opacity-100 transition-opacity" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl border-none p-0 bg-transparent shadow-none">
              <DialogTitle className="sr-only">{product.name}</DialogTitle>
              <DialogDescription className="sr-only">Visual representation of {product.name}</DialogDescription>
              <div className="relative aspect-square w-full bg-white rounded-[40px] overflow-hidden p-8 flex items-center justify-center shadow-3xl border border-white/20">
                 <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-10" />
              </div>
            </DialogContent>
          </Dialog>

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
          <Button 
            onClick={() => addToCart({ ...product, id: product._id || product.id, price: pPrice, mrp: pMrp })} 
            className={cn(
              "w-full h-7 sm:h-12 rounded-full font-black text-[7px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.15em] uppercase gap-1.5 sm:gap-2 shadow-md sm:shadow-lg active:scale-95 transition-all border-none",
              isAlt ? "bg-accent text-white hover:bg-accent/90" : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {qty > 0 ? `IN CART (${qty})` : "ADD"} <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default function ProductDetailClient({ initialProduct, id }: { initialProduct: any, id: string }) {
  const { toast } = useToast();
  const { addToCart, getItemQuantity } = useCart();

  // Use initial data if available for instant render, but still keep hook for live updates if needed
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
  const switchSavingsPct = brandedMrp > 0 ? Math.round((switchSavingsAmt / brandedMrp) * 100) : 0;

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

          <div className="mb-4 sm:mb-10 px-1">
            {showComparison ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-6 items-stretch">
                <ComparisonCard 
                  product={brandedItem} 
                  label="Branded Version" 
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
                <ComparisonCard 
                  product={genericItem} 
                  label="Save with Generic" 
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

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[24px] sm:rounded-[48px] p-4 sm:p-12 shadow-sm border border-slate-100 overflow-hidden"
          >
            <Tabs defaultValue="clinical" className="w-full">
              <TabsList className="bg-slate-50 p-1 rounded-full h-10 sm:h-14 w-full max-w-[500px] flex mx-auto mb-8 border border-slate-100 shadow-inner">
                <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Information</TabsTrigger>
                <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Safety Advice</TabsTrigger>
                <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Interactions</TabsTrigger>
              </TabsList>

              <TabsContent value="clinical" className="space-y-10 focus-visible:outline-none">
                 <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-8">
                    <div className="bg-lavender p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-white space-y-2 sm:space-y-4 shadow-sm">
                       <div className="flex items-center gap-2 sm:gap-4"><ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /><h3 className="text-[10px] sm:text-lg font-black text-slate-800 tracking-tighter font-outfit uppercase">Medical Uses</h3></div>
                       <p className="text-[8px] sm:text-[11px] font-black text-slate-500 leading-tight sm:leading-relaxed uppercase opacity-70 tracking-tight">{product?.treatment || "Standard medical use."}</p>
                    </div>
                    <div className="bg-sahi-blue p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-white space-y-2 sm:space-y-4 shadow-sm">
                       <div className="flex items-center gap-2 sm:gap-4"><Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /><h3 className="text-[10px] sm:text-lg font-black text-slate-800 tracking-tighter font-outfit uppercase">Product Info</h3></div>
                       <p className="text-[8px] sm:text-[11px] font-black text-slate-500 leading-tight sm:leading-relaxed uppercase opacity-70 tracking-tight">{product?.description || "Medicine details."}</p>
                    </div>
                  </div>
              </TabsContent>

              <TabsContent value="safety" className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-8 focus-visible:outline-none">
                 <div className="bg-sahi-pink border border-white p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-sm">
                   <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-[16px] sm:rounded-[24px] flex items-center justify-center shrink-0 shadow-lg"><AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500" /></div>
                   <div><h4 className="text-[8px] sm:text-xs font-black text-rose-600 mb-1 sm:mb-2 uppercase tracking-widest">Safety Advice</h4><p className="text-[8px] sm:text-[10px] font-black text-rose-900/60 leading-tight sm:leading-relaxed uppercase tracking-tight">{product?.safetyAdvice || "Follow medical guidance."}</p></div>
                 </div>
                 <div className="bg-sahi-blue border border-white p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-sm">
                   <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-[16px] sm:rounded-[24px] flex items-center justify-center shrink-0 shadow-lg"><Stethoscope className="w-4 h-4 sm:w-6 sm:h-6 text-primary" /></div>
                   <div><h4 className="text-[8px] sm:text-xs font-black text-primary mb-1 sm:mb-2 uppercase tracking-widest">How to Use</h4><p className="text-[8px] sm:text-[10px] font-black text-slate-500 leading-tight sm:leading-relaxed uppercase tracking-tight">{product?.howToUse || "Take as directed by your doctor."}</p></div>
                 </div>
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
                  <motion.div 
                    key={i} 
                    variants={fadeInVariant}
                    className={cn("p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] flex flex-col gap-3 sm:gap-5 border border-white shadow-sm", item.color)}
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-[12px] sm:rounded-[16px] flex items-center justify-center text-primary shrink-0 shadow-sm border border-slate-50"><item.icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <h4 className="text-[7px] sm:text-[9px] font-black tracking-[0.2em] text-slate-500/60 uppercase">{item.title}</h4>
                      <p className="text-[9px] sm:text-[11px] font-black text-slate-800 leading-tight uppercase tracking-tight line-clamp-2">{item.text || "CONSULT DOCTOR"}</p>
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
