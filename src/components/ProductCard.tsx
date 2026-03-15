
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

  // Universal real-time sync for all SKU views
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

  // Tiered Price Selection
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
    <div className="bg-white rounded-[12px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group relative">
      {/* Discount Badge - Top Right per reference */}
      {savingsPct > 0 && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-[#4CAF50] text-white font-bold text-[9px] px-2 py-1 rounded-bl-lg">
            {savingsPct}% OFF
          </div>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-4 space-y-3">
        <div className="relative aspect-square w-full bg-white flex items-center justify-center">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-contain p-2" 
          />
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 text-[13px] leading-[1.3] line-clamp-2 min-h-[34px]">
            {product.name}
          </h3>
          <p className="text-[11px] font-bold text-[#3F51B5] truncate">
            {product.manufacturer}
          </p>
          <p className="text-[11px] font-medium text-gray-400">
            {product.packSize || 'N/A'}
          </p>
        </div>

        <div className="pt-2 mt-auto">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">
              ₹{Number(currentPrice).toFixed(1)}
            </p>
            {currentMrp > currentPrice && (
              <span className="text-[11px] text-gray-400 line-through">₹{Number(currentMrp).toFixed(1)}</span>
            )}
          </div>
        </div>
      </Link>
      
      <div className="p-4 pt-0">
        {quantity > 0 ? (
          <div className="flex items-center gap-1 rounded-md border border-primary p-1 bg-white w-full h-10">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
              className="h-full flex-1 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold text-gray-900 flex-[1.5] text-center">
              {quantity} In Bag
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
              className="h-full flex-1 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleAdd} 
            className="rounded-md h-10 w-full border border-[#FFCDD2] bg-[#FFEBEE]/30 hover:bg-[#FFEBEE]/60 text-[#D32F2F] font-bold text-xs transition-all active:scale-95"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
