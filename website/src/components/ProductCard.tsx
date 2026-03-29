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
      transition={springTransition as any}
      className="pharma-card flex flex-col h-full group relative p-2 sm:p-4 bg-white border border-slate-100 rounded-[16px] sm:rounded-[32px] gap-2 sm:gap-0"
    >
      {savingsPct > 0 && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20">
          <Badge className="bg-accent text-white font-black text-[8px] px-2 py-0.5 rounded-lg tracking-widest border-none shadow-lg shadow-accent/20 uppercase">
            {savingsPct}% OFF
          </Badge>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 gap-2 sm:gap-4 w-full">
        <div className="relative w-full aspect-square sm:h-32 bg-sahi-blue rounded-[16px] sm:rounded-[24px] flex items-center justify-center overflow-hidden group-hover:bg-white transition-colors duration-500 p-2 sm:p-3 shrink-0 mx-auto">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 30vw, 15vw"
            className="object-contain p-1.5 sm:p-3 transition-transform duration-700 group-hover:scale-110" 
          />
          {savingsPct > 0 && (
             <div className="hidden sm:block absolute top-1.5 right-1.5 bg-accent text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg shadow-accent/20 z-10 animate-pulse-slow">
               SAVE ₹{Math.round(currentMrp - currentPrice)}
             </div>
          )}
        </div>

        <div className="space-y-0.5 sm:space-y-1.5 flex-1 px-0.5 min-w-0">
          {product.brand && (
            <p className="text-[8px] sm:text-[10px] font-black text-primary/80 uppercase tracking-[0.1em] opacity-100 mb-0.5">
              {product.brand}
            </p>
          )}
          <h3 className="font-extrabold text-slate-800 text-[10px] sm:text-xs leading-tight line-clamp-2 min-h-[28px] sm:min-h-[32px] font-outfit uppercase">
            {product.name}
          </h3>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <p className="text-[9px] sm:text-[11px] font-bold text-slate-600 tracking-tight truncate opacity-100">
              {product.packSize || '10 Capsules / Strip'}
            </p>
            {product.manufacturer && (
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 truncate uppercase tracking-tighter">
                {product.manufacturer}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2.5 pt-0.5 sm:pt-1.5">
            <span className="text-primary font-black text-sm sm:text-base font-outfit tracking-tighter">₹{Math.round(currentPrice)}</span>
            <span className="text-slate-500 line-through text-[9px] sm:text-[11px] font-bold opacity-70 decoration-1">₹{Math.round(currentMrp)}</span>
            {savingsPct > 0 && (
              <span className="text-[8px] sm:text-[10px] font-black text-accent uppercase tracking-tighter ml-auto">Save ₹{Math.round(currentMrp - currentPrice)}</span>
            )}
          </div>
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
              className="bg-primary/5 flex items-center gap-1 p-0.5 w-full h-8 sm:h-10 rounded-[12px] border border-primary/10 shadow-inner"
            >
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary hover:bg-white rounded-[10px] transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-black text-primary flex-[1.5] text-center font-outfit">
                {quantity}
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary hover:bg-white rounded-[10px] transition-all"
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
                toast({ title: "Medicines in Basket" });
              }} 
              className="h-8 sm:h-10 w-full bg-primary text-white font-black text-[8px] sm:text-[10px] tracking-widest uppercase rounded-[12px] sm:rounded-[14px] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 sm:gap-2 group/btn"
            >
              <ShoppingCart className="w-3.5 h-3.5 group-hover/btn:translate-y-[-1.5px] transition-transform" />
              ADD TO CART
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
