'use client';

import * as React from 'react';
import { Search, FileText, PackageCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    icon: Search,
    title: "Search Medicines",
    desc: "Find medicines from 50,000+ authentic, pharmacist-verified products in seconds.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    num: "01"
  },
  {
    icon: FileText,
    title: "Upload Prescription",
    desc: "Snap a photo of your Rx. Our certified pharmacists verify it within minutes.",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
    num: "02"
  },
  {
    icon: PackageCheck,
    title: "Quality Check",
    desc: "Every order goes through a multi-layer authenticity check before packing.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    num: "03"
  },
  {
    icon: Truck,
    title: "Safe Delivery",
    desc: "Track real-time as your order arrives at your doorstep via trusted partners.",
    color: "from-emerald-500 to-green-500",
    bg: "bg-emerald-50",
    num: "04"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-10 sm:py-20 bg-white rounded-2xl sm:rounded-[48px] border border-slate-100 shadow-sm overflow-hidden relative my-4 sm:my-10">
      {/* Background blob */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full mb-3">
            Simple Process
          </span>
          <h2 className="text-xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            How Sahimed <span className="text-primary italic">Works</span>
          </h2>
          <p className="text-slate-500 text-sm sm:text-lg font-medium max-w-xl mx-auto mt-2 sm:mt-4 px-4">
            The simplest, safest way to get your medicines delivered across India.
          </p>
        </motion.div>

        {/* Steps — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-8 px-1">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="min-w-[220px] sm:min-w-0 flex flex-col items-center text-center group"
            >
              {/* Number + Icon */}
              <div className="relative mb-4 sm:mb-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${step.color} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500`}>
                  <step.icon className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] shadow-lg border-2 border-white">
                  {step.num}
                </div>
              </div>

              {/* Text */}
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight mb-2 leading-tight px-2">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-[200px] sm:max-w-[220px]">
                {step.desc}
              </p>

              {/* Connector line (desktop only) */}
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-10 w-8 h-px bg-dashed border-t-2 border-dashed border-slate-200 translate-x-8" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
