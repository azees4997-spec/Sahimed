
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { BellRing, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
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

  // Dynamic Data Sync for Price and Stock
  useEffect(() => {
    if (db && product.sku) {
      setIsLoadingLive(true);
      const liveRef = doc(db, 'product_live_data', product.sku);
      getDoc(liveRef).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ 
            price: Number(d.sahimed_price) || 0, 
            mrp: Number(d.mrp) || 0, 
            stock: Number(d.stock_quantity) || 0 
          });
        }
        setIsLoadingLive(false);
      }).catch(() => setIsLoadingLive(false));
    } else {
      setIsLoadingLive(false);
    }
  }, [db, product.sku]);

  const currentPrice = liveData?.price || 0;
  const currentMrp = liveData?.mrp || 0;
  const isOutOfStock = liveData ? liveData.stock <= 0 : false;
  
  // Clinical Calcs
  const packNum = parseInt(product.packSize?.match(/\d+/)?.[0] || "1");
  const unitCost = currentPrice > 0 ? (currentPrice / packNum).toFixed(2) : "0.00";
  const savingsPercent = (currentMrp > currentPrice && currentMrp > 0) 
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) 
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    toast({ title: "Added to Bag", description: `${product.name} ready for checkout.` });
  };

  const handleNotify = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login Required", description: "Sign in to receive stock notifications." });
      return;
    }
    const enquiryData = {
      medicineId: product.id,
      medicineName: product.name,
      userId: user.uid,
      timestamp: serverTimestamp()
    };
    addDocumentNonBlocking(collection(db, 'stockEnquiries'), enquiryData);
    toast({ title: "Notification Set", description: "We will alert you when stock returns." });
  };

  // Robust URL Validation
  const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <div className={cn(
      "bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full group",
      isOutOfStock && "opacity-90"
    )}>
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-4 sm:p-6 space-y-3 sm:space-y-5">
        
        {/* 1. Medicine Pack Image (Centered) */}
        <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-4">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            fill 
            className="object-contain p-2 group-hover:scale-110 transition-transform duration-700" 
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white/90 px-4 py-1.5 rounded-full border border-orange-100 text-[8px] font-black text-orange-600 uppercase tracking-widest shadow-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* 2. Item Name */}
        <h3 className="font-black text-gray-900 text-[13px] sm:text-base uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.4rem]">
          {product.name}
        </h3>

        {/* 3. Pack Size */}
        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {product.packSize || 'N/A'}
        </p>

        {/* 4. Marketing Company */}
        <p className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase truncate">
          {product.manufacturer || 'PHARMA CORP'}
        </p>

        {/* 5. Dynamic Pricing & Unit Cost */}
        <div className="pt-3 border-t border-dashed space-y-1">
          <div className="flex items-baseline gap-2">
            <p className="text-[16px] sm:text-2xl font-black text-accent tracking-tighter">
              ₹{isLoadingLive ? "..." : currentPrice}
            </p>
            {savingsPercent > 0 && (
              <span className="text-[10px] sm:text-xs text-red-400 line-through font-bold">₹{currentMrp}</span>
            )}
          </div>
          <p className="text-[8px] sm:text-[11px] text-gray-400 font-bold">
            ₹{unitCost} per unit
          </p>
        </div>

        {/* 6. Savings Badge (Live Calculation) */}
        {savingsPercent > 0 && !isOutOfStock && (
          <div className="mt-auto">
            <div className="bg-accent/10 text-accent text-[8px] sm:text-[10px] font-black uppercase px-3 py-1.5 rounded-xl text-center border border-accent/5">
              SAVE {savingsPercent}%
            </div>
          </div>
        )}
      </Link>
      
      {/* 7. Action Button (Add to Bag / Notify) */}
      <div className="p-4 sm:p-6 pt-0 mt-auto">
        {isOutOfStock ? (
          <Button 
            onClick={handleNotify} 
            variant="outline" 
            className="rounded-full h-10 sm:h-12 w-full border-orange-200 bg-orange-50 text-orange-600 font-black text-[9px] sm:text-[11px] uppercase tracking-widest gap-2 shadow-sm hover:bg-orange-100 transition-colors"
          >
            <BellRing className="w-4 h-4" /> Notify Me
          </Button>
        ) : quantity > 0 ? (
          <div className="flex items-center gap-1 rounded-full p-1 bg-primary shadow-xl w-full h-10 sm:h-12">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
              className="h-full flex-1 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="w-4 h-4 font-black" />
            </button>
            <span className="text-[10px] sm:text-[12px] font-black text-white flex-[1.5] text-center uppercase tracking-widest">
              {quantity} In Bag
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
              className="h-full flex-1 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="w-4 h-4 font-black" />
            </button>
          </div>
        ) : (
          <Button 
            onClick={handleAdd} 
            className="rounded-full h-10 sm:h-12 w-full bg-primary hover:bg-primary/90 text-white font-black text-[9px] sm:text-[11px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            ADD TO BAG <ShoppingCart className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
