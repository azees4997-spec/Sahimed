"use client"

import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function SectionHeader({ title, subtitle, onBack, children, compact }: { title: string, subtitle: string, onBack?: () => void, children?: React.ReactNode, compact?: boolean }) {
  if (compact) {
    return (
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-end gap-4 mb-6"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6"
    >
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack} 
            className="rounded-full bg-white shadow-md h-9 w-9 hover:scale-105 transition-transform flex items-center justify-center border border-white active:scale-95"
          >
            <ChevronRight className="w-4 h-4 rotate-180 text-slate-900" />
          </button>
        )}
        <div className="space-y-0.5">
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase font-outfit">{title}</h2>
          <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase leading-none">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {children}
      </div>
    </motion.div>
  );
}
