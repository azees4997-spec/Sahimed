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

  return (
    <motion.div variants={scaleInVariant} className="h-full">
      <Card className={cn(
        "h-full rounded-[24px] sm:rounded-[48px] p-2.5 sm:p-10 flex flex-col justify-between border shadow-sm relative overflow-hidden transition-all duration-700",
        isAlt ? "bg-accent/[0.03] ring-2 ring-accent/10 border-accent/20" : "bg-white border-slate-100"
      )}>
        <div className="space-y-2.5 sm:space-y-8">
          <div className="flex items-center justify-between">
            <Badge className={cn("rounded-full font-black text-[7px] sm:text-[10px] px-2 sm:px-3 py-0.5 sm:py-1 uppercase tracking-widest", isAlt ? "bg-accent text-white" : "bg-slate-100 text-slate-400")}>{label}</Badge>
            {displaySavingsPct > 0 && (
              <Badge className="bg-primary text-white text-[7px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm">-{displaySavingsPct}%</Badge>
            )}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-square w-full bg-white rounded-[16px] sm:rounded-[32px] flex items-center justify-center overflow-hidden h-20 sm:h-56 p-1 sm:p-6 border border-slate-50 shadow-inner group/img cursor-zoom-in">
                <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-2 sm:p-6 transition-transform duration-700 group-hover/img:scale-110" />
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
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-0.5 sm:space-y-2">
            <h3 className="font-extrabold text-[9px] sm:text-xl text-slate-800 leading-tight line-clamp-2 min-h-[1.8rem] sm:min-h-[2.8rem] font-outfit uppercase">
              {product.name}
            </h3>
            <p className="text-[8px] sm:text-[12px] font-black text-slate-500 tracking-widest uppercase opacity-80">
              {product.packSize || "N/A"}
            </p>
            <p className="text-[8px] sm:text-[12px] font-bold text-slate-400 truncate uppercase mt-0 sm:mt-1 tracking-tighter">
              {product.manufacturer}
            </p>

            <div className="pt-2 sm:pt-4 border-t border-dashed mt-1.5 sm:mt-4 space-y-0.5 sm:space-y-1">
              <div className="flex items-baseline gap-1 sm:gap-3">
                <p className="text-base sm:text-5xl font-black tracking-tighter text-primary font-outfit">
                  ₹{Number(pPrice).toFixed(0)}
                </p>
                {pMrp > pPrice && (
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-lg text-slate-400 line-through font-bold opacity-80 decoration-1">₹{Number(pMrp).toFixed(0)}</span>
                    <span className="text-[7px] sm:text-xs font-black text-accent uppercase bg-accent/10 px-1 sm:px-1.5 py-0.5 rounded-sm sm:rounded-md">Save ₹{Number(pMrp - pPrice).toFixed(0)}</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] font-bold text-slate-400 tracking-tight uppercase">
                ₹{unitPrice.toFixed(2)} / unit
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-6">
          <Button 
            onClick={() => addToCart({ ...product, id: product._id || product.id, price: pPrice, mrp: pMrp })} 
            className={cn(
              "w-full h-7 sm:h-16 rounded-full font-black text-[7px] sm:text-xs tracking-wider sm:tracking-[0.15em] uppercase gap-1 sm:gap-3 shadow-md sm:shadow-xl active:scale-95 transition-all border-none",
              isAlt ? "bg-accent text-white hover:bg-accent/90" : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {qty > 0 ? `CART (${qty})` : "ADD"} <ShoppingCart className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
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
                <h2 className="text-[8px] sm:text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Composition Matrix</h2>
                <span className="text-[10px] sm:text-2xl font-black text-slate-900 tracking-tighter font-outfit uppercase leading-tight max-w-2xl px-2 line-clamp-1">
                   {molData?.molecule || molData?.name || product.saltComposition || product.composition || "Molecular formulation info Pending"}
                </span>
             </motion.div>
          </div>

          <div className="mb-8 sm:mb-16 px-1">
            {showComparison ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-10 items-stretch">
                <ComparisonCard 
                  product={product} 
                  label="Original Brand" 
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
                <ComparisonCard 
                  product={genericAlt} 
                  label="Sahimed Generic" 
                  isAlt 
                  getItemQuantity={getItemQuantity}
                  addToCart={addToCart}
                  showComparison={showComparison}
                  brandedMrp={brandedMrp}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-full sm:max-w-md">
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
