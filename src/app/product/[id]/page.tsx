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
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { addToCart, getItemQuantity, updateQuantity } = useCart();

  // 1. Fetch Static Clinical Profile
  const productRef = useMemoFirebase(() => (!db || !id) ? null : doc(db, 'medicines', id), [db, id]);
  const { data: staticProduct, isLoading: productLoading } = useDoc(productRef);

  // 2. Dynamic Data Handshake (Universal SKU Fetching)
  const [liveData, setLiveData] = useState<{ mrp: number, price: number, stock: number } | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

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
        } else {
          setLiveData({ mrp: 0, price: 0, stock: 0 });
        }
        setIsLiveLoading(false);
      }, (err) => {
        setIsLiveLoading(false);
      });
      return () => unsubscribe();
    }
  }, [db, staticProduct?.sku, staticProduct?.id]);

  // 3. Clinical Molecule Metadata
  const molRef = useMemoFirebase(() => (!db || !staticProduct?.moleculeId) ? null : doc(db, 'moleculeMaster', staticProduct.moleculeId), [db, staticProduct?.moleculeId]);
  const { data: molData } = useDoc(molRef);

  // 4. Alternatives Logic (Generic Mapping)
  const alternativesQuery = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId || staticProduct?.isGeneric) return null;
    return query(collection(db, 'medicines'), where('moleculeId', '==', staticProduct.moleculeId), where('isGeneric', '==', true), limit(1));
  }, [db, staticProduct?.moleculeId, staticProduct?.isGeneric]);
  
  const { data: genericAlternatives } = useCollection(alternativesQuery);
  const genericAlt = genericAlternatives?.[0];

  // 5. Dynamic Data Handshake for Alternative Choice
  const [altLiveData, setAltLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);
  const [isAltLiveLoading, setIsAltLiveLoading] = useState(true);

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
        } else {
          setAltLiveData({ price: 0, mrp: 0, stock: 0 });
        }
        setIsAltLiveLoading(false);
      }, (err) => {
        setIsAltLiveLoading(false);
      });
      return () => unsubscribe();
    } else if (genericAlt === null || (!productLoading && !genericAlt)) {
      setIsAltLiveLoading(false);
    }
  }, [db, genericAlt?.sku, genericAlt?.id, productLoading]);

  if (productLoading || !staticProduct) {
    return (<div className="min-h-screen bg-[#F8F8F8]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[40px]" /></main></div>);
  }

  const ComparisonCard = ({ product, live, label, isAlt = false, isLoading = false, comparePrice = 0 }: { product: any, live: any, label: string, isAlt?: boolean, isLoading?: boolean, comparePrice?: number }) => {
    const qty = getItemQuantity(product.id);
    const pPrice = live?.price || 0;
    const pMrp = live?.mrp || 0;
    const pPackNum = parseInt(product.packSize?.match(/\d+/)?.[0] || "1");
    const pUnitCost = pPrice > 0 ? (pPrice / pPackNum).toFixed(2) : "0.00";
    const pIsOutOfStock = live ? live.stock <= 0 : false;
    
    const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
      ? product.imageUrl
      : `https://picsum.photos/seed/${product.id}/300/300`;

    let savingsPercent = 0;
    let savingsAmount = 0;
    if (isAlt && comparePrice > pPrice && pPrice > 0) {
      savingsAmount = comparePrice - pPrice;
      savingsPercent = Math.round((savingsAmount / comparePrice) * 100);
    }

    return (
      <Card className={cn(
        "rounded-[20px] sm:rounded-[32px] p-3 sm:p-6 flex flex-col h-full border shadow-sm transition-all overflow-hidden relative",
        isAlt ? "bg-accent/5 border-dashed border-accent/20" : "bg-white border-gray-100"
      )}>
        <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{label}</span>
        
        {/* Medicine Image */}
        <div className="relative aspect-square w-full bg-white rounded-xl mb-3 overflow-hidden border border-gray-50 flex items-center justify-center p-2">
          <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-1" />
          {pIsOutOfStock && !isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/90 px-2 py-1 rounded-full border border-orange-100 text-[7px] font-black text-orange-600 uppercase tracking-widest">Out of Stock</span>
            </div>
          )}
        </div>

        {/* 6-Attribute Clinical Clinical Sequence */}
        <div className="flex-1 space-y-1">
          <h3 className="font-black text-[11px] sm:text-[15px] text-gray-900 uppercase leading-tight line-clamp-2 min-h-[2.2rem]">
            {product.name}
          </h3>
          <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
            {product.packSize || "N/A"}
          </p>
          <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase truncate">
            {product.manufacturer}
          </p>

          <div className="pt-2 border-t border-dashed mt-2">
            <div className="flex items-baseline gap-1">
              <p className={cn("text-lg sm:text-2xl font-black tracking-tighter", pPrice > 0 ? "text-accent" : "text-gray-300")}>
                {isLoading ? <span className="animate-pulse">...</span> : `₹${pPrice}`}
              </p>
              {!isLoading && pMrp > pPrice && pPrice > 0 && (
                <span className="text-[8px] sm:text-[10px] text-red-400 line-through font-bold">₹{pMrp}</span>
              )}
            </div>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              {isLoading ? "Checking..." : `₹${pUnitCost} per unit`}
            </p>
          </div>
        </div>

        {!isLoading && savingsPercent > 0 && (
          <div className="mt-3 bg-accent text-white py-1.5 rounded-lg text-center shadow-md">
            <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-tight">SAVE {savingsPercent}% (₹{savingsAmount.toFixed(0)})</p>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <Button disabled className="w-full h-9 sm:h-12 rounded-full bg-gray-50 text-gray-400 font-black text-[7px] sm:text-[9px] uppercase tracking-widest gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking...
            </Button>
          ) : pIsOutOfStock ? (
            <Button disabled className="w-full h-9 sm:h-12 rounded-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest bg-gray-100 text-gray-400">Out of Stock</Button>
          ) : qty > 0 ? (
            <div className="flex items-center gap-1 rounded-full p-1 bg-primary text-white h-9 sm:h-12 shadow-lg">
              <button onClick={() => updateQuantity(product.id, -1)} className="flex-1 h-full flex items-center justify-center font-bold">-</button>
              <span className="text-[8px] sm:text-[10px] font-black flex-1 text-center uppercase">{qty}</span>
              <button onClick={() => updateQuantity(product.id, 1)} className="flex-1 h-full flex items-center justify-center font-bold">+</button>
            </div>
          ) : (
            <Button 
              onClick={() => addToCart(product)} 
              className={cn("w-full h-9 sm:h-12 rounded-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest gap-2 shadow-xl", isAlt ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}
            >
              ADD <ShoppingCart className="w-3 sm:w-4 h-3 sm:h-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-32 pharma-bg-pattern page-transition-wrapper">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-3 sm:px-10 py-8">
        
        {/* Top Header: Plain Clinical Composition Only */}
        <div className="text-center mb-8 space-y-3">
           <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2.5 rounded-full border border-primary/20 shadow-sm">
              <Dna className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-base font-black text-primary uppercase tracking-[0.2em]">
                {molData?.molecule || staticProduct.name.split(' ')[0]}
              </span>
           </div>
           {staticProduct.prescriptionRequired && (
             <div className="flex justify-center">
               <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[9px] px-4 py-1.5 uppercase tracking-widest flex items-center gap-2 shadow-sm">
                 <AlertTriangle className="w-3.5 h-3.5" /> Prescription Required
               </Badge>
             </div>
           )}
        </div>

        {/* Strict 2-Card Horizontal Comparison (Forced Mobile Side-by-Side) */}
        <div className="mb-12">
          <div className="grid grid-cols-2 gap-2 sm:gap-10 items-stretch">
            <ComparisonCard 
              product={staticProduct} 
              live={liveData} 
              label="CURRENT SELECTION" 
              isLoading={isLiveLoading}
            />
            
            {genericAlt ? (
              <ComparisonCard 
                product={genericAlt} 
                live={altLiveData} 
                label="RECOMMENDED CHOICE" 
                isAlt 
                isLoading={isAltLiveLoading}
                comparePrice={liveData?.price || 0}
              />
            ) : !productLoading && (
              <div className="rounded-[20px] sm:rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 text-center bg-gray-50/50 h-full">
                <Package className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Generic Alternative Pending</p>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Tabs */}
        <section className="bg-white rounded-[40px] p-6 sm:p-16 shadow-2xl border border-gray-100 overflow-hidden">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-full h-12 sm:h-16 w-full max-w-[600px] flex mx-auto mb-10 sm:mb-16">
              <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-xs uppercase tracking-[0.15em]">Clinical</TabsTrigger>
              <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-xs uppercase tracking-[0.15em]">Safety</TabsTrigger>
              <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-xs uppercase tracking-[0.15em]">Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-8 space-y-3">
                     <div className="flex items-center gap-3"><ClipboardList className="w-5 h-5 text-primary" /><h3 className="text-sm sm:text-lg font-black uppercase text-gray-900 tracking-tight">Primary Treatment</h3></div>
                     <p className="text-[11px] sm:text-[14px] font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.treatment || "Precision clinical protocol."}</p>
                  </div>
                  <div className="pt-8 space-y-3">
                     <div className="flex items-center gap-3"><Info className="w-5 h-5 text-primary" /><h3 className="text-sm sm:text-lg font-black uppercase text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-[11px] sm:text-[14px] font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.description || "Active clinical formulation."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 flex gap-4">
                 <div className="w-12 h-12 sm:w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border"><AlertTriangle className="w-6 h-6 text-orange-600" /></div>
                 <div><h4 className="text-[10px] sm:text-sm font-black uppercase text-orange-600 mb-1">Clinical Caution</h4><p className="text-[10px] sm:text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{staticProduct.safetyAdvice || "Follow professional clinical guidance."}</p></div>
               </div>
               <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 flex gap-4">
                 <div className="w-12 h-12 sm:w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-6 h-6 text-blue-600" /></div>
                 <div><h4 className="text-[10px] sm:text-sm font-black uppercase text-blue-600 mb-1">Usage Protocol</h4><p className="text-[10px] sm:text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{staticProduct.howToUse || "Follow clinical instructions carefully."}</p></div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
              {[
                { icon: Dna, title: "Clinical Composition", text: staticProduct.saltComposition },
                { icon: Baby, title: "Pregnancy Protocol", text: staticProduct.pregnancyInteraction },
                { icon: Milk, title: "Lactation Caution", text: staticProduct.lactationInteraction },
                { icon: Car, title: "Driving Stability", text: staticProduct.drivingInteraction },
                { icon: Package, title: "Renal Safety", text: staticProduct.kidneyInteraction },
                { icon: ShieldAlert, title: "Hepatic Protocol", text: staticProduct.liverInteraction }
              ].map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-start gap-4 hover:shadow-lg transition-all">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0"><item.icon className="w-5 h-5" /></div>
                  <div className="flex flex-col">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-0.5">{item.title}</h4>
                    <p className="text-[10px] font-bold text-gray-700 leading-relaxed uppercase">{item.text || "Clinical standards apply"}</p>
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