
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product, variant = 'default' }: { product: Product, variant?: 'default' | 'compact' }) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} is now in your cart.`,
    });
  };

  return (
    <div className={`group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${variant === 'compact' ? 'h-full' : ''}`}>
      <Link href={`/product/${product.id}`} className="relative h-48 w-full overflow-hidden bg-gray-50">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform"
        />
        {product.price < 300 && (
          <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">Top Deal</Badge>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">{product.category}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-400 line-clamp-1 mb-3 italic">{product.saltComposition}</p>
        
        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
            {product.price > 500 && <span className="text-[10px] text-green-600 font-bold">FREE DELIVERY</span>}
          </div>
          <Button onClick={handleAdd} size="sm" className="rounded-full h-9 px-4 gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
