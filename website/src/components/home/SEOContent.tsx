'use client';

import * as React from 'react';
import { ShieldCheck, Award, Heart, CheckCircle2, Star } from 'lucide-react';
import Image from 'next/image';

export default function SEOContent() {
  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 sm:gap-20 items-start lg:items-center">
        
        {/* Text Content Area - Col Span 7 on Desktop */}
        <div className="lg:col-span-7 space-y-8 sm:space-y-12 w-full">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 w-fit">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Google Verified Pharmacy</span>
            </div>
            
            <h2 className="text-2xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-[0.95]">
              SahiMed: India's Trusted <br className="hidden sm:block"/>
              <span className="text-primary italic">Digital Pharmacy Partner</span>
            </h2>
            <p className="text-base sm:text-xl text-slate-900 font-bold sm:font-medium leading-relaxed max-w-2xl">
              At SahiMed, we believe that healthcare should be accessible, affordable, and most importantly—authentic. In a world of rising medical costs and uncertainty, we stand as a beacon of trust for millions of Indian families.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: ShieldCheck, title: "100% Authentic", desc: "Every medicine is sourced directly from licensed manufacturers and verified by our SahiMed quality team." },
              { icon: Award, title: "Best Prices", desc: "Sahi Dawai, Sahi Daam Pe. We eliminate middlemen to provide you the most affordable rates in India." },
              { icon: Heart, title: "Expert Care", desc: "Our team of certified pharmacists is always available to guide you through your healthcare journey." },
              { icon: CheckCircle2, title: "Safe Delivery", desc: "Special temperature-controlled packaging ensures your medicines remain effective and safe." }
            ].map((item, i) => (
              <div key={i} className="p-5 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-3 hover:border-primary/20 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-slate-900 uppercase text-[10px] sm:text-sm tracking-tight">{item.title}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dark Feature Card - Col Span 5 on Desktop */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-slate-900 rounded-[40px] sm:rounded-[60px] p-8 sm:p-16 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/30 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 space-y-8 sm:space-y-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-8 bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Why Choose Us</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter font-outfit leading-none">
                  Why Millions <br className="hidden sm:block"/> of Indians <br className="hidden sm:block"/> Choose Sahimed
                </h3>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                {[
                  "Direct-to-consumer model for 100% authenticity",
                  "Advanced prescription verification by experts",
                  "Pan-India delivery reaching remote corners",
                  "Dedicated support for chronic care patients"
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-4 group/item">
                    <div className="mt-1 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center shrink-0 group-hover/item:bg-primary transition-colors">
                      <CheckCircle2 className="w-3 h-3 text-primary group-hover/item:text-white" />
                    </div>
                    <p className="text-slate-300 group-hover/item:text-white font-medium leading-snug transition-colors text-sm sm:text-base">{point}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-8 border-t border-white/10 flex items-center">
                <div>
                  <p className="text-3xl sm:text-5xl font-black text-primary font-outfit tracking-tighter">100%</p>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Genuine Stock</p>
                </div>
              </div>

              {/* Google Verified Logo Placement */}
              <div className="pt-6 flex justify-center">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 w-full">
                  <div className="shrink-0">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-tight text-white leading-none">Verified Merchant</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-bold text-slate-300">4.9/5 Trust Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
