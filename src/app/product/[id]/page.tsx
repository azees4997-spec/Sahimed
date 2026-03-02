"use client"

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Minus, 
  Plus, 
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  FlaskConical,
  Dna,
  Scale,
  AlertCircle,
  Stethoscope,
  Wine,
  Baby,
  Car,
  Heart,
  Target,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, cart, updateQuantity } = useCart();

  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  const genericQuery = useMemoFirebase(() => {
    if (!db || !product || product.isGeneric) return null;
    return query(
      collection(db, 'medicines'),
      where('saltComposition', '==', product.saltComposition),
      where('isGeneric', '==', true),
      limit(1)
    );
  }, [db, product]);
  
  const { data: genericAlternatives } = useCollection(genericQuery);
  const genericSubstitute = genericAlternatives?.[0];

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !productLoading) return notFound();

  const handleAdd = (p: any) => {
    addToCart(p);
    toast({ title: "Added to cart", description: `${p.name} added.` });
  };

  const getQty = (pid: string) => cart.find(i => i.id === pid)?.quantity || 0;

  const getUnitCount = (packSize: string) => {
    const match = packSize?.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  const percentageSaved = product && genericSubstitute 
    ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <Link href="/search" className="hover:text-primary">Medicines</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-primary truncate">{product?.name}</span>
        </div>

        {/* Clinical Context Banner */}
        <div className="mb-6 bg-white border border-primary/10 rounded-2xl py-3 px-5 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col items-center justify-center gap-1">
             <div className="flex items-center gap-2">
                <Dna className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Salt Composition</p>
             </div>
             <h2 className="text-xs font-black text-gray-900 uppercase tracking-tight text-center">{product?.saltComposition}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Comparison Area */}
          {genericSubstitute ? (
            <div className="grid grid-cols-2 gap-3 md:gap-6 items-stretch">
              {/* Branded Card */}
              <Card className="rounded-[28px] border-none bg-gray-100/50 overflow-hidden flex flex-col p-4 md:p-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">You Searched</p>
                <div className="aspect-square w-full max-w-[120px] bg-white rounded-2xl mx-auto mb-6 p-2 shadow-sm relative overflow-hidden">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div>
                    <h3 className="text-xs md:text-lg font-black text-gray-900 leading-tight uppercase">{product?.name}</h3>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{product?.manufacturer}</p>
                    <p className="text-[8px] text-gray-400 font-bold mt-0.5">{product?.packSize}</p>
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="text-sm md:text-2xl font-black text-gray-900">₹{product?.price}</div>
                    <p className="text-[7px] md:text-[9px] font-bold text-gray-400">₹{(product?.price / getUnitCount(product?.packSize || '')).toFixed(1)} / Unit</p>
                    <Button onClick={() => handleAdd(product)} variant="outline" className="w-full h-8 md:h-10 mt-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border-2">Add To Cart</Button>
                  </div>
                </div>
              </Card>

              {/* Generic Card */}
              <Card className="rounded-[28px] border-2 border-green-500 bg-white overflow-hidden flex flex-col relative p-4 md:p-8 shadow-xl shadow-green-100">
                <div className="absolute top-0 right-0">
                  <div className="bg-green-500 text-white font-black text-[7px] md:text-[9px] uppercase px-2 py-1 md:px-4 md:py-2 rounded-bl-xl shadow-md">
                    Save {percentageSaved}%
                  </div>
                </div>
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Recommended</p>
                <div className="aspect-square w-full max-w-[120px] bg-gray-50 rounded-2xl mx-auto mb-6 p-2 relative overflow-hidden">
                  <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div>
                    <h3 className="text-xs md:text-lg font-black text-gray-900 leading-tight uppercase">{genericSubstitute.name}</h3>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{genericSubstitute.manufacturer}</p>
                    <p className="text-[8px] text-gray-400 font-bold mt-0.5">{genericSubstitute.packSize}</p>
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm md:text-2xl font-black text-green-600">₹{genericSubstitute.price}</span>
                    </div>
                    <p className="text-[7px] md:text-[9px] font-bold text-gray-400">₹{(genericSubstitute.price / getUnitCount(genericSubstitute.packSize || '')).toFixed(1)} / Unit</p>
                    <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-8 md:h-10 mt-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">Add To Cart</Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white p-5 md:p-10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 aspect-square relative bg-gray-50 rounded-2xl p-4">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-primary tracking-widest">{product?.manufacturer}</p>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{product?.name}</h1>
                    <p className="text-[10px] text-gray-400 font-bold">{product?.saltComposition}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-none bg-gray-50">{product?.dosageForm}</Badge>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-none bg-gray-50">{product?.packSize}</Badge>
                  </div>
                  <div className="text-3xl font-black text-gray-900">₹{product?.price}</div>
                  <Button onClick={() => handleAdd(product)} className="h-12 px-10 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Add to Cart</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Clinical Information - Side by Side Grid */}
          <div className="space-y-8 mt-4">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest ml-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" /> Clinical Equivalence
            </h2>
            
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              {/* Uses */}
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-primary" /> Uses
                </h3>
                <ul className="space-y-2">
                  {(product?.uses || []).slice(0, 3).map((use: string, i: number) => (
                    <li key={i} className="text-[8px] md:text-[10px] font-bold text-gray-600 leading-tight flex gap-1.5">
                      <span className="text-primary">•</span> {use}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Side Effects */}
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-orange-500" /> Effects
                </h3>
                <div className="flex flex-wrap gap-1">
                  {(product?.sideEffects || []).slice(0, 4).map((effect: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[7px] md:text-[8px] font-bold bg-orange-50/50 text-orange-700 border-none px-1.5 py-0.5">
                      {effect}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Info Card */}
            <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/50 px-6 py-4 border-b">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5" /> Pharmacological Action
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-[10px] md:text-xs text-gray-500 font-medium leading-relaxed">
                {product?.howItWorks || "This therapeutic agent works through specific clinical pathways to manage symptoms as prescribed by your medical professional."}
              </CardContent>
            </Card>

            {/* Safety Grid */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Clinical Safety Advice</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { icon: Wine, label: "Alcohol", text: product?.safetyAdvice?.alcohol || "Consult Doctor" },
                  { icon: Baby, label: "Pregnancy", text: product?.safetyAdvice?.pregnancy || "Consult Doctor" },
                  { icon: Car, label: "Driving", text: product?.safetyAdvice?.driving || "Generally Safe" },
                  { icon: Heart, label: "Liver", text: product?.safetyAdvice?.liver || "Consult Doctor" },
                  { icon: Activity, label: "Kidney", text: product?.safetyAdvice?.kidney || "Caution" }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded-2xl border border-gray-50 flex items-center gap-3">
                    <div className="bg-gray-50 p-1.5 rounded-lg shrink-0">
                      <item.icon className="w-3 h-3 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-gray-400 uppercase">{item.label}</p>
                      <p className="text-[8px] font-bold text-gray-700 truncate">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Quick Buy */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-40">
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-full shadow-2xl border border-gray-100 flex items-center gap-2">
          <div className="flex-1 pl-4">
            <p className="text-[7px] font-black text-gray-400 uppercase">Selected</p>
            <p className="text-[10px] font-black text-gray-900 truncate">{product?.name}</p>
          </div>
          <Link href="/cart">
            <Button className="h-10 px-6 rounded-full font-black uppercase text-[9px] tracking-widest gap-2">
              Go To Cart
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
