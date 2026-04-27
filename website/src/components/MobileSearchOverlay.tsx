"use client"

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, Loader2, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { getDoc, doc } from 'firebase/firestore';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [mostSearchedMeds, setMostSearchedMeds] = useState<any[]>([]);
  const [mostSearchedSalts, setMostSearchedSalts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories?limit=9')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); });
    
    // Fetch real trending data from MongoDB
    fetch('/api/analytics/trending')
      .then(res => res.json())
      .then(data => {
        if (data.brands) setMostSearchedMeds(data.brands);
        if (data.salts) setMostSearchedSalts(data.salts);
      });
  }, []);

  // Debounced keystroke logging
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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const [resMeds, resMols] = await Promise.all([
          fetch(`/api/products?q=${encodeURIComponent(search.trim())}&limit=10`),
          fetch(`/api/molecules?q=${encodeURIComponent(search.trim())}&limit=10`)
        ]);
        
        const meds = resMeds.ok ? await resMeds.json() : [];
        const mols = resMols.ok ? await resMols.json() : [];

        const seenCompositionTerms = new Set<string>();
        const seenBrandTerms = new Set<string>();
        const results: any[] = [];

        // Process Molecules first (registry)
        mols.forEach((m: any) => {
          const key = (m.molecule || m.name || "").toLowerCase().trim();
          if (key && !seenCompositionTerms.has(key)) {
            results.push({ ...m, _type: 'molecule' });
            seenCompositionTerms.add(key);
          }
        });

        // Process Medicines
        meds.forEach((m: any) => {
          const brandName = (m.name || "").toLowerCase().trim();
          if (brandName && !seenBrandTerms.has(brandName)) {
            results.push({ ...m, _type: 'medicine' });
            seenBrandTerms.add(brandName);
          }

          const saltName = (m.saltComposition || m.composition || m.salt || "").toLowerCase().trim();
          if (saltName && !seenCompositionTerms.has(saltName)) {
            results.push({ 
              ...m, 
              name: m.saltComposition || m.composition || m.salt,
              _type: 'salt' 
            });
            seenCompositionTerms.add(saltName);
          }
        });

        setSuggestions(results);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleItemClick = (item: any) => {
    logSearch(item.name || item.molecule);
    if (item._type === 'molecule' || item._type === 'salt') {
      if (item.moleculeId || item._id || item.id) {
        const molId = item.moleculeId || item._id || item.id;
        router.push(`/search?moleculeId=${molId}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(item.molecule || item.name)}`);
      }
    } else {
      router.push(`/product/${item._id || item.id}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-100">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search medicines..."
            className="w-full pl-10 pr-10 h-11 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                logSearch(search.trim());
                router.push(`/search?q=${encodeURIComponent(search.trim())}`);
                onClose();
              }
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Searching SahiMed...</p>
          </div>
        )}

        {!isSearching && search.length >= 2 && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-tight">No results found for "{search}"</p>
            <p className="text-xs text-slate-400 font-medium">Try searching for generic names or categories</p>
          </div>
        )}

        {suggestions.length > 0 && !isSearching && (
          <div className="divide-y divide-slate-100">
            {suggestions.map((item) => (
              <div 
                key={item._id || item.id}
                className="bg-white p-4 flex items-center gap-4 active:bg-slate-50 transition-colors"
                onClick={() => handleItemClick(item)}
              >
                {item._type === 'medicine' ? (
                  <div className="relative w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <Image 
                      src={item.imageUrl || `https://picsum.photos/seed/${item._id}/200/200`}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-6 h-6 text-primary/40" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">
                    {item.name || item.molecule}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[8px] px-1.5 py-0.5 rounded-md border-none uppercase tracking-widest shrink-0">
                      {item._type}
                    </Badge>
                    {item.liveData?.sahimed_price && (
                      <span className="text-sm font-black text-primary">₹{item.liveData.sahimed_price}</span>
                    )}
                  </div>
                </div>

                {item._type === 'medicine' ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                      toast({ title: "Added to Basket" });
                    }}
                    className="h-8 px-4 rounded-full bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Add
                  </Button>
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-slate-300" />
                )}
              </div>
            ))}
          </div>
        )}

        {!search && (
          <div className="p-6 space-y-10 pb-20">
            {/* Categories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Top Categories</h3>
                <button onClick={() => { router.push('/categories'); onClose(); }} className="text-[9px] font-black text-primary uppercase tracking-widest">See All</button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => {
                      router.push(`/search?c=${encodeURIComponent(cat.name)}`);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-3 p-4 bg-white border border-slate-100 rounded-3xl hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 relative group-hover:scale-110 transition-transform duration-500">
                      <Image 
                        src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/100/100`} 
                        alt={cat.name} 
                        fill 
                        className="object-contain" 
                      />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-tight text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Most Searched Brands */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Most Searched Brands</h3>
              <div className="flex flex-wrap gap-2">
                {mostSearchedMeds.slice(0, 8).map((med, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { 
                      setSearch(med.name);
                      router.push(`/search?q=${encodeURIComponent(med.name)}`);
                      onClose();
                    }}
                    className="px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 hover:border-primary/20 transition-all uppercase tracking-tight"
                  >
                    {med.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Most Searched Salts (Molecules) */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Most Searched Molecules</h3>
              <div className="flex flex-wrap gap-2">
                {mostSearchedSalts.slice(0, 8).map((salt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { 
                      setSearch(salt.name);
                      router.push(`/search?q=${encodeURIComponent(salt.name)}`);
                      onClose();
                    }}
                    className="px-4 py-2 bg-slate-100/50 border border-transparent rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-tight"
                  >
                    {salt.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
