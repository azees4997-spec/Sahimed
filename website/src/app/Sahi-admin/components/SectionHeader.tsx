"use client"

import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function SectionHeader({ title, subtitle, onBack, children }: { title: string, subtitle: string, onBack?: () => void, children?: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12"
    >
      <div className="flex items-center gap-6">
        {onBack && (
          <button 
            onClick={onBack} 
            className="rounded-full bg-white shadow-xl h-14 w-14 hover:scale-110 transition-transform flex items-center justify-center border border-white active:scale-95"
          >
            <ChevronRight className="w-6 h-6 rotate-180 text-slate-900" />
          </button>
        )}
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit">{title}</h2>
          <p className="text-[10px] font-black text-primary tracking-[0.4em] uppercase leading-none">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {children}
      </div>
    </motion.div>
  );
}
