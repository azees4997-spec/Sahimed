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
    <div className={`group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col active:scale-[0.98] ${variant === 'compact' ? 'h-full' : ''}`}>
      <Link href={`/product/${product.id}`} className="relative h-44 w-full overflow-hidden bg-gray-50/50">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
        />
        {product.isGeneric && (
          <Badge className="absolute top-3 left-3 bg-green-600 text-[8px] font-black uppercase tracking-widest px-3 py-1">Best Value</Badge>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">{product.category}</p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors text-sm">{product.name}</h3>
        </Link>
        <p className="text-[10px] text-gray-400 line-clamp-1 mb-4 italic font-medium">{product.saltComposition}</p>
        
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900 leading-tight">₹{product.price}</span>
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Incl. Taxes</span>
          </div>
          <Button onClick={handleAdd} size="sm" className="rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
