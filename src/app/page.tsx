
"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Camera, MessageCircle, ShieldCheck, ChevronRight, Truck, Thermometer, Bandage, Soup, HeartPulse, Pill, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { CATEGORIES as LOCAL_CATEGORIES, PRODUCTS as LOCAL_PRODUCTS } from '@/lib/data';

export default function Home() {
  const db = useFirestore();

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(10));
  }, [db]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(6));
  }, [db]);

  const { data: medicines } = useCollection(medicinesQuery);
  const { data: categories } = useCollection(categoriesQuery);

  const displayMedicines = medicines?.length ? medicines : LOCAL_PRODUCTS.slice(0, 5);
  const displayCategories = (categories?.length ? categories : LOCAL_CATEGORIES.slice(0, 6)).map((cat, idx) => ({
    ...cat,
    icon: idx === 0 ? Thermometer : idx === 1 ? Bandage : idx === 2 ? Soup : idx === 3 ? HeartPulse : Pill
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        
        {/* Hero Banner */}
        <section className="relative rounded-[24px] bg-[#020617] overflow-hidden p-8 flex flex-col justify-center min-h-[200px]">
          <div className="absolute top-4 left-4">
            <span className="bg-[#F97316] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Limited Offer</span>
          </div>
          <div className="space-y-2 relative z-10">
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Affordable Medicines<br />Across India
            </h1>
            <div className="w-16 h-0.5 bg-primary/30" />
            <p className="text-gray-300 text-sm font-bold pt-2">Save 60% on Quality Generics</p>
          </div>
          {/* Abstract Bag Icon Overlay */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <Search size={180} className="text-white" strokeWidth={1} />
          </div>
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-2 gap-4">
          <Link href="/prescription" className="flex flex-col items-center justify-center gap-3 bg-[#FFF0EB] p-6 rounded-[24px] group active:scale-95 transition-all">
            <div className="bg-[#F97316] p-2.5 rounded-xl text-white shadow-lg">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-[#F97316] uppercase text-center leading-tight">Upload Prescription</span>
          </Link>
          <Link href="#" className="flex flex-col items-center justify-center gap-3 bg-[#EBFBF5] p-6 rounded-[24px] group active:scale-95 transition-all">
            <div className="bg-[#136A31] p-2.5 rounded-xl text-white shadow-lg">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-[#136A31] uppercase text-center leading-tight">Order via WhatsApp</span>
          </Link>
        </section>

        {/* Trust Bar */}
        <section className="bg-white border border-gray-100 p-4 rounded-[20px] flex items-center gap-4">
          <div className="bg-[#136A31]/10 p-2.5 rounded-xl text-[#136A31]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-tight">Quality Certified</h3>
            <p className="text-[10px] font-bold text-gray-400 leading-tight">Ensuring the highest international manufacturing standards for your health.</p>
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900">Shop by Category</h2>
            <Link href="/search" className="text-xs font-bold text-[#F97316]">See All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
            {displayCategories.map((cat: any, i) => (
              <Link key={i} href={`/search?c=${cat.name}`} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-14 h-14 bg-[#F1F5F9] rounded-full flex items-center justify-center text-gray-600 active:bg-primary/10 transition-colors">
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900">Best Sellers</h2>
            <div className="flex gap-2">
              <button className="p-1 rounded-full bg-gray-100"><ChevronRight className="w-4 h-4 rotate-180" /></button>
              <button className="p-1 rounded-full bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1">
            {displayMedicines.map((p: any) => (
              <div key={p.id} className="min-w-[180px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Free Delivery Banner */}
        <section className="bg-[#F97316] p-5 rounded-[24px] flex items-center gap-4 text-white shadow-xl shadow-orange-500/20">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">FREE Delivery</h3>
            <p className="text-[10px] font-bold opacity-90">All over India, no minimum order!</p>
          </div>
        </section>

        {/* Quality Medicines Card */}
        <section className="bg-[#F1F5F9] p-8 rounded-[24px] text-center space-y-4">
          <div className="w-14 h-14 bg-[#136A31]/10 text-[#136A31] rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Best Quality Medicines</h2>
          <p className="text-xs font-bold text-gray-500 leading-relaxed max-w-xs mx-auto">
            You get nothing but the best – premium quality medicines you can trust. Sourced directly from certified facilities.
          </p>
        </section>

      </main>
    </div>
  );
}
