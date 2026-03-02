
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} is in your cart.`,
    });
  };

  return (
    <div className="group bg-white rounded-[20px] sm:rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col active:scale-[0.97] h-full">
      <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-50/30">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-500"
          data-ai-hint="medicine box"
        />
        {product.isGeneric && (
          <Badge className="absolute top-1.5 left-1.5 bg-green-600 text-[6px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border-none">Save Now</Badge>
        )}
      </Link>
      
      <div className="p-2 sm:p-4 flex flex-col flex-1">
        <p className="text-[7px] sm:text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5 truncate">{product.manufacturer}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-gray-900 line-clamp-1 mb-0.5 group-hover:text-primary transition-colors text-[10px] sm:text-sm">{product.name}</h3>
        </Link>
        <p className="text-[7px] sm:text-[9px] text-muted-foreground line-clamp-1 mb-2 italic font-medium">{product.saltComposition}</p>
        
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="text-xs sm:text-base font-black text-gray-900">₹{product.price}</span>
          <Button 
            onClick={handleAdd} 
            size="icon" 
            className="rounded-full h-7 w-7 sm:h-9 sm:w-9 p-0 shadow-lg shadow-primary/20 active:scale-90 transition-transform"
          >
            <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
