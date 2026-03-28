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
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
      className={cn(
        "sticky top-0 z-[100] transition-all duration-500 px-4 py-3 sm:py-4",
        scrolled ? "bg-white/80 backdrop-blur-2xl shadow-xl border-b border-white/20" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Tier 1: Logo, Location, Cart */}
        <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-2 rounded-full border border-white/40 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <SahiMedIcon className="w-10 h-10 sm:w-11 sm:h-11 shadow-lg shadow-primary/20" />
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center leading-none">
                  <span className="font-black text-2xl text-slate-900 tracking-tighter">Sahi</span>
                  <span className="font-black text-2xl text-primary tracking-tighter">Med</span>
                </div>
              </div>
            </Link>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 hover:bg-white transition-all text-[11px] sm:text-xs font-black text-slate-600 border border-white/60 shadow-sm group">
                  <MapPin className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="max-w-[70px] sm:max-w-none truncate tracking-tight">{location}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent sideOffset={12} className="w-72 p-5 rounded-[32px] shadow-3xl border border-white/50 glass">
                <Button 
                  onClick={handleGeoLocation} 
                  disabled={isLocating}
                  className="w-full justify-start gap-3 h-14 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-xs tracking-widest uppercase shadow-xl shadow-primary/20"
                >
                  {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                  Identify Location
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="flex items-center gap-2 group">
              <div className="p-3 bg-white/60 backdrop-blur-md rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-white/60 shadow-sm relative">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white h-5 min-w-[20px] sm:h-6 sm:min-w-[24px] flex items-center justify-center p-0 text-[9px] sm:text-[10px] font-black rounded-full border-2 border-white shadow-lg animate-bounce">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:block font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-primary transition-colors">Cart</span>
            </Link>
          </div>
        </div>

        {/* Tier 2: Search */}
        <div className="relative w-full" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for medicines or generics"
                className="w-full pl-14 pr-12 h-14 sm:h-16 text-sm sm:text-base font-bold bg-white/60 border-white/60 focus:bg-white focus:border-primary/20 rounded-full shadow-2xl shadow-primary/5 transition-all outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.length >= 2 && setShowSuggestions(true)}
              />
              {isSearching && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
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
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 glass rounded-[32px] overflow-hidden z-[110] border border-white/50 shadow-3xl"
              >
                <div className="max-h-[500px] overflow-y-auto scrollbar-hide py-3">
                  {displayedSuggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestionClick(item.term)}
                      className="w-full px-8 py-3.5 flex items-center gap-4 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-white/50 rounded-xl group-hover:bg-white group-hover:scale-110 transition-all border border-white/50">
                        <SearchIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                        <p className="font-extrabold text-sm text-slate-800 truncate flex-1">
                          {item.term}
                        </p>
                        <Badge variant="secondary" className="bg-white/50 text-slate-500 font-black text-[8px] px-2 py-0.5 rounded-lg border border-white/50 shrink-0 uppercase tracking-widest">
                          {item.type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>

  );
}
