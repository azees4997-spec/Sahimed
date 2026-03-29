"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
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
      className="pharma-card flex flex-row sm:flex-col h-full group relative p-3 sm:p-5 bg-white border border-slate-100 rounded-[24px] sm:rounded-[48px] gap-3 sm:gap-0"
    >
      {savingsPct > 0 && (
        <div className="absolute top-5 left-5 z-10">
          <Badge className="bg-accent text-white font-black text-[9px] px-2.5 py-1 rounded-xl tracking-widest border-none shadow-lg shadow-accent/20 uppercase">
            {savingsPct}% OFF
          </Badge>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-row sm:flex-col flex-1 gap-3 sm:gap-5 w-full">
        <div className="relative aspect-square w-24 h-24 sm:w-full sm:h-40 bg-sahi-blue rounded-[20px] sm:rounded-[32px] flex items-center justify-center overflow-hidden group-hover:bg-white transition-colors duration-500 p-2 sm:p-4 shrink-0">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 30vw, 15vw"
            className="object-contain p-2 sm:p-4 transition-transform duration-700 group-hover:scale-110" 
          />
          {savingsPct > 0 && (
             <div className="absolute top-2 right-2 bg-accent text-white text-[8px] sm:text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-accent/20 z-10 animate-pulse-slow">
               SAVE ₹{Math.round(currentMrp - currentPrice)}
             </div>
          )}
        </div>

        <div className="space-y-1 sm:space-y-2 flex-1 px-1 min-w-0">
          {product.brand && (
            <p className="text-[9px] sm:text-[11px] font-black text-primary/80 uppercase tracking-[0.15em] opacity-100 mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight line-clamp-2 min-h-[32px] sm:min-h-[40px] font-outfit uppercase">
            {product.name}
          </h3>
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="text-[10px] sm:text-[12px] font-bold text-slate-600 tracking-tight truncate opacity-100">
              {product.packSize || '10 Capsules / Strip'}
            </p>
            {product.manufacturer && (
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">
                {product.manufacturer}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
            <span className="text-primary font-black text-base sm:text-xl font-outfit tracking-tighter">₹{Math.round(currentPrice)}</span>
            <span className="text-slate-500 line-through text-[11px] sm:text-[13px] font-bold opacity-70 decoration-1">₹{Math.round(currentMrp)}</span>
            {savingsPct > 0 && (
              <span className="text-[9px] sm:text-[11px] font-black text-accent uppercase tracking-tighter ml-auto">Save ₹{Math.round(currentMrp - currentPrice)}</span>
            )}
          </div>
        </div>
      </Link>
      
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {quantity > 0 ? (
            <motion.div 
              key="quantity-selector"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-primary/5 flex items-center gap-1 p-1 w-full h-12 rounded-[20px] border border-primary/10 shadow-inner"
            >
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary hover:bg-white rounded-[16px] transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-primary flex-[1.5] text-center font-outfit">
                {quantity}
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary hover:bg-white rounded-[16px] transition-all"
              >
                <Plus className="w-4 h-4" />
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
              className="h-10 sm:h-12 w-full bg-primary text-white font-black text-[9px] sm:text-xs tracking-[0.15em] uppercase rounded-[16px] sm:rounded-[20px] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 sm:gap-3 group/btn"
            >
              <ShoppingBag className="w-4 h-4 group-hover/btn:translate-y-[-2px] transition-transform" />
              Add to Bag
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
