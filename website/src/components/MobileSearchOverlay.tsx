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
  const inputRef = useRef<HTMLInputElement>(null);

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

        const normalized = [
          ...meds.map((m: any) => ({ ...m, _type: 'medicine' })),
          ...mols.map((m: any) => ({ ...m, _type: 'molecule' }))
        ];

        setSuggestions(normalized);
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
    if (item._type === 'molecule') {
      router.push(`/search?moleculeId=${item._id || item.id}&q=${encodeURIComponent(item.molecule || item.name)}`);
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
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Popular Categories</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Diabetes', 'Heart Care', 'Vitamins', 'Baby Care'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => {
                      router.push(`/search?c=${encodeURIComponent(cat)}`);
                      onClose();
                    }}
                    className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-primary/20 transition-all font-bold text-sm text-slate-700"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-primary/5 rounded-[24px] border border-primary/10 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-widest">Sahimed Plus</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Order medicines in just 2 clicks</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
