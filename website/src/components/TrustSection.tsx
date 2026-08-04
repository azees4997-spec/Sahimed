'use client';

import * as React from 'react';
import { Star, CheckCircle2, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    name: "Arjun Sharma",
    location: "Bangalore",
    tag: "Cardiac Medicines",
    text: "Excellent service! Got my BP medicines delivered in 18 hours. The pharmacist called to confirm my Rx — real attention to patient safety. Saved ₹600 vs local pharmacy!",
    rating: 5,
    date: "2 days ago"
  },
  {
    name: "Priya Patel",
    location: "Mumbai",
    tag: "Diabetic Care",
    text: "I order insulin and metformin monthly. Sahimed's prices are 35-40% cheaper than my chemist. Packaging is pharma-grade and every strip I've received is genuine.",
    rating: 5,
    date: "1 week ago"
  },
  {
    name: "Rahul Verma",
    location: "Delhi",
    tag: "Prescription Medicines",
    text: "Uploading prescriptions is super smooth. WhatsApp ordering is a game-changer for my 70-year-old father who isn't tech-savvy. Trusted Sahimed completely now.",
    rating: 5,
    date: "3 days ago"
  },
  {
    name: "Sunita Reddy",
    location: "Hyderabad",
    tag: "Vitamins & Supplements",
    text: "Ordered vitamins for the whole family. Received original sealed products with 10+ months expiry. The price difference vs offline pharmacy is unbelievable. 10/10!",
    rating: 5,
    date: "5 days ago"
  },
  {
    name: "Mohammed Rashid",
    location: "Chennai",
    tag: "Thyroid & Hormones",
    text: "Managing my thyroid medication for 2 years through Sahimed now. Never a single issue with authenticity. The auto-reorder reminder is an excellent feature.",
    rating: 5,
    date: "2 weeks ago"
  },
  {
    name: "Kavya Nair",
    location: "Kochi",
    tag: "Family Healthcare",
    text: "As someone managing elderly parents' 8 different medicines, Sahimed is a lifesaver. One order, everything delivered together, with a packing slip by doctor's prescription name.",
    rating: 5,
    date: "4 days ago"
  }
];

const TRUST_STATS = [
  { val: '1L+', label: 'Happy Patients', icon: '👥' },
  { val: '4.9★', label: 'Google Rating', icon: '⭐' },
  { val: '50K+', label: 'Medicines', icon: '💊' },
  { val: '99.2%', label: 'Auth. Rate', icon: '✅' },
];

export default function TrustSection() {
  return (
    <section className="py-10 sm:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-16"
        >
          <div className="flex items-center justify-center gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-slate-800 font-black text-sm sm:text-base">4.9 on Google</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full mb-3">
            Real Patients
          </span>
          <h2 className="text-xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Trusted by <span className="text-primary italic">Thousands</span><br className="hidden sm:block" /> of Happy Indians
          </h2>
          <p className="text-slate-500 text-sm sm:text-lg font-medium max-w-xl mx-auto mt-2 sm:mt-4">
            Real stories from patients who switched to Sahimed for authentic, affordable healthcare.
          </p>
        </motion.div>

        {/* Review Cards — horizontal scroll */}
        <div className="flex flex-nowrap overflow-x-auto gap-4 sm:gap-6 pb-4 px-1 scrollbar-hide snap-x snap-mandatory">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="min-w-[280px] sm:min-w-[360px] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-400 snap-center flex-shrink-0 relative group/card"
            >
              {/* Quote decoration */}
              <div className="absolute top-4 right-4 text-primary/5 group-hover/card:text-primary/10 transition-colors">
                <Quote className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              {/* Tag + Stars */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {review.tag}
                </span>
                <div className="flex gap-0.5">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Review text */}
              <p className="text-slate-700 text-sm sm:text-[15px] leading-relaxed font-medium relative z-10 mb-4">
                "{review.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {review.name[0]}
                </div>
                <div>
                  <p className="text-slate-900 font-black text-sm flex items-center gap-1">
                    {review.name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  </p>
                  <p className="text-slate-400 font-semibold text-[11px]">{review.location} · {review.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 sm:mt-16 grid grid-cols-4 gap-3 sm:gap-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-8"
        >
          {TRUST_STATS.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <span className="text-xl sm:text-3xl mb-1">{stat.icon}</span>
              <p className="text-sm sm:text-2xl font-black text-slate-900 leading-none">{stat.val}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Verification Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-none">Google Verified</p>
              <p className="text-[10px] font-semibold text-slate-400">Business Partner</p>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-none">Drug License</p>
              <p className="text-[10px] font-semibold text-slate-400">KA-B51-286602</p>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-none">SSL Secured</p>
              <p className="text-[10px] font-semibold text-slate-400">256-bit Encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
