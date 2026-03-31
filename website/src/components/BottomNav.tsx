"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Refills', icon: ClipboardList, path: '/orders' },
    { label: 'Account', icon: User, path: '/profile' },
  ];

  return (
    <div className="sm:hidden fixed bottom-6 left-6 right-6 z-[150] bg-white/80 backdrop-blur-3xl border border-white/20 shadow-2xl safe-bottom pointer-events-auto rounded-[32px]">
      <div className="flex justify-around items-center h-20 px-4 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-500",
                isActive ? "bg-primary/10 scale-110" : "bg-transparent scale-100"
              )}>
                <item.icon className={cn("w-5.5 h-5.5 transition-all", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              
              <span className={cn(
                "text-[8px] uppercase tracking-[0.1em] font-black leading-none transition-all duration-300",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
