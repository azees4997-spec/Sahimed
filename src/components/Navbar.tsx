
"use client"

import Link from 'next/link';
import { ShoppingCart, User, Upload, MapPin, ChevronDown, LocateFixed, Loader2, Home, Package, Search as SearchIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

export default function Navbar() {
  const { totalItems, location, setLocation } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();

  // Search medicines from Firestore
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
            const lat = position.coords.latitude.toFixed(4);
            const lng = position.coords.longitude.toFixed(4);
            setLocation(`My Location (${lat}, ${lng})`);
          } catch (e) {
            console.error(e);
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

  const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) => (
    <Link href={href} className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all py-2 ${active ? 'text-primary' : 'text-gray-400'}`}>
      <Icon className={`w-6 h-6 ${active ? 'fill-primary/10' : ''}`} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex justify-between items-center h-14 md:h-20">
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-xl shadow-lg shadow-primary/20">
                  <div className="text-white font-bold text-sm sm:text-xl tracking-tighter">HL</div>
                </div>
                <span className="hidden sm:block font-black text-xl text-primary font-headline tracking-tight text-nowrap">HealthLink</span>
              </Link>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 text-[10px] font-black text-gray-500 hover:text-primary p-2 h-auto rounded-xl bg-gray-50 border border-gray-100 uppercase tracking-widest max-w-[120px] sm:max-w-none">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{location}</span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
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
                          onClick={() => setLocation(loc)}
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

            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/cart" className="relative p-2.5 hover:bg-gray-100 rounded-2xl active:scale-95 transition-transform">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-accent text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="hidden sm:block p-2.5 hover:bg-gray-100 rounded-2xl">
                <User className="w-6 h-6 text-gray-700" />
              </Link>
            </div>
          </div>

          {/* Persistent Search Bar */}
          <div className="pb-3 md:pb-4 relative" ref={suggestionRef}>
            <form onSubmit={handleSearch} className="relative group">
              <Input
                type="text"
                placeholder="Search medicines, salts, generics..."
                className="w-full pl-12 pr-4 py-2 rounded-full border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all bg-gray-100 h-12 sm:h-14 font-bold text-sm shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
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
                    <div className="w-12 h-12 relative bg-gray-50 rounded-xl overflow-hidden shrink-0">
                      <img src={p.imageUrl} alt={p.name} className="object-contain p-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">{p.saltComposition}</p>
                    </div>
                    {p.isGeneric ? (
                      <Badge className="ml-auto bg-green-50 text-green-700 border-none text-[8px] font-black uppercase px-2 h-6">GENERIC</Badge>
                    ) : (
                      <Badge variant="outline" className="ml-auto text-[8px] font-black uppercase px-2 h-6 text-gray-400">BRANDED</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16 px-2 safe-bottom">
          <NavItem href="/" icon={Home} label="Home" active={pathname === '/'} />
          <NavItem href="/search" icon={SearchIcon} label="Explore" active={pathname === '/search'} />
          
          <div className="relative flex justify-center flex-1 h-full">
            <Link href="/prescription" className="absolute -top-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(30,58,138,0.4)] border-4 border-white active:scale-90 transition-all group">
                <Upload className="w-7 h-7 group-hover:animate-bounce" />
              </div>
              <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Scan</span>
            </Link>
          </div>

          <NavItem href="/orders" icon={Package} label="Orders" active={pathname === '/orders'} />
          <NavItem href="/profile" icon={User} label="Profile" active={pathname === '/profile'} />
        </div>
      </div>
    </>
  );
}
