"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/Sahi-admin')) return null;

  const hideOnPaths = ['/Sahi-admin', '/login', '/prescription'];
  if (hideOnPaths.some(path => pathname.startsWith(path))) return null;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Categories', icon: LayoutGrid, path: '/categories' },
    { label: 'Refills', icon: ClipboardList, path: '/orders' },
    { label: 'Account', icon: User, path: '/profile' },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white border-t border-slate-100 shadow-[0_-8px_40px_rgba(0,0,0,0.08)] safe-bottom pointer-events-auto rounded-t-2xl">
      <div className="flex justify-around items-center h-20 px-6 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative z-10",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <motion.div
                animate={isActive ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </motion.div>
              
              <span className={cn(
                "text-[9px] uppercase tracking-[0.15em] font-black leading-none transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-2 w-12 h-1 bg-primary rounded-full"
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
