
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [liveData, setLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);
  const quantity = getItemQuantity(product.id);

  // Universal real-time sync for all SKU views - Handled in background
  useEffect(() => {
    const sku = product.sku || product.id;
    if (!db || !sku) return;

    const liveRef = doc(db, 'product_live_data', sku);
    const unsubscribe = onSnapshot(liveRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setLiveData({ 
          price: Number(d.sahimed_price) || 0, 
          mrp: Number(d.mrp) || 0, 
          stock: Number(d.stock_quantity) ?? 0 
        });
      }
    }, (err) => {
      console.warn("Live sync failure for SKU:", sku);
    });

    return () => unsubscribe();
  }, [db, product.sku, product.id]);

  // Tiered Price Selection: Prioritize Live, Instant Fallback to Static
  const currentPrice = (liveData?.price && liveData.price > 0) ? liveData.price : product.price;
  const currentMrp = (liveData?.mrp && liveData.mrp > 0) ? liveData.mrp : (product.mrp || product.price + 50);
  
  const savingsAmt = Math.max(0, currentMrp - currentPrice);
  const savingsPct = currentMrp > 0 ? Math.round((savingsAmt / currentMrp) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      ...product,
      price: currentPrice,
      mrp: currentMrp
    });
    toast({ title: "Added to Bag" });
  };

  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full group relative">
      {savingsPct > 0 && (
        <div className="absolute top-3 left-3 z-10 animate-in fade-in zoom-in duration-500">
          <Badge className="bg-accent text-white font-black text-[10px] uppercase tracking-tighter px-3 py-1 rounded-full shadow-xl border-none ring-2 ring-white">
            {savingsPct}% OFF
          </Badge>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-4 space-y-3">
        <div className="relative aspect-square w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-50 flex items-center justify-center p-3">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-2 group-hover:scale-110 transition-transform duration-700" 
          />
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-gray-900 text-[12px] uppercase tracking-tighter leading-[1.2] line-clamp-2 min-h-[28px]">
            {product.name}
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {product.packSize || 'N/A'}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
            {product.manufacturer}
          </p>
        </div>

        <div className="pt-2 border-t border-dashed space-y-1 mt-auto">
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-black text-accent tracking-tighter">
              ₹{Number(currentPrice).toFixed(2)}
            </p>
            {currentMrp > currentPrice && (
              <span className="text-[10px] text-red-400 line-through font-bold">₹{Number(currentMrp).toFixed(2)}</span>
            )}
          </div>
          {savingsAmt > 0 && (
            <div className="flex items-center gap-1.5 bg-accent/5 w-fit px-2 py-0.5 rounded-md border border-accent/10 animate-pulse">
              <Zap className="w-2.5 h-2.5 text-accent fill-current" />
              <p className="text-[9px] font-black text-accent uppercase tracking-tighter">
                Save ₹{Number(savingsAmt).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4 pt-0">
        {quantity > 0 ? (
          <div className="flex items-center gap-1 rounded-full p-1 bg-primary shadow-lg w-full h-10">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
              className="h-full flex-1 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="w-3.5 h-3.5 font-black" />
            </button>
            <span className="text-[10px] font-black text-white flex-[1.5] text-center uppercase tracking-widest">
              {quantity} In Bag
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
              className="h-full flex-1 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 font-black" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleAdd} 
            className="rounded-full h-10 w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            ADD TO BAG <ShoppingCart className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
