"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';


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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, rotate: -1, scale: 1.02 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      className="bg-white border border-slate-100/60 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all flex flex-col h-full group relative p-5"
    >
      {savingsPct > 0 && (
        <div className="absolute top-5 left-5 z-10">
          <Badge className="bg-accent text-white font-black text-[9px] px-2.5 py-1 rounded-xl tracking-widest border-none shadow-lg shadow-accent/20 uppercase">
            {savingsPct}% OFF
          </Badge>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 space-y-5">
        <div className="relative aspect-square w-full bg-pastel-blue rounded-[32px] flex items-center justify-center overflow-hidden h-40 group-hover:bg-white transition-colors duration-500">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 40vw, 15vw"
            className="object-contain p-4 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" 
          />
        </div>

        <div className="space-y-2 flex-1 px-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">
            {product.brand || 'Premium Brand'}
          </p>
          <h3 className="font-extrabold text-slate-800 text-sm leading-tight line-clamp-2 min-h-[40px] font-outfit">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 tracking-tight">
            {product.packSize || '10 Capsules / Strip'}
          </p>
          
          <div className="flex items-center gap-3 pt-2">
            <span className="text-slate-900 font-black text-lg font-outfit tracking-tighter">₹{Math.round(currentPrice)}</span>
            <span className="text-slate-300 line-through text-[12px] font-bold opacity-70">₹{Math.round(currentMrp)}</span>
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
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                addToCart({ ...product, price: currentPrice, mrp: currentMrp });
                toast({ title: "Clinical Medicine added to cart" });
              }} 
              className="h-12 w-full bg-primary text-white font-black text-xs tracking-[0.15em] uppercase rounded-[20px] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group/btn"
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

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold", className)}>
      {children}
    </span>
  );
}
