"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { tapVariant } from '@/lib/animations';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  
  const molData = (product as any).moleculeData;
  const moleculeName = molData?.molecule || product.saltComposition || (product as any).composition || (product as any).salt || (product as any).moleculeName || (product as any).molecule;

  const quantity = getItemQuantity(product.id);

  const pPriceRaw = product.liveData?.sahimed_price || product.price || 0;
  const pMrpRaw = product.liveData?.mrp || product.mrp || (Number(pPriceRaw) + 20);

  const currentPrice = Number(pPriceRaw) || 0;
  const currentMrp = Number(pMrpRaw) || (currentPrice + 20);
  
  const savingsPct = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <div 
      className="pharma-card flex flex-col h-full group relative p-1.5 sm:p-2.5 bg-white border border-slate-100/60 rounded-[20px] sm:rounded-[28px] gap-1 sm:gap-1.5 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-0.5"
    >
      {savingsPct > 0 && (
        <div className="absolute top-0 left-2.5 sm:left-4 z-20 pointer-events-none drop-shadow-md">
          <div className="relative w-7 sm:w-10 h-10 sm:h-14">
            {/* The Ribbon Body */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-[#2E5BFF] rounded-t-sm flex flex-col items-center pt-1 sm:pt-2">
              <span className="text-[6px] sm:text-[8px] font-black text-white leading-none tracking-tighter uppercase opacity-80">Save</span>
              <span className="text-[9px] sm:text-[13px] font-black text-white leading-tight font-outfit">
                {savingsPct}%
              </span>
              <span className="text-[5px] sm:text-[7px] font-black text-white/90 uppercase tracking-widest mt-0.5">OFF</span>
            </div>
            
            {/* Serrated Bottom Edge (SVG) */}
            <div className="absolute -bottom-[6px] left-0 w-full">
              <svg viewBox="0 0 40 10" className="w-full h-[6px] fill-primary" preserveAspectRatio="none">
                <path d="M0 0 L5 8 L10 0 L15 8 L20 0 L25 8 L30 0 L35 8 L40 0 V10 H0 Z" />
              </svg>
            </div>

            {/* Fold effect at top (The blue "flap") */}
            <div className="absolute -top-[3px] left-0 w-2 h-[3px] bg-[#1E3A8A] rounded-tl-sm -skew-x-[45deg] origin-bottom-left" />
          </div>
        </div>
      )}
 
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 gap-1 sm:gap-1.5 w-full">
        <div className="relative w-full h-20 sm:h-28 bg-slate-50/50 rounded-[14px] sm:rounded-[20px] flex items-center justify-center overflow-hidden group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all duration-500 p-0.5 sm:p-1 shrink-0 mx-auto">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 100px, 200px"
            loading="lazy"
            className="object-contain p-0.5 sm:p-1 transition-transform duration-700 group-hover:scale-105" 
          />
        </div>
 
          <div className="space-y-0.5 flex-1 px-0.5 min-w-0">
            <div className="h-2.5 sm:h-3.5 mb-0.5">
              {product.isGeneric && (
                <p className="text-[5.5px] sm:text-[7.5px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1 py-0.5 rounded-full w-fit leading-none">
                  RECOMMENDED
                </p>
              )}
            </div>
            
            <h3 className="font-extrabold text-black text-[10px] sm:text-[12px] leading-tight line-clamp-2 min-h-[24px] sm:min-h-[28px] font-outfit uppercase tracking-tight group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            <div className="h-2 sm:h-3">
              {moleculeName && (
                <p className="text-[6px] sm:text-[8.5px] font-bold text-blue-600 uppercase tracking-tight line-clamp-1 leading-none opacity-80">
                  {moleculeName}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 pt-0.5">
              <p className="text-[6px] sm:text-[8px] font-bold text-slate-400 tracking-tight truncate uppercase italic shrink-0">
                {product.manufacturer || product.brand || 'Pharma'}
              </p>
              <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <p className="text-[6px] sm:text-[8px] font-black text-slate-600 tracking-tight truncate uppercase">
                {product.packSize || 'Pack'}
              </p>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
               <span className="text-slate-400 line-through text-[8px] sm:text-[10px] font-bold decoration-1">₹{Math.round(currentMrp)}</span>
               <span className="text-emerald-500 font-black text-[7px] sm:text-[9px] uppercase tracking-tighter">Save ₹{Math.round(currentMrp - currentPrice)}</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-black font-black text-base sm:text-lg font-outfit leading-none tracking-tighter">₹{Math.round(currentPrice)}</span>
               <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">Sahi Price</span>
            </div>
          </div>
      </Link>
      
      <div className="mt-1 sm:mt-2">
        <AnimatePresence mode="wait">
          {quantity > 0 ? (
            <motion.div 
              key="quantity-selector"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-primary/5 flex items-center gap-0.5 p-0.5 w-full h-6 sm:h-8 rounded-[10px] sm:rounded-[14px] border border-primary/10 shadow-inner"
            >
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary bg-white rounded-[8px] shadow-sm transition-all active:scale-90"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-[9px] sm:text-xs font-black text-primary flex-[1.2] text-center font-outfit">
                {quantity}
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary bg-white rounded-[8px] shadow-sm transition-all active:scale-90"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              key="add-button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileTap={tapVariant}
              onClick={(e) => {
                e.preventDefault();
                addToCart({ ...product, price: currentPrice, mrp: currentMrp });
                toast({ title: "Added" });
              }} 
              className="h-6 sm:h-8 w-full bg-primary text-white font-black text-[7px] sm:text-[9px] tracking-widest uppercase rounded-[10px] sm:rounded-[14px] shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all flex items-center justify-center gap-1 group/btn active:scale-95"
            >
              <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ADD
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
