"use client"

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ZoomIn, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  discountPct: number;
  prescriptionRequired?: boolean;
  currentImageIndex: number;
  onImageChange: (index: number) => void;
}

export default function ImageGallery({
  images,
  productName,
  discountPct,
  prescriptionRequired,
  currentImageIndex,
  onImageChange,
}: ImageGalleryProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  return (
    <div className="lg:col-span-5">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Main image with zoom */}
        <div
          className="relative aspect-square bg-gradient-to-br from-slate-50 via-white to-primary/5 overflow-hidden cursor-zoom-in"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          {/* Hex grid background */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <defs><pattern id="hex" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
                <polygon points="20,2 38,11 38,35 20,44 2,35 2,11" fill="none" stroke="#10b981" strokeWidth="1"/>
              </pattern></defs>
              <rect width="400" height="400" fill="url(#hex)" />
            </svg>
          </div>

          {/* Zoomed layer */}
          <div
            className={cn("absolute inset-0 transition-opacity duration-200", isZoomed ? "opacity-100" : "opacity-0")}
            style={{
              backgroundImage: `url(${images[currentImageIndex]})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: '250%',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Normal image */}
          <Image
            src={images[currentImageIndex]}
            alt={productName || 'Medicine'}
            fill
            className={cn("object-contain p-8 relative z-10 transition-opacity duration-200", isZoomed ? "opacity-0" : "opacity-100")}
            priority
          />

          {/* Badges */}
          {discountPct > 0 && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-200 z-20">
              {discountPct}% Off
            </div>
          )}
          {prescriptionRequired && (
            <div className="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider z-20">
              Rx Required
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[9px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 z-20 opacity-60">
            <ZoomIn className="w-3 h-3" /> Hover to zoom
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto border-t border-slate-50">
            {images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => onImageChange(i)}
                className={cn(
                  "relative w-14 h-14 rounded-xl border-2 bg-slate-50 overflow-hidden shrink-0 transition-all",
                  i === currentImageIndex ? "border-primary shadow-sm" : "border-slate-100 hover:border-slate-300"
                )}
              >
                <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-contain p-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Authenticity Seal */}
      <div className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-emerald-100">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <BadgeCheck className="w-7 h-7 text-white" />
        </div>
        <div className="text-white">
          <p className="text-xs font-black uppercase tracking-widest mb-0.5">Verified Genuine Product</p>
          <p className="text-[10px] text-white/80 font-medium">Sourced directly from licensed distributors · Quality checked by our pharmacists</p>
        </div>
      </div>
    </div>
  );
}
