
"use client"

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { PRODUCTS, ExtendedProduct } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Info, Heart, ArrowRight, Zap, CheckCircle2, Minus, Plus, Package, Factory, Stethoscope, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = PRODUCTS.find(p => p.id === id) as ExtendedProduct;
  const { addToCart, cart, updateQuantity } = useCart();
  const { toast } = useToast();

  if (!product) notFound();

  const genericSubstitute = PRODUCTS.find(p => 
    p.saltComposition === product.saltComposition && p.id !== product.id && p.isGeneric === true
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
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        
        {/* Breadcrumb - Mobile Optimized */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/">Home</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/search?c=${product.category}`}>{product.category}</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="text-primary">{product.name}</span>
        </div>

        {/* Comparison Header Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          
          {/* Branded / Searched Product */}
          <div className="bg-white rounded-[40px] p-6 sm:p-10 shadow-xl border border-white flex flex-col relative group">
             <div className="flex justify-between items-start mb-6">
                <Badge variant="outline" className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-3 py-1">
                  Branded Product
                </Badge>
                <Button size="icon" variant="ghost" className="rounded-full bg-gray-50 h-10 w-10">
                  <Heart className="w-5 h-5 text-gray-400" />
                </Button>
             </div>

             <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
                <div className="w-48 h-48 relative bg-gray-50 rounded-3xl overflow-hidden p-4 shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 leading-tight">{product.name}</h1>
                  <p className="text-xs font-bold text-gray-400 mb-4 flex items-center justify-center sm:justify-start gap-1">
                    <Factory className="w-3 h-3" /> {product.manufacturer}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-2xl mb-6 border border-blue-50">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Salt:</span>
                    <span className="text-xs font-bold text-blue-900">{product.saltComposition}</span>
                  </div>

                  <div className="flex items-baseline justify-center sm:justify-start gap-3">
                    <span className="text-4xl font-black text-gray-900">₹{product.price}</span>
                    <span className="text-gray-400 line-through text-sm">₹{(product.price * 1.25).toFixed(0)}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{product.packSize}</p>
                </div>
             </div>

             <div className="mt-auto pt-6 border-t border-gray-50 flex items-center gap-4">
                {getQty(product.id) > 0 ? (
                  <div className="flex-1 flex items-center justify-between border-2 border-primary rounded-full h-14 px-2 bg-primary/5">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, -1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-black text-lg">{getQty(product.id)}</span>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleAdd(product)} className="flex-1 h-14 rounded-full font-black text-lg shadow-xl shadow-primary/20">
                    Add to Cart
                  </Button>
                )}
             </div>
          </div>

          {/* Generic Substitute Comparison */}
          {genericSubstitute ? (
            <div className="bg-gradient-to-br from-green-50 to-white rounded-[40px] p-6 sm:p-10 shadow-2xl border-2 border-green-200 flex flex-col relative animate-in slide-in-from-right duration-700">
               <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                 <Badge className="bg-green-600 text-white border-none text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-green-200">
                   Save ₹{product.price - genericSubstitute.price}
                 </Badge>
                 <div className="flex items-center gap-1 text-[8px] font-black text-green-700 bg-white/50 px-2 py-1 rounded-full uppercase tracking-tighter">
                   <Zap className="w-3 h-3 animate-pulse" /> 80% cheaper
                 </div>
               </div>

               <div className="flex justify-between items-start mb-6">
                <Badge className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-4 py-1.5 rounded-full">
                  HealthLink Approved Generic
                </Badge>
               </div>

               <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
                  <div className="w-48 h-48 relative bg-white rounded-3xl overflow-hidden p-4 shrink-0 shadow-inner border border-green-100">
                    <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className="object-contain" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-black text-green-900 mb-1 leading-tight">{genericSubstitute.name}</h2>
                    <p className="text-xs font-bold text-green-600/60 mb-4 flex items-center justify-center sm:justify-start gap-1">
                      <Factory className="w-3 h-3" /> {genericSubstitute.manufacturer}
                    </p>

                    <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-2 rounded-2xl mb-6 border border-green-100">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Composition:</span>
                      <span className="text-xs font-bold text-green-900">Same Salt</span>
                    </div>

                    <div className="flex items-baseline justify-center sm:justify-start gap-3">
                      <span className="text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                      <span className="text-gray-400 line-through text-sm">₹{product.price}</span>
                    </div>
                    <p className="text-[10px] font-black text-green-600/40 uppercase tracking-widest mt-1 italic">{genericSubstitute.packSize}</p>
                  </div>
               </div>

               <div className="mt-auto pt-6 border-t border-green-100 flex items-center gap-4">
                  {getQty(genericSubstitute.id) > 0 ? (
                    <div className="flex-1 flex items-center justify-between border-2 border-green-600 rounded-full h-14 px-2 bg-green-50">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-black text-lg text-green-900">{getQty(genericSubstitute.id)}</span>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleAdd(genericSubstitute)} className="flex-1 h-14 rounded-full bg-green-600 hover:bg-green-700 font-black text-lg shadow-2xl shadow-green-200 hover:scale-[1.02] transition-all">
                      Switch & Save More
                    </Button>
                  )}
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 opacity-60">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <Package className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-black text-gray-900">No Generic Available</h3>
               <p className="text-sm text-gray-400 max-w-xs">We currently don't have a verified generic alternative for this specific medication.</p>
            </div>
          )}
        </div>

        {/* Deep Medical Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-primary" /> 
                Medical Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Therapeutic Uses</h4>
                  <ul className="space-y-3">
                    {product.uses.map((use, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Potential Side Effects</h4>
                  <ul className="space-y-3">
                    {product.sideEffects.map((se, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                        {se}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-gray-50">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Full Description</h4>
                 <p className="text-sm text-gray-600 leading-relaxed font-medium">{product.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-primary p-8 rounded-[40px] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <Info className="w-10 h-10 mb-6 opacity-40" />
                <h3 className="text-2xl font-black mb-4">Mfr. Details</h3>
                <p className="text-sm text-white/80 font-bold mb-6 italic">{product.mfrDetails}</p>
                <Badge className="bg-white/20 text-white border-none uppercase text-[8px] font-black px-4 py-2">Verified Supplier</Badge>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Expert Advice</h4>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-bold leading-relaxed">Consult with our licensed pharmacists for dosage guidance and drug interactions.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Similar Healthcare Solutions */}
        <section>
            <h2 className="text-2xl font-black text-gray-900 mb-10 text-center uppercase tracking-widest">Related Solutions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
               {PRODUCTS.filter(p => p.category === product.category && p.id !== id).slice(0, 4).map(p => (
                 <Link key={p.id} href={`/product/${p.id}`} className="group block">
                    <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-2 transition-all">
                       <div className="relative aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-100">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                       </div>
                       <h4 className="font-black text-gray-900 mb-1 line-clamp-1">{p.name}</h4>
                       <p className="text-primary font-black text-lg">₹{p.price}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">{p.manufacturer}</p>
                    </div>
                 </Link>
               ))}
            </div>
        </section>
      </main>
    </div>
  );
}
