
"use client"

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Info,
  ShieldCheck,
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
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart } = useCart();

  // 1. Fetch Static Clinical Details
  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  const { data: staticProduct, isLoading: productLoading } = useDoc(productRef);

  // 2. Fetch Live Price & Stock for Current Product
  const [liveData, setLiveData] = useState<{ mrp: number, price: number, stock: number } | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    if (!db || !id) return;
    const liveRef = doc(db, 'product_live_data', id);
    getDoc(liveRef).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setLiveData({
          mrp: d.mrp || 0,
          price: d.sahimed_price || 0,
          stock: d.stock_quantity || 0
        });
      }
      setLiveLoading(false);
    }).catch(() => setLiveLoading(false));
  }, [db, id]);

  // 3. Molecule Lookup for plain composition
  const moleculeRef = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId) return null;
    return doc(db, 'moleculeMaster', staticProduct.moleculeId);
  }, [db, staticProduct?.moleculeId]);
  const { data: moleculeData } = useDoc(moleculeRef);

  // 4. Look for Generic Alternative
  const alternativesQuery = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId || staticProduct?.isGeneric) return null;
    return query(
      collection(db, 'medicines'),
      where('moleculeId', '==', staticProduct.moleculeId),
      where('isGeneric', '==', true),
      limit(1)
    );
  }, [db, staticProduct?.moleculeId, staticProduct?.isGeneric]);

  const { data: genericAlternatives } = useCollection(alternativesQuery);
  const genericAlt = genericAlternatives?.[0];

  // 5. Fetch Live Data for Generic Alternative
  const [altLiveData, setAltLiveData] = useState<{ price: number, mrp: number } | null>(null);
  useEffect(() => {
    if (db && genericAlt?.id) {
      const liveRef = doc(db, 'product_live_data', genericAlt.id);
      getDoc(liveRef).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setAltLiveData({ price: d.sahimed_price || 0, mrp: d.mrp || 0 });
        }
      });
    }
  }, [db, genericAlt?.id]);

  if (productLoading || !staticProduct) {
    return (
      <div className="min-h-screen bg-[#F0F9FF]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[400px] rounded-[40px]" /></main>
      </div>
    );
  }

  const currentPrice = liveData?.price || staticProduct.price || 0;
  const currentMrp = liveData?.mrp || staticProduct.mrp || 0;
  const isOutOfStock = (liveData?.stock ?? staticProduct.availableQuantity ?? 0) <= 0;

  const brandedSavings = currentMrp > currentPrice 
    ? { percent: Math.round(((currentMrp - currentPrice) / currentMrp) * 100), amount: currentMrp - currentPrice }
    : null;

  const genericSavings = (currentPrice > 0 && altLiveData?.price)
    ? { percent: Math.round(((currentPrice - altLiveData.price) / currentPrice) * 100), amount: currentPrice - altLiveData.price }
    : null;

  const InteractionCard = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-start gap-5 hover:shadow-xl transition-all">
      <div className="w-12 h-12 bg-primary/5 rounded-[20px] flex items-center justify-center text-primary shrink-0"><Icon className="w-6 h-6" /></div>
      <div className="flex flex-col">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">{title}</h4>
        <p className="text-[12px] font-bold text-gray-700 leading-relaxed uppercase">{description || "No specific interaction details provided."}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F9FF] pb-32">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        
        {/* CLINICAL HEADER */}
        <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
              <Dna className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                ACTIVE FORMULA: {moleculeData?.molecule || staticProduct.saltComposition || "Clinical Formula"}
              </span>
           </div>
           
           {staticProduct.prescriptionRequired && (
             <div className="flex justify-center">
               <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[9px] px-6 py-1.5 uppercase tracking-[0.2em] flex items-center gap-2">
                 <AlertTriangle className="w-3.5 h-3.5" /> Prescription Required
               </Badge>
             </div>
           )}
        </div>

        {/* COMPARISON HUB */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
              {genericAlt ? "GENERIC ALTERNATIVE IDENTIFIED" : "PRODUCT SELECTION"}
            </h2>
            {genericSavings && (
              <Badge className="bg-accent text-white font-black text-[9px] px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
                SWITCH & SAVE ₹{genericSavings.amount}
              </Badge>
            )}
          </div>

          <div className="flex flex-row items-stretch gap-4 sm:gap-8 overflow-x-auto scrollbar-hide pb-4 sm:pb-0">
            
            {/* CARD 1: CURRENT SELECTION */}
            <Card className="basis-1/2 min-w-[300px] sm:min-w-0 flex-shrink-0 flex-grow rounded-[40px] border-none bg-white p-8 flex flex-col gap-6 shadow-xl relative group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">CURRENT SELECTION</span>
                <Badge variant="outline" className="text-[8px] font-black uppercase rounded-md">{staticProduct.isGeneric ? 'GENERIC' : 'BRANDED'}</Badge>
              </div>

              <div className="space-y-6 flex-1">
                {/* 1. Item Name */}
                <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight leading-tight line-clamp-2 min-h-[3rem]">
                  {staticProduct.name}
                </h3>

                {/* 2. Pack */}
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-primary opacity-40" />
                  <span className="text-[11px] font-black text-gray-500 uppercase">{staticProduct.packSize || "N/A"}</span>
                </div>

                {/* 3. Manufacturer */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Marketing Company</span>
                  <span className="text-[11px] font-black text-gray-900 uppercase truncate">{staticProduct.manufacturer}</span>
                </div>

                {/* 4. Unit Price */}
                <div className="pt-4 border-t border-dashed">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Sahimed Price</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-gray-900">₹{currentPrice}</span>
                    <span className="text-sm text-red-400 font-bold line-through">MRP ₹{currentMrp}</span>
                  </div>
                </div>
              </div>

              {/* 5. Saving % Amount */}
              <div className="mt-auto">
                {brandedSavings ? (
                  <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span className="text-[10px] font-black text-green-600 uppercase">Save {brandedSavings.percent}%</span>
                    </div>
                    <span className="text-[10px] font-black text-green-600">₹{brandedSavings.amount} Off</span>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-center">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Clinically Verified Choice</span>
                  </div>
                )}
                
                <Button 
                  onClick={() => addToCart(staticProduct)} 
                  disabled={isOutOfStock}
                  className="w-full h-16 rounded-full mt-4 font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Clinical Bag"}
                </Button>
              </div>
            </Card>

            {/* CARD 2: RECOMMENDED CHOICE (Visible only if generic alternative exists) */}
            {genericAlt ? (
              <Card className="basis-1/2 min-w-[300px] sm:min-w-0 flex-shrink-0 flex-grow rounded-[40px] border-none bg-accent/5 p-8 flex flex-col gap-6 shadow-2xl border-2 border-dashed border-accent/20 hover:scale-[1.02] transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">RECOMMENDED CHOICE</span>
                  <Badge className="bg-accent text-white text-[8px] font-black uppercase rounded-md shadow-sm">GENERIC</Badge>
                </div>

                <div className="space-y-6 flex-1">
                  {/* 1. Item Name */}
                  <h3 className="font-black text-lg text-accent uppercase tracking-tight leading-tight line-clamp-2 min-h-[3rem]">
                    {genericAlt.name}
                  </h3>

                  {/* 2. Pack */}
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-accent opacity-40" />
                    <span className="text-[11px] font-black text-accent/70 uppercase">{genericAlt.packSize || "N/A"}</span>
                  </div>

                  {/* 3. Manufacturer */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-accent/40 uppercase tracking-widest">Marketing Company</span>
                    <span className="text-[11px] font-black text-accent uppercase truncate">{genericAlt.manufacturer}</span>
                  </div>

                  {/* 4. Unit Price */}
                  <div className="pt-4 border-t border-dashed border-accent/20">
                    <p className="text-[8px] font-black text-accent/60 uppercase mb-1">Sahimed Price</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-accent">₹{altLiveData?.price || '...'}</span>
                      <span className="text-sm text-gray-400 font-bold line-through">MRP ₹{altLiveData?.mrp || '...'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Saving % Amount */}
                <div className="mt-auto">
                  {genericSavings ? (
                    <div className="bg-accent text-white p-4 rounded-2xl flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-current" />
                        <span className="text-[10px] font-black uppercase">Switch & Save {genericSavings.percent}%</span>
                      </div>
                      <span className="text-[10px] font-black uppercase">₹{genericSavings.amount} More Off</span>
                    </div>
                  ) : (
                    <div className="bg-white/50 border border-accent/10 p-4 rounded-2xl flex items-center justify-center">
                      <span className="text-[9px] font-black text-accent uppercase">Clinical Best Value</span>
                    </div>
                  )}
                  
                  <Link href={`/product/${genericAlt.id}`} className="block mt-4">
                    <Button className="w-full h-16 rounded-full font-black uppercase text-xs tracking-widest bg-primary text-white shadow-xl active:scale-95 transition-all">
                      View Generic Alternative
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="basis-1/2 hidden sm:flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-[40px] border border-dashed">
                <ShieldCheck className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Generic Alternative Available for this SKU</p>
              </div>
            )}

          </div>
        </section>

        {/* CLINICAL DATA SECTION */}
        <section className="bg-white rounded-[48px] p-6 sm:p-14 shadow-2xl border border-gray-50 overflow-hidden">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-100 p-1.5 rounded-full h-16 w-full max-w-[600px] flex mx-auto mb-12">
              <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[10px] uppercase tracking-widest">Clinical Data</TabsTrigger>
              <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[10px] uppercase tracking-widest">Safety Advice</TabsTrigger>
              <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[10px] uppercase tracking-widest">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-10 animate-in fade-in duration-500">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-10 space-y-4">
                     <div className="flex items-center gap-3"><ClipboardList className="w-5 h-5 text-primary" /><h3 className="text-lg font-black uppercase text-gray-900 tracking-tight">Primary Treatment</h3></div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.treatment || "Standard clinical protocol based on bio-equivalent efficacy standards."}</p>
                  </div>
                  <div className="pt-10 space-y-4">
                     <div className="flex items-center gap-3"><Info className="w-5 h-5 text-primary" /><h3 className="text-lg font-black uppercase text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase">{staticProduct.description || "Active pharmaceutical ingredients formulated for optimal stability."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-orange-50/50 p-8 rounded-[40px] border border-orange-100 flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><ShieldAlert className="w-7 h-7 text-orange-600" /></div>
                    <div><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2">Patient Safety</h4><p className="text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{staticProduct.safetyAdvice || "Consult clinical supervisor before use."}</p></div>
                  </div>
                  <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-7 h-7 text-blue-600" /></div>
                    <div><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Usage Protocol</h4><p className="text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{staticProduct.howToUse || "Take exactly as directed by healthcare professional."}</p></div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <InteractionCard icon={Beer} title="Alcohol Interaction" description={staticProduct.alcoholInteraction} />
              <InteractionCard icon={Baby} title="Pregnancy Protocol" description={staticProduct.pregnancyInteraction} />
              <InteractionCard icon={Milk} title="Lactation Caution" description={staticProduct.lactationInteraction} />
              <InteractionCard icon={Car} title="Driving Safety" description={staticProduct.drivingInteraction} />
              <InteractionCard icon={ShieldPlus} title="Kidney Safety" description={staticProduct.kidneyInteraction} />
              <InteractionCard icon={ShieldAlert} title="Liver Protocol" description={staticProduct.liverInteraction} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

// Sub-components for clarity
const ShieldPlus = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
