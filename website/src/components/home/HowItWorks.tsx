'use client';

import * as React from 'react';
import { Search, FileText, PackageCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  {
    icon: Search,
    title: "Search Medicines",
    desc: "Find 50,000+ authentic products",
    gradient: "from-blue-500 to-cyan-500",
    num: "01",
  },
  {
    icon: FileText,
    title: "Upload Prescription",
    desc: "Fast verification by pharmacists",
    gradient: "from-purple-500 to-pink-500",
    num: "02",
  },
  {
    icon: PackageCheck,
    title: "Quality Check",
    desc: "Multi-layer authenticity check",
    gradient: "from-violet-500 to-indigo-500",
    num: "03",
  },
  {
    icon: Truck,
    title: "Safe Delivery",
    desc: "Express doorstep delivery",
    gradient: "from-emerald-500 to-teal-500",
    num: "04",
  }
];

export default function HowItWorks() {
  return (
    <section className="py-4 sm:py-6 px-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs relative my-3 sm:my-5">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 sm:mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              How SahiMed <span className="text-primary italic">Works</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Order genuine medicines in 4 simple steps</p>
          </div>
          <Link
            href="/search"
            className="text-[11px] font-black text-primary uppercase tracking-wider hover:underline flex items-center gap-1 shrink-0"
          >
            Start Shopping →
          </Link>
        </div>

        {/* Compact Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50/70 border border-slate-100/80">
              {/* Compact Icon Box */}
              <div className={`relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center shadow-xs shrink-0`}>
                <step.icon className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-[8px] shadow-2xs border border-slate-200">
                  {step.num}
                </div>
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-slate-800 tracking-tight leading-tight truncate">
                  {step.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
