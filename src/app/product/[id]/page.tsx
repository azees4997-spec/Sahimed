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
  TrendingDown,
  AlertCircle,
  FlaskConical,
  Dna,
  Scale
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Records Sync...</p>
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

  const getUnitSavings = () => {
    if (!product || !genericSubstitute) return null;
    const match = product.packSize?.match(/\d+/);
    if (!match) return null;
    const units = parseInt(match[0]);
    const totalSaving = product.price - genericSubstitute.price;
    return (totalSaving / units).toFixed(2);
  };

  const unitSaving = getUnitSavings();

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-16">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-8">
        <div className="mb-3">
          <Link href="/" className="flex items-center gap-1 text-primary/60 hover:text-primary transition-all">
            <ChevronLeft className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Back to catalog</span>
          </Link>
        </div>

        {/* Composition Banner */}
        <div className="bg-primary text-white p-3.5 sm:p-6 rounded-xl sm:rounded-[32px] mb-4 flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-primary/10">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="w-7 h-7 sm:w-12 sm:h-12 bg-white/10 rounded-lg sm:rounded-2xl flex items-center justify-center backdrop-blur">
              <Activity className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">Active Salt</p>
              <h2 className="font-black text-[10px] sm:text-xl line-clamp-1 tracking-tight">{product?.saltComposition}</h2>
            </div>
          </div>
        </div>

        {/* SIDE BY SIDE MOBILE GRID */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-8 mb-6">
          {/* Main Branded Product */}
          <div className="bg-white rounded-2xl sm:rounded-[40px] p-3 sm:p-8 shadow-sm border border-gray-100 flex flex-col group h-full">
             <div className="mb-1.5">
                <Badge variant="outline" className="text-[6px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-50 border-none px-1.5 py-0.5 rounded-md text-gray-400">
                  {product?.isGeneric ? "Generic" : "Branded"}
                </Badge>
             </div>
             <div className="flex flex-col items-center text-center gap-1.5 sm:gap-6 flex-1">
                <div className="w-full aspect-square relative bg-gray-50/50 rounded-xl sm:rounded-[32px] overflow-hidden p-2 sm:p-8">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="w-full">
                  <h1 className="text-[9px] sm:text-2xl font-black text-gray-900 mb-0.5 sm:mb-2 leading-tight line-clamp-2 uppercase tracking-tighter">{product?.name}</h1>
                  <p className="text-[6px] sm:text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-widest truncate">{product?.manufacturer}</p>
                  <div className="text-[11px] sm:text-4xl font-black text-primary mb-2 sm:mb-6 tracking-tighter">₹{product?.price}</div>
                </div>
             </div>
             <div className="mt-auto pt-2 border-t border-gray-50">
                {getQty(product?.id!) > 0 ? (
                  <div className="flex items-center justify-between border border-primary/20 rounded-lg h-8 sm:h-16 px-1 bg-primary/5">
                    <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(product?.id!, -1)}>
                      <Minus className="w-2.5 h-2.5" />
                    </Button>
                    <span className="font-black text-[10px] sm:text-xl text-primary">{getQty(product?.id!)}</span>
                    <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(product?.id!, 1)}>
                      <Plus className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleAdd(product)} className="w-full h-8 sm:h-16 rounded-lg font-black text-[8px] sm:text-lg shadow-md shadow-primary/5 uppercase tracking-widest">
                    Add
                  </Button>
                )}
             </div>
          </div>

          {/* Generic Side-by-Side Alternative */}
          <div className="h-full">
            {genericSubstitute ? (
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl sm:rounded-[40px] p-3 sm:p-8 shadow-xl border-2 border-green-100 flex flex-col h-full relative group overflow-hidden">
                 <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white font-black text-[6px] sm:text-xs uppercase px-1.5 sm:px-4 py-0.5 sm:py-2 rounded-bl-lg shadow-md flex items-center gap-0.5">
                      <TrendingDown className="w-2 h-2" /> -₹{product!.price - genericSubstitute.price}
                    </div>
                 </div>
                 <div className="mb-1.5">
                  <Badge className="text-[6px] sm:text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-1.5 py-0.5 rounded-md">
                    Best Value
                  </Badge>
                 </div>
                 <div className="flex flex-col items-center text-center gap-1.5 sm:gap-6 flex-1">
                    <div className="w-full aspect-square relative bg-white rounded-xl sm:rounded-[32px] overflow-hidden p-2 sm:p-8 shadow-inner border border-green-50">
                      <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="w-full">
                      <h2 className="text-[9px] sm:text-2xl font-black text-green-900 mb-0.5 sm:mb-2 leading-tight line-clamp-2 uppercase tracking-tighter">{genericSubstitute.name}</h2>
                      <p className="text-[6px] sm:text-xs font-bold text-green-600/40 mb-1.5 uppercase tracking-widest truncate">{genericSubstitute.manufacturer}</p>
                      <div className="flex items-baseline justify-center gap-1 sm:gap-3 mb-2 sm:mb-6">
                        <span className="text-[11px] sm:text-4xl font-black text-green-600 tracking-tighter">₹{genericSubstitute.price}</span>
                        <span className="text-[7px] sm:text-lg text-gray-300 line-through font-bold">₹{product?.price}</span>
                      </div>
                    </div>
                 </div>
                 <div className="mt-auto pt-2 border-t border-green-100">
                    {getQty(genericSubstitute.id) > 0 ? (
                      <div className="flex items-center justify-between border border-green-600/20 rounded-lg h-8 sm:h-16 px-1 bg-green-50">
                        <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                          <Minus className="w-2.5 h-2.5" />
                        </Button>
                        <span className="font-black text-[10px] sm:text-xl text-green-900">{getQty(genericSubstitute.id)}</span>
                        <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-10 sm:h-10 rounded-full" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-8 sm:h-16 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-[8px] sm:text-lg shadow-lg shadow-green-100 gap-1 uppercase tracking-widest">
                        <Zap className="w-2 h-2" /> Switch
                      </Button>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gray-50 rounded-2xl sm:rounded-[40px] border border-dashed border-gray-200">
                 <Loader2 className="w-4 h-4 text-gray-200 animate-spin mb-2" />
                 <h3 className="font-black text-gray-400 mb-1 uppercase text-[7px] sm:text-lg tracking-widest">Sourcing...</h3>
              </div>
            )}
          </div>
        </div>

        {/* UNIT WISE SAVINGS CALLOUT */}
        {unitSaving && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="bg-green-600 rounded-xl p-3 sm:p-6 text-white flex items-center gap-3 shadow-md shadow-green-100">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="font-black text-[10px] sm:text-xl uppercase tracking-tighter">Save ₹{unitSaving} per unit</h3>
                <p className="text-[7px] sm:text-sm font-bold text-white/70 uppercase tracking-widest">Reduce healthcare costs by switching</p>
              </div>
            </div>
          </div>
        )}

        {/* COMPARATIVE PRODUCT DETAILS */}
        <section className="space-y-6">
           <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
              <Card className="rounded-xl sm:rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                 <CardHeader className="bg-gray-50/50 p-2 sm:p-6 border-b border-gray-100">
                    <CardTitle className="text-[7px] sm:text-sm font-black uppercase tracking-widest text-primary flex items-center gap-1">
                       <FlaskConical className="w-2.5 h-2.5 sm:w-4 sm:h-4" /> Branded
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-2.5 sm:p-6 space-y-2">
                    <p className="text-gray-500 text-[7px] sm:text-sm font-medium leading-relaxed line-clamp-6">{product?.description}</p>
                    <div className="pt-1.5 border-t border-gray-50">
                       <p className="text-[5px] sm:text-[8px] font-black uppercase text-gray-300">Pack Size</p>
                       <p className="text-[7px] sm:text-xs font-bold text-gray-900">{product?.packSize || 'Standard'}</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-xl sm:rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                 <CardHeader className="bg-green-50/50 p-2 sm:p-6 border-b border-green-100">
                    <CardTitle className="text-[7px] sm:text-sm font-black uppercase tracking-widest text-green-700 flex items-center gap-1">
                       <Dna className="w-2.5 h-2.5 sm:w-4 sm:h-4" /> Generic
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-2.5 sm:p-6 space-y-2">
                    <p className="text-gray-500 text-[7px] sm:text-sm font-medium leading-relaxed line-clamp-6">{genericSubstitute?.description || 'Molecularly identical generic alternative with verified clinical equivalence.'}</p>
                    <div className="pt-1.5 border-t border-green-50">
                       <p className="text-[5px] sm:text-[8px] font-black uppercase text-green-600/40">Savings</p>
                       <p className="text-[7px] sm:text-xs font-black text-green-700">~{product && genericSubstitute ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) : 0}% less</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="bg-white p-3.5 sm:p-8 rounded-2xl sm:rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-[9px] sm:text-xl font-black text-gray-900 uppercase tracking-widest mb-3.5 sm:mb-8 flex items-center gap-1.5">
                 <CheckCircle2 className="w-3 h-3 sm:w-6 sm:h-6 text-primary" /> Therapeutic Uses
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-12">
                 <div className="space-y-2">
                    <p className="text-[6px] sm:text-[10px] font-black uppercase text-primary/40 mb-1">{product?.name}</p>
                    <ul className="space-y-1.5 sm:space-y-3">
                       {(product?.uses || [product?.category]).map((use: string, i: number) => (
                         <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[7px] sm:text-sm font-bold text-gray-600 leading-tight">• {use}</span>
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="border-l border-gray-50 pl-3 sm:pl-12 space-y-2">
                    <p className="text-[6px] sm:text-[10px] font-black uppercase text-green-600/40 mb-1">Generic</p>
                    <ul className="space-y-1.5 sm:space-y-3">
                       {(genericSubstitute?.uses || product?.uses || [product?.category]).map((use: string, i: number) => (
                         <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[7px] sm:text-sm font-bold text-gray-600 leading-tight">• {use}</span>
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>

           <div className="bg-orange-50/20 p-3.5 sm:p-8 rounded-2xl sm:rounded-[40px] border border-orange-100/50">
              <h3 className="text-[9px] sm:text-xl font-black text-orange-900 uppercase tracking-widest mb-3.5 sm:mb-8 flex items-center gap-1.5">
                 <AlertCircle className="w-3 h-3 sm:w-6 sm:h-6 text-orange-600" /> Side Effects
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-12">
                 <div className="space-y-2">
                    <p className="text-[6px] sm:text-[10px] font-black uppercase text-orange-600/40">Branded</p>
                    <div className="flex flex-wrap gap-1">
                       {(product?.sideEffects || ['Nausea']).map((effect: string, i: number) => (
                         <Badge key={i} variant="outline" className="bg-white/50 border-orange-100 text-orange-700 font-bold px-1 py-0.5 text-[6px] sm:text-[10px]">
                            {effect}
                         </Badge>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2 border-l border-orange-100 pl-3 sm:pl-12">
                    <p className="text-[6px] sm:text-[10px] font-black uppercase text-orange-600/40">Generic</p>
                    <div className="flex flex-wrap gap-1">
                       {(genericSubstitute?.sideEffects || product?.sideEffects || ['Nausea']).map((effect: string, i: number) => (
                         <Badge key={i} variant="outline" className="bg-white/50 border-orange-100 text-orange-700 font-bold px-1 py-0.5 text-[6px] sm:text-[10px]">
                            {effect}
                         </Badge>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="mt-4 sm:mt-8 pt-3 sm:pt-8 border-t border-orange-100/50">
                 <p className="text-[5px] sm:text-[10px] text-orange-800/40 font-black uppercase text-center tracking-widest">
                    Note: Identical molecules. Identical results.
                 </p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
