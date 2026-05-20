'use client';

import * as React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Award, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';

export default function SideDecorations() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div className="hidden xl:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle Background Blobs */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-[10%] -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-[10%] -right-20 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px]"
      />

      {/* Left Side: Vertical Branding & Trust Strip */}
      <div className="absolute top-0 left-0 h-full w-[calc((100vw-1280px)/2)] flex flex-col items-center justify-center py-20 px-4">
        <div className="relative h-full flex flex-col items-center justify-between">
          <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-slate-200 to-slate-200" />
          
          <div className="rotate-180 [writing-mode:vertical-lr] flex items-center gap-6 py-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              ESTD 2024 • SAHIMED PHARMACY
            </span>
            <div className="h-12 w-[1px] bg-slate-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 italic">
              Authentic • Verified • Trusted
            </span>
          </div>

          <div className="w-[1px] h-32 bg-gradient-to-t from-transparent via-slate-200 to-slate-200" />
        </div>
      </div>

      {/* Right Side: Floating Interactive Cards & Support */}
      <div className="absolute top-0 right-0 h-full w-[calc((100vw-1280px)/2)] flex flex-col items-center justify-center py-20 px-8">
        <div className="space-y-12">
          {/* Trust Floating Pills */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl shadow-slate-200/20 space-y-2 pointer-events-auto group hover:bg-white transition-colors duration-500"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none">100% Genuine</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sourced Directly</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl shadow-slate-200/20 space-y-2 pointer-events-auto group hover:bg-white transition-colors duration-500"
          >
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none">4.9/5 Rating</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">On Google Maps</p>
          </motion.div>

          {/* Quick Support Sticky */}
          <Link href="https://wa.me/917349499898" className="block pointer-events-auto">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 group"
            >
              <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:rotate-12 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="hidden 2xl:block text-left pr-4">
                <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none">Help Desk</p>
                <p className="text-[8px] font-bold text-[#25D366] uppercase tracking-widest mt-1">Online Now</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
