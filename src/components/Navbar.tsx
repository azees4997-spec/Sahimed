
"use client"

import Link from 'next/link';
import { ShoppingCart, User, MapPin, ChevronDown, LocateFixed, Loader2, Search as SearchIcon, X, Info, Dna } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFirestore } from '@/firebase';
import { collection, query, limit, where, getDocs } from 'firebase/firestore';
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement>(null);
  const db = useFirestore();

  // Optimized Search Suggestions: High-efficiency dual-path lookup with strict read limits
  useEffect(() => {
    if (search.trim().length >= 2 && db) {
      setIsProcessing(true);
      const term = search.trim();
      
      // Standardize high-probability variants for Firestore prefix search
      // Dash-aware logic: "d-veniz" -> "D-Veniz"
      const vUpper = term.toUpperCase();
      const vProper = term.replace(/(^|[\s-])\S/g, (match) => match.toUpperCase());
      const vRaw = term;

      // READ REDUCTION: Only query essential variants to save reads
      const variants = Array.from(new Set([vProper, vUpper, vRaw])).filter(v => v.length >= 2);
      
      const fetchSuggestions = async () => {
        try {
          // 1. DIRECT PRODUCT NAME QUERIES (Strict limit of 5 per variant)
          const nameQueries = variants.map(v => 
            query(collection(db, 'medicines'), where('name', '>=', v), where('name', '<=', v + '\uf8ff'), limit(5))
          );

          // 2. CLINICAL SALT (MOLECULE) QUERIES (Strict limit of 5 per variant)
          const saltQueries = variants.map(v => 
            query(collection(db, 'moleculeMaster'), where('molecule', '>=', v), where('molecule', '<=', v + '\uf8ff'), limit(5))
          );

          // Parallel execution for lowest latency
          const [nameSnaps, saltSnaps] = await Promise.all([
            Promise.all(nameQueries.map(q => getDocs(q))),
            Promise.all(saltQueries.map(q => getDocs(q)))
          ]);

          const resultsMap = new Map();
          
          // Process Name Matches
          nameSnaps.forEach(snap => {
            snap.forEach(doc => {
              resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
          });

          // Process Salt Matches (Finding medicines linked to these molecules)
          const moleculeIds: string[] = [];
          const moleculeNameMap = new Map<string, string>();
          
          saltSnaps.forEach(snap => {
            snap.forEach(doc => {
              if (!moleculeNameMap.has(doc.id)) {
                moleculeIds.push(doc.id);
                moleculeNameMap.set(doc.id, doc.data().molecule);
              }
            });
          });

          if (moleculeIds.length > 0) {
            // READ REDUCTION: Strictly limit salt-based product lookup
            const medicinesBySaltQuery = query(
              collection(db, 'medicines'), 
              where('moleculeId', 'in', moleculeIds.slice(0, 5)), 
              limit(5)
            );
            const medBySaltSnap = await getDocs(medicinesBySaltQuery);
            
            medBySaltSnap.forEach(doc => {
              const data = doc.data();
              if (!resultsMap.has(doc.id)) {
                const moleculeName = moleculeNameMap.get(data.moleculeId);
                resultsMap.set(doc.id, { 
                  id: doc.id, 
                  ...data, 
                  // Inject the actual clinical salt name if missing in the medicine doc
                  saltComposition: data.saltComposition || moleculeName || data.category || 'Clinical Formula' 
                });
              }
            });
          }

          // FINAL LIMIT: Return exactly 5 unique suggestions to the UI as requested
          setSuggestions(Array.from(resultsMap.values()).slice(0, 5));
        } catch (error) {
          console.warn("Clinical discovery delay:", error);
        } finally {
          setIsProcessing(false);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsProcessing(false);
    }
  }, [search, db]);

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
      const q = search.trim();
      setSuggestions([]);
      setSearch('');
      setIsSearchExpanded(false);
      router.push(`/search?q=${encodeURIComponent(q)}`);
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
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-xl border-b safe-top pb-2 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-10">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2 sm:gap-6">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 active:scale-95 transition-transform group">
                <div className="bg-primary p-1.5 sm:p-2 rounded-xl shadow-lg group-hover:rotate-6 transition-transform shrink-0">
                  <div className="text-white font-black text-[10px] sm:text-sm tracking-tighter">SM</div>
                </div>
                <div className="hidden xs:flex flex-col items-start leading-none shrink-0">
                  <span className="font-black text-lg sm:text-2xl text-primary font-headline tracking-tighter">SahiMed</span>
                  <span className="text-[6px] sm:text-[7px] font-black text-primary/60 uppercase tracking-widest mt-0.5">sahi dawa sahi daam pe</span>
                </div>
              </Link>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] font-black text-gray-500 hover:text-primary p-2 h-auto rounded-xl bg-gray-50 border border-gray-100 uppercase tracking-widest transition-all active:scale-95 max-w-[100px] sm:max-w-none">
                    <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary shrink-0" />
                    <span className="truncate">{location}</span>
                    <ChevronDown className="w-2 h-2 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent sideOffset={12} className="w-72 p-5 rounded-[32px] shadow-3xl border-none animate-in slide-in-from-top-4 duration-500">
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

            <div className="flex items-center gap-1 sm:gap-2">
              {!isHomePage && (
                <button 
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className={cn(
                    "p-2 sm:p-2.5 hover:bg-gray-50 rounded-full active:scale-90 transition-all",
                    isSearchExpanded ? "text-primary bg-primary/5" : "text-gray-700"
                  )}
                >
                  {isSearchExpanded ? <X className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                </button>
              )}
              
              <Link href="/cart" className="relative p-2 sm:p-2.5 hover:bg-gray-50 rounded-full active:scale-90 transition-transform">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-accent text-white text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-full active:scale-90 transition-transform">
                <User className="w-5 h-5 text-gray-700" />
              </Link>
            </div>
          </div>

          <div className={cn(
            "pb-3 sm:pb-5 transition-all duration-500 ease-in-out overflow-visible",
            (isHomePage || isSearchExpanded) ? "max-h-[500px] opacity-100 mt-1 sm:mt-2" : "max-h-0 opacity-0 pointer-events-none"
          )} ref={suggestionRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search name or composition..."
                  className="w-full pl-10 sm:pl-12 pr-12 rounded-2xl sm:rounded-3xl border-[2px] border-primary focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 bg-white h-10 sm:h-12 font-black text-[10px] sm:text-xs shadow-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus={isSearchExpanded}
                />
                <SearchIcon className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-primary w-4 sm:w-5 h-4 sm:h-5" />
                
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isProcessing && (
                     <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  )}
                  <Button 
                    type="submit" 
                    size="sm"
                    className="rounded-xl sm:rounded-2xl h-7 sm:h-8 px-3 sm:px-4 font-black uppercase text-[8px] sm:text-[9px] tracking-widest shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Go
                  </Button>
                </div>
              </div>

              {search.trim().length >= 2 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-[24px] sm:rounded-[32px] shadow-3xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
                  {suggestions.length > 0 ? (
                    <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Clinical Matches</p>
                      </div>
                      {suggestions.map((p) => {
                        // Priority: Explicit composition -> Mapping from salt lookup -> Category
                        const displayComposition = p.saltComposition || p.category || 'Clinical Formula';
                        
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSearch('');
                              setSuggestions([]);
                              setIsSearchExpanded(false);
                              router.push(`/product/${p.id}`);
                            }}
                            className="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:bg-primary/5 transition-all border-b last:border-none text-left active:scale-[0.98]"
                          >
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 p-1 flex items-center justify-center">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                              ) : (
                                <Dna className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-[10px] sm:text-[11px] uppercase text-gray-900 truncate tracking-tight">{p.name}</p>
                              <p className="text-[8px] sm:text-[9px] font-bold text-primary uppercase tracking-widest truncate">
                                {displayComposition}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : !isProcessing ? (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                       <Info className="w-5 h-5 text-gray-200" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No clinical matches for "{search}"</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center gap-3">
                       <Loader2 className="w-6 h-6 text-primary animate-spin" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning clinical vault...</p>
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
