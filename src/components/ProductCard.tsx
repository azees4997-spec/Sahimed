
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [liveData, setLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);
  const quantity = getItemQuantity(product.id);

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
    });

    return () => unsubscribe();
  }, [db, product.sku, product.id]);

  const currentPrice = (liveData?.price && liveData.price > 0) ? liveData.price : product.price;
  const currentMrp = (liveData?.mrp && liveData.mrp > 0) ? liveData.mrp : (product.mrp || product.price + 50);
  
  const savingsPct = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full group relative p-2">
      {savingsPct > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-primary text-white font-black text-[7px] px-1.5 py-0.5 rounded tracking-tighter">
            Save {savingsPct}%
          </div>
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 space-y-2">
        <div className="relative aspect-square w-full bg-[#F8FAFC] rounded-lg flex items-center justify-center overflow-hidden h-28">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 40vw, 15vw"
            className="object-contain p-1 group-hover:scale-105 transition-transform" 
          />
        </div>

        <div className="space-y-0.5">
          <h3 className="font-black text-gray-900 text-[11px] leading-tight line-clamp-2 min-h-[28px]">
            {product.name}
          </h3>
          <p className="text-[8px] font-bold text-gray-400 truncate">
            {product.packSize || '10 Capsules'}
          </p>
          
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-gray-400 line-through text-[9px] font-bold">₹{Math.round(currentMrp)}</span>
            <span className="text-gray-900 font-black text-[13px]">₹{Math.round(currentPrice)}</span>
          </div>
        </div>
      </Link>
      
      <div className="mt-2">
        {quantity > 0 ? (
          <div className="flex items-center gap-1 rounded-md border border-primary p-0.5 bg-white w-full h-8">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
              className="h-full flex-1 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="text-[10px] font-black text-gray-900 flex-[1.5] text-center">
              {quantity}
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
              className="h-full flex-1 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={(e) => {
              e.preventDefault();
              addToCart({ ...product, price: currentPrice, mrp: currentMrp });
              toast({ title: "Added to bag" });
            }} 
            className="rounded-md h-8 w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] tracking-wider transition-all active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}
