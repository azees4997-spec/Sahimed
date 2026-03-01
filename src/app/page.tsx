"use client"

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/lib/data';
import { Activity, ArrowRight, ShieldCheck, Upload, HeartPulse, Zap, ShieldPlus, Sparkles, Wind } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const featuredProducts = PRODUCTS.slice(0, 6);

  const getIcon = (name: string) => {
    switch(name) {
      case 'Diabetes': return <Activity className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'Heart care': return <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'Stomach care': return <Zap className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'Liver care': return <ShieldPlus className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'Derma care': return <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'Respicare': return <Wind className="w-6 h-6 sm:w-8 sm:h-8" />;
      default: return <Activity className="w-6 h-6 sm:w-8 sm:h-8" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 sm:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[32px] overflow-hidden aspect-[16/9] sm:aspect-[21/7] bg-primary shadow-xl">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent flex items-center p-6 sm:p-12">
                <div className="max-w-md text-white">
                  <span className="inline-block bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-widest shadow-lg">Save up to 80%</span>
                  <h1 className="text-2xl sm:text-4xl font-bold font-headline mb-2 leading-tight">Your Health,<br/>Delivered Home.</h1>
                  <p className="text-white/80 mb-6 text-sm hidden sm:block">Switch to verified generic alternatives and save big on chronic care.</p>
                  <Button size="lg" className="rounded-full bg-white text-primary hover:bg-gray-100 font-bold px-6 h-12 text-sm sm:h-14 sm:text-lg shadow-xl shadow-black/10">Shop Medicines</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Prescription Upload Card */}
        <section className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <Link href="/prescription">
              <Card className="rounded-[28px] border-none shadow-sm bg-gradient-to-r from-blue-50 to-white border-2 border-primary/5 active:scale-[0.98] transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-black text-gray-900 text-sm sm:text-base">Order with Prescription</h2>
                    <p className="text-xs text-muted-foreground">Upload and let us handle the rest</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Categories Grid - Mobile Optimized 3x2 */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-headline text-gray-900 uppercase tracking-tight">Shop by Categories</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">See All</Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-6">
              {CATEGORIES.map((cat) => (
                <Link key={cat.name} href={`/search?c=${cat.name}`} className="group flex flex-col items-center text-center active:scale-95 transition-all">
                  <div className="w-full aspect-square bg-white rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-primary/20">
                    {getIcon(cat.name)}
                  </div>
                  <h3 className="font-bold text-[10px] sm:text-xs text-gray-700 truncate w-full px-1">{cat.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 bg-white/50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-headline text-gray-900 uppercase tracking-tight">Top Recommendations</h2>
              <Link href="/search" className="text-[10px] font-black text-primary uppercase tracking-widest">Explore All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">100% Genuine Medicines</span>
            </div>
            <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto">Sourced from certified labs. Guaranteed fast delivery within 2-3 days.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
