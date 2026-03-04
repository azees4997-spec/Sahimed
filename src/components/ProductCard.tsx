
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
        "group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col active:scale-[0.98] tap-highlight h-full",
        isOutOfStock && "opacity-90"
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={cn(
            "object-contain p-4 group-hover:scale-105 transition-transform duration-500",
            isOutOfStock && "grayscale opacity-40"
          )}
          data-ai-hint="medicine product"
          sizes="(max-width: 768px) 50vw, 300px"
          loading="lazy"
        />
        
        {savingsPercent > 0 && !isOutOfStock && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-accent text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md animate-in fade-in zoom-in duration-500">
              {savingsPercent}% OFF
            </div>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/30 backdrop-blur-[1px]">
            <Badge variant="destructive" className="font-black text-[8px] uppercase tracking-widest rounded-full px-2 py-0.5 bg-gray-900/90 shadow-xl border-none">Out of Stock</Badge>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="space-y-1 mb-4">
          <h3 className="font-black text-gray-900 line-clamp-2 text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase truncate">
            {product.saltComposition}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-black text-primary uppercase">
              {packSizeDisplay} Units
            </span>
          </div>
        </div>
        
        <div className="mt-auto space-y-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-primary">₹{product.price}</span>
                {savingsAmount > 0 && (
                  <span className="text-xs text-[#E11D48] line-through font-bold">₹{Math.round(mrp)}</span>
                )}
              </div>
              {savingsAmount > 0 && (
                <div className="bg-accent/10 px-2 py-0.5 rounded-md">
                   <p className="text-[10px] font-black text-accent uppercase">SAVE ₹{savingsAmount}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {isOutOfStock ? (
              <Button 
                onClick={handleNotify}
                variant="outline"
                className="rounded-full h-11 w-full border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm tap-highlight"
              >
                <BellRing className="w-3.5 h-3.5" /> Notify Me
              </Button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-1 rounded-full p-1 bg-primary shadow-lg shadow-primary/20 w-full overflow-hidden animate-in zoom-in duration-200">
                <Button 
                  onClick={handleDecrement} 
                  className="h-9 w-9 p-0 rounded-full bg-white/10 text-white hover:bg-white/20 border-none shadow-none shrink-0 tap-highlight"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xs font-black text-white flex-1 text-center">{quantity}</span>
                <Button 
                  onClick={handleIncrement} 
                  className="h-9 w-9 p-0 rounded-full bg-white/10 text-white hover:bg-white/20 border-none shadow-none shrink-0 tap-highlight"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleAdd} 
                className="rounded-full h-12 w-full bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-[0.1em] gap-3 tap-highlight shadow-md"
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
