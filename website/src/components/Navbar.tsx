"use client"

import Link from 'next/link';
import { Search as SearchIcon, MapPin, ChevronDown, LocateFixed, Loader2, ShoppingCart, Package, ArrowUpRight, ChevronUp, User, ChevronRight, Wallet, Plus, LogOut, HeartPulse, Sparkles, History, TrendingUp, X, Command } from 'lucide-react';

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
import dynamic from 'next/dynamic';
const MobileSearchOverlay = dynamic(() => import('./MobileSearchOverlay'), { ssr: false });
import { usePathname } from 'next/navigation';
import { Product } from '@/types';
import SahiMedLogo from './SahiMedLogo';

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
  const { location, setLocation, totalItems, addToCart, importSharedCart } = useCart();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // [COST FIX] Pages fetched once via API with 10-min cache instead of
  // a real-time Firestore listener running for every website visitor.
  const [headerPages, setHeaderPages] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shareCartParam = params.get('shareCart');
      if (shareCartParam) {
        importSharedCart(shareCartParam);
        // Clean query param
        params.delete('shareCart');
        const newQuery = params.toString() ? `?${params.toString()}` : '';
        window.history.replaceState(null, '', `${window.location.pathname}${newQuery}`);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/pages')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!cancelled) {
          const pages = Array.isArray(data) ? data : (data.pages || []);
          setHeaderPages(pages.filter((p: any) => p.placement === 'header' || p.placement === 'both'));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const addressesQuery = useMemoFirebase(() => user ? query(
    collection(db, 'userProfiles', user.uid, 'addresses'),
    orderBy('isDefault', 'desc')
  ) : null, [db, user]);
  const { data: savedAddresses } = useCollection(addressesQuery);

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
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Search UX Enhancements (Heart of SahiMed)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const SEARCH_PLACEHOLDERS = [
    "Search 'Dolo 650' or Paracetamol...",
    "Search medicines, brands, salts...",
    "Search 'Augmentin 625 Duo'...",
    "Search generic salts & save up to 70%...",
    "Search 'Metformin 500mg'...",
    "Search 'Vitamin C & Zinc'..."
  ];

  const TRENDING_SEARCHES = [
    { term: 'Dolo 650', type: 'Medicine', icon: '🔥' },
    { term: 'Paracetamol', type: 'Generic Salt', icon: '💊' },
    { term: 'Multivitamins', type: 'Supplement', icon: '🛡️' },
    { term: 'Amoxicillin', type: 'Antibiotic', icon: '⚡' },
    { term: 'Metformin', type: 'Diabetes', icon: '🩸' },
    { term: 'Omeprazole', type: 'Antacid', icon: '🩺' }
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sahimed_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addRecentSearch = (term: string) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('sahimed_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
      try {
        localStorage.setItem('sahimed_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('sahimed_recent_searches');
    } catch (e) {}
  };
  
  // Mega Ribbon State
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({});
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/categories?limit=1000')
      .then(res => res.json())
      .then(data => {
        if (!cancelled && Array.isArray(data)) {
          const catMap: Record<string, Set<string>> = {};
          data.forEach(item => {
            if (item.category && item.sub_category) {
              if (!catMap[item.category]) catMap[item.category] = new Set();
              catMap[item.category].add(item.sub_category);
            }
          });
          
          const formattedMap: Record<string, string[]> = {};
          const counts: {cat: string, count: number}[] = [];
          Object.keys(catMap).forEach(cat => {
            const arr = Array.from(catMap[cat]);
            formattedMap[cat] = arr;
            counts.push({ cat, count: arr.length });
          });

          // Sort by number of subcategories, take top 8
          counts.sort((a, b) => b.count - a.count);
          const top8 = counts.slice(0, 8).map(c => c.cat);
          
          setCategoriesMap(formattedMap);
          setTopCategories(top8);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const [newAddress, setNewAddress] = useState({
    houseNumber: '',
    street: '',
    city: '',
    pincode: '',
    tag: 'Home'
  });
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
    if (search.trim().length >= 3) {
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
      
      // Extract location data from cart context if available
      let lat = null;
      let lng = null;
      let pincode = null;

      if (location && location.includes('PIN:')) {
        pincode = location.replace('PIN:', '').trim();
      }

      await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          mobile: profile?.phone || user?.phoneNumber || 'Anonymous',
          userId: user?.uid || null,
          lat,
          lng,
          pincode,
          platform: 'web',
          resultsCount: rawSuggestions.length
        })
      });
    } catch (err) {
      console.error("Search analytics failure", err);
    }
  };


  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim().length >= 1) {
      addRecentSearch(search.trim());
      logSearch(search.trim());
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    addRecentSearch(item.term);
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
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || addr.city_district || addr.state_district || 'Current Location';
              const state = addr.state || '';
              
              const formatted = state ? `${city}, ${state}` : city;
              
              const detectedPincode = addr.postcode?.replace(/\s/g, '');
              
              if (detectedPincode) {
                try {
                  const res = await fetch('/api/logistics/shipway/serviceability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toPincode: detectedPincode })
                  });
                  const shipwayData = await res.json();
                  if (!shipwayData.serviceable) {
                    toast({ variant: 'destructive', title: "Not Serviceable", description: `We currently do not deliver to your detected location (${detectedPincode}).` });
                    setIsPopoverOpen(false);
                    setIsLocating(false);
                    return;
                  }
                } catch(e) {
                  console.error("Shipway check failed", e);
                }
              }

              setLocation(formatted);
              setLocationResolved(true);
              toast({ title: "Location detected", description: `Delivering to ${formatted}` });
            }
          } catch (e) {
            console.error("Locating failed", e);
            toast({ variant: 'destructive', title: "Error", description: "Could not detect location automatically." });
          } finally {
            setIsLocating(false);
            setIsPopoverOpen(false);
          }
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <>
      <nav 
        className={cn(
          "sticky top-0 z-[100] transition-all duration-300 w-full bg-white border-b border-slate-100 shadow-sm",
          scrolled ? "py-1 sm:py-1.5" : "py-1.5 sm:py-2.5"
        )}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Main Container */}
          <div className="flex justify-between items-center transition-all duration-500">
            {/* Logo Section — Top Left Corner */}
            <Link href="/" className="group shrink-0">
              <SahiMedLogo placement="nav" />
            </Link>

            {/* ── MIDDLE SEARCH BAR (Heart of SahiMed - Modern, Glowing & Interactive) ── */}
            <div className="flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl mx-3 sm:mx-6 relative hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="relative group transition-all duration-300">
                  {/* Ambient Glow Aura */}
                  <div className={cn(
                    "absolute -inset-0.5 rounded-full bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 opacity-25 group-hover:opacity-60 transition-all duration-500 blur-[3px]",
                    isFocused ? "opacity-100 blur-[5px]" : ""
                  )} />

                  <div className="relative flex items-center bg-white rounded-full border border-slate-200 group-focus-within:border-teal-500 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
                    {/* Left Icon with Heartbeat Pulse */}
                    <div className="pl-4 pr-1.5 flex items-center gap-1.5 shrink-0 select-none">
                      <div className="relative flex items-center justify-center">
                        <HeartPulse className="w-4 h-4 text-teal-600 animate-pulse" />
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                    </div>

                    {/* Input Field + Rotating Placeholder */}
                    <div className="relative flex-1 h-11 flex items-center overflow-hidden">
                      <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => {
                          setIsFocused(true);
                          setShowSuggestions(true);
                        }}
                        onBlur={() => setIsFocused(false)}
                        className="w-full h-full bg-transparent pl-1.5 pr-2 text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder-transparent z-10"
                      />

                      {/* Rotating Animated Placeholder when search is empty */}
                      {!search && (
                        <div className="absolute left-1.5 inset-y-0 flex items-center pointer-events-none z-0 overflow-hidden pr-2">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={placeholderIndex}
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -10, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="text-xs sm:text-sm font-medium text-slate-400 truncate flex items-center gap-1.5"
                            >
                              <span>{SEARCH_PLACEHOLDERS[placeholderIndex]}</span>
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Action Controls Right */}
                    <div className="flex items-center gap-2 pr-1 shrink-0 z-10">
                      {search && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            inputRef.current?.focus();
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!search && (
                        <div className="hidden xl:flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-400 select-none">
                          <Command className="w-2.5 h-2.5" />
                          <span>K</span>
                        </div>
                      )}

                      {isSearching ? (
                        <div className="px-4 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                        </div>
                      ) : (
                        <Button 
                          type="submit"
                          className="h-9 px-5 rounded-full text-white font-black text-[11px] uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-teal-500/25 hover:scale-[1.03] active:scale-95 flex items-center gap-1.5 group/btn"
                          style={{
                            background: 'linear-gradient(135deg, #009F9C 0%, #059669 100%)',
                            boxShadow: '0 3px 12px rgba(0, 159, 156, 0.35)'
                          }}
                        >
                          <SearchIcon className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Search</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Autocomplete & Smart Search Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-[24px] overflow-hidden z-[110] border border-slate-100 shadow-2xl"
                  >
                    {/* CASE 1: INPUT IS EMPTY -> Show Recent Searches & Trending Medicines */}
                    {!search.trim() ? (
                      <div className="p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto scrollbar-hide">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5 text-teal-600" /> Recent Searches
                              </span>
                              <button 
                                onClick={clearAllRecent}
                                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {recentSearches.map((term, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setSearch(term);
                                    handleSearch();
                                  }}
                                  className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-200 rounded-full text-xs font-bold text-slate-700 hover:text-teal-900 cursor-pointer transition-all shadow-2xs"
                                >
                                  <History className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
                                  <span>{term}</span>
                                  <span
                                    onClick={(e) => removeRecentSearch(term, e)}
                                    className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending Searches */}
                        <div className="space-y-2">
                          <div className="px-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Popular & Trending Searches
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {TRENDING_SEARCHES.map((item, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setSearch(item.term);
                                  handleSearch();
                                }}
                                className="flex items-center justify-between p-2.5 bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 rounded-2xl cursor-pointer transition-all group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm shrink-0">{item.icon}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">{item.term}</p>
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{item.type}</p>
                                  </div>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Generic Savings Tip Banner */}
                        <div className="p-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                            💡
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Smart Medicine Tip</p>
                            <p className="text-xs font-medium text-slate-600">
                              Search by generic chemical/salt name to discover lower-cost alternatives and save up to <span className="font-bold text-teal-700">70% OFF</span>!
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : suggestions.length > 0 ? (
                      /* CASE 2: INPUT TYPED -> Suggestions List */
                      <div className="max-h-[500px] overflow-y-auto scrollbar-hide grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
                        {/* Suggestions list */}
                        <div className="sm:col-span-5 bg-slate-50/30">
                          <div className="px-5 py-3 border-b border-slate-100/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> Suggestions
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100/50">
                            {suggestions.map((item) => (
                              <div 
                                key={item.id}
                                onClick={() => handleSuggestionClick(item)}
                                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white transition-all group cursor-pointer"
                              >
                                <SearchIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  <span className="font-extrabold text-[12px] text-slate-700 truncate group-hover:text-slate-900 transition-colors uppercase">
                                    {item.term}
                                  </span>
                                  <Badge variant="secondary" className="text-[8px] bg-slate-100 text-slate-400 font-bold border-none uppercase h-4 px-1">
                                    {item.type === 'Salt' ? 'Molecule' : 'Brand'}
                                  </Badge>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-teal-600 transition-all opacity-0 group-hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Instant Top Matches */}
                        <div className="sm:col-span-7 bg-white">
                          <div className="px-5 py-3 border-b border-slate-100/50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Top Matches
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100/50 max-h-[380px] overflow-y-auto">
                            {displayedSuggestions.filter(s => s.type === 'Brand').length > 0 ? (
                              displayedSuggestions.filter(s => s.type === 'Brand').map((item) => (
                                <div 
                                  key={`prod-${item.id}`}
                                  className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-all group"
                                >
                                  <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 overflow-hidden group-hover:scale-105 transition-transform">
                                    <Image 
                                      src={(item as any).imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                                      alt={item.term} 
                                      fill 
                                      className="object-contain p-1" 
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSuggestionClick(item)}>
                                      <p className="font-extrabold text-[13px] text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                        {item.term}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {(item as any).price > 0 && (
                                          <span className="text-[13px] font-black text-slate-900">₹{(item as any).price}</span>
                                        )}
                                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                          60% OFF
                                        </span>
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart((item as any).product);
                                        toast({ title: "Added to Basket" });
                                      }}
                                      variant="outline"
                                      className="h-8 px-4 rounded-xl border-teal-500/20 text-teal-700 hover:bg-teal-600 hover:text-white font-black text-[9px] uppercase tracking-widest shadow-sm transition-all"
                                    >
                                      Add +
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-12 text-center space-y-2 opacity-40">
                                 <Package className="w-6 h-6 text-slate-300 mx-auto" />
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search for products</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Section: Location, Search (Mobile Trigger), & Cart */}
            <div className="flex items-center gap-2 sm:gap-4 pr-1">
              {/* Location Picker (Mobile: Show simplified or icon only if needed, but keeping text for clarity) */}
              {locationResolved ? (
                // Static pill — shown after location is resolved (button hidden)
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="max-w-[100px] truncate tracking-tight">{location}</span>
                </div>
              ) : (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-[10px] font-black group border bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                      <span className="max-w-[80px] truncate tracking-tight">{location}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent sideOffset={12} className="w-85 p-6 rounded-[32px] shadow-3xl border border-white/50 glass space-y-4">
                    <AnimatePresence mode="wait">
                      {!isAddingAddress ? (
                        <motion.div 
                          key="list"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Delivery Location</p>
                            {user && (
                              <button 
                                onClick={() => setIsAddingAddress(true)} 
                                className="text-[9px] font-black text-primary uppercase hover:underline"
                              >
                                Add New +
                              </button>
                            )}
                          </div>

                          {/* Saved Addresses List */}
                          {user ? (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                              {savedAddresses && savedAddresses.length > 0 ? (
                                savedAddresses.map((addr: any) => (
                                  <button
                                    key={addr.id}
                                    onClick={() => {
                                      const formatted = `${addr.houseNumber}, ${addr.street}, ${addr.city}`;
                                      setLocation(formatted);
                                      setLocationResolved(true);
                                      setIsPopoverOpen(false);
                                      toast({ title: "Address selected", description: `Delivering to ${addr.tag || 'Home'}` });
                                    }}
                                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group border border-transparent hover:border-slate-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <MapPin className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{addr.tag || 'Address'}</p>
                                        <p className="text-[9px] text-slate-500 truncate">{addr.houseNumber}, {addr.street}, {addr.city}</p>
                                      </div>
                                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="text-center py-6 space-y-3">
                                  <p className="text-[9px] text-slate-400 uppercase font-black">No saved addresses</p>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsAddingAddress(true)}
                                    className="rounded-full text-[8px] font-black uppercase tracking-widest h-8"
                                  >
                                    Create One Now
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                              <p className="text-[10px] font-bold text-blue-600">Login to see your saved addresses</p>
                            </div>
                          )}

                          <Button 
                            onClick={() => setIsAddingAddress(true)}
                            className="w-full justify-start gap-4 h-14 rounded-2xl bg-slate-50 text-slate-800 hover:bg-slate-100 font-black text-xs tracking-widest uppercase border border-slate-100"
                          >
                            <Plus className="w-5 h-5 text-primary" />
                            Add New Address
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="form"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <button onClick={() => setIsAddingAddress(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                              <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                            <p className="text-[10px] font-black tracking-widest text-slate-800 uppercase">New Address</p>
                            <div className="w-6" />
                          </div>

                          <button
                            onClick={async () => {
                              if (!navigator.geolocation) {
                                toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
                                return;
                              }
                              setIsLocating(true);
                              navigator.geolocation.getCurrentPosition(async (pos) => {
                                try {
                                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                                  const data = await res.json();
                                  if (data.address) {
                                    setNewAddress({
                                      ...newAddress,
                                      houseNumber: data.address.suburb || data.address.neighbourhood || '',
                                      street: data.address.road || '',
                                      city: data.address.city || data.address.town || '',
                                      pincode: data.address.postcode || ''
                                    });
                                    toast({ title: "Location Detected", description: "Address fields have been populated." });
                                  }
                                } finally {
                                  setIsLocating(false);
                                }
                              }, () => {
                                setIsLocating(false);
                                toast({ title: "Error", description: "Location access denied", variant: "destructive" });
                              });
                            }}
                            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-black text-[10px] tracking-widest uppercase"
                          >
                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                            Use Current Location
                          </button>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5 col-span-2">
                              <Input 
                                placeholder="House / Flat No." 
                                value={newAddress.houseNumber}
                                onChange={(e) => setNewAddress({...newAddress, houseNumber: e.target.value})}
                                className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px]" 
                              />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                              <Input 
                                placeholder="Street / Area Name" 
                                value={newAddress.street}
                                onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                                className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px]" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Input 
                                placeholder="City" 
                                value={newAddress.city}
                                onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                                className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px]" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Input 
                                placeholder="Pincode" 
                                maxLength={6}
                                value={newAddress.pincode}
                                onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                                className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px]" 
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {['Home', 'Office', 'Other'].map((tag) => (
                              <button
                                key={tag}
                                onClick={() => setNewAddress({...newAddress, tag})}
                                className={cn(
                                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                  newAddress.tag === tag 
                                    ? "bg-primary text-white border-primary shadow-md" 
                                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                                )}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>

                          <Button 
                            disabled={isLocating || !newAddress.houseNumber || !newAddress.pincode}
                            onClick={async () => {
                              setIsLocating(true);
                              try {
                                const res = await fetch('/api/user/addresses', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({...newAddress, isDefault: true})
                                });
                                if (res.ok) {
                                  const formatted = `${newAddress.houseNumber}, ${newAddress.street}, ${newAddress.city}`;
                                  setLocation(formatted);
                                  setLocationResolved(true);
                                  setIsPopoverOpen(false);
                                  setIsAddingAddress(false);
                                  toast({ title: "Address Saved", description: "Delivering to your new location." });
                                }
                              } catch(e) {
                                toast({ variant: 'destructive', title: "Save Failed" });
                              } finally {
                                setIsLocating(false);
                              }
                            }}
                            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs tracking-widest uppercase shadow-xl shadow-primary/20"
                          >
                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Deliver"}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </PopoverContent>
                </Popover>
              )}

              {/* Mobile Search Overlay Trigger (Mobile Only) */}
              <button 
                onClick={() => setIsSearchOverlayOpen(true)}
                className={cn(
                  "flex md:hidden items-center justify-center p-2 rounded-full border transition-all h-9 w-9",
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
              
              {/* User Menu - Desktop Only */}
              <div className="hidden sm:flex items-center">
                {user ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all h-9 group",
                        scrolled 
                          ? "bg-slate-100 border-slate-200 text-slate-900" 
                          : isHome 
                            ? "bg-white/80 border-slate-200/50 text-slate-800" 
                            : "bg-primary/10 border-primary/20 text-primary"
                      )}>
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-sm group-hover:scale-110 transition-transform">
                          {user.email?.[0].toUpperCase() || <User className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline-block">Profile</span>
                        <ChevronDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent sideOffset={12} className="w-64 p-3 rounded-[32px] shadow-3xl border border-white/50 glass space-y-1.5">
                      <div className="p-4 mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated as</p>
                        <p className="text-xs font-black text-slate-900 truncate">{user.email || user.phoneNumber}</p>
                      </div>
                      
                      {[
                        { label: 'My Profile', href: '/profile', icon: User },
                        { label: 'My Orders', href: '/orders', icon: Package },
                      ].map((item) => (
                        <Link key={item.label} href={item.href}>
                          <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">{item.label}</span>
                            <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
                        </Link>
                      ))}
                      
                      <div className="h-px bg-slate-100 my-2 mx-4" />
                      
                      <button 
                        onClick={async () => {
                          const { signOut } = await import('firebase/auth');
                          const { initializeFirebase } = await import('@/firebase');
                          const { auth } = initializeFirebase();
                          await signOut(auth);
                          router.push('/login');
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 text-rose-500 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                      </button>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Link href="/login">
                    <Button 
                      size="sm" 
                      className={cn(
                        "h-9 rounded-full px-5 font-black text-[9px] tracking-widest uppercase gap-2 shadow-lg transition-all active:scale-95",
                        scrolled || !isHome ? "bg-primary text-white shadow-primary/20" : "bg-white text-primary shadow-white/20"
                      )}
                    >
                      <User className="w-3.5 h-3.5" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
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
                  placeholder="Search by medicine or salt..."
                  className="w-full pl-14 pr-32 h-14 sm:h-16 text-sm sm:text-base font-bold bg-white border-slate-200 focus:border-primary/20 rounded-full shadow-2xl shadow-primary/5 transition-all outline-none"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.length >= 2) setShowSuggestions(true);
                  }}
                  onFocus={() => search.length >= 2 && setShowSuggestions(true)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {isSearching ? (
                    <div className="mr-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Button 
                      type="submit"
                      className="h-10 sm:h-12 px-6 sm:px-8 rounded-full bg-primary text-white font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Search
                    </Button>
                  )}
                </div>
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
                  <div className="max-h-[85vh] sm:max-h-[650px] overflow-y-auto scrollbar-hide py-0 grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
                    {/* LEFT COLUMN: SUGGESTIONS (Salts & Short Brands) - 5 columns wide */}
                    <div className="sm:col-span-5 bg-slate-50/30">
                      <div className="px-6 py-4 border-b border-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary" /> Suggestions
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100/50">
                        {suggestions.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => handleSuggestionClick(item)}
                            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white transition-all group cursor-pointer"
                          >
                            <SearchIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" />
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                              <span className="font-extrabold text-[13px] text-slate-600 truncate group-hover:text-slate-900 transition-colors uppercase">
                                {item.term}
                              </span>
                              <Badge variant="secondary" className="text-[8px] bg-slate-100 text-slate-400 font-bold border-none uppercase h-4 px-1.5">
                                {item.type === 'Salt' ? 'Molecule' : 'Brand'}
                              </Badge>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: PRODUCTS (Detailed Cards) - 7 columns wide */}
                    <div className="sm:col-span-7 bg-white">
                      <div className="px-6 py-4 border-b border-slate-100/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" /> Top Matches
                        </span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Instant Results</span>
                      </div>
                      <div className="divide-y divide-slate-100/50 max-h-[500px] overflow-y-auto">
                        {displayedSuggestions.filter(s => s.type === 'Brand').length > 0 ? (
                          displayedSuggestions.filter(s => s.type === 'Brand').map((item) => (
                            <div 
                              key={`prod-${item.id}`}
                              className="w-full px-6 py-5 flex items-center gap-5 hover:bg-slate-50/50 transition-all group"
                            >
                              <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 overflow-hidden group-hover:scale-105 transition-transform">
                                <Image 
                                  src={(item as any).imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                                  alt={item.term} 
                                  fill 
                                  className="object-contain p-2" 
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/product/${(item as any).product?.id}`)}>
                                  <p className="font-extrabold text-[14px] text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                                    {item.term}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {(item as any).price > 0 && (
                                      <span className="text-[15px] font-black text-slate-900">₹{(item as any).price}</span>
                                    )}
                                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                      20% OFF
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart((item as any).product);
                                    toast({ title: "Added to Basket" });
                                  }}
                                  variant="outline"
                                  className="h-10 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                                >
                                  Add +
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-20 text-center space-y-3 opacity-40">
                             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                               <Package className="w-6 h-6 text-slate-300" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search for products</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </nav>

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
