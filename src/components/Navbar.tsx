
"use client"

import Link from 'next/link';
import { Search as SearchIcon, MapPin, ChevronDown, LocateFixed, Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function SahiMedIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-8 h-8", className)}
    >
      <path 
        d="M20 55C20 30 40 20 50 20C35 35 32 55 32 75C32 90 45 100 55 100C30 100 20 85 20 55Z" 
        fill="#F37021" 
      />
      <path 
        d="M80 45C80 70 60 80 50 80C65 65 68 45 68 25C68 10 55 0 45 0C70 0 80 15 80 45Z" 
        fill="#F37021" 
      />
      <path 
        d="M50 10C35 30 35 55 50 65C65 75 65 95 50 110C80 90 80 65 65 55C50 45 50 25 50 10Z" 
        fill="#005FAC" 
      />
      <path 
        d="M55 20C48 35 48 55 58 65C68 75 68 85 63 95C73 85 73 70 63 60C53 50 53 30 55 20Z" 
        fill="#CBD5E1" 
      />
    </svg>
  );
}

export default function Navbar() {
  const { location, setLocation, totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim().length >= 3) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
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
    <nav className="bg-white border-b sticky top-0 z-[100] px-4 pt-4 pb-3">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Row: Logo & Actions */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <SahiMedIcon className="w-10 h-10" />
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-black text-2xl text-[#005FAC] tracking-tighter leading-none">Sahi</span>
                <span className="font-black text-2xl text-[#2E8B57] tracking-tighter leading-none">Med</span>
              </div>
              <span className="text-[9px] font-black text-[#005FAC] uppercase tracking-widest mt-0.5">Sahi Dawai, Sahi Daam Pe</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-6">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-primary transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="max-w-[80px] sm:max-w-none truncate">{location}</span>
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
              </PopoverTrigger>
              <PopoverContent sideOffset={8} className="w-64 p-4 rounded-[24px] shadow-2xl border-none">
                <Button 
                  onClick={handleGeoLocation} 
                  disabled={isLocating}
                  className="w-full justify-start gap-3 h-12 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[11px] uppercase tracking-wider"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  Use GPS Location
                </Button>
              </PopoverContent>
            </Popover>

            {/* Desktop Cart Button */}
            <Link href="/cart" className="hidden sm:flex items-center gap-2 group">
              <div className="relative p-2 bg-gray-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-white h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-black rounded-full border-2 border-white">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary">Cart</span>
            </Link>
          </div>
        </div>

        {/* Search Row */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search for medicines or generics (min 3 chars)"
              className="w-full pl-11 pr-4 rounded-xl border-none bg-[#F1F5F9] h-11 text-[13px] font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
      </div>
    </nav>
  );
}
