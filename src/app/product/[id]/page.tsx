
"use client"

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { PRODUCTS, ExtendedProduct } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Minus, 
  Plus, 
  Package, 
  Factory, 
  Stethoscope, 
  AlertTriangle, 
  TrendingDown,
  Info,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

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

  // Suggested Products (Same Category)
  const suggestedProducts = PRODUCTS.filter(p => 
    p.category === product.category && 
    p.id !== product.id && 
    p.id !== genericSubstitute?.id
  ).slice(0, 4);

  const handleAdd = (p: typeof product) => {
    addToCart(p);
    toast({
      title: "Added to cart",
      description: `${p.name} added.`,
    });
  };

  const getQty = (pid: string) => cart.find(i => i.id === pid)?.quantity || 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24 sm:pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Mobile Header & Breadcrumb */}
        <div className="flex items-center justify-between mb-4 px-2">
          <Link href="/" className="flex items-center gap-1 text-primary font-black active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-widest text-primary">Store</span>
          </Link>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
            <span className="truncate max-w-[80px]">{product.category}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-primary truncate max-w-[100px]">{product.name}</span>
          </div>
          <Button size="icon" variant="ghost" className="rounded-full bg-white shadow-sm h-8 w-8">
            <Heart className="w-4 h-4 text-gray-300" />
          </Button>
        </div>

        {/* Comparison Hero Banner */}
        {genericSubstitute && (
          <div className="bg-primary text-white p-4 rounded-[28px] mb-6 flex items-center justify-between shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-top duration-500 mx-2">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-accent animate-pulse shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Switch & Save</p>
                <h2 className="font-black text-sm sm:text-lg">Save ₹{product.price - genericSubstitute.price} with generic alternative</h2>
              </div>
            </div>
            <Badge className="bg-white text-primary font-black text-[10px] border-none px-4 py-1.5 rounded-full shrink-0 hidden sm:flex">BIO-EQUIVALENT READY</Badge>
          </div>
        )}

        {/* Side-by-Side Comparison Grid */}
        <div className={`grid ${genericSubstitute ? 'grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'} gap-2 sm:gap-8`}>
          
          {/* COLUMN 1: BRANDED */}
          <div className="space-y-3 sm:space-y-6 flex flex-col">
            <div className="bg-white rounded-[24px] sm:rounded-[40px] p-3 sm:p-8 shadow-sm border border-gray-100 flex flex-col flex-1">
               <div className="flex justify-between items-start mb-2 sm:mb-6">
                  <Badge variant="outline" className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-2 sm:px-4 py-1 rounded-full text-gray-400">
                    Branded
                  </Badge>
               </div>

               <div className="flex flex-col items-center text-center gap-2 sm:gap-6 flex-1 mb-4">
                  <div className="w-24 h-24 sm:w-48 sm:h-48 relative bg-gray-50 rounded-[20px] sm:rounded-[32px] overflow-hidden p-2 sm:p-6">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                  </div>
                  <div className="w-full">
                    <h1 className="text-[11px] sm:text-2xl font-black text-gray-900 mb-0.5 sm:mb-2 leading-tight line-clamp-2">{product.name}</h1>
                    <p className="text-[7px] sm:text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest truncate">{product.manufacturer}</p>
                    
                    <div className="inline-flex items-center gap-1 sm:gap-2 bg-blue-50/50 px-2 sm:px-4 py-1 sm:py-2 rounded-[10px] sm:rounded-2xl border border-blue-100 mb-4 w-full">
                      <span className="text-[6px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest shrink-0">Salt:</span>
                      <span className="text-[7px] sm:text-xs font-bold text-blue-900 truncate">{product.saltComposition}</span>
                    </div>

                    <div className="flex items-baseline justify-center gap-1 sm:gap-3">
                      <span className="text-sm sm:text-3xl font-black text-gray-900">₹{product.price}</span>
                      <span className="text-gray-300 line-through text-[9px] sm:text-sm font-bold">₹{(product.price * 1.2).toFixed(0)}</span>
                    </div>
                  </div>
               </div>

               <div className="pt-3 sm:pt-6 border-t border-gray-50">
                  {getQty(product.id) > 0 ? (
                    <div className="flex items-center justify-between border-2 border-primary rounded-full h-10 sm:h-14 px-1 sm:px-2 bg-primary/5">
                      <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-black text-xs sm:text-lg text-primary">{getQty(product.id)}</span>
                      <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full hover:bg-primary hover:text-white" onClick={() => updateQuantity(product.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleAdd(product)} className="w-full h-10 sm:h-14 rounded-full font-black text-[9px] sm:text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                      Add Branded
                    </Button>
                  )}
               </div>
            </div>

            {/* Branded Clinical Details */}
            <div className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border border-gray-100 space-y-4 sm:space-y-8 flex-1">
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 border-l-4 border-primary pl-2">Composition</h4>
                 <p className="text-[9px] sm:text-sm text-gray-700 font-bold leading-tight">{product.saltComposition}</p>
                 <p className="text-[8px] sm:text-xs text-gray-400 mt-1">{product.packSize}</p>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 border-l-4 border-primary pl-2">Description</h4>
                 <p className="text-[9px] sm:text-sm text-gray-600 font-medium leading-relaxed">{product.description}</p>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 border-l-4 border-primary pl-2">Uses</h4>
                 <ul className="space-y-1 sm:space-y-3">
                   {product.uses.map((use, i) => (
                     <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                       <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                       {use}
                     </li>
                   ))}
                 </ul>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 border-l-4 border-primary pl-2">Side Effects</h4>
                 <ul className="space-y-1 sm:space-y-3">
                   {product.sideEffects.map((se, i) => (
                     <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                       <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                       {se}
                     </li>
                   ))}
                 </ul>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 border-l-4 border-primary pl-2">Manufacturer</h4>
                 <p className="text-[9px] sm:text-xs text-gray-500 font-bold leading-tight">{product.mfrDetails}</p>
               </section>
            </div>
          </div>

          {/* COLUMN 2: GENERIC (IF AVAILABLE) */}
          {genericSubstitute && (
            <div className="space-y-3 sm:space-y-6 flex flex-col animate-in fade-in slide-in-from-right duration-500">
              <div className="bg-gradient-to-br from-green-50 to-white rounded-[24px] sm:rounded-[40px] p-3 sm:p-8 shadow-xl border-2 border-green-200 flex flex-col flex-1 relative">
                 <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white font-black text-[7px] sm:text-[10px] uppercase px-3 sm:px-6 py-1 sm:py-2 rounded-bl-[16px] sm:rounded-bl-[24px] shadow-lg flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Save ₹{product.price - genericSubstitute.price}
                    </div>
                 </div>

                 <div className="flex justify-between items-start mb-2 sm:mb-6">
                  <Badge className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-2 sm:px-4 py-1 rounded-full">
                    Generic Alternative
                  </Badge>
                 </div>

                 <div className="flex flex-col items-center text-center gap-2 sm:gap-6 flex-1 mb-4">
                    <div className="w-24 h-24 sm:w-48 sm:h-48 relative bg-white rounded-[20px] sm:rounded-[32px] overflow-hidden p-2 sm:p-6 shadow-inner border border-green-100">
                      <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className="object-contain" />
                    </div>
                    <div className="w-full">
                      <h2 className="text-[11px] sm:text-2xl font-black text-green-900 mb-0.5 sm:mb-2 leading-tight line-clamp-2">{genericSubstitute.name}</h2>
                      <p className="text-[7px] sm:text-xs font-bold text-green-600/60 mb-2 uppercase tracking-widest truncate">{genericSubstitute.manufacturer}</p>

                      <div className="inline-flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-4 py-1 sm:py-2 rounded-[10px] sm:rounded-2xl border border-green-100 mb-4 w-full">
                        <span className="text-[6px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest shrink-0">Salt:</span>
                        <span className="text-[7px] sm:text-xs font-bold text-green-900 truncate">{genericSubstitute.saltComposition}</span>
                      </div>

                      <div className="flex items-baseline justify-center gap-1 sm:gap-3">
                        <span className="text-sm sm:text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                        <span className="text-gray-400 line-through text-[9px] sm:text-sm font-bold">₹{product.price}</span>
                      </div>
                    </div>
                 </div>

                 <div className="pt-3 sm:pt-6 border-t border-green-100">
                    {getQty(genericSubstitute.id) > 0 ? (
                      <div className="flex items-center justify-between border-2 border-green-600 rounded-full h-10 sm:h-14 px-1 sm:px-2 bg-green-50">
                        <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-black text-xs sm:text-lg text-green-900">{getQty(genericSubstitute.id)}</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full hover:bg-green-600 hover:text-white" onClick={() => updateQuantity(genericSubstitute.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-10 sm:h-14 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[9px] sm:text-lg shadow-xl shadow-green-200 active:scale-95 transition-all gap-1">
                        <Zap className="w-3 h-3 sm:w-5 sm:h-5" /> Switch & Save
                      </Button>
                    )}
                 </div>
              </div>

              {/* Generic Clinical Details - MIRROR OF BRANDED */}
              <div className="bg-green-50/50 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border border-green-100 space-y-4 sm:space-y-8 flex-1">
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 border-l-4 border-green-600 pl-2">Composition</h4>
                   <p className="text-[9px] sm:text-sm text-green-900 font-bold leading-tight">{genericSubstitute.saltComposition}</p>
                   <p className="text-[8px] sm:text-xs text-green-600/60 mt-1">{genericSubstitute.packSize}</p>
                 </section>
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 border-l-4 border-green-600 pl-2">Description</h4>
                   <p className="text-[9px] sm:text-sm text-gray-600 font-medium leading-relaxed">{genericSubstitute.description || product.description}</p>
                 </section>
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 border-l-4 border-green-600 pl-2">Uses</h4>
                   <ul className="space-y-1 sm:space-y-3">
                     {(genericSubstitute.uses.length > 0 ? genericSubstitute.uses : product.uses).map((use, i) => (
                       <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                         <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                         {use}
                       </li>
                     ))}
                   </ul>
                 </section>
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 border-l-4 border-green-600 pl-2">Side Effects</h4>
                   <ul className="space-y-1 sm:space-y-3">
                     {(genericSubstitute.sideEffects.length > 0 ? genericSubstitute.sideEffects : product.sideEffects).map((se, i) => (
                       <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                         <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                         {se}
                       </li>
                     ))}
                   </ul>
                 </section>
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 border-l-4 border-green-600 pl-2">Manufacturer</h4>
                   <div className="p-2 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-green-100 flex items-center gap-2 sm:gap-3">
                      <Factory className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 opacity-40 shrink-0" />
                      <div>
                        <p className="text-[6px] sm:text-[8px] font-black uppercase text-gray-400 tracking-tighter">Certified Lab</p>
                        <p className="text-[7px] sm:text-[10px] font-bold text-gray-700 truncate line-clamp-1">{genericSubstitute.mfrDetails}</p>
                      </div>
                   </div>
                 </section>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Products Section */}
        {suggestedProducts.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xl font-black font-headline text-gray-900 uppercase tracking-tight">Suggested Products</h3>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
              {suggestedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
