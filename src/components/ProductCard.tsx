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
    <div className="group bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col active:scale-[0.97]">
      <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-50/30">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        {product.isGeneric && (
          <Badge className="absolute top-2 left-2 bg-green-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none">Switch & Save</Badge>
        )}
      </Link>
      
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 truncate">{product.manufacturer}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors text-xs sm:text-sm">{product.name}</h3>
        </Link>
        <p className="text-[9px] text-muted-foreground line-clamp-1 mb-3 italic font-medium">{product.saltComposition}</p>
        
        <div className="mt-auto flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-gray-900 leading-tight">₹{product.price}</span>
          </div>
          <Button 
            onClick={handleAdd} 
            size="icon" 
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0 shadow-lg shadow-primary/20 active:scale-90 transition-transform"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
