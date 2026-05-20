'use client';

import * as React from 'react';
import { ShieldCheck, Award, Heart, CheckCircle2 } from 'lucide-react';

export default function SEOContent() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
              SahiMed: India's Trusted <br/>
              <span className="text-primary italic">Digital Pharmacy Partner</span>
            </h2>
            <p className="text-xl text-slate-600 font-medium leading-relaxed">
              At SahiMed, we believe that healthcare should be accessible, affordable, and most importantly—authentic. In a world of rising medical costs and uncertainty, we stand as a beacon of trust for millions of Indian families.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: ShieldCheck, title: "100% Authentic", desc: "Every medicine is sourced directly from licensed manufacturers and verified by our SahiMed quality team." },
              { icon: Award, title: "Best Prices", desc: "Sahi Dawai, Sahi Daam Pe. We eliminate middlemen to provide you the most affordable rates in India." },
              { icon: Heart, title: "Expert Care", desc: "Our team of certified pharmacists is always available to guide you through your healthcare journey." },
              { icon: CheckCircle2, title: "Safe Delivery", desc: "Special temperature-controlled packaging ensures your medicines remain effective and safe." }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">{item.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[60px] p-12 sm:p-20 text-white relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <h3 className="text-3xl font-black uppercase tracking-tighter font-outfit leading-tight">
              Why Millions of Indians <br/> Choose Sahimed
            </h3>
            <div className="space-y-6">
              {[
                "Direct-to-consumer model ensuring 100% authenticity",
                "Advanced prescription verification by licensed professionals",
                "Pan-India delivery reaching even the most remote corners",
                "Dedicated customer support for chronic care patients",
                "Transparent pricing with no hidden shipping charges"
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-slate-300 font-medium leading-snug">{point}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-white/10 flex items-center gap-10">
              <div>
                <p className="text-4xl font-black text-primary font-outfit">50K+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Happy Users</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary font-outfit">100%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Genuine Stock</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
