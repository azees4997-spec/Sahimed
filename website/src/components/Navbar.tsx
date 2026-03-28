"use client"

import Link from 'next/link';
import { Search as SearchIcon, MapPin, ChevronDown, LocateFixed, Loader2, ShoppingCart, Package, ArrowUpRight, ChevronUp, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export function SahiMedIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center bg-primary rounded-xl shadow-lg shadow-primary/20", className)}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-3/4 h-3/4"
      >
        <path 
          d="M20 55C20 30 40 20 50 20C35 35 32 55 32 75C32 90 45 100 55 100C30 100 20 85 20 55Z" 
          fill="white"
        />
        <circle cx="65" cy="35" r="15" fill="white" opacity="0.6" />
      </svg>
    </div>
  );
}

interface SuggestionItem {
  id: string;
  term: string;
  type: 'Brand' | 'Salt';
}

export default function Navbar() {
  const { location, setLocation, totalItems, addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim().length >= 1) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearch(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim().length < 1) {
      setRawSuggestions([]);
      setIsSearching(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      const term = search.trim();

      try {
        const resMeds = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=10`);
        const mongoMeds = resMeds.ok ? await resMeds.json() : [];

        const resMols = await fetch(`/api/molecules?q=${encodeURIComponent(term)}&limit=10`);
        const mongoMols = resMols.ok ? await resMols.json() : [];

        const normalizedMeds = mongoMeds.map((m: any) => ({
          ...m,
          id: m._id || m.id,
          _type: 'medicine'
        }));

        const normalizedMols = mongoMols.map((m: any) => ({
          ...m,
          id: m._id || m.id,
          _type: 'molecule'
        }));

        setRawSuggestions([...normalizedMeds, ...normalizedMols]);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const suggestions = useMemo(() => {
    if (!rawSuggestions.length) return [];
    
    const term = search.toLowerCase();
    const items: SuggestionItem[] = [];
    const seenTerms = new Set<string>();

    rawSuggestions.forEach(p => {
      if (p._type === 'molecule') {
        const molName = p.molecule || '';
        if (molName.toLowerCase().includes(term) && !seenTerms.has(molName)) {
          items.push({ id: `mol-${p.id}`, term: molName, type: 'Salt' });
          seenTerms.add(molName);
        }
      } else {
        const name = p.name || '';
        const salt = p.saltComposition || '';

        if (name.toLowerCase().includes(term) && !seenTerms.has(name)) {
          items.push({ id: `brand-${p.id}`, term: name, type: 'Brand' });
          seenTerms.add(name);
        }
        if (salt.toLowerCase().includes(term) && !seenTerms.has(salt)) {
          items.push({ id: `salt-${p.id}`, term: salt, type: 'Salt' });
          seenTerms.add(salt);
        }
      }
    });

    return items;
  }, [rawSuggestions, search]);

  const displayedSuggestions = expanded ? suggestions : suggestions.slice(0, 5);

  const handleGeoLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.address) {
              const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.city_district || 'Current Location';
              setLocation(neighborhood);
            }
            setIsPopoverOpen(false);
          } catch (e) {
            console.error("Locating failed", e);
          } finally {
            setIsLocating(false);
          }
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <nav className={cn(
      "sticky top-0 z-[100] transition-all duration-300 px-4 py-3",
      scrolled ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <SahiMedIcon className="w-10 h-10 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <div className="flex items-center leading-none">
                <span className="font-extrabold text-2xl text-slate-900 tracking-tight">Sahi</span>
                <span className="font-extrabold text-2xl text-primary tracking-tight">Med</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-[11px] font-semibold text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="max-w-[70px] sm:max-w-none truncate">{location}</span>
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
              </PopoverTrigger>
              <PopoverContent sideOffset={12} className="w-72 p-4 rounded-3xl shadow-2xl border-none glass">
                <Button 
                  onClick={handleGeoLocation} 
                  disabled={isLocating}
                  className="w-full justify-start gap-3 h-12 rounded-2xl bg-primary text-white hover:bg-primary/90 font-bold text-xs"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  Locate me automatically
                </Button>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-4">
              <Link href="/cart" className="relative group">
                <div className="p-2.5 bg-slate-100 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-black rounded-full border-2 border-white animate-in zoom-in">
                      {totalItems}
                    </span>
                  )}
                </div>
              </Link>
              <button className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <User className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-3xl mx-auto" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-4 h-4" />
              <Input
                type="text"
                placeholder="Search medicines or generics..."
                className="w-full pl-11 pr-12 h-12 text-sm font-medium bg-slate-100/80 border-transparent focus:bg-white focus:border-primary/20 focus-visible:ring-4 focus-visible:ring-primary/10 rounded-2xl shadow-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.length >= 3 && setShowSuggestions(true)}
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          </form>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-[calc(100%+12px)] left-0 right-0 glass rounded-3xl overflow-hidden z-[110] border border-white/50"
              >
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-3">
                  {displayedSuggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestionClick(item.term)}
                      className="w-full px-6 py-3.5 flex items-center gap-4 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                        <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-700 truncate flex-1">
                          {item.term}
                        </p>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] px-2 py-0.5 rounded-md border-none shrink-0 group-hover:bg-primary/10 group-hover:text-primary">
                          {item.type}
                        </Badge>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                    </button>
                  ))}

                  {suggestions.length > 5 && (
                    <button 
                      onClick={() => setExpanded(!expanded)}
                      className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-[11px] tracking-wide hover:bg-slate-50 transition-colors border-t border-slate-50 mt-2"
                    >
                      {expanded ? (
                        <>View less <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>View more <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="p-5 bg-slate-50/50 border-t border-white/50 flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Top Recommendations</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rawSuggestions.filter(p => p._type === 'medicine').slice(0, 2).map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => handleSuggestionClick(p.name)}
                        className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 hover:shadow-xl hover:shadow-primary/5 transition-all text-left cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 p-2 group-hover:scale-105 transition-transform">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-slate-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 truncate tracking-tight">{p.packSize || '10 Tablets'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-primary">₹{p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
