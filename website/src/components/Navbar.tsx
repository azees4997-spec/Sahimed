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
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import MobileSearchOverlay from './MobileSearchOverlay';

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
  moleculeId?: string;
  product?: any;
}

export default function Navbar() {
  const { location, setLocation, totalItems, addToCart } = useCart();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const headerPagesQuery = useMemoFirebase(() => query(
    collection(db, 'pages'), 
    where('placement', 'in', ['header', 'both']),
    orderBy('lastUpdated', 'desc')
  ), [db]);
  const { data: headerPages } = useCollection(headerPagesQuery);
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOverlayOpen(true);
    window.addEventListener('open-mobile-search', handleOpenSearch);
    
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 120) {
        setScrolled(true);
      } else if (y < 20) {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-mobile-search', handleOpenSearch);
    };
  }, []);

  const logSearch = async (keyword: string) => {
    if (!user) return;
    try {
      // Fetch profile to get mobile
      const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid));
      const profile = profileSnap.data();
      
      await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          mobile: profile?.phone || user.phoneNumber || 'Unknown',
          userId: user.uid
        })
      });
    } catch (err) {
      console.error("Search analytics failure", err);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim().length >= 1) {
      logSearch(search.trim());
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    logSearch(item.term);
    if (item.type === 'Salt' && item.moleculeId) {
      router.push(`/search?moleculeId=${item.moleculeId}&q=${encodeURIComponent(item.term)}`);
    } else {
      router.push(`/product/${item.product?.id || item.id.replace('brand-', '').replace('mol-', '')}`);
    }
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
      const type = p._type || (p.molecule ? 'molecule' : 'medicine');
      const id = p.id;
      const name = p.name || p.molecule || '';
      const salt = p.saltComposition || p.composition || p.liveData?.composition || p.salt || '';
      const price = p.price || p.liveData?.sahimed_price || 0;
      const imageUrl = p.imageUrl || `https://picsum.photos/seed/${id}/200/200`;

      if (type === 'molecule') {
        if (name.toLowerCase().includes(term) && !seenTerms.has(`mol-${name}`)) {
          items.push({ 
            id: `mol-${id}`, 
            term: name, 
            type: 'Salt',
            moleculeId: id 
          } as any);
          seenTerms.add(`mol-${name}`);
        }
      } else {
        if (name.toLowerCase().includes(term) && !seenTerms.has(`brand-${name}`)) {
          items.push({ 
            id: `brand-${id}`, 
            term: name, 
            type: 'Brand',
            price,
            imageUrl,
            product: p 
          } as any);
          seenTerms.add(`brand-${name}`);
        }
        if (salt.toLowerCase().includes(term) && !seenTerms.has(`salt-${salt}`)) {
          items.push({ 
            id: `salt-${id}`, 
            term: salt, 
            type: 'Salt'
          } as any);
          seenTerms.add(`salt-${salt}`);
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
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        className={cn(
          "sticky top-0 z-[100] transition-all duration-500",
          scrolled ? "bg-white shadow-xl border-b border-slate-100" : "bg-transparent px-4 py-3 sm:py-4"
        )}
      >
        <div className="max-w-7xl mx-auto">
          {/* Main Container */}
          <div className={cn(
            "flex justify-between items-center transition-all duration-500",
            scrolled ? "bg-white px-4 py-3" : "bg-white/40 backdrop-blur-md p-2 rounded-full border border-white/40 shadow-sm overflow-hidden"
          )}>
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-1.5 group shrink-0 ml-1">
              <SahiMedIcon className="w-8 h-8 sm:w-11 sm:h-11 shadow-lg shadow-primary/20" />
              <div className="flex flex-col">
                <div className="flex items-center leading-none">
                  <span className={cn("font-black text-lg sm:text-2xl tracking-tight transition-colors", scrolled ? "text-slate-900" : "text-slate-900")}>Sahi</span>
                  <span className="font-black text-lg sm:text-2xl text-primary tracking-tight">Med</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-4 ml-4">
              {headerPages?.map((page: any) => (
                <Link key={page.id} href={`/p/${page.id}`} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                  {page.title}
                </Link>
              ))}
            </div>

            {/* Right Section: Location, Search (Mobile Trigger), & Cart */}
            <div className="flex items-center gap-2 sm:gap-3 pr-1">
              {/* Location Picker */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/60 hover:bg-white transition-all text-[10px] sm:text-xs font-black text-slate-600 border border-white/60 shadow-sm group">
                    <MapPin className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="max-w-[60px] sm:max-w-none truncate tracking-tight">{location}</span>
                    <ChevronDown className="w-3 3 h-3 opacity-40 shrink-0" />
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

              {/* Mobile Search Overlay Trigger */}
              <button 
                onClick={() => setIsSearchOverlayOpen(true)}
                className="lg:hidden flex items-center justify-center p-2.5 bg-white/60 backdrop-blur-md rounded-full border border-white/60 shadow-sm shrink-0 hover:bg-primary/5 active:scale-95 transition-all"
              >
                <SearchIcon className="w-5 h-5 text-primary" />
              </button>

              {/* Cart Button */}
              <Link href="/cart" className="flex items-center gap-2 group shrink-0">
                <div className="p-2.5 sm:p-3 bg-white/60 backdrop-blur-md rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-white/60 shadow-sm relative">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white h-4.5 min-w-[18px] sm:h-6 sm:min-w-[24px] flex items-center justify-center p-0 text-[8px] sm:text-[10px] font-black rounded-full border-2 border-white shadow-lg animate-bounce">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-primary transition-colors">Cart</span>
              </Link>
            </div>
          </div>

          {/* Desktop Search Section (Tier 2) */}
          <div className={cn(
            "relative w-full transition-all duration-300 hidden lg:block mt-4",
            scrolled ? "max-w-xl mx-auto" : ""
          )} ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <div className="relative group">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for medicines or generics"
                  className="w-full pl-14 pr-12 h-14 sm:h-16 text-sm sm:text-base font-bold bg-white border-slate-200 focus:border-primary/20 rounded-full shadow-2xl shadow-primary/5 transition-all outline-none"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.length >= 2) setShowSuggestions(true);
                  }}
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
                  className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-[24px] overflow-hidden z-[110] border border-slate-100 shadow-2xl"
                >
                  <div className="max-h-[40vh] sm:max-h-[500px] overflow-y-auto scrollbar-hide py-1 sm:py-2">
                    {displayedSuggestions.map((item) => (
                      <div 
                        key={item.id}
                        className="w-full px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group"
                      >
                        {item.type !== 'Salt' && (
                          <div className="relative w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-[10px] sm:rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border border-slate-100 overflow-hidden group-hover:scale-105 transition-transform">
                            <Image 
                              src={(item as any).imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                              alt={item.term} 
                              fill 
                              className="object-contain p-1 sm:p-1.5" 
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1 sm:gap-4">
                          <div className="flex-1 min-w-0" onClick={() => handleSuggestionClick(item)}>
                            <p className="font-extrabold text-xs sm:text-sm text-slate-800 truncate cursor-pointer hover:text-primary transition-colors">
                              {item.term}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[8px] px-1.5 py-0 rounded-md border-none uppercase tracking-widest shrink-0">
                                {item.type}
                              </Badge>
                              {(item as any).price > 0 && (
                                 <span className="text-[10px] sm:text-xs font-black text-primary">₹{(item as any).price}</span>
                              )}
                            </div>
                          </div>
                          {item.type === 'Brand' && (item as any).product && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart((item as any).product);
                                toast({ title: "Added to Basket" });
                              }}
                              className="h-7 sm:h-8 px-3 sm:px-5 rounded-full bg-primary text-white font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-fit"
                            >
                              Add +
                            </Button>
                          )}
                           {item.type === 'Salt' && (
                             <div className="flex items-center gap-2">
                               <Button 
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); handleSuggestionClick(item); }}
                                  className="h-7 sm:h-8 px-3 sm:px-4 rounded-full text-slate-500 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all gap-1 sm:gap-2 border border-slate-200 shrink-0"
                               >
                                  Browse <ArrowUpRight className="w-3 h-3" />
                               </Button>
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOverlayOpen && (
          <MobileSearchOverlay 
            isOpen={isSearchOverlayOpen} 
            onClose={() => setIsSearchOverlayOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
;
}
