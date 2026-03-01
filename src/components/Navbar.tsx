
"use client"

import Link from 'next/link';
import { Search, ShoppingCart, User, Upload, Menu } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { totalItems } = useCart();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <div className="text-white font-bold text-xl tracking-tighter">HL</div>
            </div>
            <span className="hidden sm:block font-bold text-xl text-primary font-headline tracking-tight">
              HealthLink <span className="text-gray-400">Pharmacy</span>
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search medicines, salts, or brands..."
                className="w-full pl-10 pr-4 py-2 rounded-full border-gray-200 focus:ring-primary focus:border-primary transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/prescription" className="hidden lg:flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Prescription</span>
            </Link>
            
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link href="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
