"use client"

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SahiMedIcon } from './Navbar';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
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

export default function Footer({ initialPages = [] }: { initialPages?: any[] }) {
  const pathname = usePathname();
  const db = useFirestore();

  const footerPagesQuery = useMemoFirebase(() => query(
    collection(db, 'pages'), 
    orderBy('lastUpdated', 'desc')
  ), [db]);
  const { data: allPages } = useCollection(footerPagesQuery);
  
  const currentPages = allPages || initialPages;
  const footerPages = currentPages?.filter((p: any) => p.placement === 'footer' || p.placement === 'both');

  const hideOnPaths = ['/cart', '/checkout', '/Sahi-admin', '/login', '/prescription'];
  if (hideOnPaths.some(path => pathname.startsWith(path))) return null;

  return (
    <footer className="relative bg-[#0A0E21] text-white pt-24 pb-32 sm:pb-12 border-t border-white/5 overflow-hidden">
      {/* Premium Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Abstract Background Design */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] -mr-64 -mt-64 opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[120px] -ml-32 -mb-32 opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Brand & About */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-[18px] shadow-2xl shadow-primary/20 transition-transform hover:scale-105 duration-500">
                <SahiMedIcon className="w-8 h-8" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-outfit font-black text-2xl tracking-tighter">
                  Sahi<span className="text-primary italic">Med</span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 mt-0.5">Sahi dawai sahi daam pe</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] font-medium">
              Revolutionizing medication accessibility through precision technology and clinical excellence. Your trust, our priority.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Linkedin, MessageCircle].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all active:scale-90 group">
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>

            <div className="pt-4">
              <Link 
                href="https://play.google.com/store/apps/details?id=com.sahimed.app" 
                target="_blank"
                className="inline-block transition-all hover:scale-105 active:scale-95"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="h-12 w-auto"
                />
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Shop */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Discover Store</h4>
            <ul className="space-y-4">
              {[
                { label: 'Shop All Products', href: '/search' },
                { label: 'Brand Categories', href: '/categories' },
                { label: 'Prescription Checkout', href: '/prescription' },
                { label: 'Exclusive Offers', href: '/p/offers' },
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all text-sm font-bold uppercase tracking-tight">
                    <ChevronRight className="w-4 h-4 text-primary opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources & Legal */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Company & Legal</h4>
            <ul className="space-y-4">
              {footerPages?.length ? (
                footerPages.map((page: any) => (
                  <li key={page.id}>
                    <Link href={`/p/${page.id}`} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all text-sm font-bold uppercase tracking-tight">
                      <ChevronRight className="w-4 h-4 text-accent opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  <li className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                  <li className="h-4 w-28 bg-white/5 rounded animate-pulse" />
                </>
              )}
            </ul>
          </div>

          {/* Column 4: Contact & Operations */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Clinical Support</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Direct Line</p>
                  <p className="text-sm font-bold text-gray-200">+91 7349499898</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Email Terminal</p>
                  <p className="text-sm font-bold text-gray-200 whitespace-nowrap">support@sahimed.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 pt-4 border-t border-white/5">
                <Clock className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400">OPEN: 24/7 EMERGENCY FULFILLMENT</p>
                  <p className="text-[9px] text-gray-600 mt-1 font-medium">Standard Hours: 09:00 - 22:00 IST</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-gray-600 tracking-[0.3em] uppercase">
            © 2026 Sahimed clinical healthcare. <span className="text-gray-700 mx-2">•</span> Precision Pharmacy Protocol
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mr-2">We Accept</span>
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              {['UPI', 'VISA', 'MASTER', 'RUPAY', 'NETBANK'].map((m) => (
                <span key={m} className="text-[7px] font-black tracking-tighter text-gray-400 uppercase">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
