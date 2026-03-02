
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  const quantity = getItemQuantity(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} is in your cart.`,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, -1);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col active:scale-[0.98] h-full">
      <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-50/20">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          data-ai-hint="medicine box"
        />
        {product.isGeneric && (
          <Badge className="absolute top-1.5 left-1.5 bg-green-600 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border-none shadow-sm">Save</Badge>
        )}
      </Link>
      
      <div className="p-2 flex flex-col flex-1">
        <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-0.5 truncate">{product.manufacturer}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-black text-gray-900 line-clamp-1 mb-0.5 group-hover:text-primary transition-colors text-[9px] sm:text-[10px] leading-tight uppercase tracking-tight">{product.name}</h3>
        </Link>
        <p className="text-[6px] text-gray-400 line-clamp-1 mb-2 font-bold uppercase tracking-widest opacity-60">
          {product.saltComposition}
        </p>
        
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] font-black text-gray-900 tracking-tighter">₹{product.price}</span>
          
          {quantity > 0 ? (
            <div className="flex items-center gap-1 bg-primary rounded-lg p-0.5 shadow-lg w-full">
              <Button 
                onClick={handleDecrement} 
                className="h-7 w-7 p-0 rounded-md bg-white/20 text-white hover:bg-white/30 border-none shadow-none"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-[10px] font-black text-white flex-1 text-center">{quantity}</span>
              <Button 
                onClick={handleIncrement} 
                className="h-7 w-7 p-0 rounded-md bg-white/20 text-white hover:bg-white/30 border-none shadow-none"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleAdd} 
              className="rounded-lg h-7 w-full p-0 shadow-lg shadow-primary/10 bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 font-black text-[8px] uppercase tracking-widest"
            >
              Add To Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
