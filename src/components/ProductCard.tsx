
"use client"

import Link from 'next/link';
import { Plus, Minus, BellRing, ShoppingCart, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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
  const quantity = getItemQuantity(product.id);

  // Dynamic Data Sync
  useEffect(() => {
    if (db && product.sku) {
      const liveRef = doc(db, 'product_live_data', product.sku);
      getDoc(liveRef).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ price: d.sahimed_price || 0, mrp: d.mrp || 0, stock: d.stock_quantity || 0 });
        }
      });
    }
  }, [db, product.sku]);

  const currentPrice = liveData?.price || product.price || 0;
  const isOutOfStock = (liveData?.stock ?? product.availableQuantity ?? 0) <= 0;
  const packNum = parseInt(product.packSize?.match(/\d+/)?.[0] || "1");
  const unitCost = (currentPrice / packNum).toFixed(2);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
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
    toast({ title: "Notification Set" });
  };

  return (
    <div className={cn("bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full", isOutOfStock && "opacity-90")}>
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-4 sm:p-6 space-y-4">
        {/* 1. Item Name */}
        <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* 2. Pack */}
        <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">
          {product.packSize || 'N/A'}
        </p>

        {/* 3. Marketing Company */}
        <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase truncate">
          {product.manufacturer || 'SUN PHARMA'}
        </p>

        {/* 4. Sahimed Price */}
        <div className="pt-2 border-t border-dashed">
          <p className="text-lg sm:text-xl font-black text-accent tracking-tighter">₹{currentPrice}</p>
          {/* 5. Unit Cost */}
          <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold">₹{unitCost} per unit</p>
        </div>

        {/* 6. Save % Footer (Conditional) */}
        {product.mrp > product.price && !isOutOfStock && (
          <div className="mt-auto pt-2">
            <div className="bg-accent/10 text-accent text-[7px] sm:text-[9px] font-black uppercase px-2 py-1.5 rounded-lg text-center">
              SWITCH & SAVE {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
            </div>
          </div>
        )}
      </Link>
      
      <div className="p-4 pt-0">
        {isOutOfStock ? (
          <Button onClick={handleNotify} variant="outline" className="rounded-full h-10 w-full border-orange-200 bg-orange-50 text-orange-600 font-black text-[9px] uppercase tracking-widest gap-2">
            <BellRing className="w-3.5 h-3.5" /> Notify Me
          </Button>
        ) : quantity > 0 ? (
          <div className="flex items-center gap-1 rounded-full p-1 bg-primary shadow-xl w-full">
            <button onClick={(e) => { e.preventDefault(); updateQuantity(product.id, -1); }} className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white"><Minus className="w-4 h-4" /></button>
            <span className="text-[10px] font-black text-white flex-1 text-center">{quantity} Units</span>
            <button onClick={(e) => { e.preventDefault(); updateQuantity(product.id, 1); }} className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white"><Plus className="w-4 h-4" /></button>
          </div>
        ) : (
          <Button onClick={handleAdd} className="rounded-full h-10 w-full bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all">
            ADD TO BAG <ShoppingCart className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
