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
    <section className="py-16 sm:py-24 bg-white rounded-[40px] sm:rounded-[60px] my-10 border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
            How Sahimed <span className="text-primary italic">Works</span>
          </h2>
          <p className="text-slate-500 text-sm sm:text-lg font-medium max-w-2xl mx-auto px-4">
            Experience the simplest and most reliable way to get your medicines delivered in India.
          </p>
        </div>

        {/* Mobile Horizontal Scroll / Desktop Grid */}
        <div className="flex overflow-x-auto pb-8 sm:pb-0 sm:grid sm:grid-cols-4 gap-8 sm:gap-12 scrollbar-hide snap-x snap-mandatory px-4 sm:px-0">
          {STEPS.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[280px] sm:min-w-0 snap-center relative space-y-6 group flex flex-col sm:items-center sm:text-center"
            >
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-10 left-[60%] w-full h-[2px] bg-slate-100 z-0" />
              )}
              
              <div className="flex sm:flex-col items-center gap-6 w-full sm:w-auto">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 ${step.color} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200/50 relative z-10 group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                  <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-xl">
                    {i + 1}
                  </div>
                </div>

                <div className="sm:hidden space-y-1">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-outfit leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold leading-normal">
                    Step {i + 1} of 4
                  </p>
                </div>
              </div>

              <div className="space-y-2 hidden sm:block">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px]">
                  {step.desc}
                </p>
              </div>

              {/* Mobile-only desc */}
              <div className="sm:hidden space-y-2">
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
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
