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
  const { addToCart } = useCart();

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
          <Link href="/" className="hover:text-primary text-[8px]">Home</Link>
          <ChevronRight className="w-2 h-2" />
          <Link href="/search" className="hover:text-primary text-[8px]">Medicines</Link>
          <ChevronRight className="w-2 h-2" />
          <span className="text-primary truncate text-[8px]">{product?.name}</span>
        </div>

        {/* Clinical Context Banner */}
        <div className="mb-4 bg-white border border-primary/10 rounded-xl py-2 px-4 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-0.5">
             <div className="flex items-center gap-1.5">
                <Dna className="w-3 h-3 text-primary" />
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Salt Composition</p>
             </div>
             <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-tight text-center">{product?.saltComposition}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Main Comparison Area - STRICT SIDE BY SIDE */}
          {genericSubstitute ? (
            <div className="grid grid-cols-2 gap-2 md:gap-4 items-stretch">
              {/* Branded Card */}
              <Card className="rounded-2xl border-none bg-gray-100/50 overflow-hidden flex flex-col p-3 md:p-6">
                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-3">You Searched</p>
                <div className="aspect-square w-full max-w-[80px] bg-white rounded-lg mx-auto mb-4 p-1.5 shadow-sm relative overflow-hidden">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div>
                    <h3 className="text-[9px] md:text-base font-black text-gray-900 leading-tight uppercase line-clamp-2">{product?.name}</h3>
                    <p className="text-[6px] font-bold text-gray-400 uppercase mt-0.5">{product?.manufacturer}</p>
                    <p className="text-[6px] text-gray-400 font-bold">{product?.packSize}</p>
                  </div>
                  <div className="mt-auto pt-2">
                    <div className="text-[10px] md:text-xl font-black text-gray-900">₹{product?.price}</div>
                    <p className="text-[6px] md:text-[8px] font-bold text-gray-400">₹{(product?.price / getUnitCount(product?.packSize || '')).toFixed(1)} / Unit</p>
                    <Button onClick={() => handleAdd(product)} variant="default" className="w-full h-7 md:h-9 mt-2 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90">Add To Cart</Button>
                  </div>
                </div>
              </Card>

              {/* Generic Card */}
              <Card className="rounded-2xl border-2 border-green-500 bg-white overflow-hidden flex flex-col relative p-3 md:p-6 shadow-lg shadow-green-100/50">
                <div className="absolute top-0 right-0">
                  <div className="bg-green-500 text-white font-black text-[6px] md:text-[8px] uppercase px-1.5 py-0.5 md:px-3 md:py-1 rounded-bl-lg">
                    Save {percentageSaved}%
                  </div>
                </div>
                <p className="text-[7px] font-black text-green-600 uppercase tracking-widest mb-3">Recommended</p>
                <div className="aspect-square w-full max-w-[80px] bg-gray-50 rounded-lg mx-auto mb-4 p-1.5 relative overflow-hidden">
                  <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div>
                    <h3 className="text-[9px] md:text-base font-black text-gray-900 leading-tight uppercase line-clamp-2">{genericSubstitute.name}</h3>
                    <p className="text-[6px] font-bold text-gray-400 uppercase mt-0.5">{genericSubstitute.manufacturer}</p>
                    <p className="text-[6px] text-gray-400 font-bold">{genericSubstitute.packSize}</p>
                  </div>
                  <div className="mt-auto pt-2">
                    <div className="text-[10px] md:text-xl font-black text-green-600">₹{genericSubstitute.price}</div>
                    <p className="text-[6px] md:text-[8px] font-bold text-gray-400">₹{(genericSubstitute.price / getUnitCount(genericSubstitute.packSize || '')).toFixed(1)} / Unit</p>
                    <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-7 md:h-9 mt-2 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700">Add To Cart</Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white p-4 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 aspect-square relative bg-gray-50 rounded-xl p-3">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black uppercase text-primary tracking-widest">{product?.manufacturer}</p>
                    <h1 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">{product?.name}</h1>
                    <p className="text-[8px] text-gray-400 font-bold">{product?.saltComposition}</p>
                  </div>
                  <div className="text-2xl font-black text-gray-900">₹{product?.price}</div>
                  <Button onClick={() => handleAdd(product)} className="h-10 px-8 rounded-full font-black uppercase tracking-widest text-[9px]">Add to Cart</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Clinical Info - SIDE BY SIDE */}
          <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-[7px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-primary" /> Clinical Uses
              </h3>
              <ul className="space-y-1">
                {(product?.uses || []).slice(0, 3).map((use: string, i: number) => (
                  <li key={i} className="text-[7px] font-bold text-gray-600 leading-tight">
                    • {use}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-[7px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5 text-orange-500" /> Side Effects
              </h3>
              <div className="flex flex-wrap gap-1">
                {(product?.sideEffects || []).slice(0, 3).map((effect: string, i: number) => (
                  <span key={i} className="text-[6px] font-bold bg-orange-50 text-orange-700 px-1 py-0.5 rounded-sm">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Safety Grid - High Density */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Wine, label: "Alcohol", text: product?.safetyAdvice?.alcohol || "Consult Doctor" },
              { icon: Baby, label: "Pregnancy", text: product?.safetyAdvice?.pregnancy || "Consult Doctor" },
              { icon: Car, label: "Driving", text: product?.safetyAdvice?.driving || "Generally Safe" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-2 rounded-xl border border-gray-100 flex items-center gap-2">
                <item.icon className="w-2.5 h-2.5 text-gray-300" />
                <div className="min-w-0">
                  <p className="text-[6px] font-black text-gray-400 uppercase leading-none">{item.label}</p>
                  <p className="text-[7px] font-bold text-gray-700 truncate">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
