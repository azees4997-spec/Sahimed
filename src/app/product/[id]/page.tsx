
"use client"

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { PRODUCTS, ExtendedProduct } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Info, Heart, ArrowRight, Zap, CheckCircle2, Minus, Plus, Package, Factory, Stethoscope, AlertTriangle, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = PRODUCTS.find(p => p.id === id) as ExtendedProduct;
  const { addToCart, cart, updateQuantity } = useCart();
  const { toast } = useToast();

  if (!product) notFound();

  // Find a generic substitute based on salt composition
  const genericSubstitute = PRODUCTS.find(p => 
    p.saltComposition === product.saltComposition && 
    p.id !== product.id && 
    p.isGeneric === true
  ) as ExtendedProduct;

  const handleAdd = (p: typeof product) => {
    addToCart(p);
    toast({
      title: "Added to cart",
      description: `${p.name} added.`,
    });
  };

  const getQty = (pid: string) => cart.find(i => i.id === pid)?.quantity || 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/">Home</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/search?c=${product.category}`}>{product.category}</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="text-primary">{product.name}</span>
        </div>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Branded Medicine Card */}
          <div className="bg-white rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100 flex flex-col relative group animate-in fade-in slide-in-from-left duration-500">
             <div className="flex justify-between items-start mb-6">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-3 py-1 rounded-full text-gray-400">
                  Branded
                </Badge>
                <Button size="icon" variant="ghost" className="rounded-full bg-gray-50 h-10 w-10 active:scale-90 transition-transform">
                  <Heart className="w-5 h-5 text-gray-300" />
                </Button>
             </div>

             <div className="flex flex-col items-center sm:items-start gap-6 mb-8">
                <div className="w-40 h-40 relative bg-gray-50 rounded-3xl overflow-hidden p-4 shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  <h1 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{product.name}</h1>
                  <p className="text-xs font-bold text-gray-400 mb-4 flex items-center justify-center sm:justify-start gap-1">
                    <Factory className="w-3 h-3" /> {product.manufacturer}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-2xl mb-6 border border-blue-50 w-full sm:w-auto">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest shrink-0">Salt:</span>
                    <span className="text-xs font-bold text-blue-900 truncate">{product.saltComposition}</span>
                  </div>

                  <div className="flex items-baseline justify-center sm:justify-start gap-3">
                    <span className="text-3xl font-black text-gray-900">₹{product.price}</span>
                    <span className="text-gray-300 line-through text-sm font-bold">₹{(product.price * 1.2).toFixed(0)}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{product.packSize}</p>
                </div>
             </div>

             <div className="mt-auto pt-6 border-t border-gray-50">
                {getQty(product.id) > 0 ? (
                  <div className="flex items-center justify-between border-2 border-primary rounded-full h-14 px-2 bg-primary/5">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, -1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-black text-lg text-primary">{getQty(product.id)}</span>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleAdd(product)} className="w-full h-14 rounded-full font-black text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    Add to Cart
                  </Button>
                )}
             </div>
          </div>

          {/* Generic Substitute Card (Comparison) */}
          {genericSubstitute ? (
            <div className="bg-gradient-to-br from-green-50 to-white rounded-[40px] p-6 sm:p-10 shadow-xl border-2 border-green-200 flex flex-col relative animate-in fade-in slide-in-from-right duration-500 overflow-hidden">
               {/* Savings Spotlight */}
               <div className="absolute top-0 right-0">
                  <div className="bg-green-600 text-white font-black text-[10px] uppercase px-6 py-2 rounded-bl-[20px] shadow-lg flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Save ₹{product.price - genericSubstitute.price}
                  </div>
               </div>

               <div className="flex justify-between items-start mb-6">
                <Badge className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-4 py-1.5 rounded-full">
                  Generic Alternative
                </Badge>
               </div>

               <div className="flex flex-col items-center sm:items-start gap-6 mb-8">
                  <div className="w-40 h-40 relative bg-white rounded-3xl overflow-hidden p-4 shrink-0 shadow-inner border border-green-100 group-hover:scale-105 transition-transform duration-500">
                    <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className="object-contain" />
                  </div>
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h2 className="text-2xl font-black text-green-900 mb-1 leading-tight">{genericSubstitute.name}</h2>
                    <p className="text-xs font-bold text-green-600/60 mb-4 flex items-center justify-center sm:justify-start gap-1">
                      <Factory className="w-3 h-3" /> {genericSubstitute.manufacturer}
                    </p>

                    <div className="inline-flex items-center gap-2 bg-white/70 px-4 py-2 rounded-2xl mb-6 border border-green-100 w-full sm:w-auto">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest shrink-0">Composition:</span>
                      <span className="text-xs font-bold text-green-900 truncate">Exact Same Salt</span>
                    </div>

                    <div className="flex items-baseline justify-center sm:justify-start gap-3">
                      <span className="text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                      <span className="text-gray-400 line-through text-sm font-bold">₹{product.price}</span>
                    </div>
                    <p className="text-[10px] font-black text-green-600/40 uppercase tracking-widest mt-1 italic">{genericSubstitute.packSize}</p>
                  </div>
               </div>

               <div className="mt-auto pt-6 border-t border-green-100">
                  {getQty(genericSubstitute.id) > 0 ? (
                    <div className="flex items-center justify-between border-2 border-green-600 rounded-full h-14 px-2 bg-green-50">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-black text-lg text-green-900">{getQty(genericSubstitute.id)}</span>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-14 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-xl shadow-green-200 active:scale-95 transition-all gap-2">
                      <Zap className="w-5 h-5" /> Switch & Save
                    </Button>
                  )}
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 opacity-60">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <Package className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-black text-gray-900">No Generic Found</h3>
               <p className="text-sm text-gray-400 max-w-xs">We currently don't have a verified generic alternative for this branded medicine.</p>
            </div>
          )}
        </div>

        {/* Detailed Medical Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-sm border border-gray-100 animate-in slide-in-from-bottom duration-700">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">Medical Insights</h3>
              </div>
              
              <div className="space-y-10">
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-l-4 border-primary pl-3">Description</h4>
                  <p className="text-gray-600 leading-relaxed font-medium text-sm sm:text-base">
                    {product.description}
                  </p>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-l-4 border-green-500 pl-3">Therapeutic Uses</h4>
                    <ul className="space-y-4">
                      {product.uses.map((use, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          {use}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-l-4 border-orange-500 pl-3">Potential Side Effects</h4>
                    <ul className="space-y-4">
                      {product.sideEffects.map((se, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                          {se}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-primary p-10 rounded-[40px] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <Factory className="w-12 h-12 mb-6 opacity-40" />
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Manufacturer</h3>
                <p className="text-sm text-white/90 font-bold mb-8 italic leading-relaxed">{product.mfrDetails}</p>
                <Badge className="bg-white/20 text-white border-none uppercase text-[8px] font-black px-4 py-2 tracking-widest">GMP Certified Lab</Badge>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Expert Pharmacist Note</h4>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-bold leading-relaxed">
                    Generic medicines are bio-equivalent to branded ones, containing the same active ingredients and delivering the same therapeutic effect at a fraction of the cost.
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="mt-20">
            <h2 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-widest text-center">Similar Solutions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
               {PRODUCTS.filter(p => p.category === product.category && p.id !== id).slice(0, 4).map(p => (
                 <Link key={p.id} href={`/product/${p.id}`} className="group block active:scale-95 transition-all">
                    <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-2 transition-all">
                       <div className="relative aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-100">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                       </div>
                       <h4 className="font-black text-gray-900 text-sm mb-1 line-clamp-1">{p.name}</h4>
                       <p className="text-primary font-black text-base">₹{p.price}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2 truncate">{p.manufacturer}</p>
                    </div>
                 </Link>
               ))}
            </div>
        </section>
      </main>
    </div>
  );
}
