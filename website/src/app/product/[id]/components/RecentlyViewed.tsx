"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Eye, ShoppingBag } from 'lucide-react';

interface ProductMiniCardProps {
  item: any;
  onAdd: (item: any) => void;
}

function ProductMiniCard({ item, onAdd }: ProductMiniCardProps) {
  const price = Number(item.liveData?.sahimed_price || item.price || item.packaging?.mrp || 0);
  const mrp = Number(item.liveData?.mrp || item.mrp || item.packaging?.mrp || price);
  const disc = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const slug = item.seo?.url_slug || item.seoUrlSlug || item._id || item.id;
  return (
    <Link
      href={`/product/${encodeURIComponent(slug?.replace(/^\//, '') || '')}`}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group shrink-0 w-40 sm:w-44"
    >
      <div className="relative h-32 bg-slate-50 flex items-center justify-center overflow-hidden">
        <Image
          src={item.imageUrl || item.images?.[0] || '/images/medicine_placeholder.png'}
          alt={item.name || 'Medicine'}
          fill
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
        />
        {disc > 0 && (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
            {disc}% OFF
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-slate-800 line-clamp-2 mb-1 flex-1">{item.product_name || item.name}</p>
        <div className="flex items-baseline gap-2 mt-auto">
          <p className="text-sm font-black text-slate-900">₹{price}</p>
          {mrp > price && <p className="text-[9px] text-slate-400 line-through">₹{mrp}</p>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(item); }}
          className="mt-2 w-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-lg py-1.5"
        >
          Add
        </button>
      </div>
    </Link>
  );
}

interface RecentlyViewedProps {
  alsoBought: any[];
  crossSellProducts: any[];
  recentlyViewed: any[];
  categoryName?: string;
  onAdd: (item: any) => void;
}

export default function RecentlyViewed({
  alsoBought,
  crossSellProducts,
  recentlyViewed,
  categoryName,
  onAdd,
}: RecentlyViewedProps) {
  const hasContent = alsoBought.length > 0 || crossSellProducts.length > 0 || recentlyViewed.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-8">
      {/* People Also Bought */}
      {alsoBought.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-800">People Also Bought</h2>
            <Link
              href={`/medicines?category=${encodeURIComponent(categoryName || '')}`}
              className="text-xs font-black text-primary hover:underline uppercase tracking-wide"
            >
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {alsoBought.map((item: any) => (
              <ProductMiniCard key={item._id || item.id} item={item} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}

      {/* Cross-sell (You May Also Need) */}
      {crossSellProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h2 className="text-base font-black text-slate-800">You May Also Need</h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {crossSellProducts.map((item: any) => (
              <ProductMiniCard key={item._id || item.id} item={item} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-black text-slate-800">Recently Viewed</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {recentlyViewed.map((item: any) => {
              const p = Number(item.price || 0);
              const m = Number(item.mrp || p);
              const slug = item.seoUrlSlug || item.id;
              return (
                <Link
                  key={item.id}
                  href={`/product/${encodeURIComponent(slug?.replace(/^\//, '') || '')}`}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col shrink-0 w-40 sm:w-44 group"
                >
                  <div className="relative h-32 bg-slate-50 flex items-center justify-center">
                    <Image
                      src={item.imageUrl || '/images/medicine_placeholder.png'}
                      alt={item.name || ''}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-slate-800 line-clamp-2 mb-1">{item.name}</p>
                    <p className="text-sm font-black text-slate-900">₹{p}</p>
                    {m > p && <p className="text-[9px] text-slate-400 line-through">₹{m}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
