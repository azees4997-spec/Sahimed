
"use client"

import { use, useState } from 'react';
import Navbar from '@/components/Navbar';
import { PRODUCTS } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Info, Share2, Heart, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = PRODUCTS.find(p => p.id === id);
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (!product) notFound();

  // Find the exact generic substitute (same salt, isGeneric: true)
  const genericSubstitute = PRODUCTS.find(p => 
    p.saltComposition === product.saltComposition && p.id !== product.id && p.isGeneric === true
  );

  const handleAdd = (p: typeof product) => {
    addToCart(p);
    toast({
      title: "Added to cart",
      description: `${p.name} has been added.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        
        {/* Main Comparison/Detail Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Branded Product Details */}
          <div className={`${genericSubstitute ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-12`}>
            <div className="md:w-1/2 space-y-6">
              <div className="relative aspect-square bg-gray-50 rounded-[32px] overflow-hidden group border border-gray-100">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-8 group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-4 right-4">
                  <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur rounded-full shadow-sm hover:text-accent h-12 w-12">
                    <Heart className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              
              {/* Medicine Description Image (Placeholder as requested) */}
              <div className="relative h-32 bg-blue-50 rounded-2xl overflow-hidden border border-blue-100 flex items-center justify-center">
                 <div className="text-center p-4">
                    <Info className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Medical Guide & Info</p>
                 </div>
              </div>
            </div>

            <div className="md:w-1/2 flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-blue-50 text-primary border-none text-[10px] font-black uppercase px-3 py-1">
                    {product.category}
                  </Badge>
                  {!product.isGeneric && <Badge className="bg-orange-500 text-white border-none text-[10px] font-black uppercase px-3 py-1">Premium Brand</Badge>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-400 font-bold text-sm">By {product.manufacturer}</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-3xl mb-8 border border-dashed border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Salt Composition</p>
                <p className="text-primary font-bold text-lg">{product.saltComposition}</p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-black text-gray-900">₹{product.price}</span>
                  <span className="text-gray-400 line-through text-lg font-medium">₹{(product.price * 1.25).toFixed(0)}</span>
                  <span className="text-green-600 font-black text-sm">25% OFF</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Delivered in 2-3 days • GST Included</p>
              </div>

              <div className="space-y-4 mt-auto">
                <Button onClick={() => handleAdd(product)} size="lg" className="w-full rounded-full h-16 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Add to Cart
                </Button>
                <Link href="/prescription" className="block w-full">
                  <Button variant="outline" size="lg" className="w-full rounded-full h-16 text-lg font-bold border-2 border-primary text-primary hover:bg-primary/5">
                    Check Prescription
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Generic Comparison Area */}
          {genericSubstitute && (
            <div className="lg:col-span-5 bg-gradient-to-br from-green-50 to-white rounded-[40px] p-8 border-2 border-green-200 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest shadow-lg">
                Save ₹{product.price - genericSubstitute.price}
              </div>
              
              <div className="mb-8">
                 <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-6 h-6 text-green-600 animate-pulse" />
                    <h2 className="text-2xl font-black text-green-800">Save 80% with Generic</h2>
                 </div>
                 <p className="text-green-700/70 text-sm font-medium leading-relaxed">Exact same <span className="font-black underline">{product.saltComposition}</span>, just at a fraction of the branded price.</p>
              </div>

              <div className="bg-white/60 backdrop-blur p-8 rounded-[32px] border border-white mb-8">
                 <div className="relative aspect-square w-32 mx-auto mb-6 bg-white rounded-2xl shadow-sm p-4 border border-green-50">
                    <Image src={genericSubstitute.imageUrl} alt={genericSubstitute.name} fill className="object-contain p-2" />
                 </div>
                 <h3 className="text-xl font-black text-center text-gray-900 mb-1">{genericSubstitute.name}</h3>
                 <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">HealthLink Approved Generic</p>
                 
                 <div className="flex justify-center items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black text-green-600">₹{genericSubstitute.price}</span>
                    <span className="text-gray-400 line-through text-sm">₹{product.price}</span>
                 </div>

                 <Button 
                   onClick={() => handleAdd(genericSubstitute)}
                   className="w-full h-14 rounded-full bg-green-600 hover:bg-green-700 font-bold text-lg shadow-lg shadow-green-200"
                 >
                   Switch & Save
                 </Button>
              </div>

              <div className="space-y-3">
                 {[
                   "Same active salt composition",
                   "Quality tested & lab approved",
                   "Same effectiveness & dosage",
                   "Major cost savings guaranteed"
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs font-bold text-green-800/60">
                     <CheckCircle2 className="w-4 h-4 text-green-500" />
                     {feat}
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Similar Products */}
        <section className="mt-20">
            <h2 className="text-3xl font-bold font-headline mb-10 text-center">Related Healthcare Solutions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {PRODUCTS.filter(p => p.category === product.category && p.id !== id).slice(0, 4).map(p => (
                 <div key={p.id} className="hover:-translate-y-2 transition-transform">
                   <Link href={`/product/${p.id}`}>
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border group">
                       <div className="relative aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-4 group-hover:scale-110 transition-transform" />
                       </div>
                       <h4 className="font-bold text-gray-900 mb-1">{p.name}</h4>
                       <p className="text-primary font-black">₹{p.price}</p>
                    </div>
                   </Link>
                 </div>
               ))}
            </div>
        </section>
      </main>
    </div>
  );
}
