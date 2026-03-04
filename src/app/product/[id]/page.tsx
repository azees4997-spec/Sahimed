
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
      <div className="min-h-screen bg-[#F0F9FF]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
           <Skeleton className="h-[600px] rounded-[40px]" />
        </main>
      </div>
    );
  }

  const InteractionCard = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-start gap-5 transition-all hover:shadow-xl hover:border-primary/20">
      <div className="w-12 h-12 bg-primary/5 rounded-[20px] flex items-center justify-center text-primary shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">{title}</h4>
        <p className="text-[12px] font-bold text-gray-700 leading-relaxed uppercase">{description || "No specific interaction details provided."}</p>
      </div>
    </div>
  );

  const BrandedProduct = product.isGeneric ? alternative : product;
  const GenericProduct = product.isGeneric ? product : alternative;

  return (
    <div className="min-h-screen bg-[#F0F9FF] pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {/* Composition Header */}
        <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
              <Dna className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Active Formula</span>
           </div>
           <h2 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase tracking-tighter max-w-3xl mx-auto leading-tight">
              {product.saltComposition || "Clinical Formula"}
           </h2>
           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Precision Bio-Equivalent Comparison</p>
        </div>

        {/* Side-by-Side Comparison Hub */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8 mb-16 items-stretch">
          <ComparisonCard 
            product={BrandedProduct} 
            type="Branded" 
            isOutOfStock={(BrandedProduct?.availableQuantity || 0) <= 0}
            onAdd={() => addToCart(BrandedProduct!)}
            quantity={getItemQuantity(BrandedProduct?.id || '')}
            updateQty={(d: number) => updateQuantity(BrandedProduct!.id, d)}
          />
          <ComparisonCard 
            product={GenericProduct} 
            type="Generic" 
            isOutOfStock={(GenericProduct?.availableQuantity || 0) <= 0}
            onAdd={() => addToCart(GenericProduct!)}
            quantity={getItemQuantity(GenericProduct?.id || '')}
            updateQty={(d: number) => updateQuantity(GenericProduct!.id, d)}
          />
        </div>

        {/* Smart Info Section */}
        <section className="bg-white rounded-[48px] p-6 sm:p-14 shadow-2xl border border-gray-50 animate-in slide-in-from-bottom-8 duration-700 overflow-hidden">
          <Tabs defaultValue="clinical" className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList className="bg-gray-100 p-1.5 rounded-full h-14 sm:h-16 w-full max-w-[600px] flex items-center justify-center">
                <TabsTrigger value="clinical" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300">Clinical Data</TabsTrigger>
                <TabsTrigger value="safety" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300">Safety Advice</TabsTrigger>
                <TabsTrigger value="interactions" className="flex-1 rounded-full h-full font-black text-[9px] sm:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300">Interactions</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="clinical" className="space-y-10 animate-in fade-in duration-500">
               <div className="max-w-4xl mx-auto divide-y divide-gray-100">
                  <div className="pb-10 space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                          <ClipboardList className="w-5 h-5" /> 
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Primary Treatment</h3>
                     </div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase pl-13">
                       {product.treatment || "Standard clinical protocol based on bio-equivalent efficacy standards."}
                     </p>
                  </div>
                  
                  <div className="pt-10 space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                          <Info className="w-5 h-5" /> 
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Pharmacology</h3>
                     </div>
                     <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase pl-13">
                       {product.description || "Active pharmaceutical ingredients formulated for optimal bio-availability and clinical stability."}
                     </p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="safety" className="animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-orange-50/50 p-8 rounded-[40px] border border-orange-100 flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border border-orange-100">
                      <ShieldAlert className="w-7 h-7 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2">Patient Safety</h4>
                      <p className="text-[13px] font-bold text-orange-900/70 leading-relaxed uppercase">{product.safetyAdvice || "Consult your clinical supervisor before initializing use of this medication."}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center shrink-0 border border-blue-100">
                      <Stethoscope className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Usage Protocol</h4>
                      <p className="text-[13px] font-bold text-blue-900/70 leading-relaxed uppercase">{product.howToUse || "Take exactly as directed by your healthcare professional for effective therapeutic results."}</p>
                    </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="interactions" className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-500">
              <InteractionCard icon={Beer} title="Alcohol Interaction" description={product.alcoholInteraction} />
              <InteractionCard icon={Baby} title="Pregnancy Protocol" description={product.pregnancyInteraction} />
              <InteractionCard icon={Milk} title="Lactation Caution" description={product.lactationInteraction} />
              <InteractionCard icon={Car} title="Driving Safety" description={product.drivingInteraction} />
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Contact Bar */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Button 
            onClick={() => window.open(`https://wa.me/91XXXXXXXXXX?text=Hi, SahiMed! I need clinical info on ${product.name}`, '_blank')} 
            className="h-20 rounded-[32px] border-2 border-accent/20 bg-white text-accent hover:bg-accent/5 font-black uppercase text-[11px] sm:text-[13px] tracking-[0.2em] gap-5 active:scale-95 transition-all shadow-xl shadow-accent/5"
           >
              <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              WhatsApp Pharmacy
           </Button>
           <Button 
            onClick={() => window.location.href = 'tel:+91XXXXXXXXXX'} 
            className="h-20 rounded-[32px] border-2 border-primary/20 bg-white text-primary hover:bg-primary/5 font-black uppercase text-[11px] sm:text-[13px] tracking-[0.2em] gap-5 active:scale-95 transition-all shadow-xl shadow-primary/5"
           >
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              Call Pharmacist
           </Button>
        </div>
      </main>
    </div>
  );
}

function ComparisonCard({ product, type, isOutOfStock, onAdd, quantity, updateQty }: any) {
  if (!product) {
    return (
      <div className="flex-1 flex flex-col">
        <Card className="h-full rounded-[32px] sm:rounded-[40px] border-2 border-dashed border-gray-100 bg-white/50 flex flex-col items-center justify-center p-6 opacity-60 min-h-[350px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 text-center">Finding Matching Molecule...</p>
        </Card>
      </div>
    );
  }

  const isGeneric = type === 'Generic';

  return (
    <div className="flex-1 flex flex-col group">
      <Card className={cn(
        "h-full rounded-[32px] sm:rounded-[40px] flex flex-col overflow-hidden transition-all duration-500 group-hover:shadow-2xl border-2 p-4 sm:p-8",
        isGeneric ? 'border-accent/30 bg-accent/5' : 'border-primary/10 bg-white shadow-lg'
      )}>
        <Badge className={cn(
          "w-fit mb-5 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border",
          isGeneric ? 'bg-accent text-white border-accent' : 'bg-primary/10 text-primary border-primary/20'
        )}>
          {isGeneric ? 'Sahi Generic' : 'Original Branded'}
        </Badge>

        <div className="aspect-square relative w-full bg-white rounded-[24px] sm:rounded-[32px] mb-6 border border-gray-100 p-4 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-3" />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center rounded-[24px] sm:rounded-[32px]">
              <Badge variant="destructive" className="font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-8 flex-1">
          <h3 className="font-black text-[12px] sm:text-lg uppercase tracking-tight text-gray-900 line-clamp-2 h-10 sm:h-14 leading-tight">
            {product.name}
          </h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">{product.manufacturer}</p>
          <div className="flex flex-col gap-1 pt-4 border-t border-gray-100/50">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-accent">₹{product.price}</span>
              {product.mrp && <span className="text-[10px] text-red-500 line-through font-bold">₹{product.mrp}</span>}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {quantity > 0 ? (
            <div className={cn(
              "flex items-center justify-between rounded-full h-12 px-3 text-white shadow-xl animate-in zoom-in duration-300",
              isGeneric ? 'bg-accent' : 'bg-primary'
            )}>
              <button onClick={(e) => { e.preventDefault(); updateQty(-1); }} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"><Minus className="w-3.5 h-3.5" /></button>
              <span className="font-black text-[11px]">{quantity} Units</span>
              <button onClick={(e) => { e.preventDefault(); updateQty(1); }} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <Button 
              onClick={(e) => { e.preventDefault(); onAdd(); }} 
              disabled={isOutOfStock}
              className={cn(
                "w-full h-12 rounded-full font-black uppercase text-[9px] tracking-[0.1em] active:scale-95 transition-all shadow-lg group-hover:translate-y-[-2px]",
                isGeneric ? 'bg-accent text-white shadow-accent/20' : 'bg-primary text-white shadow-primary/20'
              )}
            >
              {isOutOfStock ? "Notify Stock" : "Add to Bag"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
