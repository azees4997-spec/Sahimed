"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import { ChevronRight, Dna, Activity, ArrowLeft, Sparkles, Zap, ArrowUpRight } from 'lucide-react';
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
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Clinical Taxonomy</h1>
              <p className="text-[10px] font-black text-primary tracking-[0.4em] uppercase leading-none opacity-70">Therapeutic Segments Directory</p>
            </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8"
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
                        className="object-contain p-6 group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <Activity className="w-10 h-10 text-slate-200" />
                    )}
                  </div>
                  <div className="space-y-3 flex flex-col items-center flex-1">
                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-tight block font-outfit">
                      {cat.name}
                    </span>
                    <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-500 mt-auto">
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Explore Matrix</span>
                      <ArrowUpRight className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 bg-white/40 backdrop-blur-xl p-14 rounded-[72px] border border-white text-center max-w-3xl mx-auto shadow-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Zap className="w-48 h-48 text-primary" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                <Dna className="w-10 h-10 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-outfit">Molecule Retrieval Necessary?</h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed max-w-md mx-auto opacity-70">
                  Our clinical database contains thousands of verified formulas. use the intelligence gateway for specific molecules.
                </p>
              </div>

              <Link href="/search" className="inline-block">
                <Button className="rounded-full px-12 h-18 font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 bg-primary border-4 border-white text-white">
                  Execute Global Search
                </Button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
