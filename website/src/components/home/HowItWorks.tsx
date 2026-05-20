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
    <section className="py-24 bg-white rounded-[60px] my-10 border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
            How Sahimed <span className="text-primary italic">Works</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Experience the simplest and most reliable way to get your medicines delivered in India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {STEPS.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative space-y-6 group"
            >
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-[2px] bg-slate-100 -translate-x-10 z-0" />
              )}
              
              <div className={`w-20 h-20 ${step.color} rounded-3xl flex items-center justify-center shadow-lg shadow-${step.color.split('-')[1]}-500/20 relative z-10 group-hover:scale-110 transition-transform duration-500`}>
                <step.icon className="w-10 h-10 text-white" />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">
                  {i + 1}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                  {step.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
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
