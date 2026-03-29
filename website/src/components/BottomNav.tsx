"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Categories', icon: LayoutGrid, path: '/categories' },
    { label: 'Orders', icon: ClipboardList, path: '/orders' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] safe-bottom pointer-events-auto rounded-t-[32px]">
      <div className="flex justify-around items-center h-[5rem] px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative",
                isActive ? "text-primary scale-110" : "text-slate-400"
              )}
            >
              <item.icon className={cn("w-6 h-6 transition-transform", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-black leading-none",
                isActive ? "opacity-100" : "opacity-60"
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
