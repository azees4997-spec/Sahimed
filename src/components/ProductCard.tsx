
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
    toast({
      title: "Added to cart",
      description: `${product.name} is in your cart.`,
    });
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

  const packSizeDisplay = product.packSize?.match(/\d+/)?.[0] || product.packSize;

  return (
    <Link 
      href={`/product/${product.id}`}
      className={cn(
        "group bg-white rounded-[20px] sm:rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col active:scale-[0.98] h-full",
        isOutOfStock && "opacity-90"
      )}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-white">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={cn(
            "object-contain p-3 group-hover:scale-105 transition-transform duration-500",
            isOutOfStock && "grayscale opacity-40"
          )}
          data-ai-hint="medicine product"
          sizes="(max-width: 768px) 50vw, 300px"
          loading="lazy"
        />
        
        {savingsPercent > 0 && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-accent text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg animate-in fade-in zoom-in duration-500">
              {savingsPercent}% OFF
            </div>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/30 backdrop-blur-[1px]">
            <Badge variant="destructive" className="font-black text-[7px] sm:text-[8px] uppercase tracking-widest rounded-full px-2 py-0.5 bg-gray-900/90 shadow-xl border-none">Out of Stock</Badge>
          </div>
        )}
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <div className="space-y-0.5 mb-2">
          <h3 className="font-black text-gray-900 line-clamp-2 text-[11px] sm:text-sm uppercase tracking-tight group-hover:text-primary transition-colors leading-tight min-h-[1.75rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase truncate">
            {product.saltComposition}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-[8px] font-black text-primary uppercase bg-primary/5 px-1.5 py-0.5 rounded">
              {packSizeDisplay} UNITS
            </span>
          </div>
        </div>
        
        <div className="mt-auto space-y-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-black text-accent">₹{product.price}</span>
                {savingsAmount > 0 && (
                  <span className="text-[10px] sm:text-xs text-[#E11D48] line-through font-bold">₹{Math.round(mrp)}</span>
                )}
              </div>
              {savingsAmount > 0 && (
                <div className="bg-accent/10 px-1.5 py-0.5 rounded border border-accent/10 hidden xs:block">
                   <p className="text-[7px] font-black text-accent uppercase whitespace-nowrap">SAVE ₹{savingsAmount}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {isOutOfStock ? (
              <Button 
                onClick={handleNotify}
                variant="outline"
                className="rounded-full h-9 sm:h-11 w-full border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-[8px] sm:text-[10px] uppercase tracking-widest gap-1.5 shadow-sm"
              >
                <BellRing className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Notify Me
              </Button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-1 rounded-full p-0.5 bg-primary shadow-lg shadow-primary/20 w-full overflow-hidden animate-in zoom-in duration-200">
                <button 
                  onClick={handleDecrement} 
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
                >
                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <span className="text-[10px] sm:text-xs font-black text-white flex-1 text-center">{quantity}</span>
                <button 
                  onClick={handleIncrement} 
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={handleAdd} 
                className="rounded-full h-9 sm:h-12 w-full bg-primary hover:bg-primary/90 text-white font-black text-[9px] sm:text-[11px] uppercase tracking-[0.1em] gap-2 shadow-md"
              >
                ADD <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
