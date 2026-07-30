"use client"

import { Search, Mic } from 'lucide-react';
import { useState } from 'react';

const POPULAR = ['Metformin', 'Amlodipine', 'Vitamin D3', 'Azithromycin', 'Omeprazole'];

export default function HeroSearch() {
  const [hovered, setHovered] = useState(false);

  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-search'));
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Main Search Bar */}
      <button
        onClick={handleOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group w-full flex items-center gap-0 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary/40 focus:border-primary shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
        aria-label="Search medicines"
      >
        {/* Icon */}
        <div className="pl-4 pr-3 py-4 shrink-0">
          <Search className={`w-5 h-5 transition-colors duration-300 ${hovered ? 'text-primary' : 'text-slate-400'}`} />
        </div>

        {/* Placeholder text */}
        <div className="flex-1 py-4 text-left">
          <span className="text-[13px] sm:text-sm text-slate-400 font-medium">
            Search medicines, brands, salts...
          </span>
        </div>

        {/* Search CTA Button */}
        <div className="m-1.5 bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 shadow-lg shadow-primary/25">
          Search
        </div>
      </button>

      {/* Popular quick pills */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Popular:</span>
        {POPULAR.map((term) => (
          <button
            key={term}
            onClick={handleOpen}
            className="text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 px-2.5 py-1 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
