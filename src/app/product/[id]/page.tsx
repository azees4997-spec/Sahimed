
"use client"

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronRight,
  Info,
  Plus,
  Minus,
  ShieldCheck,
  Beer,
  Baby,
  Milk,
  Car,
  ShieldAlert,
  Stethoscope,
  ClipboardList,
  Loader2,
  Dna,
  Search as SearchIcon,
  Activity,
  HeartPulse,
  Zap,
  Sparkles,
  Wind,
  ShieldPlus,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, getDoc, query, collection, where, limit } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Step 1: Fetch Static Clinical Details
  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  const { data: staticProduct, isLoading: productLoading } = useDoc(productRef);

  // Step 2: Targeted Fetch for Dynamic Triad (Live Price & Stock)
  const [liveData, setLiveData] = useState<{ mrp: number, price: number, stock: number } | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    if (!db || !id) return;
    setLiveLoading(true);
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

  // Step 3: Molecule Plain Composition Lookup
  const moleculeRef = useMemoFirebase(() => {
    if (!db || !staticProduct?.moleculeId) return null;
    return doc(db, 'moleculeMaster', staticProduct.moleculeId);
  }, [db, staticProduct?.moleculeId]);
  const { data: moleculeData } = useDoc(moleculeRef);

  // Step 4: Branded-to-Generic Mapping Rule
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

  // Step 5: Fetch Live Data for the Generic Alternative
  const [altLiveData, setAltLiveData] = useState<{ price: number, mrp: number } | null>(null);
  useEffect(() => {
    if (db && genericAlt?.id) {
      const liveRef = doc(db, 'product_live_data', genericAlt.id);
      getDoc(liveRef).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setAltLiveData({ 
            price: d.sahimed_price || 0,
            mrp: d.mrp || 0
          });
        }
      });
    }
  }, [db, genericAlt?.id]);

  if (productLoading || !staticProduct) {
    return (
      <div className="min-h-screen bg-[#F0F9FF]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8"><Skeleton className="h-[600px] rounded-[40px]" /></main>
      </div>
    );
  }

  const product = {
    ...staticProduct,
    price: liveData?.price || staticProduct.price || 0,
    mrp: liveData?.mrp || staticProduct.mrp || 0,
    availableQuantity: liveData?.stock ?? staticProduct.availableQuantity ?? 0
  };

  const isOutOfStock = product.availableQuantity <= 0;
  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/600/600`;

  const InteractionCard = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-start gap-5 hover:shadow-xl transition-all">
      <div className="w-12 h-12 bg-primary/5 rounded-[20px] flex items-center justify-center text-primary shrink-0"><Icon className="w-6 h-6" /></div>
      <div className="flex flex-col">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">{title}</h4>
        <p className="text-[12px] font-bold text-gray-700 leading-relaxed uppercase">{description || "No specific interaction details provided."}</p>
      </div>
    </div>
  );

  const savingsPercent = (product.price > 0 && altLiveData?.price) 
    ? Math.round(((product.price - altLiveData.price) / product.price) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#F0F9FF] pb-32">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           {/* Plain Composition Header - STRICTLY ONLY COMPOSITION */}
           <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
              <Dna className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {moleculeData?.molecule || product.saltComposition || "Clinical Formula"}
              </span>
           </div>
           
           {/* Prescription Warning */}
           {product.prescriptionRequired && (
             <div className="flex justify-center">
               <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full font-black text-[10px] px-6 py-2 uppercase tracking-[0.2em] animate-pulse flex items-center gap-2">
                 <AlertTriangle className="w-3 h-3" /> Prescription Required
               </Badge>
             </div>
           )}

           <h2 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase tracking-tighter leading-tight">{product.name}</h2>
           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">SKU Profile: {product.sku}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
           <Card className="rounded-[48px] overflow-hidden border-none shadow-2xl bg-white aspect-square relative group">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="w-full h-full relative cursor-zoom-in">
                    <Image 
                      src={safeImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-contain p-12 group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-all">
                       <SearchIcon className="text-primary w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl border-none p-0 overflow-hidden rounded-[48px] shadow-3xl bg-white">
                   <div className="aspect-square relative"><Image src={safeImageUrl} alt={product.name} fill className="object-contain p-12" /></div>
                </DialogContent>
              </Dialog>
              {isOutOfStock && !liveLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm"><Badge variant="destructive" className="font-black text-xs px-6 py-2 rounded-full shadow-2xl">OUT OF STOCK</Badge></div>}
           </Card>

           <div className="flex flex-col justify-center space-y-10">
              <div className="space-y-4">
                 <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full font-black text-[9px] px-4 py-1.5 uppercase tracking-widest">{product.category}</Badge>
                 <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-accent tracking-tighter">₹{product.price}</span>
                    <span className="text-xl text-red-500 font-bold line-through">MRP ₹{product.mrp}</span>
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Inclusive of clinical distribution taxes</p>
              </div>

              <div className="space-y-6 bg-white p-8 rounded-[40px] border shadow-sm">
                 <div className="flex justify-between items-center pb-6 border-b">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pharmacist Notes</span>
                       <span className="font-black text-sm uppercase">{product.manufacturer}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Standard Pack</span>
                       <span className="font-black text-sm uppercase">{product.packSize || "N/A"}</span>
                    </div>
                 </div>
                 
                 {liveLoading ? (
                   <Button disabled className="w-full h-20 rounded-full bg-gray-100 text-gray-400 animate-pulse uppercase font-black text-xs">Syncing Dynamic Triad...</Button>
                 ) : isOutOfStock ? (
                   <Button variant="outline" className="w-full h-20 rounded-full border-2 border-orange-200 text-orange-600 font-black uppercase text-xs tracking-widest bg-orange-50">Notify Availability</Button>
                 ) : (
                   <div className="flex gap-4">
                      <Button onClick={() => addToCart(product)} className="flex-1 h-20 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30">Add to Clinical Bag</Button>
                   </div>
                 )}
              </div>

              <div className="flex items-center gap-4 p-6 bg-accent/5 rounded-[32px] border border-accent/10">
                 <ShieldCheck className="w-8 h-8 text-accent shrink-0" />
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Verified Bio-Equivalent Source • Precision Supply Chain</p>
              </div>
           </div>
        </div>

        {/* FORCED HORIZONTAL SIDE-BY-SIDE COMPARISON */}
        {!product.isGeneric && genericAlt && (
          <div className="bg-white rounded-[40px] p-6 sm:p-10 mb-12 border-2 border-dashed border-accent/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Zap size={120} className="text-accent" />
            </div>
            
            <div className="mb-8 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                <Badge className="bg-accent text-white px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">Switch & Save</Badge>
                {savingsPercent && (
                  <Badge variant="outline" className="border-accent text-accent font-black text-[10px] uppercase px-4 py-1 animate-bounce">
                    SAVE {savingsPercent}%
                  </Badge>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Generic Alternative Identified</h3>
            </div>

            {/* THE FLEX-ROW OVERRIDE: 50/50 SPLIT */}
            <div className="flex flex-row items-stretch gap-4 sm:gap-8 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 scrollbar-hide">
              
              {/* CURRENT BRANDED CARD */}
              <Card className="basis-1/2 min-w-[260px] sm:min-w-0 rounded-[32px] border-none bg-gray-50 p-6 flex flex-col gap-4 shadow-inner relative opacity-80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Current Selection</span>
                  <Badge variant="outline" className="text-[7px] font-black uppercase">BRANDED</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl p-2 border flex items-center justify-center shrink-0">
                    <Image src={safeImageUrl} alt={product.name} width={64} height={64} className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs uppercase truncate">{product.name}</h4>
                    <p className="text-[8px] text-gray-400 font-bold uppercase truncate">{product.manufacturer}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-dashed">
                  <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Branded Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-gray-900">₹{product.price}</span>
                    <span className="text-[10px] text-red-400 line-through">MRP ₹{product.mrp}</span>
                  </div>
                </div>
              </Card>

              {/* RECOMMENDED GENERIC CARD */}
              <Card className="basis-1/2 min-w-[260px] sm:min-w-0 rounded-[32px] border-none bg-accent/5 p-6 flex flex-col gap-4 shadow-xl border border-accent/10 hover:scale-[1.02] transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-black text-accent uppercase tracking-widest">Recommended Choice</span>
                  <Badge className="bg-accent text-white text-[7px] font-black uppercase">GENERIC</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-accent/20 flex items-center justify-center shrink-0 shadow-lg">
                    <Image 
                      src={(genericAlt.imageUrl && typeof genericAlt.imageUrl === 'string' && genericAlt.imageUrl.startsWith('http')) ? genericAlt.imageUrl : `https://picsum.photos/seed/${genericAlt.id}/300/300`} 
                      alt={genericAlt.name} 
                      width={64} 
                      height={64} 
                      className="object-contain" 
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs uppercase truncate text-accent">{genericAlt.name}</h4>
                    <p className="text-[8px] text-gray-400 font-bold uppercase truncate">{genericAlt.manufacturer}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-dashed border-accent/20 flex items-end justify-between">
                  <div>
                    <p className="text-[8px] text-accent font-black uppercase mb-1">Generic Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-accent">₹{altLiveData?.price || '...'}</span>
                      <span className="text-[10px] text-gray-400 line-through">MRP ₹{altLiveData?.mrp || '...'}</span>
                    </div>
                  </div>
                  <Link href={`/product/${genericAlt.id}`}>
                    <Button className="rounded-full h-10 px-6 font-black text-[10px] uppercase bg-primary text-white shadow-lg group-hover:scale-105 transition-transform">
                      VIEW & SAVE
                    </Button>
                  </Link>
                </div>
              </Card>

            </div>
          </div>
        )}

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
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase">{product.treatment || "Standard clinical protocol based on bio-equivalent efficacy standards."}</p>
                  </div>
                  <div className="pt-10 space-y-4">
                     <div className="flex items-center gap-3"><Info className="w-5 h-5 text-primary" /><h3 className="text-lg font-black uppercase text-gray-900 tracking-tight">Pharmacology</h3></div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase">{product.description || "Active pharmaceutical ingredients formulated for optimal stability."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-orange-50/50 p-8 rounded-[40px] border border-orange-100 flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><ShieldAlert className="w-7 h-7 text-orange-600" /></div>
                    <div><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2">Patient Safety</h4><p className="text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{product.safetyAdvice || "Consult clinical supervisor before use."}</p></div>
                  </div>
                  <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border"><Stethoscope className="w-7 h-7 text-blue-600" /></div>
                    <div><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Usage Protocol</h4><p className="text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{product.howToUse || "Take exactly as directed by healthcare professional."}</p></div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <InteractionCard icon={Beer} title="Alcohol Interaction" description={product.alcoholInteraction} />
              <InteractionCard icon={Baby} title="Pregnancy Protocol" description={product.pregnancyInteraction} />
              <InteractionCard icon={Milk} title="Lactation Caution" description={product.lactationInteraction} />
              <InteractionCard icon={Car} title="Driving Safety" description={product.drivingInteraction} />
              <InteractionCard icon={ShieldPlus} title="Kidney Safety" description={product.kidneyInteraction} />
              <InteractionCard icon={ShieldAlert} title="Liver Protocol" description={product.liverInteraction} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
