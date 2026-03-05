
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, BellRing, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const quantity = getItemQuantity(product.id);
  const isOutOfStock = (product.availableQuantity || 0) <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    addToCart(product);
    // Silent confirmation per prior context of non-intrusive UI
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
    toast({ title: "Notification Set", description: "We will notify you when stock returns." });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    updateQuantity(product.id, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, -1);
  };

  const mrp = product.mrp || product.price + (product.price * 0.2);
  const savingsAmount = Math.max(0, Math.round(mrp - product.price));
  const savingsPercent = Math.round(((mrp - product.price) / mrp) * 100);

  // Unit Price Calculation
  const packSizeMatch = product.packSize?.match(/\d+/);
  const unitsCount = packSizeMatch ? parseInt(packSizeMatch[0]) : 1;
  const unitPrice = (product.price / unitsCount).toFixed(1);

  return (
    <Link 
      href={`/product/${product.id}`}
      className={cn(
        "group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col active:scale-[0.98] h-full",
        isOutOfStock && "opacity-90"
      )}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-white border-b border-gray-50">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={cn(
            "object-contain p-4 group-hover:scale-110 transition-transform duration-700",
            isOutOfStock && "grayscale opacity-40"
          )}
          data-ai-hint="pharmaceutical product"
          sizes="(max-width: 768px) 50vw, 300px"
          loading="lazy"
        />
        
        {savingsPercent > 0 && !isOutOfStock && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-accent text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-xl animate-in fade-in zoom-in duration-500">
              SAVE ₹{savingsAmount} ({savingsPercent}%)
            </div>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/40 backdrop-blur-[2px]">
            <Badge variant="destructive" className="font-black text-[8px] uppercase tracking-widest rounded-full px-3 py-1 bg-gray-900/90 shadow-2xl border-none">Out of Stock</Badge>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="space-y-1 mb-4">
          <h3 className="font-black text-gray-900 text-[13px] sm:text-base uppercase tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase truncate">
            {product.saltComposition}
          </p>
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Packing:</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase">{product.packSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Marketer:</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase truncate max-w-[120px]">{product.manufacturer}</span>
          </div>
        </div>
        
        <div className="mt-auto space-y-4 pt-4 border-t border-dashed border-gray-100">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold line-through tracking-tight">MRP ₹{Math.round(mrp)}</span>
                <span className="text-xl sm:text-2xl font-black text-accent tracking-tighter">₹{product.price}</span>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">₹{unitPrice} / UNIT</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {isOutOfStock ? (
              <Button 
                onClick={handleNotify}
                variant="outline"
                className="rounded-full h-10 sm:h-12 w-full border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-[9px] sm:text-[10px] uppercase tracking-widest gap-2 shadow-sm transition-all"
              >
                <BellRing className="w-3.5 h-3.5" /> Notify Me
              </Button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-1 rounded-full p-1 bg-primary shadow-xl shadow-primary/20 w-full overflow-hidden animate-in zoom-in duration-300">
                <button 
                  onClick={handleDecrement} 
                  className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-black text-white flex-1 text-center">{quantity}</span>
                <button 
                  onClick={handleIncrement} 
                  className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={handleAdd} 
                className="rounded-full h-10 sm:h-12 w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-[0.15em] gap-2 shadow-lg hover:shadow-primary/30 active:scale-95 transition-all"
              >
                ADD <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
