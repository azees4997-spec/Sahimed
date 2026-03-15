
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shapes, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Categories', icon: Shapes, path: '/search' },
    { label: 'Orders', icon: ClipboardList, path: '/orders' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all active:scale-90",
                isActive ? "text-[#F97316]" : "text-gray-400"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
