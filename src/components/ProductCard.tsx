
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [liveData, setLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const quantity = getItemQuantity(product.id);

  // GLOBAL REAL-TIME HANDSHAKE: Independent listener for every SKU
  useEffect(() => {
    const sku = product.sku || product.id;
    if (!db || !sku) {
      setIsLoadingLive(false);
      return;
    }

    const liveRef = doc(db, 'product_live_data', sku);
    const unsubscribe = onSnapshot(liveRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setLiveData({ 
          price: Number(d.sahimed_price) || 0, 
          mrp: Number(d.mrp) || 0, 
          stock: Number(d.stock_quantity) ?? 0 
        });
      } else {
        setLiveData({ price: 0, mrp: 0, stock: 0 });
      }
      setIsLoadingLive(false);
    }, (err) => {
      setIsLoadingLive(false);
    });

    return () => unsubscribe();
  }, [db, product.sku, product.id]);

  // HIGH-PRECISION PRICE RECOVERY: Priority 1: Live, Priority 2: Static
  const currentPrice = (liveData?.price && liveData.price > 0) ? liveData.price : product.price;
  const currentMrp = (liveData?.mrp && liveData.mrp > 0) ? liveData.mrp : (product.mrp || product.price + 50);
  
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
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full group">
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-4 space-y-3">
        
        {/* 1. Medicine Pack Photo */}
        <div className="relative aspect-square w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-50 flex items-center justify-center p-3">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            className="object-contain p-2 group-hover:scale-110 transition-transform duration-700" 
          />
        </div>

        {/* Clinical Identity Sequence */}
        <div className="space-y-1">
          {/* 2. Item Name */}
          <h3 className="font-black text-gray-900 text-[13px] uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.4rem]">
            {product.name}
          </h3>
          {/* 3. Pack Size */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {product.packSize || 'N/A'}
          </p>
          {/* 4. Manufacturer */}
          <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
            {product.manufacturer || 'PHARMA CORP'}
          </p>
        </div>

        {/* 5 & 6. Pricing Section - Universal Handshake + Static Fallback */}
        <div className="pt-2 border-t border-dashed space-y-0.5 mt-auto">
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-black text-accent tracking-tighter">
              {isLoadingLive ? (
                <span className="animate-pulse text-gray-300">...</span>
              ) : currentPrice > 0 ? (
                `₹${currentPrice}`
              ) : (
                <span className="text-gray-300">Price TBD</span>
              )}
            </p>
            {!isLoadingLive && currentMrp > currentPrice && currentPrice > 0 && (
              <span className="text-[10px] text-red-400 line-through font-bold">₹{currentMrp}</span>
            )}
          </div>
        </div>
      </Link>
      
      {/* 7. Purchase Logic - Universal ADD (Always Active) */}
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
          <Button 
            onClick={handleAdd} 
            className="rounded-full h-10 w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            ADD TO BAG <ShoppingCart className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
