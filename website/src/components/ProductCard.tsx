"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { hoverVariant, springTransition, tapVariant } from '@/lib/animations';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  
  // 1. Performance Fix: Use pre-fetched moleculeData from the server-side join (no more client-side waterfall)
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
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={hoverVariant}
      transition={springTransition}
      className="pharma-card flex flex-col h-full group relative p-3 sm:p-5 bg-white border border-slate-100/60 rounded-[24px] sm:rounded-[32px] gap-2 sm:gap-0 shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      {savingsPct > 0 && (
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20">
          <Badge className="bg-emerald-600 text-white font-black text-[8px] sm:text-[11px] px-3 py-1.5 rounded-full tracking-[0.1em] border-none shadow-xl shadow-emerald-200/50 uppercase">
            SAVE {savingsPct}%
          </Badge>
        </div>
      )}
 
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 gap-2 sm:gap-4 w-full">
        <div className="relative w-full aspect-square sm:h-40 bg-slate-50/50 rounded-[20px] sm:rounded-[28px] flex items-center justify-center overflow-hidden group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all duration-500 p-0.5 sm:p-1 shrink-0 mx-auto">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 40vw, 20vw"
            className="object-contain p-0.5 sm:p-1.5 transition-transform duration-700 group-hover:scale-110" 
          />
        </div>
 
          <div className="space-y-1 sm:space-y-1.5 flex-1 px-1 min-w-0">
            {/* Slot 1: Generic Badge Slot (Fixed Height) */}
            <div className="h-4 sm:h-6 mb-1.5">
              {product.isGeneric && (
                <p className="text-[7px] sm:text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                  SAHI RECOMMENDED
                </p>
              )}
            </div>
            
            {/* Slot 2: Title Slot (Fixed 2 lines) */}
            <h3 className="font-extrabold text-black text-[12px] sm:text-[18px] leading-[1.2] line-clamp-2 min-h-[30px] sm:min-h-[44px] font-outfit uppercase tracking-tight group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Slot 3: Molecule Slot (Fixed height) */}
            <div className="h-3 sm:h-4">
              {moleculeName && (
                <p className="text-[8px] sm:text-[12px] font-bold text-blue-600 uppercase tracking-tight line-clamp-1 leading-none opacity-90">
                  {moleculeName}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-0 pt-0.5">
              <p className="text-[7px] sm:text-[10px] font-bold text-slate-400 tracking-tight truncate uppercase italic">
                {product.manufacturer || product.brand || 'Pharma Division'}
              </p>
              <p className="text-[8px] sm:text-[11px] font-black text-slate-600 tracking-tight truncate uppercase">
                {product.packSize || '10 Units / Pack'}
              </p>
            </div>
          </div>
            <div className="flex items-center gap-3">
               <span className="text-slate-400 line-through text-[10px] sm:text-[14px] font-bold decoration-1">MRP ₹{Math.round(currentMrp)}</span>
               <span className="text-emerald-500 font-black text-[10px] sm:text-[14px] uppercase tracking-tighter">Save ₹{Math.round(currentMrp - currentPrice)}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-black font-black text-xl sm:text-3xl font-outfit leading-none tracking-tighter">₹{Math.round(currentPrice)}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Sahimed Price</span>
            </div>
      </Link>
      
      <div className="mt-3 sm:mt-6">
        <AnimatePresence mode="wait">
          {quantity > 0 ? (
            <motion.div 
              key="quantity-selector"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-primary/5 flex items-center gap-1 p-1 w-full h-8 sm:h-12 rounded-[14px] sm:rounded-[18px] border border-primary/10 shadow-inner"
            >
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary bg-white rounded-[10px] shadow-sm transition-all active:scale-90 hover:bg-slate-50"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] sm:text-base font-black text-primary flex-[1.2] text-center font-outfit">
                {quantity}
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary bg-white rounded-[10px] shadow-sm transition-all active:scale-90 hover:bg-slate-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              key="add-button"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileTap={tapVariant}
              onClick={(e) => {
                e.preventDefault();
                addToCart({ ...product, price: currentPrice, mrp: currentMrp });
                toast({ title: "Added to Basket" });
              }} 
              className="h-8 sm:h-12 w-full bg-primary text-white font-black text-[8px] sm:text-[11px] tracking-widest uppercase rounded-[14px] sm:rounded-[20px] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 sm:gap-2 group/btn active:scale-95"
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:translate-y-[-2px] transition-transform" />
              ADD
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
