import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ShieldCheck, FileText, Phone, Truck, Star, Zap } from 'lucide-react';
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
  title: 'Sahimed — Sahi Dawai, Sahi Daam Pe | Up to 61% OFF on Medicines',
  description: 'Buy 100% genuine medicines online in India at up to 61% off MRP. Sahimed is a licensed pharmacy with expert prescription verification, fast delivery, and certified authentic stock. Sahi Dawai, Sahi Daam Pe.',
  keywords: ['online pharmacy india', 'authentic medicines', 'buy medicines bangalore', 'affordable medicines', 'prescription delivery', '61% off medicines', 'generic medicines india'],
  alternates: { canonical: 'https://sahimed.com' },
};

export const revalidate = 60;

async function getBanners() {
  try {
    const db = getDbAdmin();
    if (!db) return [];
    const snapshot = await db.collection('banners').where('isActive', '==', true).orderBy('order', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch { return []; }
}

async function getCategories() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const categories = await db.collection('Category Master').find({ showOnHomepage: true }).sort({ category: 1 }).toArray();
    return categories.map(c => ({ ...c, id: c._id.toString(), name: c.category, imageUrl: c.imageUrl }));
  } catch {
    return CATEGORIES.map((cat, idx) => ({ id: `fallback-cat-${idx}`, name: cat.name, imageUrl: cat.imageUrl, description: cat.description }));
  }
}

async function getProducts(filterType: 'bestSeller' | 'topSelection' | 'all' = 'all') {
  const limitValue = filterType === 'all' ? 50 : 20;
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const query: any = { isActive: { $ne: false } };
    if (filterType === 'bestSeller') query.isBestSeller = { $in: [true, 'true'] };
    else if (filterType === 'topSelection') query.isTopSelection = { $in: [true, 'true'] };
    const products = await db.collection('products').find(query).limit(limitValue).toArray();
    return products.map(p => ({ ...p, id: p._id.toString() }));
  } catch {
    const fallback = PRODUCTS.map((p, idx) => ({ ...p, _id: p.id || `fp-${idx}`, id: p.id || `fp-${idx}` }));
    if (filterType === 'bestSeller') return fallback.slice(0, 10);
    if (filterType === 'topSelection') return fallback.slice(0, 10);
    return fallback;
  }
}

import MegaCategoryRibbon from '@/components/MegaCategoryRibbon';

export default async function Home() {
  const [banners, categories, bestSellers, topSelections, medicines] = await Promise.all([
    getBanners(), getCategories(), getProducts('bestSeller'), getProducts('topSelection'), getProducts('all')
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [
      { "question": "Are medicines 100% authentic?", "acceptedAnswer": { "type": "Answer", "text": "Yes. Every product is sourced directly from licensed manufacturers. We have a strict quality-check protocol ensuring only genuine, unexpired medicines reach you." } },
      { "question": "Is a prescription required?", "acceptedAnswer": { "type": "Answer", "text": "For Rx medicines, a valid prescription is mandatory. Upload a photo during checkout. Our certified pharmacists verify every prescription for your safety." } },
      { "question": "How long does delivery take?", "acceptedAnswer": { "type": "Answer", "text": "24-48 hours in major cities. 3-5 days for other regions. All orders are tracked in real time." } },
      { "question": "Can I order via WhatsApp?", "acceptedAnswer": { "type": "Answer", "text": "Yes! WhatsApp +91 7349499898 with your prescription photo. Our team replies within 5 minutes." } },
      { "question": "Why is Sahimed so affordable?", "acceptedAnswer": { "type": "Answer", "text": "We cut intermediaries, source directly from manufacturers, and pass savings directly to you — up to 61% off MRP on branded generics." } },
    ].map(faq => ({ "@type": "Question", "name": faq.question, "acceptedAnswer": { "@type": "Answer", "text": faq.acceptedAnswer.text } }))
  };

  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <MegaCategoryRibbon />

        {/* ══════════════════════════════════════════════════
            FULL-BLEED HERO — lives outside padded main
        ══════════════════════════════════════════════════ */}
        <section className="w-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #fdf6ff 0%, #fff0f7 35%, #f0fffe 70%, #fffbeb 100%)' }}>
          {/* Decorative blobs — absolutely positioned inside the section */}
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #d8b4fe, #a78bfa)' }} />
          <div className="absolute -bottom-12 -right-8 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #6ee7b7, #34d399)' }} />
          <div className="absolute top-8 right-1/3 w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, #fda4af, #fb7185)' }} />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-0 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

              {/* Left: Wording (Compact & Sleek) */}
              <div className="space-y-3 text-center md:text-left max-w-xl pb-4 sm:pb-6">
                {/* Label pill */}
                <span className="inline-flex items-center gap-2 text-[10.5px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border shadow-sm"
                  style={{ background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.4)', color: '#7c3aed' }}
                >
                  🏥 India&apos;s Trusted Pharmacy
                </span>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-slate-900">
                  Switch to Branded{' '}
                  <span style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Generics</span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Same formula as branded drugs — certified quality, verified by pharmacists, delivered fast.
                </p>

                {/* 3 Checkmark Bullets */}
                <div className="space-y-2">
                  {[
                    { text: 'Trusted by thousands of customers', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
                    { text: 'WHO & FDA Certified', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
                    { text: 'Save upto 60% on MRP', color: '#db2777', bg: 'rgba(219,39,119,0.12)' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center justify-center md:justify-start gap-2.5">
                      <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center font-black text-[11px] shrink-0"
                        style={{ background: b.bg, color: b.color, border: `1.5px solid ${b.color}40` }}
                      >
                        ✓
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap pt-0.5">
                  <Link
                    href="/search"
                    className="px-6 py-2.5 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-105 transition-all duration-200 flex items-center gap-1.5 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}
                  >
                    Shop Now →
                  </Link>
                  <Link
                    href="/prescription"
                    className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-purple-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
                  >
                    Upload Rx
                  </Link>
                </div>

                {/* Mini stats */}
                <div className="flex items-center justify-center md:justify-start gap-4 pt-0.5">
                  {[
                    { val: '10K+', label: 'Customers' },
                    { val: '4.8★', label: 'Rating' },
                    { val: '60%', label: 'Max Savings' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <p className="text-sm sm:text-base font-black" style={{ color: '#7c3aed' }}>{s.val}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                      {i < 2 && <div className="w-px h-3.5 bg-slate-200 ml-1.5" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Sleek Doctor Cutout PNG (Compact 320px height, bottom flush) */}
              <div className="relative shrink-0 w-56 sm:w-72 md:w-[320px] lg:w-[360px] h-[230px] sm:h-[290px] lg:h-[320px] flex items-end justify-center md:ml-auto self-end">
                {/* Clean transparent PNG cutout — sits directly flush on the bottom line */}
                <img
                  src="/images/doctor_transparent.png"
                  alt="SahiMed Certified Doctor"
                  className="relative z-10 w-full h-full object-contain object-bottom pointer-events-none"
                />
                {/* Badge: savings */}
                <div className="absolute top-2 left-0 sm:-left-3 z-20 flex items-center gap-2 bg-white/95 rounded-2xl px-3 py-1.5 shadow-md border border-pink-100/80">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0" style={{ background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)' }}>💊</div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Save upto</p>
                    <p className="text-[11px] font-black" style={{ color: '#db2777' }}>60% OFF MRP</p>
                  </div>
                </div>
                {/* Badge: certified */}
                <div className="absolute bottom-4 right-0 sm:-right-3 z-20 flex items-center gap-2 bg-white/95 rounded-2xl px-3 py-1.5 shadow-md border border-purple-100/80">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>🏅</div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Certified by</p>
                    <p className="text-[11px] font-black" style={{ color: '#7c3aed' }}>WHO & FDA</p>
                  </div>
                </div>
              </div>
          </div>

          {/* Trust ticker */}
          <div className="w-full overflow-hidden py-2.5 border-t" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(167,139,250,0.2)' }}>
            <div className="flex animate-marquee w-max">
              {[
                { icon: '✅', text: 'Trusted by Thousands' },
                { icon: '🏅', text: 'WHO & FDA Certified' },
                { icon: '💊', text: 'Save upto 60% on MRP' },
                { icon: '🚚', text: 'Free Delivery ₹499+' },
                { icon: '🏥', text: 'Licensed Pharmacy KA-B51' },
                { icon: '⭐', text: '4.8 Star Rating' },
                { icon: '📦', text: '50,000+ Medicines' },
                { icon: '⚡', text: '24hr Express Delivery' },
                { icon: '✅', text: 'Trusted by Thousands' },
                { icon: '🏅', text: 'WHO & FDA Certified' },
                { icon: '💊', text: 'Save upto 60% on MRP' },
                { icon: '🚚', text: 'Free Delivery ₹499+' },
                { icon: '🏥', text: 'Licensed Pharmacy KA-B51' },
                { icon: '⭐', text: '4.8 Star Rating' },
                { icon: '📦', text: '50,000+ Medicines' },
                { icon: '⚡', text: '24hr Express Delivery' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 mx-5 shrink-0">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{item.text}</span>
                  <span className="text-slate-300 ml-1">·</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            MAIN CONTENT (HomeClient handles everything below)
        ══════════════════════════════════════════════════ */}
        <main className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-10 md:pt-8 md:pb-16">
          <HomeClient
            banners={banners}
            categories={categories}
            bestSellers={bestSellers}
            topSelections={topSelections}
            medicines={medicines}
          />
          <HowItWorks />
          <TrustSection />
          <FAQSection />
          <FinalCTA />
          <SEOContent />
        </main>
      </div>
    </PageTransition>
  );
}

// ─── Announcement Bar ─────────────────────────────────────────────────────────
function AnnouncementBar() {
  return (
    <div className="w-full bg-gradient-to-r from-primary via-teal-500 to-primary overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {[
          '🎉 New Users: Extra 10% OFF — Use code SAHI10',
          '🚚 FREE delivery on orders above ₹499',
          '💊 Up to 61% OFF on branded generics',
          '⭐ 4.8★ rated on Google — 1 Lakh+ happy patients',
          '🏥 Licensed Pharmacy — Drug License KA-B51-286602',
          '📱 Order via WhatsApp: +91 73494 99898',
        ].concat([
          '🎉 New Users: Extra 10% OFF — Use code SAHI10',
          '🚚 FREE delivery on orders above ₹499',
          '💊 Up to 61% OFF on branded generics',
          '⭐ 4.8★ rated on Google — 1 Lakh+ happy patients',
          '🏥 Licensed Pharmacy — Drug License KA-B51-286602',
          '📱 Order via WhatsApp: +91 73494 99898',
        ]).map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-[11px] font-bold text-white shrink-0">
            {item}
            <span className="text-white/30 mx-1">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white border-b border-slate-100">
      {/* Split background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#eefbf9] via-white to-[#f5f0ff] opacity-60" />
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-violet-400/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-rose-400/5 rounded-full blur-3xl" />
        {/* Floating pill shapes */}
        <div className="hidden lg:block absolute top-8 right-[38%] w-3 h-8 bg-primary/20 rounded-full rotate-45" />
        <div className="hidden lg:block absolute bottom-10 right-[42%] w-2 h-6 bg-violet-400/20 rounded-full -rotate-12" />
        <div className="hidden lg:block absolute top-16 right-[45%] w-4 h-4 bg-rose-400/15 rounded-full" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-7 sm:py-10 md:py-12">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">

          {/* ─── LEFT: Main Copy ──────────────────────────────── */}
          <div className="flex-1 space-y-5 text-center lg:text-left w-full">

            {/* Top badge row */}
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-700">
                <ShieldCheck className="w-3 h-3" /> 100% Authentic
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-black uppercase tracking-widest text-amber-700">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.8★ Google Rated
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-[11px] font-black uppercase tracking-widest text-violet-700">
                <Zap className="w-3 h-3 fill-violet-500 text-violet-500" /> Licensed Pharmacy
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <p className="text-[11px] sm:text-xs font-black text-primary uppercase tracking-[0.2em]">Sahi Dawai · Sahi Daam Pe</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight text-slate-900">
                India's Most<br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600">Affordable</span>
                </span>{' '}
                <span className="text-slate-900">Pharmacy</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 pt-1 leading-relaxed">
                Genuine medicines delivered to your door at up to{' '}
                <strong className="text-rose-500 font-black">61% OFF MRP</strong>.
                Expert pharmacist-verified prescriptions. Pan-India shipping.
              </p>
            </div>

            {/* Search bar — BIG and prominent */}
            <div className="w-full max-w-2xl mx-auto lg:mx-0">
              <HeroSearch />
            </div>

            {/* Social proof stats */}
            <div className="flex items-center gap-4 justify-center lg:justify-start flex-wrap">
              {[
                { val: '50,000+', label: 'Medicines', color: 'text-primary' },
                { val: '1 Lakh+', label: 'Customers', color: 'text-violet-600' },
                { val: '24hr', label: 'Delivery', color: 'text-emerald-600' },
                { val: '61%', label: 'Max OFF', color: 'text-rose-500' },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="w-px h-5 bg-slate-200" />}
                  <div className="text-center lg:text-left">
                    <div className={cn("text-base sm:text-lg font-black leading-none", s.color)}>{s.val}</div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 justify-center lg:justify-start flex-wrap">
              <Link href="/prescription" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25">
                <FileText className="w-3.5 h-3.5" /> Upload Prescription
              </Link>
              <Link href="https://wa.me/917349499898?text=Hi%2C%20I%20want%20to%20order%20medicines" target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#22c55e] transition-all active:scale-95 shadow-lg shadow-[#25D366]/25">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Order on WhatsApp
              </Link>
              <Link href="tel:+917349499898" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95">
                <Phone className="w-3.5 h-3.5" /> Call Us
              </Link>
            </div>
          </div>

          {/* ─── RIGHT: Visual Panel ──────────────────────────── */}
          <div className="w-full lg:w-[340px] xl:w-[380px] flex flex-col gap-3 shrink-0">

            {/* Main savings card */}
            <div className="relative bg-gradient-to-br from-primary to-teal-600 rounded-2xl sm:rounded-3xl p-6 text-white overflow-hidden shadow-2xl shadow-primary/30">
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-teal-300/20 rounded-full blur-xl" />
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/5 rounded-full" />

              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Save on Every Order</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-6xl sm:text-7xl font-black leading-none text-white">61</span>
                  <div className="pb-2">
                    <div className="text-2xl font-black text-white/80 leading-none">%</div>
                    <div className="text-sm font-bold text-white/70">OFF</div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-white/70 mb-4">on branded generic medicines vs MRP</p>

                {/* Inline mini stats */}
                <div className="flex items-center gap-3 mb-4">
                  {[
                    { v: '50K+', l: 'SKUs' },
                    { v: '1L+', l: 'Patients' },
                    { v: '24hr', l: 'Delivery' },
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <div className="w-px h-5 bg-white/20" />}
                      <div>
                        <div className="text-sm font-black text-white">{s.v}</div>
                        <div className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{s.l}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <Link href="/search" className="flex items-center justify-between bg-white hover:bg-white/95 text-primary px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-primary/20">
                  <span>Shop Now & Save Big</span>
                  <span className="text-lg leading-none">→</span>
                </Link>
              </div>
            </div>

            {/* ── 3 Trust Mini Cards ── */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: '🏥', val: 'Licensed', sub: 'Pharmacy', border: 'border-emerald-100', bg: 'bg-emerald-50' },
                { icon: '💊', val: '100%', sub: 'Genuine', border: 'border-blue-100', bg: 'bg-blue-50' },
                { icon: '🚚', val: 'Free', sub: 'Delivery ₹499+', border: 'border-amber-100', bg: 'bg-amber-50' },
              ].map((c, i) => (
                <div key={i} className={cn("rounded-xl border p-2.5 text-center", c.bg, c.border)}>
                  <div className="text-xl mb-0.5">{c.icon}</div>
                  <div className="text-[11px] font-black text-slate-800 leading-none">{c.val}</div>
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Express Delivery ── */}
            <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Express Delivery Available</p>
                <p className="text-[10px] font-medium text-slate-400">Bangalore, Mumbai, Delhi & 500+ cities</p>
              </div>
              <div className="ml-auto bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">24hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA (above footer) ─────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="my-10 sm:my-16 rounded-2xl sm:rounded-3xl overflow-hidden relative bg-gradient-to-br from-[#eefbf9] via-white to-[#f0f0ff] border border-primary/15 p-8 sm:p-14 text-center">
      {/* Soft blobs */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary">
          🎉 Start Saving Today
        </div>
        <h2 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight text-slate-900">
          Sahi Dawai, <span className="text-primary">Sahi Daam Pe</span><br className="hidden sm:block" /> — For Every Indian Family
        </h2>
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          Join over 1 Lakh patients who switched to Sahimed for genuine, certified, affordable medicines.
        </p>

        {/* Trust pills */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {[
            { icon: '✅', text: 'Certified Medicines' },
            { icon: '📅', text: 'Long Expiry' },
            { icon: '🔒', text: 'Secure Payment' },
            { icon: '🚚', text: 'Free Delivery ₹499+' },
          ].map((t) => (
            <span key={t.text} className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
              {t.icon} {t.text}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 justify-center flex-wrap pt-2">
          <Link href="/search" className="bg-primary text-white px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25">
            Browse Medicines →
          </Link>
          <Link href="https://wa.me/917349499898" target="_blank" className="border-2 border-[#25D366] text-[#25D366] bg-white px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-[#f0fdf4] transition-all active:scale-95 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            WhatsApp Order
          </Link>
        </div>
      </div>
    </section>
  );
}