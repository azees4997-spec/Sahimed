import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Search, FileText, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import HomeClient from '@/components/HomeClient';
import clientPromise from '@/lib/mongodb';
import HeroSearch from '@/components/HeroSearch';
import { getDbAdmin } from '@/lib/firebase-admin';
import TrustSection from '@/components/TrustSection';
import HowItWorks from '@/components/home/HowItWorks';
import SEOContent from '@/components/home/SEOContent';
import FAQSection from '@/components/home/FAQSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sahimed - Authentic Medicines & Healthcare at Best Prices',
  description: 'Buy genuine medicines online in India. Sahimed provides authentic stock, expert prescription verification, and fast delivery at affordable prices. Sahi Dawai, Sahi Daam Pe.',
  keywords: ['online pharmacy india', 'authentic medicines online', 'buy medicines bangalore', 'genuine healthcare products', 'affordable medicines india', 'prescription delivery'],
};

export const revalidate = 60; // Revalidate every minute

async function getBanners() {
  try {
    const db = getDbAdmin();
    if (!db) return [];
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

async function getProducts(filterType: 'bestSeller' | 'topSelection' | 'all' = 'all') {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const query: any = { isActive: { $ne: false } };
    
    if (filterType === 'bestSeller') {
      query.isBestSeller = { $in: [true, 'true'] };
    } else if (filterType === 'topSelection') {
      query.isTopSelection = { $in: [true, 'true'] };
    }
    
    const products = await db.collection('products')
      .find(query)
      .limit(filterType === 'all' ? 50 : 20)
      .toArray();
    
    return products.map(p => ({ ...p, id: p._id.toString() }));
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export default async function Home() {
  const [banners, categories, bestSellers, topSelections, medicines] = await Promise.all([
    getBanners(),
    getCategories(),
    getProducts('bestSeller'),
    getProducts('topSelection'),
    getProducts('all')
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
                      <span className="text-slate-800 font-black uppercase tracking-[0.1em] text-[8px] sm:text-[9px]">Trusted Quality</span>
                    </div>
                    <h1 className="text-xl sm:text-5xl font-black leading-[1.1] tracking-tighter text-slate-900 font-outfit uppercase">
                      Affordable Medicines <br/>
                      <span className="text-primary italic">for Everyday Health</span>
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
                <HeroSearch />
              </div>
 
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto w-full">
                {[
                  { label: 'Upload Rx', href: '/prescription', color: 'bg-lavender', Icon: FileText, iconColor: 'bg-primary' },
                  { 
                    label: 'WhatsApp', 
                    href: 'https://wa.me/917349499898', 
                    color: 'bg-emerald-50', 
                    Icon: (props: any) => (
                      <svg viewBox="0 0 24 24" {...props} className={cn("fill-white", props.className)}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    ), 
                    iconColor: 'bg-[#25D366]' 
                  },
                  { label: 'Order on Call', href: 'tel:+917349499898', color: 'bg-rose-50', Icon: Phone, iconColor: 'bg-rose-500' }
                ].map((action, i) => (
                  <Link key={i} href={action.href} className={cn("group p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white shadow-lg shadow-slate-200/40 flex flex-col items-center justify-center text-center gap-1 sm:gap-2 transition-all active:scale-95", action.color)}>
                    <div className={cn("w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl shadow-md", action.iconColor)}>
                      <action.Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="font-black text-[7px] sm:text-[10px] tracking-tight text-slate-900 uppercase leading-none whitespace-nowrap">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
 
        <main className="max-w-7xl mx-auto px-4 pt-0 pb-10 sm:pt-8 sm:pb-20">
          <HomeClient 
            banners={banners}
            categories={categories}
            bestSellers={bestSellers}
            topSelections={topSelections}
            medicines={medicines}
          />

          <HowItWorks />
          
          <TrustSection />

          <SEOContent />

          <FAQSection />
        </main>
      </div>
    </PageTransition>
  );
}