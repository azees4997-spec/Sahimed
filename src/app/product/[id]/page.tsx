
"use client"

import { use, useState, useEffect } from 'react';
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
  Activity,
  Info,
  Loader2,
  ChevronLeft,
  TrendingDown
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
  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  // Fetch Generic Alternative (Bio-equivalent)
  // We search for products with the same salt composition but flagged as generic
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

  // Suggested Products (Same Category)
  const suggestedQuery = useMemoFirebase(() => {
    if (!db || !product) return null;
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Clinical Records...</p>
        </div>
      </div>
    );
  }

  if (!product && !productLoading) {
    return notFound();
  }

  const handleAdd = (p: any) => {
    addToCart(p);
    toast({ title: "Item Added", description: `${p.name} added to your cart.` });
  };

  const getQty = (pid: string) => cart.find(i => i.id === pid)?.quantity || 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24 sm:pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-1 text-primary hover:opacity-80 transition-all">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>{product?.category}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-primary truncate max-w-[150px]">{product?.name}</span>
          </div>
        </div>

        <div className="bg-primary text-white p-6 rounded-[32px] mb-8 flex flex-col sm:flex-row items-center justify-between shadow-2xl shadow-primary/20">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Active Composition</p>
              <h2 className="font-black text-lg sm:text-xl">{product?.saltComposition}</h2>
            </div>
          </div>
          <Badge className="bg-white text-primary font-black text-[10px] px-6 py-2 rounded-full border-none shadow-lg">
            VERIFIED BIO-EQUIVALENT
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Item Detail */}
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col group h-full">
               <div className="mb-6">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-4 py-1 rounded-full text-gray-400">
                    {product?.isGeneric ? "Generic Clinical Version" : "Prescribed Brand"}
                  </Badge>
               </div>
               <div className="flex flex-col items-center text-center gap-6 flex-1">
                  <div className="w-full aspect-square relative bg-gray-50 rounded-[32px] overflow-hidden p-8">
                    <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="w-full">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 leading-tight">{product?.name}</h1>
                    <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Manufacturer: {product?.manufacturer}</p>
                    <div className="text-4xl font-black text-primary mb-6">₹{product?.price}</div>
                  </div>
               </div>
               <div className="mt-6 pt-6 border-t border-gray-50">
                  {getQty(product?.id!) > 0 ? (
                    <div className="flex items-center justify-between border-2 border-primary rounded-full h-16 px-4 bg-primary/5">
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product?.id!, -1)}>
                        <Minus className="w-5 h-5" />
                      </Button>
                      <span className="font-black text-xl text-primary">{getQty(product?.id!)}</span>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product?.id!, 1)}>
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleAdd(product)} className="w-full h-16 rounded-full font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
                      Add to Pharmacy Cart
                    </Button>
                  )}
               </div>
            </div>
          </div>

          {/* Savings / Alternative Section */}
          <div className="space-y-6">
            {genericSubstitute ? (
              <div className="bg-gradient-to-br from-green-50 to-white rounded-[40px] p-8 shadow-2xl border-2 border-green-200 flex flex-col h-full relative group overflow-hidden">
                 <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white font-black text-xs uppercase px-6 py-3 rounded-bl-[24px] shadow-lg flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" /> Save ₹{product!.price - genericSubstitute.price}
                    </div>
                 </div>
                 <div className="mb-6">
                  <Badge className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-4 py-1 rounded-full">
                    Recommended Alternative
                  </Badge>
                 </div>
                 <div className="flex flex-col items-center text-center gap-6 flex-1">
                    <div className="w-full aspect-square relative bg-white rounded-[32px] overflow-hidden p-8 shadow-inner border border-green-50">
                      <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="w-full">
                      <h2 className="text-2xl font-black text-green-900 mb-2 leading-tight">{genericSubstitute.name}</h2>
                      <p className="text-xs font-bold text-green-600/60 mb-4 uppercase tracking-widest">{genericSubstitute.manufacturer} Clinical</p>
                      <div className="flex items-baseline justify-center gap-3 mb-6">
                        <span className="text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                        <span className="text-gray-300 line-through text-lg font-bold">₹{product?.price}</span>
                      </div>
                    </div>
                 </div>
                 <div className="mt-6 pt-6 border-t border-green-100">
                    {getQty(genericSubstitute.id) > 0 ? (
                      <div className="flex items-center justify-between border-2 border-green-600 rounded-full h-16 px-4 bg-green-50">
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                          <Minus className="w-5 h-5" />
                        </Button>
                        <span className="font-black text-xl text-green-900">{getQty(genericSubstitute.id)}</span>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-16 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-2xl shadow-green-200 active:scale-95 transition-all gap-2">
                        <Zap className="w-5 h-5" /> Switch & Save
                      </Button>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Info className="w-10 h-10 text-gray-300" />
                 </div>
                 <h3 className="font-black text-gray-900 mb-2 uppercase text-lg">Bio-Equivalent Sourcing</h3>
                 <p className="text-sm text-gray-400 font-bold max-w-xs">Our pharmacological team is currently validating a high-savings generic bio-equivalent for this salt composition.</p>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Info */}
        <section className="mt-12 bg-white p-10 rounded-[40px] border border-gray-100">
           <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
             <Info className="w-5 h-5 text-primary" /> Clinical Indication & Guidance
           </h4>
           <p className="text-gray-600 leading-relaxed font-medium text-lg mb-8">{product?.description}</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                 <h5 className="font-black text-primary text-xs uppercase tracking-widest mb-4">Therapeutic Uses</h5>
                 <ul className="space-y-3">
                   {['Clinically indicated for ' + product?.category, 'Salt: ' + product?.saltComposition].map((use, i) => (
                     <li key={i} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                       <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                       {use}
                     </li>
                   ))}
                 </ul>
              </div>
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                 <h5 className="font-black text-orange-600 text-xs uppercase tracking-widest mb-4">Clinical Quality</h5>
                 <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                    <ShieldCheck className="w-8 h-8 text-orange-500" />
                    <span>This product is sourced from WHO-GMP certified facilities.</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Suggested Section */}
        {suggestedProducts && suggestedProducts.length > 1 && (
          <section className="mt-16 pt-16 border-t">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Therapeutic Suggestions</h3>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">See Full Catalog</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {suggestedProducts.filter(p => p.id !== product?.id).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
