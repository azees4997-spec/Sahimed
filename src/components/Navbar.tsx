
"use client"

import Link from 'next/link';
import { ShoppingCart, User, MapPin, ChevronDown, LocateFixed, Loader2, Search as SearchIcon, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  const { totalItems, location, setLocation } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();

  // Fetch a larger set for client-side matching to ensure better "top match" accuracy
  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), limit(500));
  }, [db]);
  
  const { data: allMedicines } = useCollection(medicinesQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (search.trim().length > 0 && allMedicines) {
      const searchLower = search.toLowerCase();
      const filtered = allMedicines
        .filter(p => 
          (p.name?.toLowerCase().includes(searchLower)) || 
          (p.saltComposition?.toLowerCase().includes(searchLower))
        )
        .sort((a, b) => {
          // Prioritize results where the name STARTS with the search query
          const aNameStart = a.name?.toLowerCase().startsWith(searchLower);
          const bNameStart = b.name?.toLowerCase().startsWith(searchLower);
          
          if (aNameStart && !bNameStart) return -1;
          if (!aNameStart && bNameStart) return 1;
          
          // Secondary: Prioritize results where the salt composition starts with the query
          const aSaltStart = a.saltComposition?.toLowerCase().startsWith(searchLower);
          const bSaltStart = b.saltComposition?.toLowerCase().startsWith(searchLower);
          
          if (aSaltStart && !bSaltStart) return -1;
          if (!aSaltStart && bSaltStart) return 1;
          
          return 0;
        })
        .slice(0, 6); // Show top 6 matches
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [search, allMedicines]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        if (!isHomePage) setIsSearchExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHomePage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setSuggestions([]);
      setIsSearchExpanded(false);
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

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
              const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.road || 'Current Location';
              const city = data.address.city || data.address.town || data.address.village || '';
              setLocation(`${neighborhood}${city ? ', ' + city : ''}`);
            } else {
              setLocation(`Area (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
            }
            setIsPopoverOpen(false);
          } catch (e) {
            console.error("Geocoding failed:", e);
            setLocation("Unknown Location");
            setIsPopoverOpen(false);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error(error);
          setIsLocating(false);
          alert("Please enable location permissions.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      alert("Location not supported.");
    }
  };

  const manualLocations = ["Mumbai, MH", "Delhi, DL", "Bangalore, KA"];

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b safe-top pb-2 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
                <div className="bg-primary p-1.5 rounded-lg shadow-lg">
                  <div className="text-white font-black text-xs tracking-tighter">HL</div>
                </div>
                <span className="hidden sm:block font-black text-lg text-primary font-headline tracking-tight text-[18px]">HealthLink</span>
              </Link>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black text-gray-500 hover:text-primary p-2 h-auto rounded-xl bg-gray-50 border border-gray-100 uppercase tracking-widest max-w-[100px] sm:max-w-none transition-all active:scale-95">
                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{location}</span>
                    <ChevronDown className="w-2 h-2 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 rounded-3xl shadow-3xl border-none animate-in slide-in-from-top-4 duration-500">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleGeoLocation} 
                      disabled={isLocating}
                      className="w-full justify-start gap-3 h-12 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-transform"
                    >
                      {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                      Use GPS Location
                    </Button>
                    <div className="pt-2">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Saved Hubs</p>
                      {manualLocations.map((loc) => (
                        <Button 
                          key={loc} 
                          variant="ghost" 
                          className="w-full justify-start text-xs h-10 rounded-xl hover:bg-gray-50 font-bold active:scale-95 transition-transform" 
                          onClick={() => {
                            setLocation(loc);
                            setIsPopoverOpen(false);
                          }}
                        >
                          <MapPin className="w-3 h-3 mr-3 text-gray-300" />
                          {loc}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-1">
              {!isHomePage && (
                <button 
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className={cn(
                    "p-2 hover:bg-gray-50 rounded-full active:scale-90 transition-all",
                    isSearchExpanded ? "text-primary bg-primary/5" : "text-gray-700"
                  )}
                >
                  {isSearchExpanded ? <X className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                </button>
              )}
              
              <Link href="/cart" className="relative p-2 hover:bg-gray-50 rounded-full active:scale-90 transition-transform">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-md animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="p-2 hover:bg-gray-50 rounded-full active:scale-90 transition-transform">
                <User className="w-5 h-5 text-gray-700" />
              </Link>
            </div>
          </div>

          <div className={cn(
            "pb-3 px-1 transition-all duration-300 overflow-hidden",
            (isHomePage || isSearchExpanded) ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
          )} ref={suggestionRef}>
            <form onSubmit={handleSearch} className="relative group">
              <Input
                type="text"
                placeholder="Search products, brands or health needs..."
                className="w-full pl-12 pr-4 py-6 rounded-3xl border-[2.5px] border-primary focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all bg-white h-12 sm:h-14 font-black text-xs sm:text-sm shadow-xl shadow-primary/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus={isSearchExpanded}
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 group-focus-within:scale-110 transition-transform" />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-3xl border-none overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSearch('');
                        setSuggestions([]);
                        setIsSearchExpanded(false);
                        router.push(`/product/${p.id}`);
                      }}
                      className="w-full p-5 flex items-center gap-4 hover:bg-primary/5 transition-all border-b last:border-none text-left active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 p-1">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[11px] uppercase text-gray-900 truncate tracking-tight">{p.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{p.saltComposition}</p>
                      </div>
                    </button>
                  ))}
                  <div className="p-4 bg-gray-50 border-t">
                     <button 
                       onClick={handleSearch}
                       className="w-full py-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:text-primary/70 transition-colors"
                     >
                       View All Results for "{search}"
                     </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}
