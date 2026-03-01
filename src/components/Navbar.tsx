
"use client"

import Link from 'next/link';
import { Search, ShoppingCart, User, Upload, Menu, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function Navbar() {
  const { totalItems, location, setLocation } = useCart();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  const locations = ["Mumbai, MH", "Delhi, DL", "Bangalore, KA", "Hyderabad, TS", "Chennai, TN", "Pune, MH"];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo & Location */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-primary p-1.5 rounded-lg">
                <div className="text-white font-bold text-xl tracking-tighter">HL</div>
              </div>
              <span className="hidden md:block font-bold text-xl text-primary font-headline tracking-tight">
                HealthLink <span className="text-gray-400">Pharmacy</span>
              </span>
            </Link>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="hidden sm:flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary p-2 h-auto rounded-xl">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="truncate max-w-[100px]">{location}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase p-2">Select City</p>
                {locations.map((loc) => (
                  <Button 
                    key={loc} 
                    variant="ghost" 
                    className="w-full justify-start text-sm" 
                    onClick={() => setLocation(loc)}
                  >
                    {loc}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search medicines, salts, or brands..."
                className="w-full pl-10 pr-4 py-2 rounded-full border-gray-200 focus:ring-primary focus:border-primary transition-all bg-gray-50 h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/prescription" className="hidden lg:flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            
            <Link href="/cart" className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link href="/profile" className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-6 h-6 text-gray-700" />
            </Link>

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
