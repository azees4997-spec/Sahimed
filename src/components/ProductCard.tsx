
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
      
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-0.5 truncate">{product.manufacturer}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-black text-gray-900 line-clamp-1 mb-0.5 group-hover:text-primary transition-colors text-[9px] sm:text-[10px] leading-tight uppercase tracking-tight">{product.name}</h3>
        </Link>
        <p className="text-[6px] text-gray-400 line-clamp-1 mb-2 font-bold uppercase tracking-widest opacity-60">
          {product.saltComposition}
        </p>
        
        <div className="mt-auto flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[11px] font-black text-gray-900 tracking-tighter">₹{product.price}</span>
          </div>
          <Button 
            onClick={handleAdd} 
            size="icon" 
            className="rounded-xl h-6 w-6 sm:h-8 sm:w-8 p-0 shadow-lg shadow-primary/10 active:scale-90 transition-transform bg-primary/5 hover:bg-primary text-primary hover:text-white"
          >
            <Plus className="w-3 h-3 sm:w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
