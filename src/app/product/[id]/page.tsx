
"use client"

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Info,
  Beer,
  Baby,
  Milk,
  Car,
  ShieldAlert,
  Stethoscope,
  ClipboardList,
  Dna,
  Zap,
  AlertTriangle,
  Package,
  Loader2,
  ShoppingCart,
  TrendingDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, getDoc, query, collection, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, getItemQuantity, updateQuantity } = useCart();

  // 1. Fetch Static Clinical Details
  const productRef = useMemoFirebase(() => (!db || !id) ? null : doc(db, 'medicines', id), [db, id]);
  const { data: staticProduct, isLoading: productLoading } = useDoc(productRef);

  // 2. Fetch Molecule Metadata for Header
  const molRef = useMemoFirebase(() => (!db || !staticProduct?.moleculeId) ? null : doc(db, 'moleculeMaster', staticProduct.moleculeId), [db, staticProduct?.moleculeId]);
  const { data: molData } = useDoc(molRef);

  // 3. Fetch Live Price & Stock for Main Product
  const [liveData, setLiveData] = useState<{ mrp: number, price: number, stock: number } | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  useEffect(() => {
    if (db && staticProduct?.sku) {
      setIsLiveLoading(true);
      getDoc(doc(db, 'product_live_data', staticProduct.sku)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ 
            mrp: Number(d.mrp) || 0, 
            price: Number(d.sahimed_price) || 0, 
            stock: Number(d.stock_quantity) ?? 0 
          });
        }
        setIsLiveLoading(false);
      });
    }
  }, [db, staticProduct?.sku]);

  // 4. Alternatives Logic (Branded to Generic Mapping)
  const alternativesQuery = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId || staticProduct?.isGeneric) return null;
    return query(collection(db, 'medicines'), where('moleculeId', '==', staticProduct.moleculeId), where('isGeneric', '==', true), limit(1));
  }, [db, staticProduct?.moleculeId, staticProduct?.isGeneric]);
  
  const { data: genericAlternatives } = useCollection(alternativesQuery);
  const genericAlt = genericAlternatives?.[0];

  const [altLiveData, setAltLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);
  useEffect(() => {
    if (db && genericAlt?.sku) {
      getDoc(doc(db, 'product_live_data', genericAlt.sku)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setAltLiveData({ 
            price: Number(d.sahimed_price) || 0, 
            mrp: Number(d.mrp) || 0, 
            stock: Number(d.stock_quantity) ?? 0 
          });
        }
      });
    }
  }, [db, genericAlt?.sku]);

  if (productLoading || !staticProduct) {
    return (<div className="min-h-screen bg-[#F8F8F8]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[40px]" /></main></div>);
  }

  const currentPrice = liveData?.price || 0;
  const altPrice = altLiveData?.price || 0;

  const savingsPercentage = (currentPrice > 0 && altPrice > 0) 
    ? Math.round(((currentPrice - altPrice) / currentPrice) * 100) 
    : 0;

  const ProductComparisonCard = ({ product, live, label, isAlt = false }: { product: any, live: any, label: string, isAlt?: boolean }) => {
    const qty = getItemQuantity(product.id);
    const pPrice = live?.price || 0;
    const pPackNum = parseInt(product.packSize?.match(/\d+/)?.[0] || "1");
    const pUnitCost = pPrice > 0 ? (pPrice / pPackNum).toFixed(2) : "0.00";
    const pIsOutOfStock = live ? live.stock <= 0 : false;

    return (
      <Card className={cn(
        "rounded-[20px] sm:rounded-[32px] p-2.5 sm:p-6 flex flex-col h-full border shadow-sm transition-all relative overflow-hidden",
        isAlt ? "bg-accent/5 border-dashed border-accent/20" : "bg-white border-gray-100"
      )}>
        <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
          {label}
        </span>
        
        <div className="flex-1 space-y-1 sm:space-y-3">
          <h3 className="font-black text-[11px] sm:text-base text-gray-900 uppercase leading-tight line-clamp-2 min-h-[1.8rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="space-y-0.5">
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase">{product.packSize || "N/A"}</p>
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase truncate">{product.manufacturer}</p>
          </div>

          <div className="pt-1.5 sm:pt-3 border-t border-dashed">
            <div className="flex items-baseline gap-1">
              <p className={cn("text-[13px] sm:text-2xl font-black tracking-tighter", isAlt ? "text-accent" : "text-primary")}>
                ₹{isLiveLoading ? '...' : pPrice}
              </p>
              {live?.mrp > pPrice && (
                <span className="text-[8px] sm:text-[10px] text-red-400 line-through font-bold">₹{live.mrp}</span>
              )}
            </div>
            <p className="text-[7px] sm:text-[10px] text-gray-400 font-bold">₹{pUnitCost} per unit</p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {isAlt && savingsPercentage > 0 && (
            <div className="bg-accent text-white py-1 rounded-lg text-center shadow-lg">
              <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-tight">SAVE {savingsPercentage}%</p>
            </div>
          )}
          
          {pIsOutOfStock ? (
            <Button disabled className="w-full h-7 sm:h-12 rounded-full font-black uppercase text-[7px] sm:text-[10px] tracking-widest bg-gray-100 text-gray-400">Out of Stock</Button>
          ) : qty > 0 ? (
            <div className="flex items-center gap-1 rounded-full p-0.5 sm:p-1 bg-primary text-white h-7 sm:h-12">
              <button onClick={() => updateQuantity(product.id, -1)} className="flex-1 h-full flex items-center justify-center font-bold text-xs">-</button>
              <span className="text-[8px] sm:text-[11px] font-black flex-1 text-center">{qty}</span>
              <button onClick={() => updateQuantity(product.id, 1)} className="flex-1 h-full flex items-center justify-center font-bold text-xs">+</button>
            </div>
          ) : (
            <Button 
              onClick={() => addToCart(product)} 
              className={cn("w-full h-7 sm:h-12 rounded-full font-black uppercase text-[7px] sm:text-[10px] tracking-widest gap-1.5 shadow-lg", isAlt ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}
            >
              Add <ShoppingCart className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-32">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-10 py-6">
        
        {/* 1. CLEAN CLINICAL HEADER - PLAIN COMPOSITION ONLY */}
        <div className="text-center mb-6 sm:mb-10 space-y-3">
           <div className="inline-flex items-center gap-2 bg-primary/10 px-5 py-2 rounded-full border border-primary/20 shadow-sm">
              <Dna className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.1em]">
                {molData?.molecule || staticProduct.name.split(' ')[0]}
              </span>
           </div>
           {staticProduct.prescriptionRequired && (
             <div className="flex justify-center">
               <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[8px] sm:text-[9px] px-4 py-1 uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-sm">
                 <AlertTriangle className="w-3 h-3" /> Prescription Required
               </Badge>
             </div>
           )}
        </div>

        {/* 2. STRICT SIDE-BY-SIDE GRID (ANTI-STACKING ON MOBILE) */}
        <div className="max-w-[1200px] mx-auto mb-10 sm:mb-16">
          {genericAlt ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-6 items-stretch">
              <ProductComparisonCard 
                product={staticProduct} 
                live={liveData} 
                label="CURRENT SELECTION" 
              />
              <ProductComparisonCard 
                product={genericAlt} 
                live={altLiveData} 
                label="RECOMMENDED CHOICE" 
                isAlt 
              />
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <ProductComparisonCard 
                product={staticProduct} 
                live={liveData} 
                label="PRODUCT PROFILE" 
              />
            </div>
          )}
        </div>

        {/* 3. CLINICAL DATA TABS */}
        <section className="bg-white rounded-[32px] sm:rounded-[48px] p-6 sm:p-14 shadow-xl border border-gray-100 overflow-hidden">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-full h-12 sm:h-16 w-full max-w-[600px] flex mx-auto mb-8 sm:mb-12">
              <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest">Clinical</TabsTrigger>
              <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest">Safety</TabsTrigger>
              <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-8 space-y-3">
                     <div className="flex items-center gap-3"><ClipboardList className="w-4 h-4 text-primary" /><h3 className="text-sm sm:text-lg font-black uppercase text-gray-900 tracking-tight">Primary Treatment</h3></div>
                     <p className="text-[11px] sm:text-sm font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.treatment || "Standard clinical protocol based on bio-equivalent standards."}</p>
                  </div>
                  <div className="pt-8 space-y-3">
                     <div className="flex items-center gap-3"><Info className="w-4 h-4 text-primary" /><h3 className="text-sm sm:text-lg font-black uppercase text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-[11px] sm:text-sm font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.description || "Active pharmaceutical ingredients formulated for optimal stability."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 flex gap-4">
                 <div className="w-10 h-10 sm:w-14 h-14 bg-white rounded-xl sm:rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600" /></div>
                 <div><h4 className="text-[8px] sm:text-[10px] font-black uppercase text-orange-600 mb-1">Patient Safety</h4><p className="text-[11px] sm:text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{staticProduct.safetyAdvice || "Consult clinical supervisor before use."}</p></div>
               </div>
               <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 flex gap-4">
                 <div className="w-10 h-10 sm:w-14 h-14 bg-white rounded-xl sm:rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" /></div>
                 <div><h4 className="text-[8px] sm:text-[10px] font-black uppercase text-blue-600 mb-1">Usage Protocol</h4><p className="text-[11px] sm:text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{staticProduct.howToUse || "Take exactly as directed by professional."}</p></div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
              {[
                { icon: Beer, title: "Alcohol Interaction", text: staticProduct.alcoholInteraction },
                { icon: Baby, title: "Pregnancy Protocol", text: staticProduct.pregnancyInteraction },
                { icon: Milk, title: "Lactation Caution", text: staticProduct.lactationInteraction },
                { icon: Car, title: "Driving Safety", text: staticProduct.drivingInteraction },
                { icon: Package, title: "Kidney Safety", text: staticProduct.kidneyInteraction },
                { icon: ShieldAlert, title: "Liver Protocol", text: staticProduct.liverInteraction }
              ].map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-start gap-4 hover:shadow-lg transition-all">
                  <div className="w-10 h-10 bg-primary/5 rounded-[12px] flex items-center justify-center text-primary shrink-0"><item.icon className="w-5 h-5" /></div>
                  <div className="flex flex-col">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.title}</h4>
                    <p className="text-[11px] font-bold text-gray-700 leading-relaxed uppercase">{item.text || "Standard Clinical Protocol"}</p>
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
