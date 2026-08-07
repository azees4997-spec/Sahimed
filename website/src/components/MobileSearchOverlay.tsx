"use client"

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, Loader2, ShoppingCart, ArrowUpRight, HeartPulse, History, Sparkles, Plus } from 'lucide-react';
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

// In-memory cache for 0ms instant speed
const mobileSearchCache = new Map<string, any[]>();

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sahimed_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
    } catch (e) {}
  }, []);

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

  // Fast 120ms debounced search with in-memory caching
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const lowerTerm = term.toLowerCase();
    if (mobileSearchCache.has(lowerTerm)) {
      setSuggestions(mobileSearchCache.get(lowerTerm) || []);
      setIsSearching(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=10`);
        const meds = res.ok ? await res.json() : [];

        mobileSearchCache.set(lowerTerm, meds);
        setSuggestions(meds);
      } catch (err) {
        console.error("Mobile search failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 120);
    return () => clearTimeout(timer);
  }, [search]);

  const handleItemClick = (item: any) => {
    router.push(`/product/${item._id || item.id}`);
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
      <div className="flex items-center gap-2 p-3 border-b border-slate-100 bg-white shadow-2xs">
        <button onClick={onClose} className="p-2 -ml-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <div className="relative flex items-center bg-slate-50 rounded-full border border-slate-200 focus-within:border-teal-500 overflow-hidden shadow-2xs">
            <div className="pl-3.5 pr-1 flex items-center shrink-0">
              <HeartPulse className="w-4 h-4 text-teal-600 animate-pulse" />
            </div>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search medicines, salts, brands..."
              className="w-full border-none focus-visible:ring-0 h-10 bg-transparent font-bold text-xs text-slate-900 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  router.push(`/search?q=${encodeURIComponent(search.trim())}`);
                  onClose();
                }
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="p-1.5 mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Searching SahiMed...</p>
          </div>
        )}

        {!isSearching && search.length >= 2 && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">No medicines found for "{search}"</p>
            <p className="text-[11px] text-slate-400 font-medium">Check spelling or search by generic chemical salt name</p>
          </div>
        )}

        {/* Live Search Suggestions Vertical List */}
        {suggestions.length > 0 && !isSearching && (
          <div className="divide-y divide-slate-100">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matching Products</span>
              <span className="text-[9px] font-bold text-teal-600 uppercase">{suggestions.length} items</span>
            </div>
            {suggestions.map((item) => (
              <div 
                key={item._id || item.id}
                onClick={() => handleItemClick(item)}
                className="p-3.5 flex items-center gap-3 active:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="relative w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  <Image 
                    src={item.imageUrl || `https://picsum.photos/seed/${item._id}/200/200`}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight truncate leading-tight">
                    {item.name}
                  </h4>
                  {item.saltComposition && (
                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{item.saltComposition}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {(item.price || item.mrp) && (
                      <span className="text-xs font-black text-slate-900">₹{item.price || item.mrp}</span>
                    )}
                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase">IN STOCK</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                    toast({ title: "Added to Cart" });
                  }}
                  className="h-8 px-3 rounded-lg bg-teal-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs active:scale-95 shrink-0"
                >
                  <Plus className="w-3 h-3 mr-0.5" /> ADD
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Default View when search is empty */}
        {!search && (
          <div className="p-4 space-y-6">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-3 h-3 text-teal-600" /> Recent Searches
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearch(term);
                        router.push(`/search?q=${encodeURIComponent(term)}`);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:border-teal-500 transition-all flex items-center gap-1"
                    >
                      <History className="w-3 h-3 text-slate-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
