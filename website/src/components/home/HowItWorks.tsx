'use client';

import * as React from 'react';
import { Search, FileText, PackageCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    icon: Search,
    title: "Search Medicines",
    desc: "Find your required medicines from our huge inventory of 100% authentic stocks.",
    color: "bg-blue-500"
  },
  {
    icon: FileText,
    title: "Upload Prescription",
    desc: "Our certified pharmacists verify every prescription to ensure your safety.",
    color: "bg-rose-500"
  },
  {
    icon: PackageCheck,
    title: "Quick Dispatch",
    desc: "Every order undergoes a multi-layer quality check before being packed securely.",
    color: "bg-primary"
  },
  {
    icon: Truck,
    title: "Safe Delivery",
    desc: "Track your order in real-time as it reaches your doorstep via our trusted partners.",
    color: "bg-green-500"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-8 sm:py-32 bg-white rounded-[32px] sm:rounded-[60px] my-4 sm:my-10 border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-1.5 sm:space-y-4 mb-8 sm:mb-20">
          <h2 className="text-base sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
            How Sahimed <span className="text-primary italic">Works</span>
          </h2>
          <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-2xl mx-auto px-4">
            Experience the simplest and most reliable way to get your medicines delivered in India.
          </p>
        </div>

        {/* Mobile Grid / Desktop Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-12 px-2 sm:px-0">
          {STEPS.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative space-y-3 sm:space-y-6 group flex flex-col items-center text-center p-4 bg-slate-50/50 sm:bg-transparent rounded-[32px] sm:rounded-none"
            >
              <div className="flex flex-col items-center gap-3 sm:gap-6 w-full">
                <div className={`w-12 h-12 sm:w-20 sm:h-20 ${step.color} rounded-xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200/50 relative z-10 group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                  <step.icon className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                  <div className="absolute -top-1.5 -right-1.5 sm:-top-3 sm:-right-3 w-5 h-5 sm:w-8 sm:h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-[10px] sm:text-sm shadow-xl">
                    {i + 1}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[11px] sm:text-xl font-black text-slate-900 uppercase tracking-tight font-outfit leading-tight px-1">
                    {step.title}
                  </h3>
                  <p className="sm:hidden text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Step {i + 1}
                  </p>
                </div>
              </div>

              <div className="space-y-2 hidden sm:block">
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px]">
                  {step.desc}
                </p>
              </div>

              {/* Mobile-only desc - subtle and small */}
              <div className="sm:hidden">
                <p className="text-slate-600 font-bold leading-tight text-[10px] px-2">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
