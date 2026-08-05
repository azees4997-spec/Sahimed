"use client"

import { useState, useEffect } from 'react';
import { Search, HeartPulse, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SEARCH_PLACEHOLDERS = [
  "Search 'Dolo 650' or Paracetamol...",
  "Search medicines, brands, salts...",
  "Search 'Augmentin 625 Duo'...",
  "Search generic salts & save up to 70%...",
  "Search 'Metformin 500mg'...",
  "Search 'Vitamin C & Zinc'..."
];

export default function HeroSearch() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-mobile-search'));
    }
  };

  return (
    <div className="w-full relative group">
      {/* Ambient Glow Aura */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 opacity-30 group-hover:opacity-70 transition-all duration-500 blur-sm" />

      <button
        onClick={handleOpen}
        type="button"
        className="relative w-full bg-white/95 backdrop-blur-md hover:bg-white rounded-full px-4 sm:px-5 py-3 shadow-xl border border-slate-200/90 hover:border-teal-400 flex items-center justify-between transition-all duration-300 active:scale-[0.99] cursor-pointer overflow-hidden"
        aria-label="Search medicines, brands, salts"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          {/* HeartPulse animated icon */}
          <div className="relative flex items-center justify-center shrink-0">
            <HeartPulse className="w-4 sm:w-5 h-4 sm:h-5 text-teal-600 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {/* Rotating Placeholder */}
          <div className="relative h-5 flex items-center overflow-hidden flex-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={placeholderIndex}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-xs sm:text-sm font-semibold text-slate-600 truncate text-left block"
              >
                {SEARCH_PLACEHOLDERS[placeholderIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-400">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>

          <span 
            className="text-[10px] sm:text-[11px] font-black text-white px-4 py-1.5 rounded-full shrink-0 shadow-md uppercase tracking-wider flex items-center gap-1.5 group-hover:scale-105 transition-transform" 
            style={{ background: 'linear-gradient(135deg, #009F9C, #059669)', boxShadow: '0 2px 10px rgba(0,159,156,0.35)' }}
          >
            <Search className="w-3 h-3" />
            <span>SEARCH</span>
          </span>
        </div>
      </button>
    </div>
  );
}

