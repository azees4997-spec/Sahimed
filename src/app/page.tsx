
"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { MessageCircle, ShieldCheck, ChevronRight, Truck, Phone, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
    return query(collection(db, 'categories'), orderBy('name', 'asc'), limit(12));
  }, [db]);

  const { data: medicines } = useCollection(medicinesQuery);
  const { data: categories } = useCollection(categoriesQuery);

  const displayMedicines = medicines?.length ? medicines : LOCAL_PRODUCTS;
  const displayCategories = categories?.length ? categories : LOCAL_CATEGORIES;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6 pb-6">
        
        {/* Hero Banner */}
        <section className="relative rounded-[24px] bg-gradient-to-br from-[#005FAC] to-[#004a8a] overflow-hidden p-8 flex flex-col justify-center min-h-[220px]">
          <div className="space-y-3 relative z-10">
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight uppercase tracking-tight">
              Affordable Medicines<br />Across India
            </h1>
            <div className="w-16 h-0.5 bg-white/20" />
            <p className="text-white/90 text-sm font-bold pt-1 uppercase tracking-widest">Sahi Dawai, Sahi Daam Pe</p>
          </div>
          {/* Medical Bag Abstract Icon Overlay */}
          <div className="absolute right-[-30px] bottom-[-30px] opacity-10 rotate-12">
            <ShieldCheck size={220} className="text-white" strokeWidth={1} />
          </div>
        </section>

        {/* Action Stack */}
        <section className="space-y-4">
          {/* Full Width Prescription Section */}
          <Link href="/prescription" className="flex items-center gap-5 bg-[#FFF0EB] p-6 rounded-[24px] group active:scale-95 transition-all shadow-sm">
            <div className="bg-[#F97316] p-3 rounded-2xl text-white shadow-xl">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#F97316] uppercase tracking-tight">Upload Prescription</span>
              <span className="text-[10px] font-bold text-[#F97316]/70 uppercase tracking-widest mt-0.5">Quick clinical verification</span>
            </div>
            <ChevronRight className="ml-auto w-5 h-5 text-[#F97316] opacity-40 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Communications Row */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="https://wa.me/91XXXXXXXXXX" className="flex items-center gap-3 bg-[#EBFBF5] p-5 rounded-[24px] group active:scale-95 transition-all shadow-sm overflow-hidden">
              <div className="bg-[#136A31] p-2.5 rounded-xl text-white shadow-lg shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-black text-[#136A31] uppercase leading-tight whitespace-nowrap">Order via WhatsApp</span>
            </Link>
            <Link href="tel:+91XXXXXXXXXX" className="flex items-center gap-3 bg-[#EBF4FF] p-5 rounded-[24px] group active:scale-95 transition-all shadow-sm overflow-hidden">
              <div className="bg-[#0061AF] p-2.5 rounded-xl text-white shadow-lg shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-black text-[#0061AF] uppercase leading-tight whitespace-nowrap">Call For Medicines</span>
            </Link>
          </div>
        </section>

        {/* Categories - Side Scroll */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Shop by Category</h2>
            <Link href="/search" className="text-[11px] font-black text-[#F97316] uppercase tracking-widest">See All</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-1">
            {displayCategories.map((cat: any, i) => (
              <Link key={i} href={`/search?c=${cat.name}`} className="flex flex-col items-center gap-2 group shrink-0">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden group-active:scale-90 transition-transform">
                  <Image 
                    src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/200/200`} 
                    alt={cat.name} 
                    width={96} 
                    height={96} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Best Sellers - More Compact */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Best Sellers</h2>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-full bg-white border border-gray-100 shadow-sm active:bg-gray-50"><ChevronRight className="w-4 h-4 rotate-180 text-gray-400" /></button>
              <button className="p-1.5 rounded-full bg-white border border-gray-100 shadow-sm active:bg-gray-50"><ChevronRight className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
            {displayMedicines.map((p: any) => (
              <div key={p.id} className="min-w-[140px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Free Delivery Banner */}
        <section className="bg-gradient-to-r from-[#F97316] to-[#EA580C] p-5 rounded-[24px] flex items-center gap-4 text-white shadow-xl shadow-orange-500/20 border-b-4 border-black/10">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">FREE Delivery</h3>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">On all orders above ₹1000 across India!</p>
          </div>
        </section>

        {/* Quality Medicines Card - Ultra Compact */}
        <section className="bg-gray-100/50 p-3 rounded-[24px] text-center space-y-1.5 border border-gray-200/50">
          <div className="w-8 h-8 bg-[#2E8B57]/10 text-[#2E8B57] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight leading-none">Best Quality Medicines</h2>
          <p className="text-[9px] font-bold text-gray-500 leading-normal max-w-xs mx-auto uppercase tracking-widest opacity-80">
            You deserve the best – premium medicines from India’s leading brands
          </p>
        </section>

      </main>
    </div>
  );
}
