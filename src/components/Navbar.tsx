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
          <div className="flex justify-between items-center h-14 md:h-20">
            <div className="flex items-center gap-2.5">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-primary p-1 rounded-lg shadow-md shadow-primary/10">
                  <div className="text-white font-bold text-xs sm:text-lg tracking-tighter">HL</div>
                </div>
                <span className="hidden sm:block font-black text-lg text-primary font-headline tracking-tight text-nowrap">HealthLink</span>
              </Link>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 text-[9px] font-black text-gray-500 hover:text-primary p-1.5 h-auto rounded-lg bg-gray-50 border border-gray-100 uppercase tracking-widest max-w-[110px] sm:max-w-none transition-all active:scale-95">
                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{location}</span>
                    <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 rounded-3xl shadow-2xl border-none">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleGeoLocation} 
                      disabled={isLocating}
                      className="w-full justify-start gap-3 h-14 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest"
                    >
                      {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                      Use GPS Location
                    </Button>
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Saved Hubs</p>
                      {manualLocations.map((loc) => (
                        <Button 
                          key={loc} 
                          variant="ghost" 
                          className="w-full justify-start text-sm h-12 rounded-xl hover:bg-gray-50 font-bold" 
                          onClick={() => {
                            setLocation(loc);
                            setIsPopoverOpen(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2 text-gray-300" />
                          {loc}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-2">
              <Link href="/cart" className="relative p-2 hover:bg-gray-50 rounded-xl active:scale-90 transition-transform">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-accent text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="p-2 hover:bg-gray-50 rounded-xl active:scale-90 transition-transform">
                <User className="w-5 h-5 text-gray-700" />
              </Link>
            </div>
          </div>

          <div className="pb-3 md:pb-4 relative" ref={suggestionRef}>
            <form onSubmit={handleSearch} className="relative group">
              <Input
                type="text"
                placeholder="Search medicines, salts, generics..."
                className="w-full pl-10 pr-4 py-2 rounded-full border-none focus-visible:ring-2 focus-visible:ring-primary/10 transition-all bg-gray-50 h-11 sm:h-14 font-bold text-xs sm:text-sm shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-primary transition-colors" />
            </form>

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {suggestions.map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/product/${p.id}`}
                    onClick={() => {
                      setSuggestions([]);
                      setSearch('');
                    }}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 border-b border-gray-50 last:border-none"
                  >
                    <div className="w-10 h-10 relative bg-gray-50 rounded-xl overflow-hidden shrink-0">
                      <img src={p.imageUrl} alt={p.name} className="object-contain p-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[11px] text-gray-900 truncate">{p.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight truncate">{p.saltComposition}</p>
                    </div>
                    {p.isGeneric ? (
                      <Badge className="ml-auto bg-green-50 text-green-700 border-none text-[7px] font-black uppercase px-1.5 h-5">GENERIC</Badge>
                    ) : (
                      <Badge variant="outline" className="ml-auto text-[7px] font-black uppercase px-1.5 h-5 text-gray-300">BRANDED</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
