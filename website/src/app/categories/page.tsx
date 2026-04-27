"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES as LOCAL_CATEGORIES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/categories?limit=50')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Categories API did not return an array", data);
          setCategories([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
        setIsLoading(false);
      });
  }, []);
  const displayCategories = categories;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-16">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 mb-10"
          >
            <Link href="/">
              <button className="rounded-full bg-white shadow-lg h-10 w-10 hover:scale-110 transition-transform flex items-center justify-center border border-slate-100 active:scale-95">
                <ArrowLeft className="w-5 h-5 text-slate-900" />
              </button>
            </Link>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Categories</h1>
              <p className="text-[8px] font-black text-primary tracking-[0.2em] uppercase leading-none opacity-60">Therapeutic Segments</p>
            </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-12 md:gap-16 lg:gap-20 max-w-6xl mx-auto"
          >
            {isLoading ? (
              // Skeleton Grid
              Array(12).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-[28px] sm:rounded-[40px] p-3 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 animate-pulse border border-slate-50 shadow-sm">
                  <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full" />
                  <Skeleton className="h-3 w-16 sm:h-5 sm:w-28 rounded-full" />
                </div>
              ))
            ) : displayCategories.map((cat: any, i) => {
              const colors = ["bg-lavender", "bg-sahi-pink", "bg-sahi-blue", "bg-sahi-green"];
              const colorClass = colors[i % colors.length];
              
              return (
                <motion.div key={i} variants={itemVariants}>
                  <Link 
                    href={`/search?c=${encodeURIComponent(cat.name)}`} 
                    className="flex flex-col items-center gap-3 sm:gap-4 group"
                  >
                    <motion.div 
                      whileHover={{ y: -8, scale: 1.05 }}
                      className={cn(
                        "w-24 h-24 sm:w-44 sm:h-44 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden p-0 transition-transform duration-500",
                        colorClass
                      )}>
                      <Image 
                        src={cat.imageUrl || `https://picsum.photos/seed/${cat.name}/300/300`} 
                        alt={cat.name} 
                        width={200} 
                        height={200} 
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
                      />
                    </motion.div>
                    <span className="text-[10px] sm:text-sm font-black text-slate-800 tracking-tight uppercase text-center line-clamp-2 h-8 px-1">
                      {cat.name}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

        </main>
      </div>
    </PageTransition>
  );
}
