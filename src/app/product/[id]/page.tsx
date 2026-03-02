
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

  const handleAdd = (p: any) => {
    addToCart(p, 1);
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
    <div className="min-h-screen bg-[#F8F8F8] pb-32 page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-2">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 mb-2 text-[7px] font-bold text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <Link href="/search" className="hover:text-primary">Medicines</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <span className="text-primary truncate">{product?.name}</span>
        </div>

        {/* Salt Composition Banner */}
        <div className="mb-3 bg-white border border-primary/5 rounded-lg py-1.5 px-3 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-0.5">
             <div className="flex items-center gap-1">
                <Dna className="w-2.5 h-2.5 text-primary" />
                <p className="text-[6px] font-black uppercase tracking-widest text-gray-400">Salt Composition</p>
             </div>
             <h2 className="text-[8px] font-black text-gray-900 uppercase tracking-tight text-center">{product?.saltComposition}</h2>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Branded Product Card */}
          <Card className="rounded-xl border-none bg-gray-100/30 overflow-hidden flex flex-col p-2 shadow-sm relative">
            <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Original Search</p>
            <div className="aspect-square w-full max-w-[70px] bg-white rounded-md mx-auto mb-2 p-1 relative shadow-inner">
              <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-[8px] font-black text-gray-900 leading-tight uppercase line-clamp-2">{product?.name}</h3>
              <p className="text-[6px] font-bold text-gray-400 uppercase leading-none">{product?.manufacturer}</p>
              <p className="text-[6px] font-black text-gray-300 uppercase mt-0.5">{product?.packSize}</p>
              
              <div className="mt-auto pt-2">
                <div className="text-[10px] font-black text-gray-900">₹{product?.price}</div>
                <p className="text-[6px] font-bold text-gray-400">₹{(product?.price / getUnitCount(product?.packSize || '')).toFixed(1)} / Unit</p>
                
                <div className="mt-2">
                  {brandedQty > 0 ? (
                    <div className="flex items-center justify-between bg-primary rounded-full h-7 px-1.5 shadow-md">
                      <button onClick={() => updateQuantity(product.id, -1)} className="p-1 text-white hover:opacity-80 transition-opacity"><Minus className="w-2.5 h-2.5" /></button>
                      <span className="text-[9px] font-black text-white">{brandedQty}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="p-1 text-white hover:opacity-80 transition-opacity"><Plus className="w-2.5 h-2.5" /></button>
                    </div>
                  ) : (
                    <Button onClick={() => handleAdd(product)} className="w-full h-7 rounded-full text-[7px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-md">Add To Cart</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Generic Card */}
          {genericSubstitute ? (
            <Card className="rounded-xl border-2 border-green-500 bg-white overflow-hidden flex flex-col relative p-2 shadow-lg shadow-green-100">
              <div className="absolute top-0 right-0 z-10">
                <div className="bg-green-500 text-white font-black text-[6px] uppercase px-1.5 py-0.5 rounded-bl-md shadow-sm">
                  Save {percentageSaved}%
                </div>
              </div>
              <p className="text-[6px] font-black text-green-600 uppercase tracking-widest mb-1.5">Our Recommendation</p>
              <div className="aspect-square w-full max-w-[70px] bg-gray-50 rounded-md mx-auto mb-2 p-1 relative">
                <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <h3 className="text-[8px] font-black text-gray-900 leading-tight uppercase line-clamp-2">{genericSubstitute.name}</h3>
                <p className="text-[6px] font-bold text-gray-400 uppercase leading-none">{genericSubstitute.manufacturer}</p>
                <p className="text-[6px] font-black text-gray-300 uppercase mt-0.5">{genericSubstitute.packSize}</p>

                <div className="mt-auto pt-2">
                  <div className="text-[10px] font-black text-green-600">₹{genericSubstitute.price}</div>
                  <p className="text-[6px] font-bold text-gray-400">₹{(genericSubstitute.price / getUnitCount(genericSubstitute.packSize || '')).toFixed(1)} / Unit</p>
                  
                  <div className="mt-2">
                    {genericQty > 0 ? (
                      <div className="flex items-center justify-between bg-green-600 rounded-full h-7 px-1.5 shadow-md">
                        <button onClick={() => updateQuantity(genericSubstitute.id, -1)} className="p-1 text-white hover:opacity-80 transition-opacity"><Minus className="w-2.5 h-2.5" /></button>
                        <span className="text-[9px] font-black text-white">{genericQty}</span>
                        <button onClick={() => updateQuantity(genericSubstitute.id, 1)} className="p-1 text-white hover:opacity-80 transition-opacity"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-7 rounded-full text-[7px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100">Add To Cart</Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-4 text-center">
              <Info className="w-4 h-4 text-gray-300 mb-1" />
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">No Alternative Found</p>
            </Card>
          )}
        </div>

        {/* Clinical Insights */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-[7px] font-black text-gray-900 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-primary" /> Uses
            </h3>
            <ul className="space-y-0.5">
              {(product?.uses || []).slice(0, 3).map((use: string, i: number) => (
                <li key={i} className="text-[7px] font-bold text-gray-600 leading-tight">• {use}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-[7px] font-black text-gray-900 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5 text-orange-500" /> Side Effects
            </h3>
            <div className="flex flex-wrap gap-1">
              {(product?.sideEffects || []).slice(0, 3).map((effect: string, i: number) => (
                <span key={i} className="text-[6px] font-black bg-orange-50 text-orange-700 px-1 py-0 rounded-sm">{effect}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: Wine, label: "Alcohol", text: product?.safetyAdvice?.alcohol || "Consult" },
            { icon: Baby, label: "Pregnancy", text: product?.safetyAdvice?.pregnancy || "Consult" },
            { icon: Car, label: "Driving", text: product?.safetyAdvice?.driving || "Safe" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-2 rounded-lg border border-gray-50 flex items-center gap-1.5">
              <item.icon className="w-2.5 h-2.5 text-gray-300" />
              <div className="min-w-0">
                <p className="text-[5px] font-black text-gray-400 uppercase leading-none mb-0.5">{item.label}</p>
                <p className="text-[6px] font-bold text-gray-700 truncate">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
