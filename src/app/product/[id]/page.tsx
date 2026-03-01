
"use client"

import { use, useState } from 'react';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Minus, 
  Plus, 
  Factory, 
  AlertTriangle, 
  TrendingDown,
  ChevronLeft,
  Activity,
  Info,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, cart, updateQuantity } = useCart();

  // Fetch Main Product
  const productRef = useMemoFirebase(() => doc(db, 'medicines', id), [db, id]);
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  // Fetch Generic Alternative (Bio-equivalent)
  const genericQuery = useMemoFirebase(() => {
    if (!product || product.isGeneric) return null;
    return query(
      collection(db, 'medicines'),
      where('saltComposition', '==', product.saltComposition),
      where('isGeneric', '==', true),
      limit(1)
    );
  }, [db, product]);
  const { data: genericAlternatives } = useCollection(genericQuery);
  const genericSubstitute = genericAlternatives?.[0];

  // Suggested Products (Same Category)
  const suggestedQuery = useMemoFirebase(() => {
    if (!product) return null;
    return query(
      collection(db, 'medicines'),
      where('category', '==', product.category),
      limit(5)
    );
  }, [db, product]);
  const { data: suggestedProducts } = useCollection(suggestedQuery);

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) notFound();

  const handleAdd = (p: any) => {
    addToCart(p);
    toast({ title: "Added to cart", description: `${p.name} added.` });
  };

  const getQty = (pid: string) => cart.find(i => i.id === pid)?.quantity || 0;

  // Unit Economics helper
  const getUnitPrice = (p: any) => {
    const packSize = p.packSize || "10 tablets";
    const match = packSize.match(/(\d+)/);
    const count = match ? parseInt(match[0]) : 10;
    return (p.price / count).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24 sm:pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-1 text-primary hover:opacity-80 transition-all">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Store</span>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>{product.category}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-primary">{product.name}</span>
          </div>
        </div>

        {/* Composition Banner */}
        <div className="bg-primary text-white p-6 rounded-[32px] mb-8 flex flex-col sm:flex-row items-center justify-between shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Molecular Composition</p>
              <h2 className="font-black text-lg sm:text-xl">{product.saltComposition}</h2>
            </div>
          </div>
          <Badge className="bg-white text-primary font-black text-[10px] px-6 py-2 rounded-full border-none shadow-lg">
            BIO-EQUIVALENT FORMULA
          </Badge>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8">
          {/* COLUMN 1: BRANDED */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-[32px] sm:rounded-[48px] p-4 sm:p-10 shadow-sm border border-gray-100 flex flex-col h-full relative group">
               <div className="mb-4">
                  <Badge variant="outline" className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-3 py-1 rounded-full text-gray-400">
                    {product.isGeneric ? "Generic Item" : "Branded Item"}
                  </Badge>
               </div>
               <div className="flex flex-col items-center text-center gap-4 flex-1">
                  <div className="w-full aspect-square relative bg-gray-50 rounded-[24px] sm:rounded-[40px] overflow-hidden p-4 sm:p-8">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="w-full">
                    <h1 className="text-sm sm:text-2xl font-black text-gray-900 mb-1 leading-tight">{product.name}</h1>
                    <p className="text-[8px] sm:text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">{product.manufacturer}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg sm:text-3xl font-black text-gray-900">₹{product.price}</span>
                    </div>
                    <div className="text-[9px] sm:text-xs font-black text-primary uppercase tracking-widest bg-primary/5 py-1.5 px-4 rounded-full inline-block">
                      ₹{getUnitPrice(product)} / unit
                    </div>
                  </div>
               </div>
               <div className="mt-6 pt-6 border-t border-gray-50">
                  {getQty(product.id) > 0 ? (
                    <div className="flex items-center justify-between border-2 border-primary rounded-full h-12 sm:h-16 px-2 bg-primary/5">
                      <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-black text-sm sm:text-xl text-primary">{getQty(product.id)}</span>
                      <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleAdd(product)} className="w-full h-12 sm:h-16 rounded-full font-black text-[10px] sm:text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
                      Add to Cart
                    </Button>
                  )}
               </div>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-gray-100 space-y-8">
               <section>
                 <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-l-4 border-primary pl-3">Clinical Uses</h4>
                 <ul className="space-y-3">
                   {product.uses?.map((use: string, i: number) => (
                     <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-gray-700">
                       <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                       {use}
                     </li>
                   ))}
                 </ul>
               </section>
               <section>
                 <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-l-4 border-primary pl-3">Side Effects</h4>
                 <ul className="space-y-3">
                   {product.sideEffects?.map((se: string, i: number) => (
                     <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-gray-700">
                       <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                       {se}
                     </li>
                   ))}
                 </ul>
               </section>
            </div>
          </div>

          {/* COLUMN 2: GENERIC / BIO-EQUIVALENT */}
          <div className="space-y-4 sm:space-y-6">
            {genericSubstitute ? (
              <>
                <div className="bg-gradient-to-br from-green-50 to-white rounded-[32px] sm:rounded-[48px] p-4 sm:p-10 shadow-2xl border-2 border-green-200 flex flex-col h-full relative group overflow-hidden">
                   <div className="absolute top-0 right-0">
                      <div className="bg-green-600 text-white font-black text-[8px] sm:text-[11px] uppercase px-4 sm:px-8 py-2 sm:py-3 rounded-bl-[24px] shadow-lg flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> Save ₹{product.price - genericSubstitute.price}
                      </div>
                   </div>
                   <div className="mb-4">
                    <Badge className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-3 py-1 rounded-full">
                      Generic Alternative
                    </Badge>
                   </div>
                   <div className="flex flex-col items-center text-center gap-4 flex-1">
                      <div className="w-full aspect-square relative bg-white rounded-[24px] sm:rounded-[40px] overflow-hidden p-4 sm:p-8 shadow-inner border border-green-50">
                        <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="w-full">
                        <h2 className="text-sm sm:text-2xl font-black text-green-900 mb-1 leading-tight">{genericSubstitute.name}</h2>
                        <p className="text-[8px] sm:text-xs font-bold text-green-600/60 mb-3 uppercase tracking-widest">{genericSubstitute.manufacturer}</p>
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                          <span className="text-lg sm:text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                          <span className="text-gray-300 line-through text-[10px] sm:text-sm font-bold">₹{product.price}</span>
                        </div>
                        <div className="text-[9px] sm:text-xs font-black text-green-600 uppercase tracking-widest bg-green-100/50 py-1.5 px-4 rounded-full inline-block">
                          ₹{getUnitPrice(genericSubstitute)} / unit
                        </div>
                      </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-green-100">
                      {getQty(genericSubstitute.id) > 0 ? (
                        <div className="flex items-center justify-between border-2 border-green-600 rounded-full h-12 sm:h-16 px-2 bg-green-50">
                          <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-black text-sm sm:text-xl text-green-900">{getQty(genericSubstitute.id)}</span>
                          <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-12 sm:h-16 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[10px] sm:text-lg shadow-2xl shadow-green-200 active:scale-95 transition-all gap-2">
                          <Zap className="w-4 h-4 sm:w-6 sm:h-6" /> Switch & Save
                        </Button>
                      )}
                   </div>
                </div>
                <div className="bg-green-50/30 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-green-100 space-y-8">
                   <section>
                     <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-green-600 mb-3 border-l-4 border-green-600 pl-3">Clinical Uses</h4>
                     <ul className="space-y-3">
                       {genericSubstitute.uses?.map((use: string, i: number) => (
                         <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-gray-700">
                           <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                           {use}
                         </li>
                       ))}
                     </ul>
                   </section>
                   <section>
                     <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-green-600 mb-3 border-l-4 border-green-600 pl-3">Manufacturer</h4>
                     <div className="p-4 bg-white rounded-2xl border border-green-50 flex items-center gap-3">
                        <Factory className="w-6 h-6 text-green-600 opacity-30" />
                        <div>
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-tighter leading-none mb-1">Certified Generic Lab</p>
                          <p className="text-[10px] sm:text-xs font-bold text-gray-700 leading-tight">{genericSubstitute.manufacturer}</p>
                        </div>
                     </div>
                   </section>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Info className="w-8 h-8 text-gray-300" />
                 </div>
                 <h3 className="font-black text-gray-900 mb-2">No Generic Yet</h3>
                 <p className="text-xs text-gray-400 font-bold max-w-[180px]">We are working with labs to bring a bio-equivalent alternative for this medicine.</p>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Products Section */}
        {suggestedProducts && suggestedProducts.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-16 border-t">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl sm:text-2xl font-black font-headline text-gray-900 uppercase tracking-tight">Suggested Products</h3>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">Explore All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {suggestedProducts.filter(p => p.id !== product.id).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
