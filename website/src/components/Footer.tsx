"use client"

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SahiMedLogo from './SahiMedLogo';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Instagram, 
  Twitter, 
  Linkedin,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// [COST FIX] Footer no longer holds a Firestore snapshot listener.
import { useState, useEffect } from 'react';

const DEFAULT_FOOTER_PAGES = [
  { id: 'about-us', title: 'About Us', placement: 'footer' },
  { id: 'privacy-policy', title: 'Privacy Policy', placement: 'footer' },
  { id: 'terms-conditions', title: 'Terms & Conditions', placement: 'footer' },
  { id: 'shipping-policy', title: 'Shipping Policy', placement: 'footer' },
  { id: 'refund-policy', title: 'Return & Refund Policy', placement: 'footer' },
  { id: 'prescription-policy', title: 'Prescription Policy', placement: 'footer' },
  { id: 'editorial-policy', title: 'Editorial Policy', placement: 'footer' },
  { id: 'contact-us', title: 'Contact Us', placement: 'footer' },
];

// Module-level session cache — fetched only ONCE per browser session, not on every page render
let _footerPagesCache: any[] | null = null;
let _footerPagesFetching = false;
let _footerPagesCallbacks: Array<(pages: any[]) => void> = [];

function fetchFooterPages(): Promise<any[]> {
  // Already cached — return immediately
  if (_footerPagesCache !== null) return Promise.resolve(_footerPagesCache);
  // Already in-flight — queue this caller
  if (_footerPagesFetching) {
    return new Promise(resolve => { _footerPagesCallbacks.push(resolve); });
  }
  _footerPagesFetching = true;
  return fetch('/api/pages')
    .then(res => res.ok ? res.json() : [])
    .then(data => {
      const pages = Array.isArray(data) && data.length > 0 ? data : DEFAULT_FOOTER_PAGES;
      _footerPagesCache = pages;
      _footerPagesFetching = false;
      _footerPagesCallbacks.forEach(cb => cb(pages));
      _footerPagesCallbacks = [];
      return pages;
    })
    .catch(() => {
      _footerPagesFetching = false;
      return DEFAULT_FOOTER_PAGES;
    });
}

export default function Footer({ initialPages = [] }: { initialPages?: any[] }) {
  const pathname = usePathname();
  const [pages, setPages] = useState<any[]>(initialPages.length > 0 ? initialPages : DEFAULT_FOOTER_PAGES);

  useEffect(() => {
    // Only fetch if not already cached (runs once per session)
    fetchFooterPages().then(data => {
      if (Array.isArray(data) && data.length > 0) setPages(data);
    });
  }, []);

  const footerPages = pages.filter(
    (p: any) => (p.placement === 'footer' || p.placement === 'both' || !p.placement) && p.id !== 'contact'
  );

  const hideOnPaths = ['/cart', '/checkout', '/Sahi-admin', '/login', '/prescription'];
  if (hideOnPaths.some(path => pathname.startsWith(path))) return null;

  return (
    <footer className="relative bg-white text-slate-700 pt-16 pb-32 sm:pb-12 overflow-hidden border-t-4 border-primary/20">
      {/* Top rainbow accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-400 to-teal-400" />

      {/* Subtle background pattern */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-primary/4 rounded-full blur-[140px] -mr-64 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-400/5 rounded-full blur-[120px] -ml-32 -mb-32 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

          {/* Column 1: Brand & About */}
          <div className="space-y-7">
            <Link href="/" className="group block w-fit">
              <SahiMedLogo placement="footer" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] font-medium">
              Revolutionizing medication accessibility through precision technology and medical excellence. Your trust, our priority.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com/sahimed" target="_blank" className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-violet-600 hover:border-violet-600 transition-all active:scale-90">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/sahimed" target="_blank" className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-violet-600 hover:border-violet-600 transition-all active:scale-90">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/sahimed" target="_blank" className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-violet-600 hover:border-violet-600 transition-all active:scale-90">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://wa.me/917349499898" target="_blank" className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/25 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-90">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>

            <div>
              <Link
                href="https://play.google.com/store/apps/details?id=com.sahimed.app"
                target="_blank"
                className="inline-block transition-all hover:scale-105 active:scale-95 opacity-90 hover:opacity-100"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  width={135}
                  height={40}
                  className="h-11 w-auto"
                />
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Shop */}
          <div className="space-y-7">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400">Discover Store</h4>
            <ul className="space-y-3">
              {[
                { label: 'All Medicines', href: '/medicines' },
                { label: 'Brand Categories', href: '/categories' },
                { label: 'Prescription Checkout', href: '/prescription' },
                { label: 'Browse Blogs', href: '/blog' },
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="group flex items-center gap-2 text-slate-400 hover:text-violet-300 transition-all text-sm font-semibold">
                    <ChevronRight className="w-3.5 h-3.5 text-violet-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Know Us */}
          <div className="space-y-7">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400">Know Us</h4>
            <ul className="space-y-3">
              {footerPages?.map((page: any) => (
                <li key={page.id}>
                  <Link href={`/p/${page.id}`} className="group flex items-center gap-2 text-slate-400 hover:text-pink-300 transition-all text-sm font-semibold">
                    <ChevronRight className="w-3.5 h-3.5 text-pink-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-7">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-400">Pharma Support</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Direct Line</p>
                  <p className="text-sm font-bold text-slate-200">+91 7349499898</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Support Email</p>
                <a href="mailto:support@sahimed.com" className="text-sm font-bold text-slate-200 hover:text-teal-400 transition-colors">support@sahimed.com</a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/25 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">WhatsApp Support</p>
                  <a href="https://wa.me/917349499898" target="_blank" className="text-sm font-bold text-slate-200 hover:text-[#25D366] transition-colors">+91 73494 99898</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Areas SEO Strip */}
        <div className="pt-8 mb-8 border-t border-white/8">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-5 text-center lg:text-left">Popular Service Areas</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start">
            {[
              { name: 'Delhi NCR', id: 'delhi' },
              { name: 'Mumbai', id: 'mumbai' },
              { name: 'Bangalore', id: 'bangalore' },
              { name: 'Hyderabad', id: 'hyderabad' },
              { name: 'Chennai', id: 'chennai' },
              { name: 'Kolkata', id: 'kolkata' },
              { name: 'Pune', id: 'pune' },
              { name: 'Ahmedabad', id: 'ahmedabad' },
              { name: 'Lucknow', id: 'lucknow' },
              { name: 'Jaipur', id: 'jaipur' }
            ].map((city) => (
              <Link
                key={city.id}
                href={`/delivery/${city.id}`}
                className="text-[11px] font-bold text-slate-500 hover:text-violet-400 transition-colors uppercase tracking-tight"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed text-center md:text-left">
            © 2026 MED TOWN PHARMA. <span className="text-slate-700 mx-2">•</span> Building No. 03, 4TH MAIN, 1ST STAGE, 4TH BLOCK, Kalyan Nagar, Bengaluru Urban
            <div className="text-slate-600 mt-2 font-medium tracking-normal normal-case text-[10px]">
              Drug License: <span className="font-bold text-slate-500">KA-B51-286602</span> (Form 20) & <span className="font-bold text-slate-500">KA-B51-286603</span> (Form 21)
              <span className="mx-2">•</span> GSTIN: <span className="font-bold text-slate-500">29BYSPA3764J1ZV</span>
              <span className="mx-2">•</span> All orders verified by a Registered Pharmacist
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">We Accept</span>
            <div className="flex items-center gap-5 bg-white/8 px-4 py-2 rounded-2xl border border-white/10">
              <img src="/images/we-accept.png" alt="We Accept Visa, UPI, MasterCard, Paytm, RuPay" width={240} height={24} className="h-6 w-auto object-contain opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
