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
    <div className="group bg-white rounded-lg sm:rounded-[24px] border border-gray-100/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col active:scale-[0.98] h-full">
      <Link href={`/product/${product.id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50/20">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-500"
          data-ai-hint="medicine box"
        />
        {product.isGeneric && (
          <Badge className="absolute top-1 left-1 bg-green-600 text-[5px] sm:text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md border-none shadow-sm">Save</Badge>
        )}
      </Link>
      
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <p className="text-[5px] sm:text-[8px] text-gray-300 font-black uppercase tracking-widest mb-0.5 truncate">{product.manufacturer}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-gray-900 line-clamp-1 mb-0.5 group-hover:text-primary transition-colors text-[8px] sm:text-sm leading-tight">{product.name}</h3>
        </Link>
        <p className="text-[6px] sm:text-[8px] text-muted-foreground line-clamp-1 mb-1.5 italic font-medium opacity-70">{product.saltComposition}</p>
        
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-sm font-black text-gray-900 tracking-tighter">₹{product.price}</span>
          <Button 
            onClick={handleAdd} 
            size="icon" 
            className="rounded-lg h-5 w-5 sm:h-8 sm:w-8 p-0 shadow-lg shadow-primary/10 active:scale-90 transition-transform bg-primary/5 hover:bg-primary text-primary hover:text-white"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
