'use client';

import * as React from 'react';
import { Star, CheckCircle2, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    name: "Arjun Sharma",
    location: "Bangalore",
    tag: "Cardiac Care",
    text: "Got BP medicines delivered in 18 hours. Pharmacist verified Rx — saved ₹600 vs local pharmacy!",
    rating: 5,
    date: "2 days ago"
  },
  {
    name: "Priya Patel",
    location: "Mumbai",
    tag: "Diabetic Care",
    text: "Order insulin monthly. 35-40% cheaper than my chemist. Packaging is pharma-grade and 100% genuine.",
    rating: 5,
    date: "1 week ago"
  },
  {
    name: "Rahul Verma",
    location: "Delhi",
    tag: "Rx Order",
    text: "WhatsApp ordering is a game-changer for my 70-year-old father. Extremely reliable service.",
    rating: 5,
    date: "3 days ago"
  },
  {
    name: "Sunita Reddy",
    location: "Hyderabad",
    tag: "Vitamins",
    text: "Original sealed products with 10+ months expiry. Unbelievable prices vs offline pharmacy.",
    rating: 5,
    date: "5 days ago"
  },
  {
    name: "Kavya Nair",
    location: "Kochi",
    tag: "Family Care",
    text: "Managing elderly parents' 8 medicines. One order, delivered together with clear prescription tags.",
    rating: 5,
    date: "4 days ago"
  }
];

const TRUST_STATS = [
  { val: '10L+', label: 'Happy Patients', emoji: '👥' },
  { val: '4.9★', label: 'Google Rating', emoji: '⭐' },
  { val: '50K+', label: 'Medicines', emoji: '💊' },
  { val: '99.2%', label: 'Delivery Rate', emoji: '⚡' },
];

export default function TrustSection() {
  return (
    <section className="py-4 sm:py-8 my-2 sm:my-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-black text-slate-800">4.9/5 Rating</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-500">Google Verified</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              Trusted by Thousands of Patients
            </h2>
          </div>

          {/* Stats inline mini pill bar */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200/70 rounded-full px-4 py-1.5 shadow-2xs">
            {TRUST_STATS.map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <span>{stat.emoji}</span>
                <span>{stat.val}</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
                {i < TRUST_STATS.length - 1 && <span className="text-slate-300 ml-1">·</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Compact Review Cards Slider */}
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x snap-mandatory px-0.5">
          {REVIEWS.map((review, i) => (
            <div
              key={i}
              className="min-w-[250px] sm:min-w-[290px] max-w-[310px] bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all snap-start flex-shrink-0 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9.5px] font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {review.tag}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 text-xs sm:text-xs leading-relaxed font-medium line-clamp-3">
                  "{review.text}"
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-slate-100">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                  {review.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900 font-black text-xs flex items-center gap-1 leading-none truncate">
                    {review.name}
                    <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                  </p>
                  <p className="text-slate-400 font-medium text-[10px] truncate mt-0.5">{review.location} · Verified</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile stats bar */}
        <div className="grid grid-cols-4 gap-2 lg:hidden mt-3 pt-3 border-t border-slate-100">
          {TRUST_STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-sm font-black text-slate-900 leading-none">{stat.val}</p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
