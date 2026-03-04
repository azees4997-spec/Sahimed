
"use client"

import React, { use, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity,
  ChevronRight,
  Info,
  Plus,
  Minus,
  BellRing,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Phone,
  MessageCircle,
  Beer,
  Baby,
  Milk,
  Car,
  ShieldAlert,
  Skull,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Custom Detailed Icons
const KidneyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21a9 9 0 0 0 9-9c0-5-4-9-9-9s-9 4-9 9a9 9 0 0 0 9 9z" />
    <path d="M12 7v10M8 12h8" />
  </svg>
);

const LiverIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8-8 3.6-8 8z" />
    <path d="M12 8l-4 4 4 4 4-4-4-4z" />
  </svg>
);

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  const genericQuery = useMemoFirebase(() => {
    if (!db || !product || product.isGeneric) return null;
    return query(collection(db, 'medicines'), where('moleculeId', '==', product.moleculeId || ''), where('isGeneric', '==', true), limit(1));
  }, [db, product]);
  
  const { data: genericAlternatives } = useCollection(genericQuery);
  const genericSubstitute = genericAlternatives?.[0];

  const handleNotify = (p: any) => {
    if (!user) {
      toast({ title: "Login Required", description: "Sign in to receive stock notifications." });
      return;
    }
    const enquiryData = { medicineId: p.id, medicineName: p.name, userId: user.uid, timestamp: serverTimestamp() };
    addDocumentNonBlocking(collection(db, 'stockEnquiries'), enquiryData);
    toast({ title: "Notification Set", description: "We will notify you when stock returns." });
  };

  if (productLoading || !product) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
           <Skeleton className="h-[600px] rounded-[40px] shimmer" />
        </main>
      </div>
    );
  }

  const brandedQty = getItemQuantity(product?.id || '');
  const isOutOfStock = (product.availableQuantity || 0) <= 0;

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

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 mb-6 text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-2 h-2" />
          <span className="text-primary truncate">{product.name}</span>
        </div>

        <div className="bg-white rounded-[40px] sm:rounded-[50px] p-6 sm:p-12 shadow-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start relative mb-12">
           <div className="sticky top-24">
              <div className="aspect-square relative w-full max-w-[400px] mx-auto bg-gray-50 rounded-[40px] p-10 border border-gray-100">
                <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-10" />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                 <Button onClick={() => window.open(`https://wa.me/91XXXXXXXXXX?text=Hi, SahiMed! I need ${product.name}`, '_blank')} variant="outline" className="h-14 rounded-3xl border-2 border-green-100 text-green-600 font-black uppercase text-[10px] tracking-widest gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
                 <Button onClick={() => window.location.href = 'tel:+91XXXXXXXXXX'} variant="outline" className="h-14 rounded-3xl border-2 border-blue-100 text-blue-600 font-black uppercase text-[10px] tracking-widest gap-2"><Phone className="w-4 h-4" /> Call Hub</Button>
              </div>
           </div>

           <div className="space-y-8">
              <div className="space-y-4">
                 <Badge className="bg-accent text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Quality Verified</Badge>
                 <h1 className="text-3xl sm:text-5xl font-black text-gray-900 uppercase tracking-tighter leading-none">{product.name}</h1>
                 <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">{product.saltComposition}</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-[32px] border flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</p>
                    <p className="text-3xl font-black text-primary">₹{product.price}</p>
                    <p className="text-[9px] text-red-500 line-through font-bold">MRP ₹{product.mrp || product.price + 50}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pack Size</p>
                    <p className="font-black text-gray-900 uppercase">{product.packSize || "N/A"}</p>
                 </div>
              </div>

              <div className="flex gap-4">
                 {isOutOfStock ? (
                   <Button onClick={() => handleNotify(product)} className="flex-1 h-20 rounded-full font-black uppercase tracking-widest bg-orange-600 shadow-2xl shadow-orange-100 text-white">Notify Stock</Button>
                 ) : brandedQty > 0 ? (
                    <div className="flex-1 flex items-center justify-between bg-primary rounded-full h-20 px-8 shadow-2xl shadow-primary/20">
                       <button onClick={() => updateQuantity(product.id, -1)} className="text-white"><Minus className="w-6 h-6" /></button>
                       <span className="text-2xl font-black text-white">{brandedQty}</span>
                       <button onClick={() => updateQuantity(product.id, 1)} className="text-white"><Plus className="w-6 h-6" /></button>
                    </div>
                 ) : (
                    <Button onClick={() => addToCart(product, 1)} className="flex-1 h-20 rounded-full font-black uppercase tracking-widest bg-primary shadow-2xl shadow-primary/30 text-white text-lg">Add to Bag</Button>
                 )}
              </div>

              <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="overview" className="border-b border-gray-100">
                    <AccordionTrigger className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 py-6">Product Overview</AccordionTrigger>
                    <AccordionContent className="pb-8 space-y-4">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary">Description</Label>
                          <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase">{product.description || "Clinical description pending review."}</p>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary">Treatment</Label>
                          <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase">{product.treatment || "Used for primary clinical treatment."}</p>
                       </div>
                    </AccordionContent>
                 </AccordionItem>

                 <AccordionItem value="howtouse" className="border-b border-gray-100">
                    <AccordionTrigger className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 py-6">Usage & Safety</AccordionTrigger>
                    <AccordionContent className="pb-8 space-y-6">
                       <div className="flex gap-4 items-start bg-gray-50 p-6 rounded-3xl">
                          <ClipboardList className="w-6 h-6 text-primary shrink-0" />
                          <div>
                             <h4 className="text-[10px] font-black uppercase mb-1">How to consume</h4>
                             <p className="text-xs font-bold text-gray-600 uppercase leading-relaxed">{product.howToUse || "Take as directed by your physician."}</p>
                          </div>
                       </div>
                       <div className="flex gap-4 items-start bg-orange-50 p-6 rounded-3xl">
                          <ShieldAlert className="w-6 h-6 text-orange-600 shrink-0" />
                          <div>
                             <h4 className="text-[10px] font-black uppercase mb-1 text-orange-600">Safety Advice</h4>
                             <p className="text-xs font-bold text-orange-900 uppercase leading-relaxed">{product.safetyAdvice || "Consult professional medical advice before use."}</p>
                          </div>
                       </div>
                    </AccordionContent>
                 </AccordionItem>

                 <AccordionItem value="sideeffects" className="border-b border-gray-100">
                    <AccordionTrigger className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 py-6">Side Effects</AccordionTrigger>
                    <AccordionContent className="pb-8">
                       <div className="flex gap-4 items-start bg-red-50 p-6 rounded-3xl">
                          <Skull className="w-6 h-6 text-red-600 shrink-0" />
                          <p className="text-xs font-bold text-red-900 uppercase leading-relaxed">{product.sideEffects || "No common side effects reported."}</p>
                       </div>
                    </AccordionContent>
                 </AccordionItem>
              </Accordion>
           </div>
        </div>

        {/* Clinical Interactions Hub */}
        <section className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Clinical Interactions</h2>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InteractionCard icon={Beer} title="Alcohol" description={product.alcoholInteraction} />
              <InteractionCard icon={Baby} title="Pregnancy" description={product.pregnancyInteraction} />
              <InteractionCard icon={Milk} title="Lactation" description={product.lactationInteraction} />
              <InteractionCard icon={Car} title="Driving" description={product.drivingInteraction} />
              <InteractionCard icon={KidneyIcon} title="Kidney Health" description={product.kidneyInteraction} />
              <InteractionCard icon={LiverIcon} title="Liver Health" description={product.liverInteraction} />
           </div>
        </section>
      </main>
    </div>
  );
}
