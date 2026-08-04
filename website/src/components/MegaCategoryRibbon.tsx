'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CategoryRibbonItem {
  id: string;
  name: string;
  emoji: string;
  image: string;
  subcategories: string[];
}

export const MEGA_CATEGORIES: CategoryRibbonItem[] = [
  {
    id: 'cardiac',
    name: 'Cardiac Care',
    emoji: '❤️',
    image: '/images/cat_cardiac.jpg',
    subcategories: ['Blood Pressure', 'Anti-Hypertensives', 'Cholesterol Care', 'Blood Thinners', 'Heart Supplements']
  },
  {
    id: 'diabetes',
    name: 'Diabetes Care',
    emoji: '🩸',
    image: '/images/cat_diabetes.jpg',
    subcategories: ['Insulin & Needles', 'Glucose Monitors', 'Oral Anti-Diabetics', 'Test Strips', 'Sugar-Free Care']
  },
  {
    id: 'vitamins',
    name: 'Vitamins & Supplements',
    emoji: '💊',
    image: '/images/cat_vitamins.jpg',
    subcategories: ['Vitamin D3 & B12', 'Daily Multivitamins', 'Calcium & Bones', 'Immunity Boosters', 'Protein Powders']
  },
  {
    id: 'respiratory',
    name: 'Respiratory Care',
    emoji: '🫁',
    image: '/images/cat_respiratory.jpg',
    subcategories: ['Asthma Inhalers', 'Anti-Allergics', 'Cough & Cold', 'Nasal Sprays', 'Nebulizers']
  },
  {
    id: 'pain',
    name: 'Pain & Ortho',
    emoji: '🩹',
    image: '/images/cat_pain_ortho.jpg',
    subcategories: ['Joint & Bone Care', 'Muscle Relaxants', 'Pain Relief Gel', 'Anti-Inflammatory', 'Back & Knee Support']
  },
  {
    id: 'skin',
    name: 'Skin & Derma',
    emoji: '✨',
    image: '/images/cat_skin_derma.jpg',
    subcategories: ['Acne & Face Care', 'Anti-Fungal Creams', 'Moisturizers', 'Sun Protection', 'Eczema Relief']
  },
  {
    id: 'gastro',
    name: 'Gastro Care',
    emoji: '🌿',
    image: '/images/cat_gastro.jpg',
    subcategories: ['Acidity & Antacids', 'Digestive Enzymes', 'Laxatives', 'Probiotics', 'Liver Care']
  },
  {
    id: 'womens',
    name: "Women's Health",
    emoji: '🌸',
    image: '/images/cat_womens.jpg',
    subcategories: ['Gynecological', 'Prenatal & Folic', 'Hormonal Care', 'Iron & Anemia', 'Feminine Hygiene']
  }
];

export default function MegaCategoryRibbon() {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  return (
    <div className="hidden sm:block w-full bg-white border-b border-slate-100 shadow-sm relative z-30">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-center gap-1.5 sm:gap-3 lg:gap-6 overflow-x-auto scrollbar-hide py-2">
          {MEGA_CATEGORIES.map((cat) => {
            const isHovered = activeCategory === cat.id;

            return (
              <div
                key={cat.id}
                className="relative shrink-0"
                onMouseEnter={() => setActiveCategory(cat.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={`/search?c=${encodeURIComponent(cat.name)}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isHovered
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="text-sm leading-none">{cat.emoji}</span>
                  <span className="whitespace-nowrap tracking-tight">{cat.name}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isHovered ? 'rotate-180 text-slate-700' : 'text-slate-400'}`} />
                </Link>

                {/* Subcategory Dropdown Drawer */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-tight">{cat.name}</p>
                          <p className="text-[10px] font-semibold text-primary">Save up to 61% OFF</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {cat.subcategories.map((sub, i) => (
                          <Link
                            key={i}
                            href={`/search?q=${encodeURIComponent(sub)}`}
                            className="block px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            • {sub}
                          </Link>
                        ))}
                      </div>

                      <Link
                        href={`/search?c=${encodeURIComponent(cat.name)}`}
                        className="mt-2.5 block text-center py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                      >
                        View All {cat.name} →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
