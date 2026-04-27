"use client"

import { Search } from 'lucide-react';

export default function HeroSearch() {
  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-search'));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button 
        onClick={handleOpenSearch}
        className="block w-full group"
      >
        <div 
          className="w-full bg-white text-slate-900 rounded-full p-0.5 sm:p-1 shadow-xl shadow-slate-200/50 flex items-center border border-slate-100 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
        >
          <div className="flex-1 px-4 sm:px-5 text-left text-[10px] sm:text-[13px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Search Medicines...
          </div>
          <div className="bg-primary p-2 sm:p-3 rounded-full shadow-lg shadow-primary/20">
            <Search className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" />
          </div>
        </div>
      </button>
    </div>
  );
}
