
"use client"

import { use, useState } from 'react';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Activity,
  Loader2,
  ChevronRight,
  Info,
  Dna,
  AlertCircle,
  Wine,
  Baby,
  Car,
  Plus,
  Minus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

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

  const brandedQty = getItemQuantity(product?.id || '');
  const genericQty = getItemQuantity(genericSubstitute?.id || '');

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !productLoading) return notFound();

  const getUnitCount = (packSize: string) => {
    const match = packSize?.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  const percentageSaved = product && genericSubstitute 
    ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-2">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 mb-2 text-[7px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <Link href="/search" className="hover:text-primary">Medicines</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <span className="text-primary truncate">{product?.name}</span>
        </div>

        {/* Salt Composition Banner */}
        <div className="mb-3 bg-white border border-primary/5 rounded-lg py-2 px-4 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-0.5">
             <div className="flex items-center gap-1.5">
                <Dna className="w-3 h-3 text-primary" />
                <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Clinical Salt Composition</p>
             </div>
             <h2 className="text-[9px] font-black text-gray-900 uppercase tracking-tight text-center">{product?.saltComposition}</h2>
          </div>
        </div>

        {/* High-Fidelity Comparison Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Branded Product Card */}
          <Card className="rounded-2xl border-none bg-gray-50/50 overflow-hidden flex flex-col p-3 shadow-sm relative border border-gray-100">
            <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest mb-2">You Searched</p>
            <div className="aspect-square w-full max-w-[80px] bg-white rounded-xl mx-auto mb-3 p-2 relative shadow-inner">
              <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <h3 className="text-[9px] font-black text-gray-900 leading-tight uppercase line-clamp-2">{product?.name}</h3>
              <p className="text-[6px] font-bold text-gray-400 uppercase leading-none">{product?.manufacturer}</p>
              <p className="text-[7px] font-black text-gray-300 uppercase mt-0.5">{product?.packSize}</p>
              
              <div className="mt-auto pt-3">
                <div className="text-[12px] font-black text-gray-900">₹{product?.price}</div>
                <p className="text-[7px] font-bold text-gray-400">₹{(product?.price / getUnitCount(product?.packSize || '')).toFixed(1)} / Tablet</p>
                
                <div className="mt-3">
                  {brandedQty > 0 ? (
                    <div className="flex items-center justify-between bg-primary rounded-lg h-9 px-2 shadow-lg">
                      <button onClick={() => updateQuantity(product.id, -1)} className="p-1.5 text-white hover:opacity-80 transition-opacity"><Minus className="w-3 h-3" /></button>
                      <span className="text-[11px] font-black text-white">{brandedQty}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="p-1.5 text-white hover:opacity-80 transition-opacity"><Plus className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <Button onClick={() => addToCart(product, 1)} className="w-full h-9 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg active:scale-95 transition-all">Add To Cart</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Generic Card */}
          {genericSubstitute ? (
            <Card className="rounded-2xl border-2 border-green-500 bg-white overflow-hidden flex flex-col relative p-3 shadow-xl shadow-green-50">
              <div className="absolute top-0 right-0 z-10">
                <div className="bg-green-500 text-white font-black text-[6px] uppercase px-2 py-0.5 rounded-bl-lg shadow-md">
                  Save {percentageSaved}%
                </div>
              </div>
              <p className="text-[6px] font-black text-green-600 uppercase tracking-widest mb-2">Our Recommendation</p>
              <div className="aspect-square w-full max-w-[80px] bg-gray-50 rounded-xl mx-auto mb-3 p-2 relative">
                <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <h3 className="text-[9px] font-black text-gray-900 leading-tight uppercase line-clamp-2">{genericSubstitute.name}</h3>
                <p className="text-[6px] font-bold text-gray-400 uppercase leading-none">{genericSubstitute.manufacturer}</p>
                <p className="text-[7px] font-black text-gray-300 uppercase mt-0.5">{genericSubstitute.packSize}</p>

                <div className="mt-auto pt-3">
                  <div className="text-[12px] font-black text-green-600">₹{genericSubstitute.price}</div>
                  <p className="text-[7px] font-bold text-gray-400">₹{(genericSubstitute.price / getUnitCount(genericSubstitute.packSize || '')).toFixed(1)} / Tablet</p>
                  
                  <div className="mt-3">
                    {genericQty > 0 ? (
                      <div className="flex items-center justify-between bg-green-600 rounded-lg h-9 px-2 shadow-lg">
                        <button onClick={() => updateQuantity(genericSubstitute.id, -1)} className="p-1.5 text-white hover:opacity-80 transition-opacity"><Minus className="w-3 h-3" /></button>
                        <span className="text-[11px] font-black text-white">{genericQty}</span>
                        <button onClick={() => updateQuantity(genericSubstitute.id, 1)} className="p-1.5 text-white hover:opacity-80 transition-opacity"><Plus className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(genericSubstitute, 1)} className="w-full h-9 rounded-lg text-[8px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 active:scale-95 transition-all">Add To Cart</Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-6 text-center">
              <Info className="w-6 h-6 text-gray-200 mb-2" />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">No alternative bio-equivalent available in current inventory</p>
            </Card>
          )}
        </div>

        {/* Comparative Clinical Insights */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-[8px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-primary" /> Uses
            </h3>
            <ul className="space-y-1">
              {(product?.uses || []).slice(0, 3).map((use: string, i: number) => (
                <li key={i} className="text-[8px] font-bold text-gray-600 leading-tight">• {use}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-[8px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-orange-500" /> Side Effects
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(product?.sideEffects || []).slice(0, 3).map((effect: string, i: number) => (
                <span key={i} className="text-[7px] font-black bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md">{effect}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical Safety Advice Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Wine, label: "Alcohol", text: product?.safetyAdvice?.alcohol || "Consult Doctor" },
            { icon: Baby, label: "Pregnancy", text: product?.safetyAdvice?.pregnancy || "Consult Doctor" },
            { icon: Car, label: "Driving", text: product?.safetyAdvice?.driving || "Generally Safe" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-2.5 rounded-xl border border-gray-50 flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <item.icon className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[6px] font-black text-gray-400 uppercase leading-none mb-1">{item.label}</p>
                <p className="text-[7px] font-black text-gray-700 truncate">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
