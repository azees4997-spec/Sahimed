
"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { MessageCircle, ShieldCheck, ChevronRight, Truck, Phone, FileText, Star, TrendingDown, Dna, ShieldPlus, FlaskConical, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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

  const { data: medicines, isLoading: isMedsLoading } = useCollection(medicinesQuery);
  const { data: categories, isLoading: isCatsLoading } = useCollection(categoriesQuery);

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
          <div className="absolute right-[-30px] bottom-[-30px] opacity-10 rotate-12">
            <ShieldCheck size={220} className="text-white" strokeWidth={1} />
          </div>
        </section>

        {/* Action Stack */}
        <section className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <Link href="https://wa.me/91XXXXXXXXXX" className="flex items-center gap-2 sm:gap-3 bg-[#EBFBF5] p-3 sm:p-5 rounded-[24px] group active:scale-95 transition-all shadow-sm overflow-hidden">
              <div className="bg-[#136A31] p-2 rounded-xl text-white shadow-lg shrink-0">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-[15px] font-black text-[#136A31] uppercase leading-tight whitespace-nowrap">Order via WhatsApp</span>
            </Link>
            <Link href="tel:+91XXXXXXXXXX" className="flex items-center gap-2 sm:gap-3 bg-[#EBF4FF] p-3 sm:p-5 rounded-[24px] group active:scale-95 transition-all shadow-sm overflow-hidden">
              <div className="bg-[#0061AF] p-2 rounded-xl text-white shadow-lg shrink-0">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-[15px] font-black text-[#0061AF] uppercase leading-tight whitespace-nowrap">Call For Medicines</span>
            </Link>
          </div>
        </section>

        {/* Categories - Side Scroll */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Shop by Category</h2>
            <Link href="/categories" className="text-[11px] font-black text-[#F97316] uppercase tracking-widest">See All</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-1">
            {isCatsLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="w-24 h-24 rounded-full shrink-0" />)
            ) : categories?.map((cat: any, i) => (
              <Link key={i} href={`/search?c=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2 group shrink-0">
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

        {/* Substitutes Information Section */}
        <section className="rounded-[32px] border border-[#DCFCE7] shadow-sm overflow-hidden flex flex-col md:flex-row items-stretch">
          <div className="md:w-1/3 relative min-h-[90px] bg-gradient-to-br from-[#136A31] to-[#2E8B57] overflow-hidden">
            <div className="absolute inset-0 p-4 flex flex-col justify-center">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-white/80 uppercase tracking-[0.2em]">Save Upto</p>
                <h2 className="text-3xl font-black text-white tracking-tighter leading-none">60%</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-[#136A31] rounded-full" />
                  </div>
                  <p className="text-[7px] font-black text-white uppercase tracking-widest">Clinical Substitutes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 p-5 sm:p-6 flex flex-col justify-center bg-white">
            <div className="mb-5">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">
                Smarter clinical choice
              </h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Switch to high-quality generics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-green-100">
                  <ShieldPlus className="w-5 h-5 text-[#136A31]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Safe</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">GMP & FDA certified medicines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-green-100">
                  <FlaskConical className="w-5 h-5 text-[#136A31]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Identical</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">Same composition & strength</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-green-100">
                  <Zap className="w-5 h-5 text-[#F97316] fill-current" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Savings</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">Upto 60% OFF</p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 p-3 rounded-[16px] flex items-center gap-3 border border-green-100/50 shadow-sm">
               <Star className="w-3.5 h-3.5 text-[#EAB308] fill-current shrink-0" />
               <p className="text-[9px] font-black text-gray-700 uppercase tracking-tight leading-none">
                 Quality assured: <span className="text-[#136A31]">All substitutes are manufactured from India's leading manufacturers.</span>
               </p>
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Best Sellers</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1">
            {isMedsLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="min-w-[140px] aspect-[2/3] rounded-[16px]" />)
            ) : medicines?.map((p: any) => (
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

        {/* Quality Medicines Card */}
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
