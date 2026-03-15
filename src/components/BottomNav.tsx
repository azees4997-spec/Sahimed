
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Categories', icon: LayoutGrid, path: '/search' },
    { label: 'Orders', icon: ClipboardList, path: '/orders' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white/95 backdrop-blur-lg border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-bottom pointer-events-auto">
      <div className="flex justify-around items-stretch h-[4.5rem] px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px] scale-110")} />
              <span className={cn(
                "text-[9px] uppercase tracking-widest font-black",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
