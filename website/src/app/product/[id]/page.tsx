
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
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useMongoDBDoc, useMongoDBMolecule, useMongoDBCollection } from '@/hooks/use-mongodb';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="h-full"
    >
      <Card className={cn(
        "rounded-[48px] p-6 sm:p-8 flex flex-col h-full border shadow-xl transition-all overflow-hidden relative",
        isAlt ? "bg-pastel-green border-dashed border-green-200" : "bg-white border-gray-100",
        !showComparison && "max-w-md mx-auto w-full"
      )}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] sm:text-xs font-black text-gray-400 tracking-[0.2em] block uppercase">{label}</span>
          {displaySavingsPct > 0 && (
            <Badge className="bg-accent text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-xl tracking-widest border-none shadow-lg shadow-accent/20 uppercase">
              Save {displaySavingsPct}%
            </Badge>
          )}
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative aspect-square w-full max-h-[160px] sm:max-h-none bg-white rounded-[32px] mb-6 overflow-hidden border border-gray-50 flex items-center justify-center p-4 cursor-zoom-in group/img shadow-inner">
              <Image src={safeImageUrl} alt={product.name} fill sizes="(max-width: 768px) 45vw, 30vw" className="object-contain p-2 transition-transform duration-700 group-hover/img:scale-110 group-hover/img:rotate-3" />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center">
                 <Maximize2 className="w-5 h-5 text-primary opacity-0 group-hover/img:opacity-100 transition-opacity" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl border-none p-0 bg-transparent shadow-none">
            <DialogTitle className="sr-only">{product.name}</DialogTitle>
            <DialogDescription className="sr-only">Visual representation of {product.name}</DialogDescription>
            <div className="relative aspect-square w-full bg-white rounded-[40px] overflow-hidden p-8 flex items-center justify-center shadow-3xl border border-white/20">
               <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-10" />
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-8 py-4 rounded-full border border-gray-100 shadow-2xl flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-black text-xs tracking-widest text-gray-900 uppercase">{product.name}</span>
               </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex-1 space-y-2">
          <h3 className="font-black text-sm sm:text-xl text-gray-900 leading-tight line-clamp-2 min-h-[2.8rem] font-outfit">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs font-black text-gray-400 tracking-widest uppercase">
            {product.packSize || "N/A"}
          </p>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 truncate opacity-70">
            {product.manufacturer}
          </p>

          <div className="pt-4 border-t border-dashed mt-4 space-y-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 font-outfit">
                ₹{Number(pPrice).toFixed(2)}
              </p>
              {pMrp > pPrice && (
                <span className="text-xs sm:text-sm text-red-400 line-through font-bold opacity-60 tracking-tight">₹{Number(pMrp).toFixed(2)}</span>
              )}
            </div>
            {displaySavingsAmt > 0 && (
              <p className="text-[10px] sm:text-xs font-black text-accent tracking-[0.1em] uppercase">
                Save ₹{Number(displaySavingsAmt).toFixed(2)} ({displaySavingsPct}% OFF)
              </p>
            )}
            <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 tracking-tight">
              ₹{unitPrice.toFixed(2)} per clinical unit
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button 
            onClick={() => addToCart({ ...product, id: product._id || product.id, price: pPrice, mrp: pMrp })} 
            className={cn(
              "w-full h-12 sm:h-16 rounded-full font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase gap-3 shadow-2xl active:scale-95 transition-all",
              isAlt ? "bg-accent hover:bg-accent/90 shadow-accent/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
            )}
          >
            {qty > 0 ? `In bag (${qty})` : "Book Clinical Order"} <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5" />
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

  const { data: genericAlternatives } = useMongoDBCollection({ 
    moleculeId: product?.moleculeId,
    isGeneric: true,
    limit: 10 
  });
  
  const isGeneric = product?.isGeneric === true || product?.isGeneric === "true";
  const isBranded = !isGeneric;
  
  const genericAlt = genericAlternatives?.find((a: any) => 
    (a.isGeneric === true || a.isGeneric === "true") && 
    String(a.id || a._id) !== String(product?.id || product?._id)
  );

  const hasGenericAlt = !!genericAlt;
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
    return (<div className="min-h-screen bg-[#F8F8F8]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[48px]" /></main></div>);
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <PageTransition>
            <div className="bg-white rounded-[48px] p-16 shadow-2xl border border-gray-100 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Info className="w-10 h-10 text-orange-400" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-4 font-outfit">Medicine not found</h1>
              <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed">The requested clinical record could not be retrieved from our secure database.</p>
              <Button onClick={() => window.location.href = '/search'} className="rounded-full h-16 px-12 font-black tracking-widest uppercase bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">Browse Secure Catalog</Button>
            </div>
          </PageTransition>
        </main>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pb-32 pharma-bg-pattern">
        <Navbar />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-10 py-6 sm:py-10">
          
          <div className="flex flex-row items-center justify-center mb-8 gap-4">
             <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/50 shadow-sm"
             >
                <Dna className="w-5 h-5 text-primary" />
                <span className="text-sm sm:text-lg font-black text-gray-900 tracking-tight font-outfit uppercase">
                  {molData?.molecule || product.name}
                </span>
             </motion.div>
             {product.prescriptionRequired && (
               <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
               >
                 <Badge className="bg-rose-500 text-white border-none rounded-full font-black text-xs px-4 py-2 tracking-widest flex items-center gap-2 shadow-lg shadow-rose-500/20 uppercase">
                   <AlertTriangle className="w-3.5 h-3.5" /> Rx Required
                 </Badge>
               </motion.div>
             )}
          </div>

          {showComparison && switchSavingsAmt > 0 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-accent to-rose-500 text-white py-4 px-8 rounded-[24px] shadow-2xl flex items-center justify-center gap-4 text-center border-b-4 border-black/10">
                 <TrendingDown className="w-6 h-6 animate-pulse" />
                 <h2 className="text-xs sm:text-xl font-black tracking-tight uppercase">
                   Switch and save ₹{Number(switchSavingsAmt).toFixed(2)} ({switchSavingsPct}% off branded MRP)
                 </h2>
                 <Zap className="w-6 h-6 fill-white" />
              </div>
            </motion.div>
          )}

          <div className="mb-12">
            {showComparison ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 items-stretch">
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
                  label="Smart Clinical Alternative" 
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
                  label={isBranded ? "Clinical Selection" : "Verified Generic"} 
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
              </div>
            )}
          </div>

          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[48px] p-8 sm:p-20 shadow-2xl border border-gray-100 overflow-hidden"
          >
            <Tabs defaultValue="clinical" className="w-full">
              <TabsList className="bg-slate-50 p-2 rounded-full h-14 sm:h-20 w-full max-w-[700px] flex mx-auto mb-12 sm:mb-20 border border-slate-100 shadow-inner">
                <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-sm tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all">Clinical Intelligence</TabsTrigger>
                <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-sm tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all">Safety Protocol</TabsTrigger>
                <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-sm tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all">Risk Factors</TabsTrigger>
              </TabsList>

              <TabsContent value="clinical" className="space-y-10 focus-visible:outline-none">
                 <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16">
                    <div className="bg-pastel-blue p-10 rounded-[40px] border border-blue-100/50 space-y-4 shadow-sm">
                       <div className="flex items-center gap-4"><ClipboardList className="w-6 h-6 text-primary" /><h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight font-outfit uppercase">Primary indications</h3></div>
                       <p className="text-xs sm:text-base font-bold text-slate-500 leading-relaxed">{product.treatment || "Standard precision clinical protocol."}</p>
                    </div>
                    <div className="bg-pastel-purple p-10 rounded-[40px] border border-purple-100/50 space-y-4 shadow-sm">
                       <div className="flex items-center gap-4"><Info className="w-6 h-6 text-primary" /><h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight font-outfit uppercase">Pharmacology</h3></div>
                       <p className="text-xs sm:text-base font-bold text-slate-500 leading-relaxed">{product.description || "Active clinical formulation with verified efficacy."}</p>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-8 focus-visible:outline-none">
                 <motion.div whileHover={{ y: -5 }} className="bg-rose-50 border border-rose-100 p-10 rounded-[40px] flex gap-6 shadow-sm">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[24px] flex items-center justify-center shrink-0 border border-rose-200/50 shadow-xl"><AlertTriangle className="w-8 h-8 text-rose-600" /></div>
                   <div><h4 className="text-xs sm:text-lg font-black text-rose-600 mb-2 uppercase tracking-widest">Clinical caution</h4><p className="text-[10px] sm:text-[15px] font-bold text-rose-900/70 leading-relaxed">{product.safetyAdvice || "Strictly follow professional clinical guidance."}</p></div>
                 </motion.div>
                 <motion.div whileHover={{ y: -5 }} className="bg-sky-50 border border-sky-100 p-10 rounded-[40px] flex gap-6 shadow-sm">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[24px] flex items-center justify-center shrink-0 border border-sky-200/50 shadow-xl"><Stethoscope className="w-8 h-8 text-sky-600" /></div>
                   <div><h4 className="text-xs sm:text-lg font-black text-sky-600 mb-2 uppercase tracking-widest">Usage protocol</h4><p className="text-[10px] sm:text-[15px] font-bold text-sky-900/70 leading-relaxed">{product.howToUse || "Execute clinical administration carefully."}</p></div>
                 </motion.div>
              </TabsContent>

              <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 focus-visible:outline-none">
                {[
                  { icon: Dna, title: "Composition", text: product.saltComposition, color: "bg-pastel-purple" },
                  { icon: Baby, title: "Pregnancy", text: product.pregnancyInteraction, color: "bg-pastel-peach" },
                  { icon: Milk, title: "Lactation", text: product.lactationInteraction, color: "bg-pastel-blue" },
                  { icon: Car, title: "Driving", text: product.drivingInteraction, color: "bg-pastel-purple" },
                  { icon: Package, title: "Renal", text: product.kidneyInteraction, color: "bg-pastel-green" },
                  { icon: ShieldAlert, title: "Hepatic", text: product.liverInteraction, color: "bg-slate-50" }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.05 }}
                    className={cn("p-6 rounded-[32px] flex items-start gap-4 hover:shadow-2xl transition-all border border-black/5 shadow-sm", item.color)}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm"><item.icon className="w-5 h-5" /></div>
                    <div className="flex flex-col">
                      <h4 className="text-[10px] font-black tracking-widest text-slate-800/40 mb-1 uppercase">{item.title}</h4>
                      <p className="text-[11px] font-bold text-gray-900 leading-relaxed">{item.text || "Standard clinical protocol applies"}</p>
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

