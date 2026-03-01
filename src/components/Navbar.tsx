
"use client"

import Link from 'next/link';
import { Search, ShoppingCart, User, Upload, Menu, MapPin, ChevronDown, LocateFixed, Loader2, Home, Package, Search as SearchIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PRODUCTS } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const { totalItems, location, setLocation } = useCart();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<typeof PRODUCTS>([]);
  const [isLocating, setIsLocating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.trim().length > 1) {
      const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.saltComposition.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [search]);

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
            // Simulate reverse geocoding or just use coords for demo
            const lat = position.coords.latitude.toFixed(2);
            const lng = position.coords.longitude.toFixed(2);
            
            // In a real app, you'd fetch the city name from an API like Google Maps or OpenStreetMap
            // For this prototype, we'll simulate finding a major city near those coords
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
          alert("Could not detect location. Please check browser permissions.");
        }
      );
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const manualLocations = ["Mumbai, MH", "Delhi, DL", "Bangalore, KA", "Hyderabad, TS"];

  const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) => (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-primary' : 'text-gray-400'}`}>
      <Icon className={`w-6 h-6 ${active ? 'fill-primary/10' : ''}`} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo & Location */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="bg-primary p-1.5 rounded-xl shadow-lg shadow-primary/20">
                  <div className="text-white font-bold text-xl tracking-tighter">HL</div>
                </div>
                <span className="hidden lg:block font-black text-xl text-primary font-headline tracking-tight">
                  HealthLink <span className="text-gray-300">Pharmacy</span>
                </span>
              </Link>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 text-[10px] sm:text-xs font-black text-gray-500 hover:text-primary p-2 h-auto rounded-xl bg-gray-50 border border-gray-100 uppercase tracking-widest max-w-[120px] sm:max-w-none">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{location}</span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 rounded-3xl shadow-2xl border-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleGeoLocation} 
                      disabled={isLocating}
                      className="w-full justify-start gap-3 h-14 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 border-none font-black text-[10px] uppercase tracking-widest"
                    >
                      {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                      Use My GPS Location
                    </Button>
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Popular Regions</p>
                      <div className="grid grid-cols-1 gap-1">
                        {manualLocations.map((loc) => (
                          <Button 
                            key={loc} 
                            variant="ghost" 
                            className="w-full justify-start text-sm h-12 rounded-xl hover:bg-gray-50 font-bold px-4" 
                            onClick={() => setLocation(loc)}
                          >
                            <MapPin className="w-4 h-4 mr-2 text-gray-300" />
                            {loc}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Bar with Suggestions */}
            <div className="flex-1 max-w-lg mx-4 relative hidden sm:block" ref={suggestionRef}>
              <form onSubmit={handleSearch} className="relative group">
                <Input
                  type="text"
                  placeholder="Search medicines, salts..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all bg-gray-100 h-12 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              </form>

              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  {suggestions.map((p) => (
                    <Link 
                      key={p.id} 
                      href={`/product/${p.id}`}
                      onClick={() => {
                        setSuggestions([]);
                        setSearch('');
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b last:border-none"
                    >
                      <div className="w-10 h-10 relative bg-gray-50 rounded-lg overflow-hidden shrink-0">
                        <img src={p.imageUrl} alt={p.name} className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400 italic truncate">{p.saltComposition}</p>
                      </div>
                      {p.isGeneric ? (
                        <Badge className="ml-auto bg-green-50 text-green-700 border-none text-[8px] h-5 font-black uppercase tracking-tighter px-2">GENERIC</Badge>
                      ) : (
                        <Badge variant="outline" className="ml-auto text-[8px] h-5 font-black uppercase tracking-tighter px-2 text-gray-400 border-gray-200">BRANDED</Badge>
                      )}
                    </Link>
                  ))}
                  <div className="p-3 bg-gray-50 text-center">
                    <button onClick={handleSearch} className="text-[10px] font-black text-primary uppercase tracking-widest">See all results</button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/prescription" className="hidden lg:flex items-center gap-2 bg-primary/5 p-2 rounded-xl text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </Link>
              
              <Link href="/cart" className="relative p-2.5 hover:bg-gray-100 rounded-2xl transition-colors">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-accent text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white animate-bounce">
                    {totalItems}
                  </span>
                )}
              </Link>

              <Link href="/profile" className="hidden sm:block p-2.5 hover:bg-gray-100 rounded-2xl transition-colors">
                <User className="w-6 h-6 text-gray-700" />
              </Link>

              <Button variant="ghost" size="icon" className="sm:hidden rounded-2xl" onClick={() => router.push('/search')}>
                <SearchIcon className="w-6 h-6 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t safe-bottom z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16">
          <NavItem href="/" icon={Home} label="Home" active={pathname === '/'} />
          <NavItem href="/search" icon={SearchIcon} label="Explore" active={pathname === '/search'} />
          <Link href="/prescription" className="-mt-10">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 border-4 border-white active:scale-90 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
          </Link>
          <NavItem href="/orders" icon={Package} label="Orders" active={pathname === '/orders'} />
          <NavItem href="/profile" icon={User} label="Profile" active={pathname === '/profile'} />
        </div>
      </div>
    </>
  );
}
