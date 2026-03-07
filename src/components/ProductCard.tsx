"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, BellRing, ShoppingCart, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const quantity = getItemQuantity(product.id);
  const isOutOfStock = (product.availableQuantity || 0) <= 0;

  const moleculeRef = useMemoFirebase(() => {
    if (!db || !product.moleculeId) return null;
    return doc(db, 'moleculeMaster', product.moleculeId);
  }, [db, product.moleculeId]);
  const { data: molecule } = useDoc(moleculeRef);

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

  const displayComposition = product.saltComposition || molecule?.molecule || 'N/A';

  // Robust URL Validation for next/image construction
  const safeImageUrl = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http')
    ? product.imageUrl
    : `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <div
      className={cn(
        "group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col active:scale-[0.99] h-full",
        isOutOfStock && "opacity-90"
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white border-b border-gray-50">
        <Dialog>
          <DialogTrigger asChild>
            <div className="w-full h-full relative cursor-zoom-in group/img">
              <Image
                src={safeImageUrl}
                alt={product.name}
                fill
                className={cn(
                  "object-contain p-3 group-hover/img:scale-105 transition-transform duration-700",
                  isOutOfStock && "grayscale opacity-40"
                )}
                data-ai-hint="pharmaceutical product"
                sizes="(max-width: 768px) 50vw, 300px"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center">
                 <SearchIcon className="w-6 h-6 text-primary opacity-0 group-hover/img:opacity-100 transition-opacity" />
              </div>
              
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/40 backdrop-blur-[2px]">
                  <Badge variant="destructive" className="font-black text-[8px] uppercase tracking-widest rounded-full px-3 py-1 bg-gray-900/90 shadow-2xl border-none">Out of Stock</Badge>
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl border-none p-0 bg-white rounded-[40px] overflow-hidden shadow-3xl">
             <DialogHeader className="sr-only">
               <DialogTitle>{product.name}</DialogTitle>
             </DialogHeader>
             <div className="relative aspect-square w-full bg-white flex items-center justify-center p-6">
                <Image src={safeImageUrl} alt={product.name} fill className="object-contain p-8" />
             </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${product.id}`} className="mb-3 block group/title">
          <h3 className="font-black text-gray-900 text-sm sm:text-base uppercase tracking-tight group-hover/title:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase truncate">
            {displayComposition}
          </p>
        </Link>

        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">PACKING:</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase">{product.packSize || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">MARKETER:</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase truncate max-w-[120px]">{product.manufacturer}</span>
          </div>
        </div>
        
        <div className="mt-auto space-y-4 pt-4 border-t border-dashed border-gray-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-red-500 font-bold line-through tracking-tight">MRP ₹{Math.round(mrp)}</span>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-accent tracking-tighter leading-none">₹{product.price}</span>
              {savingsPercent > 0 && !isOutOfStock && (
                <div className="bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">
                  SAVE ₹{savingsAmount} ({savingsPercent}%)
                </div>
              )}
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">₹{unitPrice} / UNIT</p>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {isOutOfStock ? (
              <Button 
                onClick={handleNotify}
                variant="outline"
                className="rounded-full h-10 w-full border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-[9px] uppercase tracking-widest gap-2 shadow-sm transition-all"
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
                className="rounded-full h-10 w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all"
              >
                ADD <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
