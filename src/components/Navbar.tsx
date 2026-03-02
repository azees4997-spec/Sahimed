"use client"

import Link from 'next/link';
import { ShoppingCart, User, MapPin, ChevronDown, LocateFixed, Loader2, Search as SearchIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

export default function Navbar() {
  const { totalItems, location, setLocation } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();

  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), limit(100));
  }, [db]);
  
  const { data: allMedicines } = useCollection(medicinesQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (search.trim().length > 1 && allMedicines) {
      const filtered = allMedicines.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.saltComposition.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [search, allMedicines]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setSuggestions([]);
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
      <nav className="sticky top-0 z-50 bg-white border-b safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 md:h-14">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-1.5">
                <div className="bg-primary p-0.5 rounded shadow-sm">
                  <div className="text-white font-bold text-[10px] tracking-tighter">HL</div>
                </div>
                <span className="hidden sm:block font-black text-xs text-primary font-headline tracking-tight text-nowrap">HealthLink</span>
              </Link>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 text-[7px] font-black text-gray-500 hover:text-primary p-1 h-auto rounded-lg bg-gray-50 border border-gray-100 uppercase tracking-widest max-w-[80px] sm:max-w-none transition-all active:scale-95">
                    <MapPin className="w-2 h-2 text-primary shrink-0" />
                    <span className="truncate">{location}</span>
                    <ChevronDown className="w-1.5 h-1.5 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 rounded-2xl shadow-2xl border-none">
                  <div className="space-y-3">
                    <Button 
                      onClick={handleGeoLocation} 
                      disabled={isLocating}
                      className="w-full justify-start gap-2 h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-black text-[8px] uppercase tracking-widest"
                    >
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
                      Use GPS Location
                    </Button>
                    <div className="pt-1">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest px-1.5 mb-2">Saved Hubs</p>
                      {manualLocations.map((loc) => (
                        <Button 
                          key={loc} 
                          variant="ghost" 
                          className="w-full justify-start text-[10px] h-8 rounded-lg hover:bg-gray-50 font-bold" 
                          onClick={() => {
                            setLocation(loc);
                            setIsPopoverOpen(false);
                          }}
                        >
                          <MapPin className="w-2.5 h-2.5 mr-2 text-gray-300" />
                          {loc}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-0.5">
              <Link href="/cart" className="relative p-1 hover:bg-gray-50 rounded-lg active:scale-90 transition-transform">
                <ShoppingCart className="w-3.5 h-3.5 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[6px] font-black px-1 py-0 rounded-full ring-1 ring-white">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="p-1 hover:bg-gray-50 rounded-lg active:scale-90 transition-transform">
                <User className="w-3.5 h-3.5 text-gray-700" />
              </Link>
            </div>
          </div>

          <div className="pb-2 relative" ref={suggestionRef}>
            <form onSubmit={handleSearch} className="relative group">
              <Input
                type="text"
                placeholder="Search medicines, salts..."
                className="w-full pl-7 pr-3 py-1 rounded-full border-none focus-visible:ring-2 focus-visible:ring-primary/10 transition-all bg-gray-50 h-8 sm:h-10 font-bold text-[9px] sm:text-xs shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 w-3 h-3 group-focus-within:text-primary transition-colors" />
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}