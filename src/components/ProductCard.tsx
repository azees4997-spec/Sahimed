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

  return (
    <div className={`group bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col active:scale-[0.97] h-full ${isOutOfStock ? 'opacity-80' : ''}`}>
      <Link href={`/product/${product.id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50/30">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={`object-contain p-4 group-hover:scale-110 transition-transform duration-700 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
          data-ai-hint="medicine packaging"
        />
        {product.isGeneric && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-600 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none shadow-lg">Save 80%</Badge>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/40 backdrop-blur-[1px]">
            <Badge variant="destructive" className="font-black text-[9px] uppercase tracking-widest rounded-full px-4 py-1.5 bg-gray-900/90 shadow-xl">Stock Pending</Badge>
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-[7px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1 truncate">{product.manufacturer}</p>
          <Link href={`/product/${product.id}`}>
            <h3 className="font-black text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors text-[10px] sm:text-[11px] leading-tight uppercase tracking-tight">{product.name}</h3>
          </Link>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest opacity-70 line-clamp-1">
            {product.saltComposition}
          </p>
        </div>
        
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between mb-3">
             <div className="flex flex-col">
                <span className="text-[12px] sm:text-[14px] font-black text-gray-900 tracking-tighter">₹{product.price}</span>
                <span className="text-[8px] text-gray-400 line-through font-bold">₹{product.mrp || product.price + 100}</span>
             </div>
             {product.packSize && <span className="text-[8px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md uppercase">{product.packSize}</span>}
          </div>
          
          {isOutOfStock ? (
            <Button 
              onClick={handleNotify}
              className="rounded-full h-10 w-full p-0 bg-orange-100 hover:bg-orange-200 text-orange-700 border-none font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-orange-100"
            >
              <BellRing className="w-4 h-4" /> Notify
            </Button>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-1 bg-primary rounded-full p-1 shadow-xl shadow-primary/20 w-full animate-in zoom-in-95">
              <Button 
                onClick={handleDecrement} 
                className="h-9 w-9 p-0 rounded-full bg-white/20 text-white hover:bg-white/30 border-none shadow-none active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-[12px] font-black text-white flex-1 text-center">{quantity}</span>
              <Button 
                onClick={handleIncrement} 
                className="h-9 w-9 p-0 rounded-full bg-white/20 text-white hover:bg-white/30 border-none shadow-none active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleAdd} 
              className="rounded-full h-11 w-full p-0 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-none font-black text-[10px] uppercase tracking-widest gap-2 active:scale-95 transition-all"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}