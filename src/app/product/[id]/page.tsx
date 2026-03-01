
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
  ChevronLeft
} from 'lucide-react';
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

        {/* Comparison Banner */}
        {genericSubstitute && (
          <div className="bg-primary text-white p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] mb-6 flex items-center justify-between shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2 sm:gap-3">
              <Zap className="w-5 h-5 text-accent animate-pulse shrink-0" />
              <div>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/70">Expert Recommendation</p>
                <h2 className="font-black text-[10px] sm:text-sm">Save ₹{product.price - genericSubstitute.price} with Bio-Equivalent</h2>
              </div>
            </div>
            <Badge className="bg-white text-primary font-black text-[8px] sm:text-[10px] border-none px-3 py-1 shrink-0">GENERIC READY</Badge>
          </div>
        )}

        {/* Main Comparison Section - Force Side-by-Side Grid */}
        <div className={`grid ${genericSubstitute ? 'grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'} gap-2 sm:gap-6 lg:gap-10`}>
          
          {/* LEFT COLUMN: BRANDED MEDICINE */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-[24px] sm:rounded-[40px] p-3 sm:p-8 shadow-sm border border-gray-100 relative group overflow-hidden flex flex-col h-full">
               <div className="flex justify-between items-start mb-2 sm:mb-6">
                  <Badge variant="outline" className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-100 px-2 sm:px-4 py-1 rounded-full text-gray-400">
                    Branded
                  </Badge>
               </div>

               <div className="flex flex-col items-center gap-3 sm:gap-6 mb-4 sm:mb-8 flex-1">
                  <div className="w-24 h-24 sm:w-48 sm:h-48 relative bg-gray-50 rounded-[20px] sm:rounded-[32px] overflow-hidden p-3 sm:p-6 shadow-inner">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                  </div>
                  <div className="text-center w-full">
                    <h1 className="text-xs sm:text-2xl font-black text-gray-900 mb-0.5 sm:mb-1 leading-tight">{product.name}</h1>
                    <p className="text-[7px] sm:text-xs font-bold text-gray-400 mb-2 sm:mb-4 uppercase tracking-widest line-clamp-1">{product.manufacturer}</p>
                    
                    <div className="inline-flex items-center gap-1 sm:gap-2 bg-blue-50/50 px-2 sm:px-4 py-1 sm:py-2 rounded-[10px] sm:rounded-2xl mb-4 sm:mb-6 border border-blue-100">
                      <span className="text-[6px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest">Salt:</span>
                      <span className="text-[7px] sm:text-xs font-bold text-blue-900 truncate max-w-[100px]">{product.saltComposition}</span>
                    </div>

                    <div className="flex items-baseline justify-center gap-1 sm:gap-3">
                      <span className="text-sm sm:text-3xl font-black text-gray-900">₹{product.price}</span>
                      <span className="text-gray-300 line-through text-[9px] sm:text-sm font-bold">₹{(product.price * 1.2).toFixed(0)}</span>
                    </div>
                  </div>
               </div>

               <div className="pt-3 sm:pt-6 border-t border-gray-50 mt-auto">
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
                    <Button onClick={() => handleAdd(product)} className="w-full h-10 sm:h-14 rounded-full font-black text-[10px] sm:text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all px-1">
                      Add Branded
                    </Button>
                  )}
               </div>
            </div>

            {/* Branded Medical Info */}
            <div className="bg-white/60 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border border-gray-100 space-y-4 sm:space-y-8 animate-in slide-in-from-bottom duration-700">
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-4 border-l-4 border-primary pl-2 sm:pl-3">Description</h4>
                 <p className="text-[9px] sm:text-sm text-gray-600 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">{product.description}</p>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-4 border-l-4 border-green-500 pl-2 sm:pl-3">Standard Uses</h4>
                 <ul className="space-y-1 sm:space-y-3">
                   {product.uses.map((use, i) => (
                     <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                       <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                       {use}
                     </li>
                   ))}
                 </ul>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-4 border-l-4 border-orange-500 pl-2 sm:pl-3">Side Effects</h4>
                 <ul className="space-y-1 sm:space-y-3">
                   {product.sideEffects.map((se, i) => (
                     <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                       <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 shrink-0 mt-0.5" />
                       {se}
                     </li>
                   ))}
                 </ul>
               </section>
               <section>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-4 border-l-4 border-gray-400 pl-2 sm:pl-3">Manufacturer</h4>
                 <p className="text-[9px] sm:text-xs text-gray-500 font-bold">{product.mfrDetails}</p>
               </section>
            </div>
          </div>

          {/* RIGHT COLUMN: GENERIC SUBSTITUTE */}
          {genericSubstitute && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-white rounded-[24px] sm:rounded-[40px] p-3 sm:p-8 shadow-xl border-2 border-green-200 relative group overflow-hidden flex flex-col h-full">
                 <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white font-black text-[6px] sm:text-[10px] uppercase px-2 sm:px-6 py-1 sm:py-2 rounded-bl-[12px] sm:rounded-bl-[24px] shadow-lg flex items-center gap-1">
                      <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3" /> -₹{product.price - genericSubstitute.price}
                    </div>
                 </div>

                 <div className="flex justify-between items-start mb-2 sm:mb-6">
                  <Badge className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border-none px-2 sm:px-4 py-1 rounded-full">
                    Generic
                  </Badge>
                 </div>

                 <div className="flex flex-col items-center gap-3 sm:gap-6 mb-4 sm:mb-8 flex-1">
                    <div className="w-24 h-24 sm:w-48 sm:h-48 relative bg-white rounded-[20px] sm:rounded-[32px] overflow-hidden p-3 sm:p-6 shadow-inner border border-green-100">
                      <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className="object-contain" />
                    </div>
                    <div className="text-center w-full">
                      <h2 className="text-xs sm:text-2xl font-black text-green-900 mb-0.5 sm:mb-1 leading-tight">{genericSubstitute.name}</h2>
                      <p className="text-[7px] sm:text-xs font-bold text-green-600/60 mb-2 sm:mb-4 uppercase tracking-widest line-clamp-1">{genericSubstitute.manufacturer}</p>

                      <div className="inline-flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-4 py-1 sm:py-2 rounded-[10px] sm:rounded-2xl mb-4 sm:mb-6 border border-green-100">
                        <span className="text-[6px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest">Salt:</span>
                        <span className="text-[7px] sm:text-xs font-bold text-green-900 truncate max-w-[100px]">{genericSubstitute.saltComposition}</span>
                      </div>

                      <div className="flex items-baseline justify-center gap-1 sm:gap-3">
                        <span className="text-sm sm:text-4xl font-black text-green-600">₹{genericSubstitute.price}</span>
                        <span className="text-gray-400 line-through text-[9px] sm:text-sm font-bold">₹{product.price}</span>
                      </div>
                    </div>
                 </div>

                 <div className="pt-3 sm:pt-6 border-t border-green-100 mt-auto">
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
                      <Button onClick={() => handleAdd(genericSubstitute)} className="w-full h-10 sm:h-14 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[10px] sm:text-lg shadow-xl shadow-green-200 active:scale-95 transition-all gap-1 sm:gap-2 px-1">
                        <Zap className="w-3 h-3 sm:w-5 sm:h-5" /> Switch & Save
                      </Button>
                    )}
                 </div>
              </div>

              {/* Generic Medical Info */}
              <div className="bg-green-50/50 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border border-green-100 space-y-4 sm:space-y-8 animate-in slide-in-from-bottom duration-700 delay-150">
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 sm:mb-4 border-l-4 border-green-600 pl-2 sm:pl-3">Bio-Equivalence</h4>
                   <p className="text-[9px] sm:text-sm text-gray-600 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">{genericSubstitute.description}</p>
                 </section>
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 sm:mb-4 border-l-4 border-green-600 pl-2 sm:pl-3">Clinical Benefits</h4>
                   <ul className="space-y-1 sm:space-y-3">
                     {genericSubstitute.uses.map((use, i) => (
                       <li key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-gray-700">
                         <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 shrink-0 mt-0.5" />
                         {use}
                       </li>
                     ))}
                   </ul>
                 </section>
                 <section>
                   <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-2 sm:mb-4 border-l-4 border-green-600 pl-2 sm:pl-3">Manufacturer</h4>
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

        {/* Safety Warning */}
        <section className="mt-8 sm:mt-12 p-4 sm:p-8 bg-orange-50 rounded-[24px] sm:rounded-[32px] border border-orange-100 flex items-start gap-3 sm:gap-4">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-orange-900 text-[10px] sm:text-sm mb-1 uppercase tracking-tight">Pharmacist Advisory</h4>
            <p className="text-[9px] sm:text-xs text-orange-800/80 font-medium leading-relaxed">
              Always consult your doctor before switching medications. While generics have the same chemical salt ({product.saltComposition}), your specific health condition might require a specific brand.
            </p>
          </div>
        </section>

        {/* Related Solutions */}
        <section className="mt-12 sm:mt-16">
            <h2 className="text-sm sm:text-xl font-black text-gray-900 mb-4 sm:mb-8 uppercase tracking-widest px-2">More for {product.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 px-2">
               {PRODUCTS.filter(p => p.category === product.category && p.id !== id).slice(0, 4).map(p => (
                 <Link key={p.id} href={`/product/${p.id}`} className="group block active:scale-95 transition-all">
                    <div className="bg-white p-2 sm:p-4 rounded-[24px] sm:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                       <div className="relative aspect-square bg-gray-50 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-2 sm:p-4 group-hover:scale-110 transition-transform duration-500" />
                       </div>
                       <h4 className="font-bold text-gray-900 text-[9px] sm:text-[11px] mb-0.5 sm:mb-1 line-clamp-1">{p.name}</h4>
                       <p className="text-primary font-black text-[10px] sm:text-sm">₹{p.price}</p>
                    </div>
                 </Link>
               ))}
            </div>
        </section>
      </main>
    </div>
  );
}
