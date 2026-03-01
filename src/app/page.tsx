
"use client"

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/lib/data';
import { Activity, ArrowRight, ShieldCheck, Truck, Clock, Upload, HeartPulse, Zap, ShieldPlus, Sparkles, Wind } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const featuredProducts = PRODUCTS.slice(0, 4);

  const getIcon = (name: string) => {
    switch(name) {
      case 'Diabetes': return <Activity className="w-8 h-8" />;
      case 'Heart care': return <HeartPulse className="w-8 h-8" />;
      case 'Stomach care': return <Zap className="w-8 h-8" />;
      case 'Liver care': return <ShieldPlus className="w-8 h-8" />;
      case 'Derma care': return <Sparkles className="w-8 h-8" />;
      case 'Respicare': return <Wind className="w-8 h-8" />;
      default: return <Activity className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="flex-1">
        {/* Hero & Quick Prescription Upload */}
        <section className="bg-white py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative rounded-3xl overflow-hidden aspect-[21/9] bg-primary group shadow-2xl">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center p-8 md:p-12">
                <div className="max-w-lg text-white">
                  <span className="inline-block bg-accent/90 text-white text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">India's Trusted Pharmacy</span>
                  <h1 className="text-3xl md:text-5xl font-bold font-headline mb-4 leading-tight">Authentic Medicines, <br/>Delivered Fast.</h1>
                  <p className="text-white/80 mb-8 text-lg hidden md:block">Save up to 80% with verified generic alternatives for chronic treatments.</p>
                  <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-bold px-8 h-14 text-lg">Order via Search</Button>
                </div>
              </div>
            </div>

            <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-blue-50 to-white overflow-hidden border-2 border-primary/10">
              <CardContent className="p-8 flex flex-col h-full justify-center text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Order with Prescription</h2>
                <p className="text-muted-foreground text-sm mb-8">Upload your prescription and let our pharmacists pre-fill your cart.</p>
                <Link href="/prescription">
                  <Button className="w-full h-14 rounded-full font-bold text-lg gap-2 shadow-lg shadow-primary/20">
                    Upload & Order Now
                  </Button>
                </Link>
                <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-500" /> Verified Pharmacists only
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold font-headline text-gray-900">Shop by Categories</h2>
                <p className="text-muted-foreground">Expertly curated for your specific health needs</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORIES.map((cat) => (
                <Link key={cat.name} href={`/search?c=${cat.name}`} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    {getIcon(cat.name)}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{cat.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Top Deals */}
        <section className="py-16 bg-white border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold font-headline text-gray-900">Recommended for You</h2>
                <p className="text-muted-foreground">Top selling medicines at guaranteed best prices</p>
              </div>
              <Link href="/search" className="text-primary font-bold flex items-center gap-1 hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Trust Features */}
        <section className="py-20 bg-[#F8F8F8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { icon: ShieldCheck, title: "100% Genuine", desc: "All medicines are sourced from ISO-certified labs and manufacturers." },
                { icon: Truck, title: "Fast Delivery", desc: "Estimated delivery in 2-3 days for standard, or 15-min express locally." },
                { icon: Clock, title: "24/7 Support", desc: "Consult our certified pharmacists anytime for your medicine queries." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 items-start p-6 bg-white rounded-3xl shadow-sm border border-white">
                  <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer code remains mostly same, just ensuring link colors are primary */}
    </div>
  );
}
