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
import { PRODUCTS, CATEGORIES } from '@/lib/data';


export const metadata: Metadata = {
  title: 'Sahimed - Authentic Medicines & Healthcare at Best Prices',
  description: 'Buy genuine medicines online in India. Sahimed provides authentic stock, expert prescription verification, and fast delivery at affordable prices. Sahi Dawai, Sahi Daam Pe.',
  keywords: ['online pharmacy india', 'authentic medicines online', 'buy medicines bangalore', 'genuine healthcare products', 'affordable medicines india', 'prescription delivery'],
  alternates: {
    canonical: 'https://sahimed.com',
  },
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
    console.error("Failed to fetch categories from MongoDB, falling back to static data...", err);
    return CATEGORIES.map((cat, idx) => ({
      id: `fallback-cat-${idx}`,
      name: cat.name,
      imageUrl: cat.imageUrl,
      description: cat.description
    }));
  }
}

async function getProducts(filterType: 'bestSeller' | 'topSelection' | 'all' = 'all') {
  const limitValue = filterType === 'all' ? 50 : 20;
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
      .limit(limitValue)
      .toArray();
    
    return products.map(p => ({ ...p, id: p._id.toString() }));
  } catch (err) {
    console.error(`Failed to fetch products (${filterType}) from MongoDB, falling back to static data...`, err);
    let fallback = PRODUCTS.map((p, idx) => ({ ...p, _id: p.id || `fallback-prod-${idx}`, id: p.id || `fallback-prod-${idx}` }));
    if (filterType === 'bestSeller') {
      return fallback.slice(0, 10);
    } else if (filterType === 'topSelection') {
      return fallback.slice(0, 10);
    }
    return fallback;
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "question": "Are the medicines sold 100% authentic?",
        "acceptedAnswer": {
          "type": "Answer",
          "text": "Yes, absolutely. Every product on Sahimed is sourced directly from licensed pharmaceutical manufacturers or their authorized distributors. We have a strict quality-check protocol to ensure that only genuine, unexpired medicines reach your doorstep."
        }
      },
      {
        "question": "Is a prescription required for medicines?",
        "acceptedAnswer": {
          "type": "Answer",
          "text": "For all prescription-only (Rx) medicines, a valid prescription from a registered medical practitioner is mandatory. You can easily upload a photo or PDF of your prescription during checkout. Our certified pharmacists verify every prescription for your safety."
        }
      },
      {
        "question": "How long does delivery usually take?",
        "acceptedAnswer": {
          "type": "Answer",
          "text": "We offer fast and safe delivery across India. Delivery times typically range from 24-48 hours in major cities like Bangalore, Mumbai, and Delhi, and 3-5 days for other regions. We focus on ensuring the medicines are transported safely and securely."
        }
      },
      {
        "question": "Can I order via WhatsApp or phone call?",
        "acceptedAnswer": {
          "type": "Answer",
          "text": "Yes! We understand that some customers prefer a more personal touch. You can reach out to our team at +91 7349499898 via WhatsApp or call us to place your order directly. Our experts will help you with the process."
        }
      },
      {
        "question": "Why are Sahimed's prices so affordable?",
        "acceptedAnswer": {
          "type": "Answer",
          "text": "Our motto is 'Sahi Dawai, Sahi Daam Pe'. We achieve this by optimizing our supply chain, removing unnecessary intermediaries, and passing those savings directly to you. We aim to make chronic healthcare affordable for every Indian household."
        }
      }
    ].map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.acceptedAnswer.text
      }
    }))
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        
        {/* Premium Dark Hero Section */}
        <section className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden pb-8 md:pb-16 pt-6 md:pt-12 border-b border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -translate-y-1/3 translate-x-1/3 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-[80px] pointer-events-none" />
          
          {/* Floating Molecules / DNA */}
          <div className="absolute top-10 left-10 opacity-20 -rotate-12 pointer-events-none hidden md:block">
            <svg viewBox="0 0 40 60" fill="none" className="w-24 h-36">
              <path d="M8 4 Q20 15 32 4" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M8 14 Q20 25 32 14" stroke="#6ee7b7" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M8 24 Q20 35 32 24" stroke="#f472b6" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M8 34 Q20 45 32 34" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col gap-8 md:gap-12">
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="flex-1 space-y-5 md:space-y-6 text-center md:text-left w-full">
                  <div className="space-y-3">
                    <div className="mx-auto md:mx-0 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit shrink-0 shadow-xl">
                      <div className="w-4 h-4 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/30">
                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-white/90 font-black uppercase tracking-[0.15em] text-[9px] sm:text-[10px]">Verified Authentic</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white font-outfit uppercase">
                      Genuine Medicines <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 italic">Delivered Fast</span>
                    </h1>
                    <p className="text-slate-300 font-medium text-sm md:text-base max-w-lg mx-auto md:mx-0 pt-2">
                      Sahi Dawai, Sahi Daam Pe. Experience India's most trusted online pharmacy with expert pharmacist verification.
                    </p>
                  </div>
                  
                  <div className="w-full max-w-xl mx-auto md:mx-0 pt-2">
                    <HeroSearch />
                  </div>
                </div>
 
                <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 flex justify-center md:justify-end">
                  <div className="relative w-full aspect-square max-w-[240px] md:max-w-[300px] rounded-[32px] border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-white/5 backdrop-blur-sm p-4 transform rotate-3 hover:rotate-0 transition-transform duration-700">
                    <div className="relative w-full h-full rounded-[24px] overflow-hidden">
                      <Image 
                        src="https://images.unsplash.com/photo-1584308666744-24d5e4785b46?q=80&w=2070&auto=format&fit=crop" 
                        alt="Authentic Medicines" 
                        fill
                        priority
                        className="object-cover object-center" 
                      />
                    </div>
                    {/* Floating badge */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 flex items-center gap-3 border border-white/50 animate-bounce">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Package className="w-5 h-5 text-white"/></div>
                      <div className="pr-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Express</p><p className="text-xs font-black text-slate-800">Delivery</p></div>
                    </div>
                  </div>
                </div>
              </div>
 
              <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto md:mx-0 w-full pt-4">
                {[
                  { label: 'Upload Rx', href: '/prescription', color: 'bg-white/10 backdrop-blur-md border-white/20', Icon: FileText, iconColor: 'bg-gradient-to-br from-primary to-primary/80' },
                  { 
                    label: 'WhatsApp', 
                    href: 'https://wa.me/917349499898', 
                    color: 'bg-white/10 backdrop-blur-md border-white/20', 
                    Icon: (props: any) => (
                      <svg viewBox="0 0 24 24" {...props} className={cn("fill-white", props.className)}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    ), 
                    iconColor: 'bg-[#25D366] shadow-lg shadow-[#25D366]/30' 
                  },
                  { label: 'Order on Call', href: 'tel:+917349499898', color: 'bg-white/10 backdrop-blur-md border-white/20', Icon: Phone, iconColor: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30' }
                ].map((action, i) => (
                  <Link key={i} href={action.href} className={cn("group p-3 md:p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-all hover:bg-white/20 active:scale-95", action.color)}>
                    <div className={cn("w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl", action.iconColor)}>
                      <action.Icon className="w-4.5 h-4.5 md:w-5 md:h-5 text-white" />
                    </div>
                    <span className="font-bold text-[8px] md:text-[10px] tracking-wider text-white uppercase leading-none whitespace-nowrap">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
 
        <main className="max-w-7xl mx-auto px-4 pt-0 pb-10 md:pt-4 md:pb-12">
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