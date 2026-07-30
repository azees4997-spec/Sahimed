'use client';

import * as React from 'react';
import { Search, FileText, PackageCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  {
    icon: Search,
    title: "Search Medicines",
    desc: "Find from 50,000+ authentic, pharmacist-verified products in seconds.",
    gradient: "from-blue-400 to-cyan-400",
    lightBg: "bg-blue-50",
    numBg: "bg-blue-500",
    num: "01",
    emoji: "🔍",
  },
  {
    icon: FileText,
    title: "Upload Prescription",
    desc: "Snap a photo of your Rx. Our certified pharmacists verify it within minutes.",
    gradient: "from-rose-400 to-pink-400",
    lightBg: "bg-rose-50",
    numBg: "bg-rose-500",
    num: "02",
    emoji: "📋",
  },
  {
    icon: PackageCheck,
    title: "Quality Check",
    desc: "Every order goes through a multi-layer authenticity & expiry check before packing.",
    gradient: "from-violet-400 to-purple-500",
    lightBg: "bg-violet-50",
    numBg: "bg-violet-500",
    num: "03",
    emoji: "✅",
  },
  {
    icon: Truck,
    title: "Safe Delivery",
    desc: "Track real-time as your order arrives at your doorstep via trusted partners.",
    gradient: "from-emerald-400 to-green-500",
    lightBg: "bg-emerald-50",
    numBg: "bg-emerald-500",
    num: "04",
    emoji: "🚚",
  }
];

export default function HowItWorks() {
  return (
    <section className="py-10 sm:py-16 bg-gradient-to-br from-[#f0fdfa] via-white to-[#faf5ff] rounded-2xl sm:rounded-3xl border border-primary/10 overflow-hidden relative my-6 sm:my-12">
      {/* Soft background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-14"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/15 px-3 py-1 rounded-full mb-3">
            Simple Process
          </span>
          <h2 className="text-xl sm:text-4xl font-black tracking-tight text-slate-800 leading-tight">
            How Sahimed <span className="text-primary italic">Works</span>
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-medium max-w-lg mx-auto mt-2 px-4">
            Order genuine medicines in 4 simple steps — delivered safe and fast across India.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-6 px-1">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="min-w-[200px] sm:min-w-0 flex flex-col items-center text-center group"
            >
              {/* Icon box */}
              <div className="relative mb-4 sm:mb-5">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${step.gradient} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-${step.numBg.replace('bg-', '')}/20 group-hover:scale-105 transition-transform duration-500`}>
                  <step.icon className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow" />
                </div>
                {/* Step number badge — colorful, NOT dark */}
                <div className={`absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 ${step.numBg} text-white rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] shadow-md border-2 border-white`}>
                  {step.num}
                </div>
              </div>

              {/* Text */}
              <h3 className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wide mb-1.5 leading-tight px-1">
                {step.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed max-w-[180px] sm:max-w-[200px]">
                {step.desc}
              </p>

              {/* Arrow connector (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden sm:flex absolute right-0 top-10 items-center justify-center translate-x-3">
                  <span className="text-slate-300 text-lg">→</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 border-t border-primary/10"
        >
          <p className="text-sm font-bold text-slate-600">Ready to get started?</p>
          <Link
            href="/search"
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25"
          >
            Shop Medicines Now →
          </Link>
          <Link
            href="https://wa.me/917349499898"
            target="_blank"
            className="border border-[#25D366] text-[#25D366] bg-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#f0fdf4] transition-all active:scale-95"
          >
            📱 Order via WhatsApp
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
