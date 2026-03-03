
"use client"

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity,
  Loader2,
  ChevronRight,
  Info,
  AlertCircle,
  Plus,
  Minus,
  BellRing,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
    
    return query(
      collection(db, 'medicines'),
      where('moleculeId', '==', product.moleculeId || ''),
      where('isGeneric', '==', true),
      limit(1)
    );
  }, [db, product]);
  
  const { data: genericAlternatives, isLoading: genericLoading } = useCollection(genericQuery);
  const genericSubstitute = genericAlternatives?.[0];

  const brandedQty = getItemQuantity(product?.id || '');
  const genericQty = getItemQuantity(genericSubstitute?.id || '');

  const handleNotify = (p: any) => {
    if (!user) {
      toast({ title: "Login Required", description: "Sign in to receive stock notifications." });
      return;
    }
    const enquiryData = {
      medicineId: p.id,
      medicineName: p.name,
      userId: user.uid,
      timestamp: serverTimestamp()
    };
    addDocumentNonBlocking(collection(db, 'stockEnquiries'), enquiryData);
    toast({ title: "Notification Set", description: "We will notify you when stock returns." });
  };

  if (productLoading || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !productLoading) return notFound();

  const percentageSaved = product && genericSubstitute 
    ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) 
    : 0;

  const brandedOutOfStock = (product.availableQuantity || 0) <= 0;
  const genericOutOfStock = genericSubstitute ? (genericSubstitute.availableQuantity || 0) <= 0 : false;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 mb-6 text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-2 h-2" />
          <Link href="/search" className="hover:text-primary">Medicines</Link>
          <ChevronRight className="w-2 h-2" />
          <span className="text-primary truncate">{product.name}</span>
        </div>

        {/* Branded Case: Comparison Mode */}
        {!product.isGeneric && genericSubstitute ? (
          <div className="space-y-4">
            <div className="text-center py-4">
               <div className="inline-flex items-center gap-2 bg-primary/5 px-6 py-2 rounded-full border border-primary/10 shadow-sm">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Molecule Bridge: {product.saltComposition}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className={cn(
                "rounded-[32px] border-none bg-white p-5 shadow-sm transition-all relative overflow-hidden flex flex-col",
                brandedOutOfStock && "opacity-80"
              )}>
                <div className="absolute top-0 left-0 bg-gray-200 text-gray-600 px-3 py-1 rounded-br-xl text-[8px] font-black uppercase tracking-widest">Your Item</div>
                
                <div className="aspect-square relative w-full max-w-[120px] mx-auto my-6">
                  <Image src={product.imageUrl} alt={product.name} fill className={cn("object-contain", brandedOutOfStock && "grayscale")} />
                </div>

                <div className="flex-1 space-y-3">
                  <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-tight leading-tight line-clamp-2">{product.name}</h3>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{product.manufacturer}</p>
                    <p className="text-[8px] font-bold text-gray-600 uppercase">{product.packSize}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[18px] font-black text-gray-900">₹{product.price}</span>
                      <span className="text-[10px] text-gray-400 line-through">₹{product.mrp || product.price + 200}</span>
                    </div>
                    {brandedOutOfStock ? (
                      <Button onClick={() => handleNotify(product)} className="w-full h-11 rounded-full text-[9px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 gap-2">
                        <BellRing className="w-3 h-3" /> Notify
                      </Button>
                    ) : brandedQty > 0 ? (
                      <div className="flex items-center justify-between bg-primary rounded-full h-11 px-3">
                        <button onClick={() => updateQuantity(product.id, -1)} className="p-1.5 text-white"><Minus className="w-4 h-4" /></button>
                        <span className="text-[12px] font-black text-white">{brandedQty}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="p-1.5 text-white"><Plus className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(product, 1)} className="w-full h-11 rounded-full text-[9px] font-black uppercase bg-primary shadow-lg">Add To Cart</Button>
                    )}
                  </div>
                </div>
              </Card>

              <Card className={cn(
                "rounded-[32px] border-2 border-primary bg-white p-5 shadow-2xl shadow-primary/10 transition-all relative overflow-hidden flex flex-col",
                genericOutOfStock && "opacity-80"
              )}>
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest">Our Recommendation</div>
                
                <div className="aspect-square relative w-full max-w-[120px] mx-auto my-6">
                  <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className={cn("object-contain", genericOutOfStock && "grayscale")} />
                  {!genericOutOfStock && (
                    <div className="absolute -bottom-2 -right-2 bg-accent text-white rounded-full p-2 shadow-xl animate-bounce">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-tight leading-tight line-clamp-2">{genericSubstitute.name}</h3>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black text-primary uppercase tracking-widest">High Quality Generic</p>
                    <p className="text-[8px] font-bold text-gray-600 uppercase">{genericSubstitute.packSize}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[22px] font-black text-primary">₹{genericSubstitute.price}</span>
                      <span className="text-[10px] text-accent font-black uppercase">Save {percentageSaved}%</span>
                    </div>
                    {genericOutOfStock ? (
                      <Button onClick={() => handleNotify(genericSubstitute)} className="w-full h-11 rounded-full text-[9px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 gap-2">
                        <BellRing className="w-3 h-3" /> Notify
                      </Button>
                    ) : genericQty > 0 ? (
                      <div className="flex items-center justify-between bg-primary rounded-full h-11 px-3">
                        <button onClick={() => updateQuantity(genericSubstitute.id, -1)} className="p-1.5 text-white"><Minus className="w-4 h-4" /></button>
                        <span className="text-[12px] font-black text-white">{genericQty}</span>
                        <button onClick={() => updateQuantity(genericSubstitute.id, 1)} className="p-1.5 text-white"><Plus className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(genericSubstitute, 1)} className="w-full h-11 rounded-full text-[9px] font-black uppercase bg-primary shadow-2xl shadow-primary/40">Switch & Save</Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Generic Case: Hero View */
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="bg-white rounded-[50px] p-8 sm:p-12 shadow-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-12 items-center overflow-hidden relative">
                <div className="absolute top-8 right-8 bg-primary/5 text-primary px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">
                   {product.isGeneric ? 'Our Recommendation' : 'Your Item'}
                </div>
                
                <div className="relative aspect-square w-full max-w-[400px] mx-auto">
                   <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] opacity-30" />
                   <Image src={product.imageUrl} alt={product.name} fill className="object-contain relative z-10" />
                </div>

                <div className="space-y-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-12 bg-primary rounded-full" />
                         <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Clinical Excellence</span>
                      </div>
                      <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">{product.name}</h1>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">{product.saltComposition}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[32px] border">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Unit Price</p>
                        <p className="text-2xl font-black text-primary">₹{product.price}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Packing</p>
                        <p className="text-xs font-bold text-gray-900 uppercase">{product.packSize}</p>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      {brandedOutOfStock ? (
                         <Button onClick={() => handleNotify(product)} className="flex-1 h-16 rounded-full text-sm font-black uppercase tracking-widest bg-orange-600 shadow-xl shadow-orange-200">Notify Stock</Button>
                      ) : (
                        <div className="flex-1 flex gap-3">
                           {brandedQty > 0 ? (
                              <div className="flex items-center justify-between bg-primary rounded-full h-16 flex-1 px-8 shadow-2xl shadow-primary/20">
                                 <button onClick={() => updateQuantity(product.id, -1)} className="p-2 text-white"><Minus className="w-6 h-6" /></button>
                                 <span className="text-xl font-black text-white">{brandedQty}</span>
                                 <button onClick={() => updateQuantity(product.id, 1)} className="p-2 text-white"><Plus className="w-6 h-6" /></button>
                              </div>
                           ) : (
                             <Button onClick={() => addToCart(product, 1)} className="flex-1 h-16 rounded-full text-sm font-black uppercase tracking-widest bg-primary shadow-2xl shadow-primary/30">Add To Cart</Button>
                           )}
                        </div>
                      )}
                      <Button variant="outline" className="w-16 h-16 rounded-full border-2"><Info className="w-6 h-6" /></Button>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="rounded-[40px] p-8 border-none bg-white shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
               <Activity className="w-5 h-5 text-primary" /> Therapeutic Uses
            </h3>
            <div className="flex flex-wrap gap-2">
               {(product.uses || []).map((use: string, i: number) => (
                 <span key={i} className="bg-gray-50 px-4 py-2 rounded-2xl text-[10px] font-bold text-gray-600 uppercase border border-dashed">{use}</span>
               ))}
            </div>
          </Card>

          <Card className="rounded-[40px] p-8 border-none bg-white shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
               <AlertCircle className="w-5 h-5 text-orange-500" /> Clinical Warnings
            </h3>
            <div className="flex flex-wrap gap-2">
               {(product.sideEffects || []).map((effect: string, i: number) => (
                 <span key={i} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase border border-orange-100">{effect}</span>
               ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
