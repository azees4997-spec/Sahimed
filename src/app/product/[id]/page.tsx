
"use client"

import { use, useState } from 'react';
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
    <div className="min-h-screen bg-[#F8F8F8] pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link href="/" className="flex items-center gap-1 text-primary hover:opacity-80 transition-all">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span>
          </Link>
        </div>

        {/* Composition Banner */}
        <div className="bg-primary text-white p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] mb-6 flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-primary/10">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/10 rounded-lg sm:rounded-2xl flex items-center justify-center backdrop-blur">
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/60">Active Salt</p>
              <h2 className="font-black text-xs sm:text-xl line-clamp-1">{product?.saltComposition}</h2>
            </div>
          </div>
        </div>

        {/* SIDE BY SIDE MOBILE GRID */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8">
          {/* Main Branded Product */}
          <div className="bg-white rounded-[24px] sm:rounded-[40px] p-4 sm:p-8 shadow-sm border border-gray-100 flex flex-col group h-full">
             <div className="mb-2">
                <Badge variant="outline" className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-2 py-0.5 rounded-full text-gray-400">
                  {product?.isGeneric ? "Generic" : "Branded"}
                </Badge>
             </div>
             <div className="flex flex-col items-center text-center gap-2 sm:gap-6 flex-1">
                <div className="w-full aspect-square relative bg-gray-50 rounded-[16px] sm:rounded-[32px] overflow-hidden p-3 sm:p-8">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="w-full">
                  <h1 className="text-[10px] sm:text-2xl font-black text-gray-900 mb-0.5 sm:mb-2 leading-tight line-clamp-2">{product?.name}</h1>
                  <p className="text-[7px] sm:text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest truncate">{product?.manufacturer}</p>
                  <div className="text-sm sm:text-4xl font-black text-primary mb-3 sm:mb-6">₹{product?.price}</div>
                </div>
             </div>
             <div className="mt-auto pt-3 border-t border-gray-50">
                {getQty(product?.id!) > 0 ? (
                  <div className="flex items-center justify-between border border-primary rounded-full h-10 sm:h-16 px-2 bg-primary/5">
                    <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(product?.id!, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-black text-xs sm:text-xl text-primary">{getQty(product?.id!)}</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(product?.id!, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleAdd(product)} className="w-full h-10 sm:h-16 rounded-full font-black text-[9px] sm:text-lg shadow-lg shadow-primary/10">
                    Add
                  </Button>
                )}
             </div>
          </div>

          {/* Generic Side-by-Side Alternative */}
          <div className="h-full">
            {genericSubstitute ? (
              <div className="bg-gradient-to-br from-green-50 to-white rounded-[24px] sm:rounded-[40px] p-4 sm:p-8 shadow-xl border-2 border-green-200 flex flex-col h-full relative group overflow-hidden">
                 <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white font-black text-[7px] sm:text-xs uppercase px-2 sm:px-4 py-1 sm:py-2 rounded-bl-lg shadow-md flex items-center gap-1">
                      <TrendingDown className="w-2 h-2 sm:w-4 sm:h-4" /> -₹{product!.price - genericSubstitute.price}
                    </div>
                 </div>
                 <div className="mb-2">
                  <Badge className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-2 py-0.5 rounded-full">
                    Best Value
                  </Badge>
                 </div>
                 <div className="flex flex-col items-center text-center gap-2 sm:gap-6 flex-1">
                    <div className="w-full aspect-square relative bg-white rounded-[16px] sm:rounded-[32px] overflow-hidden p-3 sm:p-8 shadow-inner border border-green-50">
                      <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="w-full">
                      <h2 className="text-[10px] sm:text-2xl font-black text-green-900 mb-0.5 sm:mb-2 leading-tight line-clamp-2">{genericSubstitute.name}</h2>
                      <p className="text-[7px] sm:text-xs font-bold text-green-600/60 mb-2 uppercase tracking-widest truncate">{genericSubstitute.manufacturer}</p>
                      <div className="flex items-baseline justify-center gap-1 sm:gap-3 mb-3 sm:mb-6">
                        <span className="text-sm sm:text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                        <span className="text-[8px] sm:text-lg text-gray-300 line-through font-bold">₹{product?.price}</span>
                      </div>
                    </div>
                 </div>
                 <div className="mt-auto pt-3 border-t border-green-100">
                    {getQty(genericSubstitute.id) > 0 ? (
                      <div className="flex items-center justify-between border border-green-600 rounded-full h-10 sm:h-16 px-2 bg-green-50">
                        <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-black text-xs sm:text-xl text-green-900">{getQty(genericSubstitute.id)}</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-10 sm:h-16 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[9px] sm:text-lg shadow-xl shadow-green-100 gap-1">
                        <Zap className="w-3 h-3" /> Switch
                      </Button>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gray-50 rounded-[24px] sm:rounded-[40px] border-2 border-dashed border-gray-200">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                    <Info className="w-5 h-5 text-gray-300" />
                 </div>
                 <h3 className="font-black text-gray-900 mb-1 uppercase text-[8px] sm:text-lg">Sourcing...</h3>
                 <p className="text-[7px] sm:text-sm text-gray-400 font-bold uppercase">Validating Generic</p>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Info */}
        <section className="mt-6 bg-white p-6 rounded-[24px] sm:rounded-[40px] border border-gray-100">
           <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
             <Info className="w-4 h-4 text-primary" /> Clinical Indication
           </h4>
           <p className="text-gray-600 leading-relaxed font-medium text-sm sm:text-lg mb-6">{product?.description}</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                 <h5 className="font-black text-primary text-[10px] uppercase tracking-widest mb-2">Therapeutic Uses</h5>
                 <ul className="space-y-2">
                   <li className="flex items-start gap-2 text-[10px] sm:text-sm font-bold text-gray-700">
                     <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                     {product?.category}
                   </li>
                 </ul>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                 <h5 className="font-black text-orange-600 text-[10px] uppercase tracking-widest mb-2">Quality</h5>
                 <div className="flex items-center gap-3 text-[10px] sm:text-sm font-bold text-gray-700">
                    <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>Bio-equivalence guaranteed.</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Similar Products */}
        {suggestedProducts && suggestedProducts.length > 1 && (
          <section className="mt-8 pt-8 border-t">
            <h3 className="text-sm sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Similar Medicines</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
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
