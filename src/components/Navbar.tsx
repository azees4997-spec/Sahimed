"use client"

import Link from 'next/link';
import { Search as SearchIcon, MapPin, ChevronDown, LocateFixed, Loader2, ShoppingCart, Package, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
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
        fill="#F97316" 
      />
      <path 
        d="M80 45C80 70 60 80 50 80C65 65 68 45 68 25C68 10 55 0 45 0C70 0 80 15 80 45Z" 
        fill="#F97316" 
      />
      <path 
        d="M50 10C35 30 35 55 50 65C65 75 65 95 50 110C80 90 80 65 65 55C50 45 50 25 50 10Z" 
        fill="#0EA5E9" 
      />
      <path 
        d="M55 20C48 35 48 55 58 65C68 75 68 85 63 95C73 85 73 70 63 60C53 50 53 30 55 20Z" 
        fill="#CBD5E1" 
      />
    </svg>
  );
}

export default function Navbar() {
  const { location, setLocation, totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const db = useFirestore();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim().length >= 3) {
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
    if (!db || search.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      const term = search.trim();
      
      // Dash-aware Title Case (e.g., "d-veniz" -> "D-Veniz")
      const vProper = term.replace(/(^|[\s-])\S/g, (match) => match.toUpperCase());
      const vUpper = term.toUpperCase();
      const vRaw = term;
      const variants = Array.from(new Set([vProper, vUpper, vRaw])).filter(v => v.length >= 3);

      try {
        // Parallel queries across multiple variants
        const queries = variants.flatMap(v => [
          query(collection(db, 'medicines'), where('name', '>=', v), where('name', '<=', v + '\uf8ff'), limit(5)),
          query(collection(db, 'medicines'), where('saltComposition', '>=', v), where('saltComposition', '<=', v + '\uf8ff'), limit(5))
        ]);

        const snaps = await Promise.all(queries.map(q => getDocs(q)));

        const resultsMap = new Map();
        snaps.forEach(snap => {
          snap.forEach(doc => {
            resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        });

        setSuggestions(Array.from(resultsMap.values()).slice(0, 8));
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search, db]);

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
    <nav className="bg-white border-b sticky top-0 z-[100] px-4 pt-4 pb-3">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Row: Logo & Actions */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <SahiMedIcon className="w-10 h-10" />
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-black text-2xl text-[#0EA5E9] tracking-tighter leading-none">Sahi</span>
                <span className="font-black text-2xl text-[#F97316] tracking-tighter leading-none">Med</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-6">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-primary transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="max-w-[80px] sm:max-w-none truncate">{location}</span>
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
              </PopoverTrigger>
              <PopoverContent sideOffset={8} className="w-64 p-4 rounded-[24px] shadow-2xl border-none">
                <Button 
                  onClick={handleGeoLocation} 
                  disabled={isLocating}
                  className="w-full justify-start gap-3 h-12 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[11px] uppercase tracking-wider"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  Use GPS Location
                </Button>
              </PopoverContent>
            </Popover>

            {/* Desktop Cart Button */}
            <Link href="/cart" className="hidden sm:flex items-center gap-2 group">
              <div className="relative p-2 bg-gray-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-white h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-black rounded-full border-2 border-white">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary">Cart</span>
            </Link>
          </div>
        </div>

        {/* Search Row */}
        <div className="relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for medicines or generics (min 3 chars)"
                className="w-full pl-11 pr-12 rounded-xl border-none bg-[#F1F5F9] h-11 text-[13px] font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-primary/20"
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

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Clinical Matches</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.name)}
                    className="w-full px-4 py-3 flex items-center gap-4 hover:bg-primary/5 transition-all text-left border-b last:border-none group"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex-shrink-0 border flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[11px] uppercase text-gray-900 truncate tracking-tight">{item.name}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">
                        {item.saltComposition}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handleSearch()}
                className="w-full p-3 text-center bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">View Full Catalog</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
