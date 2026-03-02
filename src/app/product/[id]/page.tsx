
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
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Clinical Sync...</p>
        </div>
      </div>
    );
  }

  if (!product && !productLoading) {
    return notFound();
  }

  const handleAdd = (p: any) => {
    addToCart(p);
    toast({ title: "Item Added", description: `${p.name} added to cart.` });
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
    <div className="min-h-screen bg-[#F8F8F8] pb-10">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="mb-3">
          <Link href="/" className="flex items-center gap-1 text-primary/60 hover:text-primary transition-all">
            <ChevronLeft className="w-3 h-3" />
            <span className="text-[7px] font-black uppercase tracking-widest">Back to catalog</span>
          </Link>
        </div>

        {/* Clinical Composition Header */}
        <div className="bg-primary text-white p-4 rounded-[24px] mb-4 flex items-center justify-between shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-[6px] font-black uppercase tracking-widest text-white/40 mb-0.5">Salt Composition</p>
              <h2 className="font-black text-[10px] sm:text-base leading-tight uppercase tracking-tight">{product?.saltComposition}</h2>
            </div>
          </div>
        </div>

        {/* SIDE BY SIDE PRODUCT CARDS (MOBILE OPTIMIZED) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Branded Card */}
          <div className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex flex-col h-full">
             <Badge variant="outline" className="text-[5px] font-black uppercase tracking-widest bg-gray-50 border-none px-1.5 py-0.5 rounded-md text-gray-400 w-fit mb-2">
               Branded
             </Badge>
             <div className="flex flex-col items-center text-center gap-2 flex-1">
                <div className="w-full aspect-square relative bg-gray-50 rounded-xl overflow-hidden p-2">
                  <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-[9px] sm:text-lg font-black text-gray-900 leading-tight uppercase tracking-tighter line-clamp-2">{product?.name}</h1>
                  <div className="text-[12px] sm:text-2xl font-black text-primary mt-1">₹{product?.price}</div>
                </div>
             </div>
             <div className="mt-4 pt-2 border-t border-gray-50">
                {getQty(product?.id!) > 0 ? (
                  <div className="flex items-center justify-between border border-primary/20 rounded-lg h-8 px-1 bg-primary/5">
                    <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full" onClick={() => updateQuantity(product?.id!, -1)}><Minus className="w-2 h-2" /></Button>
                    <span className="font-black text-[10px] text-primary">{getQty(product?.id!)}</span>
                    <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full" onClick={() => updateQuantity(product?.id!, 1)}><Plus className="w-2 h-2" /></Button>
                  </div>
                ) : (
                  <Button onClick={() => handleAdd(product)} className="w-full h-8 rounded-lg font-black text-[8px] uppercase tracking-widest">Add</Button>
                )}
             </div>
          </div>

          {/* Generic Card */}
          <div className="h-full">
            {genericSubstitute ? (
              <div className="bg-gradient-to-br from-green-50 to-white rounded-[24px] p-3 shadow-xl border-2 border-green-100 flex flex-col h-full relative overflow-hidden">
                 <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white font-black text-[6px] uppercase px-1.5 py-1 rounded-bl-lg shadow-sm">
                      -₹{product!.price - genericSubstitute.price}
                    </div>
                 </div>
                 <Badge className="text-[5px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-1.5 py-0.5 rounded-md w-fit mb-2">
                    Generic
                 </Badge>
                 <div className="flex flex-col items-center text-center gap-2 flex-1">
                    <div className="w-full aspect-square relative bg-white rounded-xl overflow-hidden p-2 shadow-inner border border-green-50">
                      <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-[9px] sm:text-lg font-black text-green-900 leading-tight uppercase tracking-tighter line-clamp-2">{genericSubstitute.name}</h2>
                      <div className="text-[12px] sm:text-2xl font-black text-green-600 mt-1">₹{genericSubstitute.price}</div>
                    </div>
                 </div>
                 <div className="mt-4 pt-2 border-t border-green-100">
                    {getQty(genericSubstitute.id) > 0 ? (
                      <div className="flex items-center justify-between border border-green-600/20 rounded-lg h-8 px-1 bg-green-50">
                        <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full" onClick={() => updateQuantity(genericSubstitute.id, -1)}><Minus className="w-2 h-2" /></Button>
                        <span className="font-black text-[10px] text-green-900">{getQty(genericSubstitute.id)}</span>
                        <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full" onClick={() => updateQuantity(genericSubstitute.id, 1)}><Plus className="w-2 h-2" /></Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-[8px] uppercase tracking-widest">Switch</Button>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                 <Loader2 className="w-4 h-4 text-gray-200 animate-spin mb-1" />
                 <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Sourcing Value...</p>
              </div>
            )}
          </div>
        </div>

        {/* Unit Savings Callout */}
        {unitSaving && (
          <div className="mb-4 bg-green-600 rounded-xl p-3 text-white flex items-center gap-3 shadow-lg shadow-green-100/50">
            <Scale className="w-4 h-4 shrink-0" />
            <div>
              <h3 className="font-black text-[9px] uppercase tracking-tight">Save ₹{unitSaving} per unit</h3>
              <p className="text-[6px] font-bold text-white/60 uppercase tracking-widest">Switching reduces long-term healthcare costs</p>
            </div>
          </div>
        )}

        {/* CLINICAL COMPARISON GRID (FORCED SIDE-BY-SIDE ON ALL SCREENS) */}
        <section className="space-y-3">
           {/* Section: Overview */}
           <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white h-full">
                 <CardHeader className="bg-gray-50/30 p-2 border-b border-gray-50">
                    <CardTitle className="text-[7px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                       <FlaskConical className="w-3 h-3" /> Branded
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-2">
                    <p className="text-gray-500 text-[7px] font-bold leading-relaxed line-clamp-[10]">{product?.description}</p>
                 </CardContent>
              </Card>

              <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white h-full">
                 <CardHeader className="bg-green-50/20 p-2 border-b border-green-50">
                    <CardTitle className="text-[7px] font-black uppercase tracking-widest text-green-700 flex items-center gap-1.5">
                       <Dna className="w-3 h-3" /> Generic
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-2">
                    <p className="text-gray-500 text-[7px] font-bold leading-relaxed line-clamp-[10]">{genericSubstitute?.description || 'Molecularly identical generic alternative with verified clinical equivalence.'}</p>
                 </CardContent>
              </Card>
           </div>

           {/* Section: Therapeutic Uses */}
           <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
              <h3 className="text-[8px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Therapeutic Uses
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[6px] font-black uppercase text-primary/40 mb-1">{product?.name}</p>
                    <ul className="space-y-1">
                       {(product?.uses || [product?.category]).map((use: string, i: number) => (
                         <li key={i} className="text-[7px] font-bold text-gray-600 leading-tight">• {use}</li>
                       ))}
                    </ul>
                 </div>
                 <div className="border-l border-gray-50 pl-4">
                    <p className="text-[6px] font-black uppercase text-green-600/40 mb-1">Generic</p>
                    <ul className="space-y-1">
                       {(genericSubstitute?.uses || product?.uses || [product?.category]).map((use: string, i: number) => (
                         <li key={i} className="text-[7px] font-bold text-gray-600 leading-tight">• {use}</li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>

           {/* Section: Side Effects */}
           <div className="bg-orange-50/10 p-3 rounded-2xl border border-orange-100/30">
              <h3 className="text-[8px] font-black text-orange-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <AlertCircle className="w-3.5 h-3.5 text-orange-600" /> Clinical Safety
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-[6px] font-black uppercase text-orange-600/40">Branded</p>
                    <div className="flex flex-wrap gap-1">
                       {(product?.sideEffects || ['Nausea']).map((effect: string, i: number) => (
                         <Badge key={i} variant="outline" className="bg-white/50 border-orange-100 text-orange-700 font-bold px-1 py-0 text-[6px] h-3.5">{effect}</Badge>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-1 border-l border-orange-100 pl-4">
                    <p className="text-[6px] font-black uppercase text-orange-600/40">Generic</p>
                    <div className="flex flex-wrap gap-1">
                       {(genericSubstitute?.sideEffects || product?.sideEffects || ['Nausea']).map((effect: string, i: number) => (
                         <Badge key={i} variant="outline" className="bg-white/50 border-orange-100 text-orange-700 font-bold px-1 py-0 text-[6px] h-3.5">{effect}</Badge>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
