
"use client"

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity,
  ChevronRight,
  Info,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Phone,
  MessageCircle,
  Beer,
  Baby,
  Milk,
  Car,
  ShieldAlert,
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Dna
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  // Fetch Alternative (Generic if this is Branded, or vice versa)
  const alternativeQuery = useMemoFirebase(() => {
    if (!db || !product?.moleculeId) return null;
    return query(
      collection(db, 'medicines'), 
      where('moleculeId', '==', product.moleculeId),
      where('isGeneric', '==', !product.isGeneric),
      limit(1)
    );
  }, [db, product?.moleculeId, product?.isGeneric]);

  const { data: alternatives } = useCollection(alternativeQuery);
  const alternative = alternatives?.[0];

  if (productLoading || !product) {
    return (
      <div className="min-h-screen bg-[#F0FDF4]/30">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
           <Skeleton className="h-[600px] rounded-[40px] shimmer" />
        </main>
      </div>
    );
  }

  const InteractionCard = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 flex gap-4 transition-all hover:shadow-lg">
      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</h4>
        <p className="text-xs font-bold text-gray-700 leading-relaxed">{description || "No specific interaction details provided."}</p>
      </div>
    </div>
  );

  const BrandedProduct = product.isGeneric ? alternative : product;
  const GenericProduct = product.isGeneric ? product : alternative;

  return (
    <div className="min-h-screen bg-[#F0FDF4]/30 pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Composition Header */}
        <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
              <Dna className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-widest">Active Composition</span>
           </div>
           <h2 className="text-xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">
              {product.saltComposition || "Clinical Formula"}
           </h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Bio-Equivalent Comparison Hub</p>
        </div>

        {/* Side-by-Side Comparison Hub */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8 mb-12 items-stretch">
          {/* Branded Card */}
          <div className="flex flex-col h-full">
            <ComparisonCard 
              product={BrandedProduct} 
              type="Branded" 
              isOutOfStock={(BrandedProduct?.availableQuantity || 0) <= 0}
              onAdd={() => addToCart(BrandedProduct!)}
              quantity={getItemQuantity(BrandedProduct?.id || '')}
              updateQty={(d) => updateQuantity(BrandedProduct!.id, d)}
            />
          </div>

          {/* Generic Card */}
          <div className="flex flex-col h-full">
            <ComparisonCard 
              product={GenericProduct} 
              type="Generic" 
              isOutOfStock={(GenericProduct?.availableQuantity || 0) <= 0}
              onAdd={() => addToCart(GenericProduct!)}
              quantity={getItemQuantity(GenericProduct?.id || '')}
              updateQty={(d) => updateQuantity(GenericProduct!.id, d)}
            />
          </div>
        </div>

        {/* Smart Info Section */}
        <section className="bg-white rounded-[40px] p-6 sm:p-12 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-6 duration-700">
          <Tabs defaultValue="clinical" className="w-full">
            <TabsList className="bg-gray-50 p-1.5 rounded-2xl w-full grid grid-cols-3 h-14 mb-10">
              <TabsTrigger value="clinical" className="rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Clinical Data</TabsTrigger>
              <TabsTrigger value="safety" className="rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Safety Advice</TabsTrigger>
              <TabsTrigger value="interactions" className="rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="clinical" className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <h3 className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-gray-900">
                        <ClipboardList className="w-5 h-5 text-primary" /> 
                        Primary Treatment
                     </h3>
                     <p className="text-sm font-bold text-gray-600 leading-relaxed uppercase">{product.treatment || "Standard clinical protocol."}</p>
                  </div>
                  <div className="space-y-4">
                     <h3 className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-gray-900">
                        <Info className="w-5 h-5 text-primary" /> 
                        Pharmacology
                     </h3>
                     <p className="text-sm font-bold text-gray-600 leading-relaxed uppercase">{product.description || "Bio-available active ingredients."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="space-y-6">
               <div className="bg-orange-50/50 p-8 rounded-[32px] border border-orange-100 flex gap-6">
                  <ShieldAlert className="w-8 h-8 text-orange-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-orange-600 mb-2">Patient Safety Manual</h4>
                    <p className="text-sm font-bold text-orange-900/70 leading-relaxed uppercase">{product.safetyAdvice || "Consult your clinical supervisor before use."}</p>
                  </div>
               </div>
               <div className="bg-blue-50/50 p-8 rounded-[32px] border border-blue-100 flex gap-6">
                  <Stethoscope className="w-8 h-8 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-blue-600 mb-2">Usage Protocol</h4>
                    <p className="text-sm font-bold text-blue-900/70 leading-relaxed uppercase">{product.howToUse || "Take as directed by a healthcare professional."}</p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InteractionCard icon={Beer} title="Alcohol" description={product.alcoholInteraction} />
              <InteractionCard icon={Baby} title="Pregnancy" description={product.pregnancyInteraction} />
              <InteractionCard icon={Milk} title="Lactation" description={product.lactationInteraction} />
              <InteractionCard icon={Car} title="Driving" description={product.drivingInteraction} />
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Contact Bar */}
        <div className="mt-12 grid grid-cols-2 gap-4">
           <Button onClick={() => window.open(`https://wa.me/91XXXXXXXXXX?text=Hi, SahiMed! I need ${product.name}`, '_blank')} variant="outline" className="h-16 rounded-[24px] border-2 border-green-100 bg-white text-green-600 hover:bg-green-50 font-black uppercase text-[10px] tracking-widest gap-3 active:scale-95 transition-all shadow-sm">
              <MessageCircle className="w-5 h-5" /> WhatsApp Hub
           </Button>
           <Button onClick={() => window.location.href = 'tel:+91XXXXXXXXXX'} variant="outline" className="h-16 rounded-[24px] border-2 border-blue-100 bg-white text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest gap-3 active:scale-95 transition-all shadow-sm">
              <Phone className="w-5 h-5" /> Call Pharmacist
           </Button>
        </div>
      </main>
    </div>
  );
}

function ComparisonCard({ product, type, isOutOfStock, onAdd, quantity, updateQty }: any) {
  if (!product) {
    return (
      <Card className="h-full rounded-[32px] border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-8 opacity-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300 mb-3" />
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 text-center">Locating Bio-Equivalent...</p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "h-full rounded-[32px] flex flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl border-2",
      type === 'Branded' ? 'border-primary/10' : 'border-accent/20 bg-accent/5'
    )}>
       <div className="p-4 sm:p-6 flex flex-col h-full">
          <Badge className={cn(
            "w-fit mb-4 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md",
            type === 'Branded' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent text-white'
          )}>
            {type === 'Branded' ? 'Original Branded' : 'Sahi Generic'}
          </Badge>

          <div className="aspect-square relative w-full bg-white rounded-2xl mb-4 border border-gray-100 p-4">
            <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-2" />
            {isOutOfStock && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                  <Badge variant="destructive" className="font-black text-[8px] uppercase tracking-widest">Out of Stock</Badge>
               </div>
            )}
          </div>

          <div className="space-y-2 mb-6">
             <h3 className="font-black text-[11px] sm:text-sm uppercase tracking-tight text-gray-900 line-clamp-2 leading-tight h-8">{product.name}</h3>
             <p className="text-[8px] text-gray-400 font-bold uppercase truncate">{product.manufacturer}</p>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary">₹{product.price}</span>
                {product.mrp && <span className="text-[8px] text-gray-400 line-through font-bold">MRP ₹{product.mrp}</span>}
             </div>
          </div>

          <div className="mt-auto">
             {quantity > 0 ? (
                <div className="flex items-center justify-between bg-primary rounded-full h-11 px-3 text-white shadow-lg animate-in zoom-in duration-300">
                  <button onClick={() => updateQty(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="font-black text-xs">{quantity}</span>
                  <button onClick={() => updateQty(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full"><Plus className="w-3.5 h-3.5" /></button>
                </div>
             ) : (
                <Button 
                  onClick={onAdd} 
                  disabled={isOutOfStock}
                  className={cn(
                    "w-full h-11 rounded-full font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md",
                    type === 'Branded' ? 'bg-primary text-white' : 'bg-accent text-white'
                  )}
                >
                  {isOutOfStock ? "Notify" : "Add to Bag"}
                </Button>
             )}
          </div>
       </div>
    </Card>
  );
}

