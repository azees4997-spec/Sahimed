"use client"

import * as React from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import PageTransition from '@/components/PageTransition';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
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
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

interface MedicinesClientProps {
  initialProducts: any[];
  letter: string;
  currentPage: number;
  totalPages: number;
}

export default function MedicinesClient({
  initialProducts,
  letter,
  currentPage,
  totalPages,
}: MedicinesClientProps) {
  const router = useRouter();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    router.push(`/medicines/${letter}?page=${page}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-16">
        <Navbar />

        <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          {/* Header */}
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
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Medicine Index</h1>
              <p className="text-[8px] font-black text-primary tracking-[0.2em] uppercase leading-none opacity-60">Directory by name: {letter.toUpperCase()}</p>
            </div>
          </motion.div>

          {/* Alphabet Index Bar */}
          <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm mb-12 overflow-x-auto scrollbar-hide flex gap-2 justify-start md:justify-center items-center min-w-full">
            {alphabet.map((char) => (
              <Link 
                key={char} 
                href={`/medicines/${char.toLowerCase()}`}
                className={cn(
                  "w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-black transition-all hover:bg-slate-50",
                  letter.toUpperCase() === char 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110 hover:bg-primary"
                    : "text-slate-500"
                )}
              >
                {char}
              </Link>
            ))}
            <Link 
              href="/medicines/0-9"
              className={cn(
                "px-4 h-10 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black tracking-wide transition-all hover:bg-slate-50 gap-1",
                letter === '0-9'
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110 hover:bg-primary"
                  : "text-slate-500"
              )}
            >
              <Hash className="w-3.5 h-3.5" /> 0-9
            </Link>
          </div>

          {/* Medicine Cards Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            {initialProducts.length === 0 ? (
              <div className="col-span-full py-24 text-center font-black text-gray-400 text-xs uppercase tracking-widest bg-white border border-slate-100 rounded-[40px] shadow-sm">
                No medicines found starting with "{letter.toUpperCase()}"
              </div>
            ) : (
              initialProducts.map((product) => (
                <motion.div key={product._id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-16">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="px-6 py-3 rounded-full bg-white border border-slate-100 text-[10px] font-black tracking-widest text-slate-600 uppercase shadow-sm">
                Page {currentPage} of {totalPages}
              </span>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
