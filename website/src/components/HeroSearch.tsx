"use client"

import { Search } from 'lucide-react';

export default function HeroSearch() {
  const handleOpen = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-mobile-search'));
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleOpen}
        type="button"
        className="w-full bg-white hover:bg-slate-50 rounded-full px-4 py-2.5 shadow-lg border border-pink-200/80 flex items-center justify-between text-slate-400 text-xs font-medium transition-all duration-200 active:scale-[0.99] cursor-pointer"
        aria-label="Open mobile search"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-4 h-4 text-pink-500 shrink-0" />
          <span className="text-slate-400 font-medium truncate text-left">Search your Medicines, brands, salts...</span>
        </div>
        <span 
          className="text-[9px] font-black text-white px-3 py-1 rounded-full shrink-0 ml-1 shadow-sm uppercase tracking-wider" 
          style={{ background: 'linear-gradient(135deg, #009F9C, #059669)' }}
        >
          SEARCH
        </span>
      </button>
    </div>
  );
}
