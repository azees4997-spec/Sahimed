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
import RibbonBadge from './RibbonBadge';

import { memo } from 'react';

function ProductCardComponent({ product, priority = false }: { product: Product, priority?: boolean }) {
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
    : null;

  return (
    <div 
      className="pharma-card flex flex-col h-full group relative p-1.5 sm:p-2.5 bg-white border border-slate-100/60 rounded-[20px] sm:rounded-[28px] gap-1 sm:gap-1.5 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-0.5"
    >
      <RibbonBadge 
        savingsPct={savingsPct} 
        variant={(product.isGeneric === true || product.isGeneric === "true") ? 'accent' : 'primary'} 
        className="left-2.5 sm:left-4"
        size="md"
      />
 
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 gap-1 sm:gap-1.5 w-full">
        <div className="relative w-full h-20 sm:h-28 bg-slate-50/50 rounded-[14px] sm:rounded-[20px] flex items-center justify-center overflow-hidden group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all duration-500 p-0.5 sm:p-1 shrink-0 mx-auto">
          {safeImageUrl ? (
            <Image 
              src={safeImageUrl} 
              alt={product.name} 
              fill 
              sizes="(max-width: 640px) 140px, 240px"
              loading={priority ? undefined : "lazy"}
              priority={priority}
              className="object-contain p-0.5 sm:p-1 transition-transform duration-700 group-hover:scale-105" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-1">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
                <rect x="8" y="18" width="32" height="12" rx="6" fill="#0d9488"/>
                <rect x="8" y="18" width="16" height="12" rx="6" fill="#134e4a"/>
                <circle cx="24" cy="24" r="2" fill="white" opacity="0.5"/>
              </svg>
              <span className="text-[8px] text-slate-300 font-medium text-center px-1 leading-tight line-clamp-2">{product.name}</span>
            </div>
          )}
        </div>
 
          <div className="space-y-0.5 flex-1 px-0.5 min-w-0">
            <div className="h-2.5 sm:h-3.5 mb-0.5">
              {product.isGeneric && (
                <p className="text-[5.5px] sm:text-[7.5px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1 py-0.5 rounded-full w-fit leading-none">
                  RECOMMENDED
                </p>
              )}
            </div>
            
            <h3 className="font-extrabold text-slate-950 text-[11px] sm:text-[13px] leading-tight line-clamp-none min-h-[36px] sm:min-h-[42px] font-outfit uppercase tracking-tight group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            <div className="h-auto">
              {moleculeName && (
                <p className="text-[7px] sm:text-[9.5px] font-black text-blue-900 uppercase tracking-tight leading-tight mb-1">
                  {moleculeName}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-1 min-w-0">
              <p className="text-[7px] sm:text-[9px] font-black text-slate-950 tracking-tight uppercase italic">
                {product.manufacturer || product.brand || 'Pharma'}
              </p>
              <div className="w-0.5 h-0.5 rounded-full bg-slate-400" />
              <p className="text-[7px] sm:text-[9px] font-black text-slate-900 tracking-tight uppercase">
                {product.packSize || 'Pack'}
              </p>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
               <span className="text-slate-500 line-through text-[8px] sm:text-[10px] font-bold decoration-1">₹{Math.round(currentMrp)}</span>
               <span className="text-emerald-500 font-black text-[7px] sm:text-[9px] uppercase tracking-tighter">Save ₹{Math.round(currentMrp - currentPrice)}</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-black font-black text-base sm:text-lg font-outfit leading-none tracking-tighter">₹{Math.round(currentPrice)}</span>
               <span className="text-[7px] sm:text-[8px] font-black text-slate-700 uppercase tracking-widest">Sahi Price</span>
            </div>
          </div>
      </Link>
      
      <div className="mt-1 sm:mt-2">
        <AnimatePresence mode="wait">
          {((Number(product.availableQuantity) <= 0 && (!product.liveData || Number(product.liveData.stock_quantity) <= 0))) ? (
            <button 
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch('/api/inventory/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      productId: product.id,
                      platform: 'web',
                      pincode: location
                    })
                  });
                  if (res.ok) {
                    toast({ title: "Notification Set", description: "We'll alert you when this is back!" });
                  }
                } catch (e) {
                  toast({ variant: 'destructive', title: "Error", description: "Failed to set alert." });
                }
              }}
              className="h-6 sm:h-8 w-full bg-[#FFF1F2] text-[#E11D48] font-black text-[7px] sm:text-[9px] tracking-widest uppercase rounded-[10px] sm:rounded-[14px] flex items-center justify-center gap-1 border border-[#FFE4E6] hover:bg-[#FFE4E6] transition-all active:scale-95"
            >
              NOTIFY ME
            </button>
          ) : quantity > 0 ? (
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

export default memo(ProductCardComponent);

