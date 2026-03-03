
"use client"

import React, { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Zap,
  ShieldCheck
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

  const getUnitPrice = (price: number, packSize: string = "") => {
    const match = packSize.match(/\d+/);
    if (match) {
      const units = parseInt(match[0]);
      if (units > 0) return (price / units).toFixed(1);
    }
    return null;
  };

  if (productLoading || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !productLoading) return notFound();

  const brandedQty = getItemQuantity(product?.id || '');
  const genericQty = genericSubstitute ? getItemQuantity(genericSubstitute.id) : 0;

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

        {!product.isGeneric && genericSubstitute ? (
          <div className="space-y-6">
            <div className="text-center py-2">
               <div className="inline-flex items-center gap-2 bg-primary/5 px-6 py-2.5 rounded-full border border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Molecule Bridge: {product.saltComposition}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branded Card */}
              <Card className={cn(
                "rounded-[40px] border-none bg-white p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden flex flex-col group",
                brandedOutOfStock && "opacity-80"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">BRANDED SKU</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase">{product.name.split(' ')[0]}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-3 py-1 rounded-full">Your Item</Badge>
                </div>
                
                <div className="aspect-square relative w-full max-w-[160px] mx-auto mb-8">
                  <Image src={product.imageUrl} alt={product.name} fill className={cn("object-contain group-hover:scale-105 transition-transform duration-500", brandedOutOfStock && "grayscale")} />
                </div>

                <div className="flex-1 space-y-6">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">{product.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Composition</p>
                      <p className="text-[11px] font-black text-gray-700 uppercase">{product.saltComposition}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Packing</p>
                      <p className="text-[11px] font-black text-gray-700 uppercase">{product.packSize}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Marketer</p>
                      <p className="text-[11px] font-black text-gray-700 uppercase">{product.manufacturer}</p>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-gray-50 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MRP</span>
                           <span className="text-[10px] text-gray-400 line-through">₹{product.mrp || product.price + 100}</span>
                        </div>
                        <div className="text-[28px] font-black text-gray-900 leading-none">₹{product.price}</div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">₹{getUnitPrice(product.price, product.packSize)} / Unit</p>
                      </div>
                    </div>
                    
                    {brandedOutOfStock ? (
                      <Button onClick={() => handleNotify(product)} className="w-full h-14 rounded-full text-[11px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 gap-2">
                        <BellRing className="w-4 h-4" /> Notify Stock
                      </Button>
                    ) : brandedQty > 0 ? (
                      <div className="flex items-center justify-between bg-primary rounded-full h-14 px-4 shadow-xl shadow-primary/20">
                        <button onClick={() => updateQuantity(product.id, -1)} className="p-2 text-white"><Minus className="w-5 h-5" /></button>
                        <span className="text-lg font-black text-white">{brandedQty}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="p-2 text-white"><Plus className="w-5 h-5" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(product, 1)} className="w-full h-14 rounded-full text-[11px] font-black uppercase bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">Add To Cart</Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Generic Card */}
              <Card className={cn(
                "rounded-[40px] border-[2.5px] border-accent bg-white p-6 sm:p-8 shadow-2xl shadow-accent/10 transition-all relative overflow-hidden flex flex-col group",
                genericOutOfStock && "opacity-80"
              )}>
                <div className="absolute top-0 right-0 bg-accent text-white px-5 py-2 rounded-bl-[20px] text-[10px] font-black uppercase tracking-widest shadow-lg">SAVE {percentageSaved}%</div>
                
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">MOLECULE LINK</p>
                    <p className="text-[10px] font-black text-accent uppercase">{genericSubstitute.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black uppercase px-3 py-1 rounded-full">Our Recommendation</Badge>
                </div>
                
                <div className="aspect-square relative w-full max-w-[160px] mx-auto mb-8">
                  <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className={cn("object-contain group-hover:scale-110 transition-transform duration-700", genericOutOfStock && "grayscale")} />
                  {!genericOutOfStock && (
                    <div className="absolute -bottom-4 -right-4 bg-accent text-white rounded-full p-3 shadow-2xl animate-bounce">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-6">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">{genericSubstitute.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Composition</p>
                      <p className="text-[11px] font-black text-gray-700 uppercase">{genericSubstitute.saltComposition}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Packing</p>
                      <p className="text-[11px] font-black text-gray-700 uppercase">{genericSubstitute.packSize}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Marketer</p>
                      <p className="text-[11px] font-black text-gray-700 uppercase">{genericSubstitute.manufacturer}</p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MRP</span>
                           <span className="text-[10px] text-gray-400 line-through">₹{genericSubstitute.mrp || genericSubstitute.price + 50}</span>
                        </div>
                        <div className="text-[28px] font-black text-accent leading-none">₹{genericSubstitute.price}</div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">₹{getUnitPrice(genericSubstitute.price, genericSubstitute.packSize)} / Unit</p>
                      </div>
                    </div>
                    
                    {genericOutOfStock ? (
                      <Button onClick={() => handleNotify(genericSubstitute)} className="w-full h-14 rounded-full text-[11px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 gap-2">
                        <BellRing className="w-4 h-4" /> Notify Stock
                      </Button>
                    ) : genericQty > 0 ? (
                      <div className="flex items-center justify-between bg-accent rounded-full h-14 px-4 shadow-xl shadow-accent/20">
                        <button onClick={() => updateQuantity(genericSubstitute.id, -1)} className="p-2 text-white"><Minus className="w-5 h-5" /></button>
                        <span className="text-lg font-black text-white">{genericQty}</span>
                        <button onClick={() => updateQuantity(genericSubstitute.id, 1)} className="p-2 text-white"><Plus className="w-5 h-5" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(genericSubstitute, 1)} className="w-full h-14 rounded-full text-[11px] font-black uppercase bg-accent shadow-xl shadow-accent/30 hover:scale-[1.02] transition-transform text-white">Switch & Save</Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="bg-white rounded-[50px] p-8 sm:p-12 shadow-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-12 items-center overflow-hidden relative">
                <div className="absolute top-8 right-8 bg-accent/5 text-accent px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/10">
                   Our Recommendation
                </div>
                
                <div className="relative aspect-square w-full max-w-[400px] mx-auto">
                   <div className="absolute inset-0 bg-accent/5 rounded-full blur-[100px] opacity-30" />
                   <Image src={product.imageUrl} alt={product.name} fill className="object-contain relative z-10" />
                </div>

                <div className="space-y-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-12 bg-accent rounded-full" />
                         <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Clinical Excellence</span>
                      </div>
                      <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">{product.name}</h1>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Composition</p>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">{product.saltComposition}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[32px] border">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Unit Price</p>
                        <p className="text-2xl font-black text-accent">₹{product.price}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">₹{getUnitPrice(product.price, product.packSize)} / UNIT</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Marketer</p>
                        <p className="text-xs font-bold text-gray-900 uppercase truncate">{product.manufacturer}</p>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      {brandedOutOfStock ? (
                         <Button onClick={() => handleNotify(product)} className="flex-1 h-16 rounded-full text-sm font-black uppercase tracking-widest bg-orange-600 shadow-xl shadow-orange-200">Notify Stock</Button>
                      ) : (
                        <div className="flex-1 flex gap-3">
                           {brandedQty > 0 ? (
                              <div className="flex items-center justify-between bg-accent rounded-full h-16 flex-1 px-8 shadow-2xl shadow-accent/20">
                                 <button onClick={() => updateQuantity(product.id, -1)} className="p-2 text-white"><Minus className="w-6 h-6" /></button>
                                 <span className="text-xl font-black text-white">{brandedQty}</span>
                                 <button onClick={() => updateQuantity(product.id, 1)} className="p-2 text-white"><Plus className="w-6 h-6" /></button>
                              </div>
                           ) : (
                             <Button onClick={() => addToCart(product, 1)} className="flex-1 h-16 rounded-full text-sm font-black uppercase tracking-widest bg-accent shadow-2xl shadow-accent/30 text-white">Add To Cart</Button>
                           )}
                        </div>
                      )}
                      <Button variant="outline" className="w-16 h-16 rounded-full border-2"><Info className="w-6 h-6" /></Button>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card className="rounded-[40px] p-8 border-none bg-white shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
               <Activity className="w-5 h-5 text-primary" /> Therapeutic Uses
            </h3>
            <div className="flex flex-wrap gap-2">
               {(product.uses || ["Clinical Management", "Pharmacist Verified"]).map((use: string, i: number) => (
                 <span key={i} className="bg-gray-50 px-4 py-2 rounded-2xl text-[10px] font-bold text-gray-600 uppercase border border-dashed">{use}</span>
               ))}
            </div>
          </Card>

          <Card className="rounded-[40px] p-8 border-none bg-white shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-accent" /> Pharmacist Notes
            </h3>
            <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed tracking-widest">
              This medication is quality-tested and sourced directly from clinical channels in Mumbai. Always follow the prescribed dosage.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
