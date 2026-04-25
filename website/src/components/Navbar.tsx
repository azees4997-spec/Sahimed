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
import { usePathname } from 'next/navigation';
import { Product } from '@/types';

export function SahiMedIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center bg-transparent", className)}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <linearGradient id="cross-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(221 83% 65%)" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
          <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(346 84% 75%)" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Translucent Base Layer for Glass Effect */}
        <rect x="38" y="15" width="24" height="70" rx="12" fill="hsl(var(--primary))" opacity="0.15" />
        <rect x="15" y="38" width="70" height="24" rx="12" fill="hsl(var(--primary))" opacity="0.15" />

        {/* Main Medical Cross (Blue) */}
        <rect x="40" y="18" width="20" height="64" rx="10" fill="url(#cross-grad)" />
        <rect x="18" y="40" width="64" height="20" rx="10" fill="url(#cross-grad)" />

        {/* Premium Checkmark (Pink) */}
        <path 
          d="M30 55 L45 70 L85 25" 
          stroke="url(#check-grad)" 
          strokeWidth="15" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-lg"
        />
        
        {/* Glass Shine Overlay */}
        <path 
          d="M34 55 L45 66 L80 30" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          opacity="0.4" 
        />
        
        {/* Subtle Highlight on Cross Arms */}
        <rect x="42" y="20" width="6" height="20" rx="3" fill="white" opacity="0.2" />
        <rect x="20" y="42" width="20" height="6" rx="3" fill="white" opacity="0.2" />
      </svg>
    </div>
  );
}

interface SuggestionItem {
  id: string;
  term: string;
  type: 'Brand' | 'Salt';
  moleculeId?: string;
  product?: Product;
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
  const [locationResolved, setLocationResolved] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOverlayOpen(true);
    window.addEventListener('open-mobile-search', handleOpenSearch);
    
    const handleScroll = () => {
      const y = window.scrollY;
      if (isHome) {
        setScrolled(y > 50);
      } else {
        setScrolled(y > 20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-mobile-search', handleOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (search.trim().length >= 3 && search.trim().length <= 15) {
      const timer = setTimeout(() => {
        logSearch(search.trim());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const logSearch = async (keyword: string) => {
    try {
      const profileSnap = user ? await getDoc(doc(db, 'userProfiles', user.uid)) : null;
      const profile = profileSnap?.data();
      
      await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          mobile: profile?.phone || user?.phoneNumber || 'Anonymous',
          userId: user?.uid || null
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
    if (item.type === 'Salt') {
      // For Salts/Molecules, go to search results. If we have a moleculeId, use it and drop the 'q' to avoid conflicts.
      if (item.moleculeId) {
        router.push(`/search?moleculeId=${item.moleculeId}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(item.term)}`);
      }
    } else {
      // For Brands (medicines), go to the product page.
      const productId = item.product?._id || item.product?.id || item.id.replace('brand-', '').replace('mol-', '').replace('salt-', '');
      router.push(`/product/${productId}`);
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
    const seenCompositionTerms = new Set<string>();
    const seenBrandTerms = new Set<string>();

    rawSuggestions.forEach(p => {
      const type = p._type || (p.molecule ? 'molecule' : 'medicine');
      const id = p._id || p.id;
      const name = p.name || p.molecule || '';
      const salt = p.saltComposition || p.composition || p.liveData?.composition || p.salt || '';
      const price = p.price || p.liveData?.sahimed_price || 0;
      const imageUrl = p.imageUrl || `https://picsum.photos/seed/${id}/200/200`;

      if (type === 'molecule') {
        const compKey = name.toLowerCase().trim();
        if (name.toLowerCase().includes(term) && !seenCompositionTerms.has(compKey)) {
          items.push({ 
            id: `mol-${id}`, 
            term: name, 
            type: 'Salt',
            moleculeId: id 
          } as any);
          seenCompositionTerms.add(compKey);
        }
      } else {
        // Handle Brand Match
        if (name.toLowerCase().includes(term) && !seenBrandTerms.has(name.toLowerCase())) {
          items.push({ 
            id: `brand-${id}`, 
            term: name, 
            type: 'Brand',
            price,
            imageUrl,
            product: p 
          } as any);
          seenBrandTerms.add(name.toLowerCase());
        }
        
        // Handle Salt/Composition Match from Medicine
        if (salt.toLowerCase().includes(term)) {
          const compKey = salt.toLowerCase().trim();
          if (!seenCompositionTerms.has(compKey)) {
            items.push({ 
              id: `salt-${id}`, 
              term: salt, 
              type: 'Salt'
            } as any);
            seenCompositionTerms.add(compKey);
          }
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
              const addr = data.address;
              const streetArea = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || '';
              const city = addr.city || addr.town || addr.state_district || addr.state || '';
              const formatted = streetArea && city
                ? `${streetArea}, ${city}`
                : streetArea || city || 'Current Location';
              
              const detectedPincode = addr.postcode?.replace(/\s/g, '');
              
              if (detectedPincode) {
                try {
                  const res = await fetch('/api/logistics/velocity/serviceability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toPincode: detectedPincode })
                  });
                  const velocityData = await res.json();
                  if (!velocityData.serviceable) {
                    toast({ variant: 'destructive', title: "Not Serviceable", description: `We currently do not deliver to your detected location (${detectedPincode}).` });
                    setIsLocating(false);
                    return;
                  }
                } catch(e) {
                  console.error("Velocity check failed", e);
                }
              }

              setLocation(formatted);
              setLocationResolved(true);
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
          scrolled 
            ? "bg-white shadow-xl border-b border-slate-100" 
            : isHome 
              ? "bg-transparent" 
              : "bg-white/40 backdrop-blur-md"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-4">
          {/* Main Container */}
          <div className={cn(
            "flex justify-between items-center transition-all duration-500",
            scrolled ? "bg-transparent" : "bg-transparent"
          )}>
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-1.5 group shrink-0 ml-1">
              <SahiMedIcon className="w-8 h-8 sm:w-11 sm:h-11 shadow-lg shadow-primary/10 rounded-xl" />
              <div className="flex flex-col ml-1">
                <div className="flex items-center leading-none">
                  <span className={cn("font-black text-lg sm:text-2xl tracking-tight transition-colors", scrolled ? "text-slate-900" : "text-slate-900")}>Sahi</span>
                  <span className="font-black text-lg sm:text-2xl text-primary tracking-tight">Med</span>
                </div>
                <span className="text-[7.5px] sm:text-[9px] font-black text-slate-500 tracking-[0.15em] uppercase mt-0.5">Sahi dawai sahi daam pe</span>
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
            <div className="flex items-center gap-2 sm:gap-4 pr-1">
              {/* Location Picker (Mobile: Show simplified or icon only if needed, but keeping text for clarity) */}
              {locationResolved ? (
                // Static pill — shown after location is resolved (button hidden)
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9.5px] font-black border",
                  scrolled 
                    ? "bg-slate-50 border-slate-100 text-slate-600 shadow-sm" 
                    : isHome 
                      ? "bg-white/40 border-slate-200/50 text-slate-800 shadow-sm" 
                      : "bg-white/60 border-white/60 text-slate-600 shadow-sm"
                )}>
                  <MapPin className={cn("w-3 h-3", scrolled || isHome ? "text-primary" : "text-white")} />
                  <span className="max-w-[100px] truncate tracking-tight">{location}</span>
                </div>
              ) : (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[9.5px] font-black group border",
                      scrolled 
                        ? "bg-slate-50 border-slate-100 text-slate-600 shadow-sm" 
                        : isHome 
                          ? "bg-white/40 border-slate-200/50 text-slate-800 shadow-sm" 
                          : "bg-white/60 border-white/60 text-slate-600 shadow-sm"
                    )}>
                      <MapPin className={cn("w-3 h-3 transition-transform", scrolled || isHome ? "text-primary" : "text-white")} />
                      <span className="max-w-[70px] truncate tracking-tight">{location}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent sideOffset={12} className="w-72 p-5 rounded-[32px] shadow-3xl border border-white/50 glass space-y-3">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Enter Pincode</p>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. 560001" 
                          id="pincode-input"
                          maxLength={6}
                          className="h-12 rounded-xl bg-slate-50 border-none font-black tracking-widest text-xs"
                        />
                        <Button 
                          onClick={async () => {
                            const input = document.getElementById('pincode-input') as HTMLInputElement;
                            if (input && input.value.length === 6) {
                              setIsLocating(true);
                              try {
                                const res = await fetch('/api/logistics/velocity/serviceability', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ toPincode: input.value })
                                });
                                const data = await res.json();
                                if (data.serviceable) {
                                  setLocation(`PIN: ${input.value}`);
                                  setLocationResolved(true);
                                  setIsPopoverOpen(false);
                                  toast({ title: "Location updated" });
                                } else {
                                  toast({ variant: 'destructive', title: "Not Serviceable", description: "We currently do not deliver to this pincode." });
                                }
                              } catch(e) {
                                toast({ variant: 'destructive', title: "Error", description: "Could not verify serviceability." });
                              } finally {
                                setIsLocating(false);
                              }
                            }
                          }}
                          disabled={isLocating}
                          className="h-12 w-12 shrink-0 rounded-xl bg-primary text-white"
                        >
                          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <div className="relative flex justify-center"><span className="bg-white px-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">OR</span></div>
                    </div>

                    <Button 
                      onClick={handleGeoLocation} 
                      disabled={isLocating}
                      className="w-full justify-start gap-3 h-14 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-xs tracking-widest uppercase shadow-xl shadow-primary/20"
                    >
                      {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                      Locate Me
                    </Button>
                  </PopoverContent>
                </Popover>
              )}

              {/* Mobile Search Overlay Trigger */}
              <button 
                onClick={() => setIsSearchOverlayOpen(true)}
                className={cn(
                  "flex items-center justify-center p-2 rounded-full border transition-all h-9 w-9",
                  scrolled 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : isHome 
                      ? "bg-white/80 text-primary border-slate-200/50 shadow-sm" 
                      : "bg-primary/10 text-primary border-primary/20"
                )}
              >
                <SearchIcon className="w-4 h-4" />
              </button>

              {/* Cart Button */}
              <Link href="/cart" className="flex items-center group shrink-0">
                <div className={cn(
                  "p-2 rounded-full transition-all duration-500 border relative h-9 w-9 flex items-center justify-center",
                  scrolled 
                    ? "bg-slate-100 text-slate-900 border-slate-200" 
                    : isHome 
                      ? "bg-white text-primary border-white" 
                      : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <ShoppingCart className="w-4 h-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white h-4 min-w-[16px] flex items-center justify-center text-[8px] font-black rounded-full border-2 border-white shadow-lg">
                      {totalItems}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop Search Section (Tier 2) - Hidden for premium look */}
          <div className={cn(
            "relative w-full transition-all duration-300 hidden mt-4",
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
}
