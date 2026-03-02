
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

  // Fetch Main Product
  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  // Fetch Generic Alternative (Bio-equivalent based on salt composition)
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

  // Helper to calculate savings per unit
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
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/60">Active Salt Composition</p>
              <h2 className="font-black text-xs sm:text-xl line-clamp-1">{product?.saltComposition}</h2>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Therapeutic Category</p>
                <p className="font-black text-sm">{product?.category}</p>
             </div>
          </div>
        </div>

        {/* SIDE BY SIDE MOBILE GRID */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8 mb-8">
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

        {/* UNIT WISE SAVINGS CALLOUT */}
        {unitSaving && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="bg-green-600 rounded-2xl p-4 sm:p-6 text-white flex items-center gap-4 shadow-lg shadow-green-100">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-xl uppercase tracking-tight">Save ₹{unitSaving} per unit</h3>
                <p className="text-[8px] sm:text-sm font-bold text-white/80 uppercase tracking-widest">Switching to generic reduces your medical cost significantly.</p>
              </div>
            </div>
          </div>
        )}

        {/* COMPARATIVE PRODUCT DETAILS - FORCED SIDE-BY-SIDE ON MOBILE */}
        <section className="space-y-8">
           {/* Section: Description Comparison */}
           <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <Card className="rounded-[24px] sm:rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                 <CardHeader className="bg-gray-50/50 p-3 sm:p-6 border-b">
                    <CardTitle className="text-[8px] sm:text-sm font-black uppercase tracking-widest text-primary flex items-center gap-1 sm:gap-2">
                       <FlaskConical className="w-3 h-3 sm:w-4 sm:h-4" /> Branded
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    <p className="text-gray-600 text-[8px] sm:text-sm leading-relaxed line-clamp-6">{product?.description}</p>
                    <div className="pt-2 sm:pt-4 grid grid-cols-1 gap-2">
                       <div>
                          <p className="text-[6px] sm:text-[8px] font-black uppercase text-gray-400">Pack Size</p>
                          <p className="text-[8px] sm:text-xs font-bold text-gray-900">{product?.packSize || 'Standard'}</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-[24px] sm:rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                 <CardHeader className="bg-green-50/50 p-3 sm:p-6 border-b">
                    <CardTitle className="text-[8px] sm:text-sm font-black uppercase tracking-widest text-green-700 flex items-center gap-1 sm:gap-2">
                       <Dna className="w-3 h-3 sm:w-4 sm:h-4" /> Generic
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    <p className="text-gray-600 text-[8px] sm:text-sm leading-relaxed line-clamp-6">{genericSubstitute?.description || 'Bio-equivalent generic matching branded version in quality and therapeutic effect.'}</p>
                    <div className="pt-2 sm:pt-4 grid grid-cols-1 gap-2">
                       <div>
                          <p className="text-[6px] sm:text-[8px] font-black uppercase text-green-600/60">Savings</p>
                          <p className="text-[8px] sm:text-xs font-black text-green-700">~{product && genericSubstitute ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) : 0}% less</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Section: Clinical Uses & Benefits - FORCED SIDE-BY-SIDE ON MOBILE */}
           <div className="bg-white p-4 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-[10px] sm:text-xl font-black text-gray-900 uppercase tracking-tighter mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3">
                 <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-primary" /> Therapeutic Uses
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-12">
                 <div>
                    <p className="text-[7px] sm:text-[10px] font-black uppercase text-primary mb-2 sm:mb-4">{product?.name}</p>
                    <ul className="space-y-2 sm:space-y-3">
                       {(product?.uses || [product?.category]).map((use: string, i: number) => (
                         <li key={i} className="flex items-start gap-1.5 sm:gap-3">
                            <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0 mt-0.5">
                               <span className="text-[6px] sm:text-[8px] font-bold">{i+1}</span>
                            </div>
                            <span className="text-[8px] sm:text-sm font-medium text-gray-700 leading-tight">{use}</span>
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="border-l pl-4 sm:pl-12">
                    <p className="text-[7px] sm:text-[10px] font-black uppercase text-green-600 mb-2 sm:mb-4">Generic</p>
                    <ul className="space-y-2 sm:space-y-3">
                       {(genericSubstitute?.uses || product?.uses || [product?.category]).map((use: string, i: number) => (
                         <li key={i} className="flex items-start gap-1.5 sm:gap-3">
                            <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                               <span className="text-[6px] sm:text-[8px] font-bold">{i+1}</span>
                            </div>
                            <span className="text-[8px] sm:text-sm font-medium text-gray-700 leading-tight">{use}</span>
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>

           {/* Section: Side Effects - FORCED SIDE-BY-SIDE ON MOBILE */}
           <div className="bg-orange-50/30 p-4 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-orange-100">
              <h3 className="text-[10px] sm:text-xl font-black text-orange-900 uppercase tracking-tighter mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3">
                 <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" /> Side Effects
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-12">
                 <div className="space-y-2 sm:space-y-4">
                    <p className="text-[7px] sm:text-[10px] font-black uppercase text-orange-600">Branded</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                       {(product?.sideEffects || ['Nausea']).map((effect: string, i: number) => (
                         <Badge key={i} variant="outline" className="bg-white border-orange-200 text-orange-700 font-bold px-1.5 py-0.5 sm:px-3 sm:py-1 text-[6px] sm:text-[10px]">
                            {effect}
                         </Badge>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2 sm:space-y-4 border-l border-orange-100 pl-4 sm:pl-12">
                    <p className="text-[7px] sm:text-[10px] font-black uppercase text-orange-600">Generic</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                       {(genericSubstitute?.sideEffects || product?.sideEffects || ['Nausea']).map((effect: string, i: number) => (
                         <Badge key={i} variant="outline" className="bg-white border-orange-200 text-orange-700 font-bold px-1.5 py-0.5 sm:px-3 sm:py-1 text-[6px] sm:text-[10px]">
                            {effect}
                         </Badge>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-orange-100">
                 <p className="text-[6px] sm:text-[10px] text-orange-800/60 font-black uppercase text-center">
                    Note: Clinical effects are identical. Consult a doctor.
                 </p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
