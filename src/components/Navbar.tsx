
"use client"

import Link from 'next/link';
import { Search as SearchIcon, MapPin, ChevronDown, LocateFixed, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function SahiMedIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-8 h-8", className)}
    >
      {/* Left Orange Swirl */}
      <path 
        d="M32 25C18 45 22 75 40 88C25 75 20 50 32 25Z" 
        fill="#F97316" 
      />
      {/* Right Orange Swirl */}
      <path 
        d="M68 25C82 45 78 75 60 88C75 75 80 50 68 25Z" 
        fill="#F97316" 
      />
      {/* Central Blue S-Wave */}
      <path 
        d="M50 12C35 32 35 58 50 72C65 86 65 100 50 108C75 95 75 72 50 58C25 44 25 25 50 12Z" 
        fill="#0061AF" 
      />
      {/* Silver/Light Detail */}
      <path 
        d="M48 35C42 45 42 60 50 70C58 80 58 90 52 98C62 88 62 75 52 65C42 55 42 45 48 35Z" 
        fill="white" 
        fillOpacity="0.2"
      />
    </svg>
  );
}

export default function Navbar() {
  const { location, setLocation } = useCart();
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
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
              const neighborhood = data.address.suburb || data.address.neighbourhood || 'Current Location';
              setLocation(neighborhood);
            }
            setIsPopoverOpen(false);
          } catch (e) {
            setLocation("Unknown Location");
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
        {/* Top Row: Logo & Location */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <SahiMedIcon className="w-9 h-9" />
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-black text-2xl text-[#0061AF] tracking-tighter leading-none">Sahi</span>
                <span className="font-black text-2xl text-[#2E8B57] tracking-tighter leading-none">Med</span>
              </div>
              <span className="text-[9px] font-black text-[#0061AF] uppercase tracking-widest mt-0.5">Sahi Dawai, Sahi Daam Pe</span>
            </div>
          </Link>

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-primary transition-colors">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>{location}</span>
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
        </div>

        {/* Search Row */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search for medicines or generics"
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
