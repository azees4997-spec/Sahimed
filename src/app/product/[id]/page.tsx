
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
  Minus,
  BriefcaseMedical
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
        <div className="flex items-center gap-1.5 mb-2 text-[7px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <Link href="/search" className="hover:text-primary">Medicines</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <span className="text-primary truncate">{product?.name}</span>
        </div>

        <div className="mb-3 bg-white border border-primary/5 rounded-xl py-3 px-4 shadow-sm border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-primary/5 p-2 rounded-lg"><Dna className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Bio-Equivalent Formula</p>
                  <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{product?.saltComposition}</h2>
                </div>
             </div>
             <BriefcaseMedical className="w-4 h-4 text-gray-200" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Branded Product Card */}
          <Card className="rounded-[24px] border-none bg-white overflow-hidden flex flex-col p-4 shadow-sm border border-gray-100">
            <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest mb-3">Branded Reference</p>
            <div className="aspect-square w-full max-w-[100px] bg-gray-50 rounded-2xl mx-auto mb-4 p-2 relative">
              <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <h3 className="text-[10px] font-black text-gray-900 uppercase min-h-[2.5em]">{product?.name}</h3>
              <p className="text-[7px] font-bold text-gray-400 uppercase">{product?.manufacturer}</p>
              
              <div className="mt-auto pt-4">
                <div className="text-[14px] font-black text-gray-900">₹{product?.price}</div>
                <p className="text-[8px] font-bold text-gray-400">₹{(product?.price / getUnitCount(product?.packSize || '')).toFixed(1)} / Unit</p>
                
                <div className="mt-4">
                  {brandedQty > 0 ? (
                    <div className="flex items-center justify-between bg-primary rounded-xl h-10 px-2 shadow-lg">
                      <button onClick={() => updateQuantity(product.id, -1)} className="p-1.5 text-white"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-[11px] font-black text-white">{brandedQty}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="p-1.5 text-white"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <Button onClick={() => addToCart(product, 1)} className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary shadow-xl">Add To Cart</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Generic Card */}
          {genericSubstitute ? (
            <Card className="rounded-[24px] border-2 border-green-500 bg-white overflow-hidden flex flex-col p-4 shadow-2xl shadow-green-100">
              <div className="absolute top-0 right-0 z-10">
                <div className="bg-green-500 text-white font-black text-[7px] uppercase px-3 py-1 rounded-bl-xl shadow-lg">Save {percentageSaved}%</div>
              </div>
              <p className="text-[6px] font-black text-green-600 uppercase tracking-widest mb-3">Smart Choice</p>
              <div className="aspect-square w-full max-w-[100px] bg-green-50/50 rounded-2xl mx-auto mb-4 p-2 relative">
                <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <h3 className="text-[10px] font-black text-gray-900 uppercase min-h-[2.5em]">{genericSubstitute.name}</h3>
                <p className="text-[7px] font-bold text-gray-400 uppercase">{genericSubstitute.manufacturer}</p>

                <div className="mt-auto pt-4">
                  <div className="text-[14px] font-black text-green-600">₹{genericSubstitute.price}</div>
                  <p className="text-[8px] font-bold text-gray-400">₹{(genericSubstitute.price / getUnitCount(genericSubstitute.packSize || '')).toFixed(1)} / Unit</p>
                  
                  <div className="mt-4">
                    {genericQty > 0 ? (
                      <div className="flex items-center justify-between bg-green-600 rounded-xl h-10 px-2 shadow-xl">
                        <button onClick={() => updateQuantity(genericSubstitute.id, -1)} className="p-1.5 text-white"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-[11px] font-black text-white">{genericQty}</span>
                        <button onClick={() => updateQuantity(genericSubstitute.id, 1)} className="p-1.5 text-white"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(genericSubstitute, 1)} className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-green-600 shadow-2xl">Add To Cart</Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-8 text-center">
              <Info className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">No alternative bio-equivalent available</p>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Therapeutic Uses</h3>
            <ul className="space-y-2">
              {(product?.uses || []).slice(0, 3).map((use: string, i: number) => (
                <li key={i} className="text-[9px] font-bold text-gray-600 leading-tight flex gap-2"><span className="text-primary">•</span> {use}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-500" /> Side Effects</h3>
            <div className="flex flex-wrap gap-2">
              {(product?.sideEffects || []).slice(0, 3).map((effect: string, i: number) => (
                <span key={i} className="text-[8px] font-black bg-orange-50 text-orange-700 px-3 py-1 rounded-lg border border-orange-100">{effect}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Wine, label: "Alcohol", text: product?.safetyAdvice?.alcohol || "Consult Doctor" },
            { icon: Baby, label: "Pregnancy", text: product?.safetyAdvice?.pregnancy || "Consult Doctor" },
            { icon: Car, label: "Driving", text: product?.safetyAdvice?.driving || "Generally Safe" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-2xl border border-gray-50 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-gray-100"><item.icon className="w-4 h-4 text-gray-400" /></div>
              <div className="min-w-0">
                <p className="text-[7px] font-black text-gray-400 uppercase leading-none mb-1">{item.label}</p>
                <p className="text-[8px] font-black text-gray-700 truncate">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
