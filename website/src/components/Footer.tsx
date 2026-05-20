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
              Revolutionizing medication accessibility through precision technology and medical excellence. Your trust, our priority.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/sahimed" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all active:scale-90 group">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/sahimed" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all active:scale-90 group">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/sahimed" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all active:scale-90 group">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://wa.me/917349499898" target="_blank" className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-90 group">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
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
                  <Link href={link.href} className="group flex items-center gap-2 text-slate-300 hover:text-white transition-all text-sm font-bold uppercase tracking-tight">
                    <ChevronRight className="w-4 h-4 text-primary opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Know Us */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Know Us</h4>
            <ul className="space-y-4">
              {footerPages?.map((page: any) => (
                <li key={page.id}>
                  <Link href={`/p/${page.id}`} className="group flex items-center gap-2 text-slate-300 hover:text-white transition-all text-sm font-bold uppercase tracking-tight">
                    <ChevronRight className="w-4 h-4 text-accent opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="group flex items-center gap-2 text-slate-300 hover:text-white transition-all text-sm font-bold uppercase tracking-tight">
                  <ChevronRight className="w-4 h-4 text-accent opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Pharma Support</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Line</p>
                  <p className="text-sm font-bold text-slate-100">+91 7349499898</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Support Email</p>
                <a href="mailto:support@sahimed.com" className="text-sm font-bold text-slate-100 hover:text-primary transition-colors">support@sahimed.com</a>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp Support</p>
                  <a href="https://wa.me/917349499898" target="_blank" className="text-sm font-bold text-slate-100 hover:text-[#25D366] transition-colors">+91 73494 99898</a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Service Areas SEO Strip */}
        <div className="pt-10 mb-10 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6 text-center lg:text-left">Popular Service Areas</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start">
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
                className="text-[11px] font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-tight"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            © 2026 Sahimed medical healthcare. <span className="text-gray-700 mx-2">•</span> Pharmacy Standard Protocol
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 transition-all duration-700">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-2">We Accept</span>
            <div className="flex items-center gap-5 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              {/* UPI */}
              <svg viewBox="0 0 45 15" className="h-5 w-auto">
                <path d="M4.3 10.3l1.8-4.4h1.1l-1.8 4.4H4.3zM10 5.9v2.8c0 .8-.4 1.2-1.1 1.2s-1.1-.4-1.1-1.2V5.9h-1v2.9c0 1.4.8 2.1 2.1 2.1s2.1-.7 2.1-2.1V5.9h-1zM14.2 5.9h-1.8v4.4h1v-1.5h.8c.8 0 1.4-.4 1.4-1.4s-.6-1.5-1.4-1.5zm-.1 2h-.7v-1.1h.7c.3 0 .5.1.5.5s-.2.6-.5.6z" fill="#fff"/>
                <path d="M0 0l2.5 7.5L0 15h2.5l2.5-7.5L2.5 0H0z" fill="#097939"/>
                <path d="M5 0l2.5 7.5L5 15h2.5l2.5-7.5L7.5 0H5z" fill="#ed752e"/>
              </svg>
              {/* VISA */}
              <svg viewBox="0 0 32 10" className="h-4 w-auto">
                <path d="M11.5 0.5H9.6L7.3 6.1L6.3 1.1C6.2 0.7 5.9 0.5 5.6 0.5H2.5V0.9C3.1 1.1 3.7 1.4 4.1 1.9C4.6 2.4 4.8 3.1 4.8 3.7V7.8H6.8L10.2 0.5H11.5ZM16.6 0.5H15.1L12.4 7.8H14.4L15.0 6.3H18.2L18.5 7.8H20.4L18.9 0.5H16.6ZM15.5 5.1L16.6 2.3L17.2 5.1H15.5ZM26.0 0.5H24.3L23.6 4.0L22.9 0.5H21.0V0.9C21.6 1.1 22.2 1.4 22.6 1.9C23.0 2.4 23.3 3.1 23.3 3.7V7.8H25.3L28.3 0.5H26.0Z" fill="#F7B600"/>
                <path d="M0 0.5H2.1L3.3 7.8H1.2L0 0.5Z" fill="#1A1F71" />
              </svg>
              {/* MASTER */}
              <div className="flex items-center -space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#eb001b]" />
                <div className="w-4 h-4 rounded-full bg-[#f79e1b] opacity-80" />
              </div>
              {/* RUPAY */}
              <div className="text-[10px] font-black italic tracking-tighter text-slate-300 uppercase border-r border-white/10 pr-4">RuPay</div>
              <div className="text-[10px] font-black italic tracking-tighter text-slate-300 uppercase">NetBank</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
