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
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-16">
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
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-6"
          >
            {displayCategories.map((cat: any, i) => {
              const gradients = [
                'from-blue-400 to-indigo-600',
                'from-rose-400 to-orange-500',
                'from-emerald-400 to-teal-600',
                'from-violet-400 to-purple-600',
                'from-amber-400 to-orange-600',
                'from-cyan-400 to-blue-600'
              ];
              const gradient = gradients[i % gradients.length];
              
              return (
                <motion.div key={i} variants={itemVariants}>
                  <Link 
                    href={`/search?c=${encodeURIComponent(cat.name)}`} 
                    className="group relative bg-white border border-white/40 h-full rounded-[28px] sm:rounded-[40px] p-3 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] active:scale-95 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] overflow-hidden"
                  >
                    {/* 3D Gradient Background Layer */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`} />
                    
                    <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] bg-slate-50 group-hover:scale-110 transition-transform duration-700">
                      {cat.imageUrl ? (
                        <Image 
                          src={cat.imageUrl} 
                          alt={cat.name} 
                          fill 
                          className="object-contain p-2 sm:p-5 group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center opacity-80`}>
                          <span className="text-white font-black text-xs sm:text-xl">{cat.name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 flex flex-col items-center flex-1 w-full text-center">
                      <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-tighter leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">
                        {cat.name}
                      </span>
                      <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 duration-500 mt-auto">
                        <span className="text-[6px] font-black text-primary uppercase tracking-widest">Select</span>
                        <ArrowUpRight className="w-2 h-2 text-primary" />
                      </div>
                    </div>
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
