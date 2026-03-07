"use client"

import Link from 'next/link';
import Image from 'next/image';
import { BellRing, ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [liveData, setLiveData] = useState<{ price: number, mrp: number, stock: number } | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const quantity = getItemQuantity(product.id);

  // UNIVERSAL REAL-TIME LISTENER: Direct handshake for every SKU rendered
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

  const currentPrice = liveData?.price || 0;
  const currentMrp = liveData?.mrp || 0;
  const isOutOfStock = liveData ? liveData.stock <= 0 : false;
  
  // Clinical Precision Calculations
  const packNum = parseInt(product.packSize?.match(/\d+/)?.[0] || "1");
  const unitCost = currentPrice > 0 ? (currentPrice / packNum).toFixed(2) : "0.00";
  const savingsPercent = (currentMrp > currentPrice && currentMrp > 0) 
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) 
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isLoadingLive) return;
    addToCart(product);
    toast({ title: "Added to Bag" });
  };

  const handleNotify = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login Required", description: "Sign in to receive notifications." });
      return;
    }
    const enquiryData = {
      medicineId: product.id,
      medicineName: product.name,
      userId: user.uid,
      timestamp: serverTimestamp()
    };
    addDocumentNonBlocking(collection(db, 'stockEnquiries'), enquiryData);
    toast({ title: "Notification Set" });
  };

  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <div className={cn(
      "bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full group",
      isOutOfStock && !isLoadingLive && "opacity-90"
    )}>
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-4 space-y-3">
        
        {/* 1. Centered Medicine Pack Photo */}
        <div className="relative aspect-square w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-50 flex items-center justify-center p-3">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            className="object-contain p-2 group-hover:scale-110 transition-transform duration-700" 
          />
          {isOutOfStock && !isLoadingLive && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/90 px-3 py-1 rounded-full border border-orange-100 text-[8px] font-black text-orange-600 uppercase tracking-widest shadow-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* 2. Clinical Identity Sequence */}
        <div className="space-y-1">
          <h3 className="font-black text-gray-900 text-[13px] uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.4rem]">
            {product.name}
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {product.packSize || 'N/A'}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
            {product.manufacturer || 'PHARMA CORP'}
          </p>
        </div>

        {/* 3. Pricing Section (Dynamic Sync) */}
        <div className="pt-2 border-t border-dashed space-y-0.5 mt-auto">
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-black text-accent tracking-tighter">
              {isLoadingLive ? (
                <span className="animate-pulse text-gray-300">...</span>
              ) : `₹${currentPrice}`}
            </p>
            {!isLoadingLive && savingsPercent > 0 && (
              <span className="text-[10px] text-red-400 line-through font-bold">₹{currentMrp}</span>
            )}
          </div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
            {isLoadingLive ? "Checking Price..." : `₹${unitCost} per unit`}
          </p>
        </div>

        {/* 4. Switch & Save Engine */}
        {!isLoadingLive && savingsPercent > 0 && !isOutOfStock && (
          <div className="bg-accent/10 text-accent text-[9px] font-black uppercase px-3 py-1.5 rounded-lg text-center border border-accent/5">
            SAVE {savingsPercent}% TODAY
          </div>
        )}
      </Link>
      
      {/* 5. Purchase Logic (Global stock_quantity > 0 Trigger) */}
      <div className="p-4 pt-0">
        {isLoadingLive ? (
          <Button disabled className="rounded-full h-10 w-full bg-gray-50 text-gray-400 border-none font-black text-[9px] uppercase tracking-widest gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking...
          </Button>
        ) : isOutOfStock ? (
          <Button 
            onClick={handleNotify} 
            variant="outline" 
            className="rounded-full h-10 w-full border-orange-200 bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm hover:bg-orange-100 transition-colors"
          >
            <BellRing className="w-4 h-4" /> Notify Me
          </Button>
        ) : quantity > 0 ? (
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