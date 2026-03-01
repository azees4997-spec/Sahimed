
"use client"

import { use } from 'react';
import Navbar from '@/components/Navbar';
import { PRODUCTS } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Info, Share2, Heart, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = PRODUCTS.find(p => p.id === id);
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (!product) notFound();

  // Find substitutes (same salt, different ID, lower price preferred)
  const substitutes = PRODUCTS.filter(p => 
    p.saltComposition === product.saltComposition && p.id !== product.id
  ).sort((a, b) => a.price - b.price);

  const handleAdd = () => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-6 md:p-12 rounded-3xl shadow-sm border mb-12">
          {/* Image Section */}
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-8 group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur rounded-full shadow-sm hover:text-accent">
                <Heart className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur rounded-full shadow-sm">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4 text-xs tracking-wider uppercase bg-blue-50 text-primary border-none">
                {product.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold font-headline text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-500 font-medium">By {product.manufacturer}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl mb-8 border border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter">Salt Composition</span>
              </div>
              <p className="text-primary font-bold italic">{product.saltComposition}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-gray-900">₹{product.price}</span>
                <span className="text-gray-400 line-through text-lg">₹{(product.price * 1.2).toFixed(0)}</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">20% OFF</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Button onClick={handleAdd} size="lg" className="rounded-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                Add to Cart
              </Button>
              <Link href="/prescription">
                 <Button variant="outline" size="lg" className="w-full rounded-full h-14 text-lg font-bold border-2 border-primary text-primary hover:bg-primary/5">
                  Check Prescription
                 </Button>
              </Link>
            </div>

            <div className="mt-auto border-t pt-6">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                100% Secure & Genuine Product Guarantee
              </div>
            </div>
          </div>
        </div>

        {/* Substitutes Section */}
        {substitutes.length > 0 && (
          <section className="mt-16">
            <div className="bg-accent/10 p-6 rounded-2xl mb-8 border border-accent/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Save More with Substitutes
                </h2>
                <p className="text-muted-foreground">Generic alternatives with the same <span className="font-bold text-primary italic">composition</span> at lower prices.</p>
              </div>
              <Badge className="bg-accent hover:bg-accent text-white px-4 py-2 text-sm rounded-full">Save up to 80%</Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {substitutes.map(sub => (
                <div key={sub.id} className="relative">
                   <ProductCard product={sub} />
                   <div className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">
                     SAVE ₹{product.price - sub.price}
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Products */}
        <section className="mt-20">
            <h2 className="text-2xl font-bold font-headline mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4).map(p => (
                 <ProductCard key={p.id} product={p} />
               ))}
            </div>
        </section>
      </main>
    </div>
  );
}
