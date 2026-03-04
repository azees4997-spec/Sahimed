
"use client"

import Link from 'next/link';
import { ShoppingCart, User, MapPin, ChevronDown, LocateFixed, Loader2, Search as SearchIcon, X, Info } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), limit(1000));
  }, [db]);
  
  const { data: allMedicines, isLoading: medsLoading } = useCollection(medicinesQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (search.trim().length > 0 && allMedicines) {
      setIsProcessing(true);
      const searchLower = search.toLowerCase();
      
      const timer = setTimeout(() => {
        const filtered = allMedicines
          .filter(p => 
            (p.name?.toLowerCase().includes(searchLower)) || 
            (p.saltComposition?.toLowerCase().includes(searchLower))
          )
          .sort((a, b) => {
            const aNameStart = a.name?.toLowerCase().startsWith(searchLower);
            const bNameStart = b.name?.toLowerCase().startsWith(searchLower);
            if (aNameStart && !bNameStart) return -1;
            if (!aNameStart && bNameStart) return 1;
            return 0;
          })
          .slice(0, 8); 
          
        setSuggestions(filtered);
        setIsProcessing(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsProcessing(false);
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
            setLocation("Unknown Location");
            setIsPopoverOpen(false);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b safe-top pb-2 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
                <div className="bg-primary p-2 rounded-xl shadow-lg group-hover:rotate-6 transition-transform">
                  <div className="text-white font-black text-sm tracking-tighter">SM</div>
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="font-black text-2xl text-primary font-headline tracking-tighter">SahiMed</span>
                  <span className="text-[7px] font-black text-primary/60 uppercase tracking-widest mt-0.5">sahi dawa sahi daam pe</span>
                </div>
              </Link>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-primary p-2.5 h-auto rounded-xl bg-gray-50 border border-gray-100 uppercase tracking-widest transition-all active:scale-95">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate max-w-[120px]">{location}</span>
                    <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-5 rounded-[32px] shadow-3xl border-none animate-in slide-in-from-top-4 duration-500">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleGeoLocation} 
                      disabled={isLocating}
                      className="w-full justify-start gap-3 h-14 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                    >
                      {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                      Use GPS Location
                    </Button>
                    <div className="pt-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Saved Delivery Hubs</p>
                      {["Mumbai, MH", "Delhi, DL", "Bangalore, KA"].map((loc) => (
                        <Button 
                          key={loc} 
                          variant="ghost" 
                          className="w-full justify-start text-xs h-12 rounded-xl hover:bg-gray-50 font-bold active:scale-95 transition-transform" 
                          onClick={() => {
                            setLocation(loc);
                            setIsPopoverOpen(false);
                          }}
                        >
                          <MapPin className="w-3.5 h-3.5 mr-3 text-gray-300" />
                          {loc}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              {!isHomePage && (
                <button 
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className={cn(
                    "p-2.5 hover:bg-gray-50 rounded-full active:scale-90 transition-all",
                    isSearchExpanded ? "text-primary bg-primary/5" : "text-gray-700"
                  )}
                >
                  {isSearchExpanded ? <X className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                </button>
              )}
              
              <Link href="/cart" className="relative p-2.5 hover:bg-gray-50 rounded-full active:scale-90 transition-transform">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-md animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="p-2.5 hover:bg-gray-50 rounded-full active:scale-90 transition-transform">
                <User className="w-5 h-5 text-gray-700" />
              </Link>
            </div>
          </div>

          <div className={cn(
            "pb-5 transition-all duration-500 ease-in-out overflow-visible",
            (isHomePage || isSearchExpanded) ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
          )} ref={suggestionRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search medicines or health needs..."
                  className="w-full pl-12 pr-12 rounded-3xl border-[2px] border-primary focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 bg-white h-12 font-black text-xs shadow-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus={isSearchExpanded}
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {(isProcessing || medsLoading) && (
                     <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  )}
                  <Button 
                    type="submit" 
                    size="sm"
                    className="rounded-2xl h-8 px-4 font-black uppercase text-[9px] tracking-widest shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Search
                  </Button>
                </div>
              </div>

              {search.trim().length > 0 && !isProcessing && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-3xl border-none overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
                  {suggestions.length > 0 ? (
                    <>
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
                          <div className="text-primary font-black text-[10px] bg-primary/5 px-3 py-1 rounded-full shrink-0">₹{p.price}</div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="p-10 text-center">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No exact matches found</p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}
