import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ShieldCheck, FileText, Phone } from 'lucide-react';
import Link from 'next/link';
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
    const categories = await db.collection('Category Master')
      .find({ showOnHomepage: true })
      .sort({ category: 1 })
      .toArray();
    return categories.map(c => ({
      ...c,
      id: c._id.toString(),
      name: c.category, // Map category to name for backwards compatibility
      imageUrl: c.imageUrl
    }));
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
        
        {/* ─── Compact Pro Hero ─── */}
        <section className="relative w-full bg-gradient-to-r from-[#f0f7ff] via-white to-[#fff5f7] border-b border-slate-100 overflow-hidden">
          {/* subtle background rings */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-rose-400/5 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 py-5 md:py-7">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">

              {/* LEFT: Copy */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                {/* Trust badge row */}
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    <ShieldCheck className="w-3 h-3" /> 100% Authentic
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                    Expert Rx Verified
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900">
                  India's Most Affordable<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">Online Pharmacy</span>
                </h1>

                {/* Sub-headline */}
                <p className="text-slate-500 text-sm max-w-md mx-auto md:mx-0 leading-relaxed">
                  Sahi Dawai, Sahi Daam Pe — Genuine medicines at up to <strong className="text-rose-500 font-black">61% off</strong> MRP. Fast delivery, pharmacist-verified prescriptions.
                </p>

                {/* Search */}
                <div className="w-full max-w-xl mx-auto md:mx-0">
                  <HeroSearch />
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap pt-1">
                  {[
                    { label: 'Upload Rx', href: '/prescription', Icon: FileText, color: 'text-primary bg-primary/5 hover:bg-primary/10 border-primary/20' },
                    { 
                      label: 'WhatsApp', href: 'https://wa.me/917349499898', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100',
                      Icon: (props: any) => (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" {...props}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      )
                    },
                    { label: 'Call Us', href: 'tel:+917349499898', Icon: Phone, color: 'text-rose-500 bg-rose-50 hover:bg-rose-100 border-rose-100' },
                  ].map((a, i) => (
                    <Link key={i} href={a.href} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all", a.color)}>
                      <a.Icon className="w-3.5 h-3.5" />
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* RIGHT: Savings Card + Stats */}
              <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto md:min-w-[280px]">
                {/* Big savings banner */}
                <div className="relative bg-gradient-to-br from-primary to-violet-600 rounded-2xl p-5 text-white overflow-hidden shadow-xl shadow-primary/20">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Save on every order</p>
                  <div className="text-5xl font-black leading-none">61%</div>
                  <div className="text-sm font-bold text-white/90 mt-1">OFF on branded generics</div>
                  <Link href="/search" className="mt-3 flex items-center gap-1.5 bg-white text-primary px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest w-fit hover:bg-white/90 transition-all active:scale-95 shadow-lg">
                    Shop Now <span className="text-base leading-none">→</span>
                  </Link>
                </div>

                {/* Mini trust stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '50K+', label: 'Medicines', color: 'text-primary' },
                    { val: '24hr', label: 'Delivery', color: 'text-violet-500' },
                    { val: '4.8★', label: 'Rating', color: 'text-amber-500' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-slate-100">
                      <div className={cn("text-lg font-black leading-none", s.color)}>{s.val}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
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