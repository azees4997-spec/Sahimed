
"use client"

import Link from 'next/link';
import { Search as SearchIcon, MapPin, ChevronDown, LocateFixed, Loader2, ShoppingCart, Package, ChevronRight, ArrowUpRight, ChevronUp } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';

export function SahiMedIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-8 h-8", className)}
    >
      <path 
        d="M20 55C20 30 40 20 50 20C35 35 32 55 32 75C32 90 45 100 55 100C30 100 20 85 20 55Z" 
        fill="#8b31c0"
      />
      <path 
        d="M80 45C80 70 60 80 50 80C65 65 68 45 68 25C68 10 55 0 45 0C70 0 80 15 80 45Z" 
        fill="#8b31c0" 
      />
      <path 
        d="M50 10C35 30 35 55 50 65C65 75 65 95 50 110C80 90 80 65 65 55C50 45 50 25 50 10Z" 
        fill="#ec4899"
      />
      <path 
        d="M55 20C48 35 48 55 58 65C68 75 68 85 63 95C73 85 73 70 63 60C53 50 53 30 55 20Z" 
        fill="#CBD5E1" 
      />
    </svg>
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
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const db = useFirestore();

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
        // 1. Fetch from MongoDB API for medicines
        const resMeds = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=20`);
        const mongoMeds = resMeds.ok ? await resMeds.json() : [];

        // 2. Fetch from MongoDB API for molecules
        const resMols = await fetch(`/api/molecules?q=${encodeURIComponent(term)}&limit=15`);
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
    <nav className="bg-[#F8FAFC] border-b sticky top-0 z-[100] px-4 pt-4 pb-3">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <SahiMedIcon className="w-10 h-10" />
            <div className="flex flex-col">
              <div className="flex items-center leading-none">
                <span className="font-black text-2xl text-primary tracking-tighter">Sahi</span>
                <span className="font-black text-2xl text-accent tracking-tighter">Med</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-6">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-primary transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="max-w-[80px] sm:max-w-none truncate">{location}</span>
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
              </PopoverTrigger>
              <PopoverContent sideOffset={8} className="w-64 p-4 rounded-[24px] shadow-2xl border-none">
                <Button 
                  onClick={handleGeoLocation} 
                  disabled={isLocating}
                  className="w-full justify-start gap-3 h-12 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[11px] tracking-wider"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  Use GPS location
                </Button>
              </PopoverContent>
            </Popover>

            <Link href="/cart" className="hidden sm:flex items-center gap-2 group">
              <div className="relative p-2 bg-gray-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-white h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-black rounded-full border-2 border-white">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] font-black tracking-widest text-gray-400 group-hover:text-primary">Cart</span>
            </Link>
          </div>
        </div>

        <div className="relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for medicines or generics"
                className="w-full pl-11 pr-12 h-11 text-[13px] font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-primary/20 bg-white border border-gray-100 rounded-xl shadow-sm"
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

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-3xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2">
              <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-2">
                {displayedSuggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.term)}
                    className="w-full px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-all text-left group"
                  >
                    <SearchIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-600 truncate flex-1">
                        {item.term}
                      </p>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-400 font-bold text-[9px] px-2 py-0.5 rounded-md border-none shrink-0">
                        {item.type}
                      </Badge>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}

                {suggestions.length > 5 && (
                  <button 
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-primary font-black text-[10px] tracking-widest hover:bg-gray-50 transition-colors border-t border-gray-50"
                  >
                    {expanded ? (
                      <>View less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>View more <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
                <span className="text-[10px] font-black text-gray-400 tracking-widest px-1">Recent products</span>
                {rawSuggestions.filter(p => p._type === 'medicine').slice(0, 2).map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => handleSuggestionClick(p.name)}
                    className="flex items-center gap-4 p-2 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0 p-1">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-gray-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[11px] text-gray-900 truncate">{p.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 truncate">{p.packSize || '10 Tablets'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-black text-accent">₹{p.price}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({ ...p, id: p._id || p.id, price: Number(p.liveData?.sahimed_price || p.price) });
                        }}
                        className="text-[9px] font-black text-primary border border-primary px-3 py-1 rounded-full mt-1 hover:bg-primary hover:text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
