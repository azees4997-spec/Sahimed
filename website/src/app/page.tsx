import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Search, FileText, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import HomeClient from '@/components/HomeClient';
import clientPromise from '@/lib/mongodb';
import { getDbAdmin } from '@/lib/firebase-admin';

export const revalidate = 60; // Revalidate every minute

async function getBanners() {
  try {
    const db = getDbAdmin();
    const snapshot = await db.collection('banners')
      .where('isActive', '==', true)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Failed to fetch banners:", err);
    return [];
  }
}

async function getCategories() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const categories = await db.collection('categories')
      .find({})
      .sort({ name: 1 })
      .limit(12)
      .toArray();
    return categories.map(c => ({ ...c, id: c._id.toString() }));
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    return [];
  }
}

async function getProducts(isBestSeller = false) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const query: any = {};
    if (isBestSeller) {
      query.isBestSeller = { $in: [true, 'true'] };
    }
    
    const products = await db.collection('products')
      .find(query)
      .limit(isBestSeller ? 20 : 50)
      .toArray();
    
    return products.map(p => ({ ...p, id: p._id.toString() }));
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export default async function Home() {
  const [banners, categories, bestSellers, medicines] = await Promise.all([
    getBanners(),
    getCategories(),
    getProducts(true),
    getProducts(false)
  ]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        
        {/* Mega Banner Hero Section */}
        <section className="relative w-full bg-[#FFF9F9] overflow-hidden pb-4 sm:pb-10 pt-2 sm:pt-8 border-b border-rose-50/50">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-100/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col gap-4 sm:gap-6">
              
              <div className="flex items-center justify-between gap-4 sm:gap-8">
                <div className="flex-1 space-y-2 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 w-fit shrink-0">
                      <div className="w-3 h-3 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-2 h-2 text-white" />
                      </div>
                      <span className="text-slate-800 font-black uppercase tracking-[0.1em] text-[8px] sm:text-[9px]">Trusted by 10L+ users</span>
                    </div>
                    <h1 className="text-xl sm:text-5xl font-black leading-[1.1] tracking-tighter text-slate-900 font-outfit uppercase">
                      Affordable <br/>
                      Solutions for <br/>
                      <span className="text-primary italic">Everyday Care</span>
                    </h1>
                  </div>
                </div>
 
                <div className="w-1/3 sm:w-1/4 flex justify-end">
                  <div className="relative w-full aspect-square max-w-[120px] sm:max-w-[280px] rounded-xl sm:rounded-[32px] border-[4px] sm:border-[8px] border-white shadow-2xl overflow-hidden bg-white">
                    <Image 
                      src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
                      alt="Healthcare Professional" 
                      fill
                      priority
                      className="object-cover object-top" 
                    />
                  </div>
                </div>
              </div>
 
              <div className="w-full max-w-2xl mx-auto">
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-search'))}
                  className="block w-full group"
                >
                  <div 
                    className="w-full bg-white text-slate-900 rounded-full p-0.5 sm:p-1 shadow-xl shadow-slate-200/50 flex items-center border border-slate-100 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    <div className="flex-1 px-4 sm:px-5 text-left text-[10px] sm:text-[13px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Search Medicines...
                    </div>
                    <div className="bg-primary p-2 sm:p-3 rounded-full shadow-lg shadow-primary/20">
                      <Search className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" />
                    </div>
                  </div>
                </button>
              </div>
 
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto w-full">
                {[
                  { label: 'Upload Rx', href: '/prescription', color: 'bg-lavender', icon: FileText, iconColor: 'bg-primary' },
                  { label: 'WhatsApp', href: 'https://wa.me/917349499898', color: 'bg-green-50', icon: MessageCircle, iconColor: 'bg-[#25D366]' },
                  { label: 'Order on Call', href: 'tel:+917349499898', color: 'bg-sahi-pink', icon: Phone, iconColor: 'bg-rose-500' }
                ].map((action, i) => (
                  <Link key={i} href={action.href} className={cn("group p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white shadow-lg shadow-slate-200/40 flex flex-col items-center justify-center text-center gap-1 sm:gap-2 transition-all active:scale-95", action.color)}>
                    <div className={cn("w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl shadow-md", action.iconColor)}>
                      <action.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="font-black text-[7px] sm:text-[10px] tracking-tight text-slate-900 uppercase leading-none whitespace-nowrap">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
 
        <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <HomeClient 
            banners={banners}
            categories={categories}
            bestSellers={bestSellers}
            medicines={medicines}
          />
        </main>
      </div>
    </PageTransition>
  );
}