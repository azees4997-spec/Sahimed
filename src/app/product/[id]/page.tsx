
"use client"

import { use, useState, useEffect } from 'react';
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
  ChevronRight,
  Info,
  FlaskConical,
  Dna,
  Scale,
  AlertCircle,
  Stethoscope,
  Wine,
  Baby,
  Car,
  Heart,
  Target
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !productLoading) return notFound();

  const handleAdd = (p: any) => {
    addToCart(p);
    toast({ title: "Added to cart", description: `${p.name} added.` });
  };

  const getQty = (pid: string) => cart.find(i => i.id === pid)?.quantity || 0;

  const calculateUnitSaving = () => {
    if (!product || !genericSubstitute) return null;
    const match = product.packSize?.match(/\d+/);
    if (!match) return null;
    const units = parseInt(match[0]);
    const saving = product.price - genericSubstitute.price;
    return (saving / units).toFixed(2);
  };

  const unitSaving = calculateUnitSaving();
  const percentageSaved = product && genericSubstitute ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/search" className="hover:text-primary transition-colors">Medicines</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary truncate">{product?.name}</span>
        </div>

        {/* Salt Composition Banner */}
        {genericSubstitute && (
           <div className="mb-8 bg-[#FFF1F2] border border-red-100 rounded-2xl py-4 px-6 text-center animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <div className="bg-red-500 rounded-full p-1"><Target className="w-3 h-3 text-white" /></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-900">Salt Composition in both</p>
              </div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter">{product?.saltComposition}</h2>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-12">
            
            {/* Side-by-Side Comparison Area */}
            {genericSubstitute ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Branded Card - "You Searched" */}
                <Card className="rounded-[32px] border-none bg-[#F3F4F6] overflow-hidden flex flex-col p-6 md:p-10">
                   <p className="text-lg font-black text-gray-900 mb-8">You Searched</p>
                   <div className="aspect-square w-32 md:w-48 bg-white rounded-[24px] mx-auto mb-10 p-4 shadow-sm relative overflow-hidden">
                      <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="space-y-4 flex-1">
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{product?.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{product?.manufacturer}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">{product?.packSize}</p>
                      </div>
                      <div className="pt-6">
                        <div className="text-3xl font-black text-gray-900">₹{product?.price}</div>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">₹{(product?.price / parseInt(product?.packSize?.match(/\d+/)?.[0] || '1')).toFixed(1)} / Unit</p>
                      </div>
                   </div>
                </Card>

                {/* Recommended Card - "Our Recommendation" */}
                <Card className="rounded-[32px] border-2 border-green-600 bg-white overflow-hidden flex flex-col relative p-6 md:p-10 shadow-2xl shadow-green-100">
                   {/* Savings Ribbon */}
                   <div className="absolute top-0 right-0">
                      <div className="bg-green-600 text-white font-black text-[10px] uppercase px-4 py-2 flex items-center gap-1.5 rounded-bl-2xl shadow-lg">
                        <Zap className="w-3 h-3 fill-white" />
                        {percentageSaved}% More Savings
                      </div>
                   </div>

                   <p className="text-lg font-black text-green-600 mb-8">Our Recommendation</p>
                   <div className="aspect-square w-32 md:w-48 bg-gray-50 rounded-[24px] mx-auto mb-10 p-4 relative overflow-hidden">
                      <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="space-y-4 flex-1">
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{genericSubstitute.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{genericSubstitute.manufacturer}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">{genericSubstitute.packSize}</p>
                      </div>
                      <div className="pt-6 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-green-600">₹{genericSubstitute.price}</span>
                            {product && <span className="text-sm text-gray-300 line-through font-bold">MRP ₹{product.price}</span>}
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">₹{(genericSubstitute.price / parseInt(genericSubstitute.packSize?.match(/\d+/)?.[0] || '1')).toFixed(1)} / Unit</p>
                        </div>
                        <Button onClick={() => handleAdd(genericSubstitute)} className="bg-red-500 hover:bg-red-600 text-white font-black h-12 px-8 rounded-full uppercase tracking-widest text-xs shadow-xl shadow-red-100">Add to Cart</Button>
                      </div>
                   </div>
                </Card>
              </div>
            ) : (
              <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white p-6 md:p-10">
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="w-full md:w-1/3 aspect-square relative bg-gray-50 rounded-[32px] overflow-hidden p-6 border border-gray-100/50">
                    <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{product?.manufacturer}</p>
                      <h1 className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tighter">{product?.name}</h1>
                      <p className="text-xs text-gray-400 font-bold italic">{product?.saltComposition}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest bg-gray-50 border-none">
                        {product?.dosageForm}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest bg-gray-50 border-none">
                        {product?.packSize}
                      </Badge>
                    </div>
                    <div className="pt-4 flex items-baseline gap-4">
                      <div className="text-4xl font-black text-gray-900">₹{product?.price}</div>
                    </div>
                    <div className="pt-6">
                      {getQty(product?.id!) > 0 ? (
                        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-full w-fit border border-gray-100">
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white shadow-sm" onClick={() => updateQuantity(product?.id!, -1)}><Minus className="w-4 h-4" /></Button>
                          <span className="font-black text-lg w-8 text-center">{getQty(product?.id!)}</span>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white shadow-sm" onClick={() => updateQuantity(product?.id!, 1)}><Plus className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <Button onClick={() => handleAdd(product)} className="h-14 px-12 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20">Add to Cart</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Detailed Clinical Sections (Side-by-Side Comparison) */}
            <div className="space-y-10">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest ml-4 flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-primary" /> Clinical Comparison
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Uses Section */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-6">
                  <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary" /> Therapeutic Uses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    <div>
                      <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest mb-2">Branded</p>
                      <ul className="space-y-2">
                        {(product?.uses || []).map((use: string, i: number) => (
                          <li key={i} className="text-[10px] font-bold text-gray-600 leading-relaxed">• {use}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-l border-gray-50 pl-6">
                      <p className="text-[8px] font-black text-green-600/40 uppercase tracking-widest mb-2">Generic</p>
                      <ul className="space-y-2">
                        {(genericSubstitute?.uses || product?.uses || []).map((use: string, i: number) => (
                          <li key={i} className="text-[10px] font-bold text-gray-600 leading-relaxed">• {use}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Side Effects Section */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-6">
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-500" /> Side Effects
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    <div>
                      <p className="text-[8px] font-black text-orange-600/40 uppercase tracking-widest mb-2">Branded</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(product?.sideEffects || []).map((effect: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[8px] font-bold bg-orange-50/30 border-orange-100 text-orange-700">{effect}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="border-l border-gray-50 pl-6">
                      <p className="text-[8px] font-black text-orange-600/40 uppercase tracking-widest mb-2">Generic</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(genericSubstitute?.sideEffects || product?.sideEffects || []).map((effect: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[8px] font-bold bg-orange-50/30 border-orange-100 text-orange-700">{effect}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works Section */}
              <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 p-8 border-b">
                   <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                     <FlaskConical className="w-4 h-4" /> How it works
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-gray-500 font-medium text-sm leading-relaxed">
                   {product?.howItWorks || "This medication operates through established clinical pathways to manage specified conditions as detailed in pharmaceutical literature."}
                </CardContent>
              </Card>

              {/* Safety Advice */}
              <div className="space-y-4">
                 <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest ml-4">Safety Advice</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { icon: Wine, label: "Alcohol", text: product?.safetyAdvice?.alcohol || "Consult doctor." },
                      { icon: Baby, label: "Pregnancy", text: product?.safetyAdvice?.pregnancy || "Consult doctor." },
                      { icon: Car, label: "Driving", text: product?.safetyAdvice?.driving || "Safe to drive." },
                      { icon: Activity, label: "Kidney", text: product?.safetyAdvice?.kidney || "Caution recommended." },
                      { icon: Heart, label: "Liver", text: product?.safetyAdvice?.liver || "Consult doctor." }
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="bg-gray-50 p-2 rounded-xl text-gray-400">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                          <p className="text-[10px] font-bold text-gray-600 leading-tight">{item.text}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-6 duration-500">
         <div className="bg-white p-3 rounded-full shadow-2xl border border-gray-100 flex items-center gap-3">
            <div className="flex-1 pl-4">
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Viewing</p>
               <p className="text-xs font-black text-gray-900 truncate">{product?.name}</p>
            </div>
            {getQty(product?.id!) > 0 ? (
               <Link href="/cart" className="flex-1">
                 <Button className="w-full h-12 rounded-full font-black uppercase text-[10px] tracking-widest gap-2">
                   View Cart ({getQty(product?.id!)})
                 </Button>
               </Link>
            ) : (
              <Button onClick={() => handleAdd(product)} className="flex-1 h-12 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                Add to Cart
              </Button>
            )}
         </div>
      </div>
    </div>
  );
}
