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
  const displayCategories = categories?.length ? categories : LOCAL_CATEGORIES;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-6 mb-16"
          >
            <Link href="/">
              <button className="rounded-full bg-white shadow-xl h-16 w-16 hover:scale-110 transition-transform flex items-center justify-center border border-white active:scale-95">
                <ArrowLeft className="w-6 h-6 text-slate-900" />
              </button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Categories</h1>
              <p className="text-[10px] font-black text-primary tracking-[0.4em] uppercase leading-none opacity-70">Browse by Therapeutic Segment</p>
            </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-8"
          >
            {displayCategories.map((cat: any, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Link 
                  href={`/search?c=${encodeURIComponent(cat.name)}`} 
                  className="group bg-white/60 backdrop-blur-md p-8 rounded-[48px] border border-white shadow-xl hover:shadow-3xl transition-all duration-500 flex flex-col items-center text-center gap-6 active:scale-95 h-full"
                >
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center border border-slate-50 overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {cat.imageUrl ? (
                      <Image 
                        src={cat.imageUrl} 
                        alt={cat.name} 
                        fill 
                        className="object-contain p-2 sm:p-6 group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                        <span className="text-primary font-black text-xs">{cat.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 flex flex-col items-center flex-1">
                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-tight block font-outfit">
                      {cat.name}
                    </span>
                    <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-500 mt-auto">
                      <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">Explore</span>
                      <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}
