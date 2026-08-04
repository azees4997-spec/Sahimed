'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const PROMISES = [
  {
    icon: '✅',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-100',
    accent: 'text-emerald-700',
    title: '100% Certified Medicines',
    desc: 'Every product is sourced directly from licensed manufacturers. Drug License No. KA-B51-286602. Zero compromise on quality.',
  },
  {
    icon: '📅',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    iconBg: 'bg-violet-100',
    accent: 'text-violet-700',
    title: 'Long Expiry Guaranteed',
    desc: 'We guarantee a minimum of 6 months expiry on every medicine we dispatch. Freshness and efficacy always protected.',
  },
  {
    icon: '🔒',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    accent: 'text-blue-700',
    title: 'Secure Payments',
    desc: '256-bit SSL encryption. Pay via UPI, Debit/Credit Cards, Net Banking or Cash on Delivery. 100% safe every time.',
  },
  {
    icon: '💊',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    iconBg: 'bg-rose-100',
    accent: 'text-rose-600',
    title: 'Up to 61% Savings',
    desc: "We remove middlemen and source directly — passing India's highest savings on branded generics directly to you.",
  },
];

const WHY_POINTS = [
  { icon: '🏥', text: 'Licensed pharmacy, verified by the Government of Karnataka' },
  { icon: '🩺', text: 'Expert pharmacist verifies every prescription' },
  { icon: '🚚', text: 'Pan-India delivery — free above ₹499' },
  { icon: '💬', text: 'Order via WhatsApp — reply in under 5 minutes' },
  { icon: '🔄', text: 'Easy returns & refund within 7 days' },
  { icon: '⭐', text: '4.8★ on Google from 1 Lakh+ verified patients' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' } })
};

export default function SEOContent() {
  return (
    <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">

      {/* ─── Section Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full mb-3">
          Our Promise to You
        </span>
        <h2 className="text-xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
          Sahimed — <span className="text-primary">Sahi Dawai,</span><br className="hidden sm:block" /> Sahi Daam Pe
        </h2>
        <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto mt-2">
          India's most trusted online pharmacy — built on 4 unbreakable promises.
        </p>
      </motion.div>

      {/* ─── 4 Promise Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {PROMISES.map((p, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`flex gap-4 p-5 sm:p-6 rounded-2xl border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${p.bg} ${p.border}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${p.iconBg}`}>
              {p.icon}
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-black mb-1 ${p.accent}`}>{p.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Why Sahimed — 2-col bright card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/5 via-white to-violet-50 border border-primary/10 overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row">
          {/* Left */}
          <div className="flex-1 p-6 sm:p-10 space-y-4 sm:space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                Why Choose Us
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Why Millions of Indians<br />
                <span className="text-primary">Choose Sahimed</span>
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Healthcare that's affordable, authentic, and always within reach.
              </p>
            </div>

            <div className="space-y-3">
              {WHY_POINTS.map((pt, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-base shrink-0 group-hover:shadow-md transition-shadow">
                    {pt.icon}
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-snug pt-1.5">{pt.text}</p>
                </motion.div>
              ))}
            </div>

            <Link href="/search" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25 mt-2">
              Shop Now & Save 61% →
            </Link>
          </div>

          {/* Right — stats panel (colorful, not dark) */}
          <div className="lg:w-80 xl:w-96 bg-gradient-to-br from-primary/10 to-violet-100/60 p-6 sm:p-10 flex flex-col justify-center gap-5 border-t lg:border-t-0 lg:border-l border-primary/10">
            <div className="text-center lg:text-left">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Our Numbers</p>
              <h4 className="text-lg sm:text-xl font-black text-slate-900">The Sahimed Impact</h4>
            </div>

            {[
              { val: '1 Lakh+', label: 'Happy Patients', icon: '👥', color: 'text-primary' },
              { val: '50,000+', label: 'Medicines Available', icon: '💊', color: 'text-violet-600' },
              { val: '61%', label: 'Max Savings on Generics', icon: '💰', color: 'text-emerald-600' },
              { val: '4.8 ★', label: 'Google Rating', icon: '⭐', color: 'text-amber-500' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`text-xl font-black leading-none ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}

            {/* Certifications */}
            <div className="flex flex-wrap gap-2 mt-1">
              {['Drug License', 'SSL Secured', 'Rx Verified'].map((cert) => (
                <span key={cert} className="text-[9px] font-black text-primary bg-white border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  ✓ {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

    </section>
  );
}
