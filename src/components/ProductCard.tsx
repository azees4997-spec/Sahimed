
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, BellRing, ShoppingCart, Sparkles, User as UserIcon } from 'lucide-react';
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
  const savingsPercent = Math.round(((mrp - product.price) / mrp) * 100);

  return (
    <div className={`group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col active:scale-[0.98] h-full ${isOutOfStock ? 'opacity-90' : ''}`}>
      <Link href={`/product/${product.id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50/20">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={`object-contain p-2 group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-40' : ''}`}
          data-ai-hint="clinical product"
        />
        
        {/* Personalized Labels */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
           {!product.isGeneric ? (
              <div className="bg-gray-200 text-gray-700 text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                 <UserIcon className="w-2 h-2" /> Your Item
              </div>
           ) : (
              <div className="bg-primary text-white text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                 <Sparkles className="w-2 h-2" /> Our Recommendation
              </div>
           )}
           {savingsPercent > 0 && !isOutOfStock && product.isGeneric && (
              <div className="bg-accent text-white text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-lg">
                SAVE {savingsPercent}%
              </div>
           )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/30 backdrop-blur-[1px]">
            <Badge variant="destructive" className="font-black text-[8px] uppercase tracking-widest rounded-full px-2 py-0.5 bg-gray-900/90 shadow-xl border-none">Out of Stock</Badge>
          </div>
        )}
      </Link>
      
      <div className="p-3.5 flex flex-col flex-1 gap-2">
        <div className="space-y-1">
          <p className="text-[7px] text-gray-400 font-black uppercase tracking-[0.05em] truncate">{product.manufacturer}</p>
          <Link href={`/product/${product.id}`}>
            <h3 className="font-black text-gray-900 line-clamp-2 min-h-[2.4em] text-[11px] leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight opacity-90 line-clamp-1 truncate">
            {product.saltComposition}
          </p>
        </div>
        
        <div className="mt-auto pt-2 border-t border-gray-50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
             <div className="flex flex-col leading-none">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-gray-900 tracking-tighter">₹{product.price}</span>
                  {savingsPercent > 0 && (
                    <span className="text-[10px] text-gray-400 line-through font-bold">₹{Math.round(mrp)}</span>
                  )}
                </div>
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{product.packSize}</span>
             </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {isOutOfStock ? (
              <Button 
                onClick={handleNotify}
                variant="outline"
                className="rounded-full h-9 w-full p-0 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-[9px] uppercase tracking-widest gap-1 shadow-sm"
              >
                <BellRing className="w-3 h-3" /> Notify
              </Button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-1 bg-primary rounded-full p-0.5 shadow-lg shadow-primary/20 w-full overflow-hidden">
                <Button 
                  onClick={handleDecrement} 
                  className="h-8 w-8 p-0 rounded-full bg-white/20 text-white hover:bg-white/30 border-none shadow-none shrink-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-[10px] font-black text-white flex-1 text-center">{quantity}</span>
                <Button 
                  onClick={handleIncrement} 
                  className="h-8 w-8 p-0 rounded-full bg-white/20 text-white hover:bg-white/30 border-none shadow-none shrink-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleAdd} 
                className="rounded-full h-9 w-full p-0 shadow-md bg-primary hover:bg-primary/90 text-white border-none font-black text-[9px] uppercase tracking-widest gap-2 active:scale-95 transition-all"
              >
                Add <ShoppingCart className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
