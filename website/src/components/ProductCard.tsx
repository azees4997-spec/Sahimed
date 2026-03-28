"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-100/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col h-full group relative p-4"
    >
      {savingsPct > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-accent text-white font-bold text-[9px] px-2 py-0.5 rounded-lg tracking-tight border-none shadow-sm capitalize">
            {savingsPct}% OFF
          </Badge>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 space-y-4">
        <div className="relative aspect-square w-full bg-slate-50/50 rounded-2xl flex items-center justify-center overflow-hidden h-32 group-hover:bg-primary/5 transition-colors">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 40vw, 15vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110" 
          />
        </div>

        <div className="space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-80">
            {product.brand || 'Premium Brand'}
          </p>
          <h3 className="font-bold text-slate-800 text-xs leading-tight line-clamp-2 min-h-[32px] font-outfit">
            {product.name}
          </h3>
          <p className="text-[10px] font-medium text-slate-400 truncate">
            {product.packSize || '10 Capsules'}
          </p>
          
          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-900 font-extrabold text-sm font-outfit">₹{Math.round(currentPrice)}</span>
            <span className="text-slate-300 line-through text-[11px] font-medium">₹{Math.round(currentMrp)}</span>
          </div>
        </div>
      </Link>
      
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {quantity > 0 ? (
            <motion.div 
              key="quantity-selector"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-primary/5 flex items-center gap-1 p-1 w-full h-10 rounded-xl border border-primary/10"
            >
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary hover:bg-white rounded-lg transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-extrabold text-primary flex-[1.5] text-center font-outfit">
                {quantity}
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                className="h-full flex-1 flex items-center justify-center text-primary hover:bg-white rounded-lg transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              key="add-button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                addToCart({ ...product, price: currentPrice, mrp: currentMrp });
                toast({ title: "Medicines added to cart" });
              }} 
              className="h-10 w-full bg-primary text-white font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
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
