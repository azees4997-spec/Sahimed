
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
  TrendingDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, getDoc, query, collection, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart } = useCart();

  // 1. Fetch Static Clinical Details
  const productRef = useMemoFirebase(() => (!db || !id) ? null : doc(db, 'medicines', id), [db, id]);
  const { data: staticProduct, isLoading: productLoading } = useDoc(productRef);

  // 2. Fetch Live Price & Stock
  const [liveData, setLiveData] = useState<{ mrp: number, price: number, stock: number } | null>(null);
  useEffect(() => {
    if (db && staticProduct?.sku) {
      getDoc(doc(db, 'product_live_data', staticProduct.sku)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ mrp: d.mrp || 0, price: d.sahimed_price || 0, stock: d.stock_quantity || 0 });
        }
      });
    }
  }, [db, staticProduct?.sku]);

  // 3. Alternatives Logic
  const alternativesQuery = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId || staticProduct?.isGeneric) return null;
    return query(collection(db, 'medicines'), where('moleculeId', '==', staticProduct.moleculeId), where('isGeneric', '==', true), limit(1));
  }, [db, staticProduct?.moleculeId, staticProduct?.isGeneric]);
  const { data: genericAlternatives } = useCollection(alternativesQuery);
  const genericAlt = genericAlternatives?.[0];

  const [altLiveData, setAltLiveData] = useState<{ price: number, mrp: number } | null>(null);
  useEffect(() => {
    if (db && genericAlt?.sku) {
      getDoc(doc(db, 'product_live_data', genericAlt.sku)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setAltLiveData({ price: d.sahimed_price || 0, mrp: d.mrp || 0 });
        }
      });
    }
  }, [db, genericAlt?.sku]);

  if (productLoading || !staticProduct) {
    return (<div className="min-h-screen bg-[#F0F9FF]"><Navbar /><main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[40px]" /></main></div>);
  }

  const currentPrice = liveData?.price || 0;
  const isOutOfStock = (liveData?.stock || 0) <= 0;
  const packNum = parseInt(staticProduct.packSize?.match(/\d+/)?.[0] || "1");
  const unitCost = (currentPrice / packNum).toFixed(2);

  const altPrice = altLiveData?.price || 0;
  const altPackNum = parseInt(genericAlt?.packSize?.match(/\d+/)?.[0] || "1");
  const altUnitCost = (altPrice / altPackNum).toFixed(2);

  const InteractionCard = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-start gap-5 hover:shadow-xl transition-all">
      <div className="w-12 h-12 bg-primary/5 rounded-[20px] flex items-center justify-center text-primary shrink-0"><Icon className="w-6 h-6" /></div>
      <div className="flex flex-col">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">{title}</h4>
        <p className="text-[12px] font-bold text-gray-700 leading-relaxed uppercase">{description || "Standard Clinical Protocol"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F9FF] pb-32">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        
        {/* 1. ACTIVE FORMULA BADGE */}
        <div className="text-center mb-8 space-y-4">
           <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
              <Dna className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                ACTIVE FORMULA: {staticProduct.saltComposition?.split('(')[0] || "Clinical Molecule"}
              </span>
           </div>
           {staticProduct.prescriptionRequired && (
             <div className="flex justify-center">
               <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[9px] px-6 py-1.5 uppercase tracking-widest flex items-center gap-2">
                 <AlertTriangle className="w-3.5 h-3.5" /> Prescription Required
               </Badge>
             </div>
           )}
        </div>

        {/* 2. RESPONSIVE SIDE-BY-SIDE GRID */}
        <div className="max-w-[1200px] mx-auto mb-16">
          <div className="grid grid-cols-2 gap-2 sm:gap-8 items-stretch">
            
            {/* CURRENT SELECTION CARD */}
            <Card className="rounded-[24px] sm:rounded-[40px] border-none bg-white p-4 sm:p-10 flex flex-col gap-4 sm:gap-6 shadow-xl relative overflow-hidden">
              <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">CURRENT SELECTION</span>
              <div className="space-y-3 sm:space-y-6 flex-1">
                <h3 className="font-black text-[11px] sm:text-lg text-gray-900 uppercase leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[3rem]">{staticProduct.name}</h3>
                <p className="text-[8px] sm:text-[11px] font-black text-gray-500 uppercase">{staticProduct.packSize || "N/A"}</p>
                <p className="text-[8px] sm:text-[11px] font-bold text-gray-400 uppercase truncate">{staticProduct.manufacturer}</p>
                
                <div className="pt-4 border-t border-dashed">
                  <p className="text-[14px] sm:text-3xl font-black text-accent tracking-tighter">₹{currentPrice}</p>
                  <p className="text-[8px] sm:text-xs text-gray-400 font-bold">₹{unitCost} per unit</p>
                </div>
              </div>
              <Button onClick={() => addToCart(staticProduct)} disabled={isOutOfStock} className="w-full h-10 sm:h-16 rounded-full font-black uppercase text-[9px] sm:text-xs tracking-widest shadow-lg">
                {isOutOfStock ? "Out of Stock" : "Add to Bag"}
              </Button>
            </Card>

            {/* RECOMMENDED CHOICE CARD */}
            {genericAlt ? (
              <Card className="rounded-[24px] sm:rounded-[40px] border-none bg-accent/5 p-4 sm:p-10 flex flex-col gap-4 sm:gap-6 shadow-2xl border-2 border-dashed border-accent/20">
                <span className="text-[7px] sm:text-[9px] font-black text-accent uppercase tracking-widest">RECOMMENDED CHOICE</span>
                <div className="space-y-3 sm:space-y-6 flex-1">
                  <h3 className="font-black text-[11px] sm:text-lg text-accent uppercase leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[3rem]">{genericAlt.name}</h3>
                  <p className="text-[8px] sm:text-[11px] font-black text-accent/70 uppercase">{genericAlt.packSize || "N/A"}</p>
                  <p className="text-[8px] sm:text-[11px] font-bold text-accent/40 uppercase truncate">{genericAlt.manufacturer}</p>
                  
                  <div className="pt-4 border-t border-dashed border-accent/20">
                    <p className="text-[14px] sm:text-3xl font-black text-accent tracking-tighter">₹{altPrice}</p>
                    <p className="text-[8px] sm:text-xs text-accent/60 font-bold">₹{altUnitCost} per unit</p>
                  </div>
                </div>
                <Link href={`/product/${genericAlt.id}`} className="mt-auto">
                  <div className="bg-accent text-white p-2 sm:p-4 rounded-xl sm:rounded-2xl text-center mb-4 shadow-xl">
                    <p className="text-[7px] sm:text-[10px] font-black uppercase">SWITCH & SAVE {Math.round(((currentPrice - altPrice) / currentPrice) * 100)}%</p>
                  </div>
                  <Button variant="outline" className="w-full h-10 sm:h-16 rounded-full font-black uppercase text-[9px] sm:text-xs border-2">View Alternative</Button>
                </Link>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-[40px] border border-dashed">
                <Info className="w-8 h-8 text-gray-200 mb-4" />
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Generic Match Not Indexed</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. CLINICAL DATA SECTION */}
        <section className="bg-white rounded-[48px] p-6 sm:p-14 shadow-2xl border border-gray-50">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-100 p-1.5 rounded-full h-16 w-full max-w-[600px] flex mx-auto mb-12">
              <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[10px] uppercase tracking-widest">Clinical Data</TabsTrigger>
              <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[10px] uppercase tracking-widest">Safety Advice</TabsTrigger>
              <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[10px] uppercase tracking-widest">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-10">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-10 space-y-4">
                     <div className="flex items-center gap-3"><ClipboardList className="w-5 h-5 text-primary" /><h3 className="text-lg font-black uppercase text-gray-900 tracking-tight">Primary Treatment</h3></div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.treatment || "Standard clinical protocol based on bio-equivalent standards."}</p>
                  </div>
                  <div className="pt-10 space-y-4">
                     <div className="flex items-center gap-3"><Info className="w-5 h-5 text-primary" /><h3 className="text-lg font-black uppercase text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.description || "Active pharmaceutical ingredients formulated for optimal stability."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-orange-50/50 p-8 rounded-[40px] border border-orange-100 flex gap-6">
                 <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><AlertTriangle className="w-7 h-7 text-orange-600" /></div>
                 <div><h4 className="text-[10px] font-black uppercase text-orange-600 mb-2">Patient Safety</h4><p className="text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{staticProduct.safetyAdvice || "Consult clinical supervisor before use."}</p></div>
               </div>
               <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 flex gap-6">
                 <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-7 h-7 text-blue-600" /></div>
                 <div><h4 className="text-[10px] font-black uppercase text-blue-600 mb-2">Usage Protocol</h4><p className="text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{staticProduct.howToUse || "Take exactly as directed by professional."}</p></div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InteractionCard icon={Beer} title="Alcohol Interaction" description={staticProduct.alcoholInteraction} />
              <InteractionCard icon={Baby} title="Pregnancy Protocol" description={staticProduct.pregnancyInteraction} />
              <InteractionCard icon={Milk} title="Lactation Caution" description={staticProduct.lactationInteraction} />
              <InteractionCard icon={Car} title="Driving Safety" description={staticProduct.drivingInteraction} />
              <InteractionCard icon={Package} title="Kidney Safety" description={staticProduct.kidneyInteraction} />
              <InteractionCard icon={ShieldAlert} title="Liver Protocol" description={staticProduct.liverInteraction} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
