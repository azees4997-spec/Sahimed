"use client"

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, FlaskConical, ShieldCheck, BadgeCheck } from 'lucide-react';

interface GenericSwitchCardProps {
  product: any;
  genericAlt: any;
  images: string[];
  currentImageIndex: number;
  unitPrice: number;
  unitMrp: number;
  altPrice: number;
  altMrp: number;
  switchSavingsAmount: number;
  genericProductDiscountPct: number;
  altSavePct: number;
  onImageChange: (idx: number) => void;
  onAddBrand: () => void;
  onSwitchSave: () => void;
}

export default function GenericSwitchCard({
  product,
  genericAlt,
  images,
  currentImageIndex,
  unitPrice,
  unitMrp,
  altPrice,
  altMrp,
  switchSavingsAmount,
  genericProductDiscountPct,
  altSavePct,
  onImageChange,
  onAddBrand,
  onSwitchSave,
}: GenericSwitchCardProps) {
  return (
    <div className="space-y-4 my-3 animate-in fade-in zoom-in-95 duration-500">

      {/* 1. Green Hero Banner */}
      <div className="bg-emerald-600 text-white rounded-xl px-3 py-2.5 shadow-md flex items-center justify-center text-center overflow-hidden">
        <div className="flex items-center justify-center gap-1.5 min-w-0">
          <Check className="w-4 h-4 bg-white/20 text-white rounded-full p-0.5 shrink-0" />
          <span className="text-[9.5px] sm:text-xs font-black uppercase tracking-tight text-white truncate">
            CLINICAL BIO-EQUIVALENCE MATCH · 100% EXACT SALT MATCH
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-5 items-stretch">

        {/* LEFT: YOUR BRAND */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 border sm:border-2 border-slate-200 shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="h-6 flex items-center justify-between mb-2">
              <span className="bg-slate-100 text-slate-800 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-0.5 rounded-full border border-slate-300">
                YOUR BRAND
              </span>
            </div>

            {/* Image */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-1.5 mb-2 flex flex-col items-center">
              <div className="relative w-full h-28 sm:h-36 bg-white rounded-lg border border-slate-200/60 p-1 overflow-hidden flex items-center justify-center">
                <Image
                  src={images[currentImageIndex] || '/images/medicine-placeholder.png'}
                  alt={product?.name || ''}
                  fill
                  className="object-contain object-center p-1 sm:p-2"
                  priority
                />
              </div>
              <div className="h-8 flex items-center justify-center gap-1 mt-1.5 overflow-x-auto max-w-full pb-0.5">
                {images.length > 1 ? (
                  images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => onImageChange(idx)}
                      className={`relative w-7 h-7 rounded-md border overflow-hidden shrink-0 transition-all ${
                        currentImageIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-slate-200 opacity-60'
                      }`}
                    >
                      <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-contain p-0.5 bg-white" />
                    </button>
                  ))
                ) : <div className="h-7 w-full" />}
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] sm:text-base font-black text-slate-900 uppercase leading-tight line-clamp-2 min-h-[2.4rem] flex items-center">{product?.name}</h4>
              <div className="pt-1 border-t border-slate-100 space-y-1.5 text-[10px] sm:text-xs">
                <div className="min-h-[2.8rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Salt Composition</span>
                  <span className="text-slate-800 font-extrabold italic leading-tight block line-clamp-2">{product?.composition || 'Active Chemical Salt'}</span>
                </div>
                <div className="min-h-[2rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Pack Size</span>
                  <span className="text-slate-800 font-bold block">{product?.packagingDetail || 'Strip of 10 tablets'}</span>
                </div>
                <div className="min-h-[2.4rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Marketer</span>
                  <span className="text-slate-800 font-bold block leading-tight break-words line-clamp-2">{product?.marketerName || product?.manufacturer || 'Sun Pharma'}</span>
                </div>
                <div className="min-h-[1.8rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Quality Standard</span>
                  <span className="text-slate-800 font-bold block text-[10px] sm:text-xs">🛡️ WHO &amp; FDA Approved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-lg sm:text-3xl font-black text-slate-950 font-outfit">₹{unitPrice}</span>
                {unitMrp > unitPrice && <span className="text-[9.5px] sm:text-xs text-slate-400 line-through font-bold">MRP ₹{unitMrp}</span>}
              </div>
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold mt-0.5">
                ₹{(unitPrice / (product?.packaging?.package_quantity || 10)).toFixed(1)} / tablet
              </p>
              <p className="text-[8.5px] sm:text-[9.5px] text-rose-600 font-bold mt-1 leading-tight flex items-center gap-1 bg-rose-50 p-1 rounded border border-rose-200">
                <span>⚠️ Includes Brand Marketing &amp; Packaging Markup</span>
              </p>
            </div>
            <Button
              onClick={onAddBrand}
              className="w-full h-10 sm:h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center px-1"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="truncate">Add To Cart</span>
            </Button>
          </div>
        </div>

        {/* RIGHT: SAHI RECOMMENDATION */}
        <div className="bg-gradient-to-b from-emerald-100/90 via-white to-teal-50/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 border-2 sm:border-4 border-emerald-500 shadow-[0_15px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between space-y-3 sm:space-y-4 relative overflow-hidden group">
          <div>
            <div className="h-6 flex items-center justify-between mb-2">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider px-2 sm:px-3 py-0.5 rounded-full shadow-md border border-emerald-400 shrink-0">
                ✨ SAHI RECOMMENDATION
              </span>
            </div>

            {/* Image */}
            <div className="bg-emerald-50/80 rounded-xl border border-emerald-200 p-1.5 mb-2 flex flex-col items-center">
              <div className="relative w-full h-28 sm:h-36 bg-white rounded-lg border border-emerald-200/80 p-1 overflow-hidden flex items-center justify-center">
                <Image
                  src={genericAlt?.imageUrl || genericAlt?.images?.[0] || images[0]}
                  alt={genericAlt?.product_name || genericAlt?.name}
                  fill
                  className="object-contain object-center p-1 sm:p-2"
                  priority
                />
              </div>
              <div className="h-8 flex items-center justify-center gap-1 mt-1.5 overflow-x-auto max-w-full pb-0.5">
                {(genericAlt?.images && genericAlt.images.length > 1) ? (
                  genericAlt.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative w-7 h-7 rounded-md border border-emerald-300 overflow-hidden shrink-0 bg-white">
                      <Image src={img} alt={`Generic Thumbnail ${idx}`} fill className="object-contain p-0.5" />
                    </div>
                  ))
                ) : <div className="h-7 w-full" />}
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] sm:text-base font-black text-slate-900 uppercase leading-tight line-clamp-2 min-h-[2.4rem] flex items-center">{genericAlt?.product_name || genericAlt?.name}</h4>
              <div className="pt-1 border-t border-emerald-100 space-y-1.5 text-[10px] sm:text-xs">
                <div className="min-h-[2.8rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">Salt Composition</span>
                  <span className="text-emerald-950 font-extrabold italic leading-tight block line-clamp-2 flex items-center gap-1">
                    <Check className="w-3 h-3 bg-emerald-600 text-white rounded-full p-0.5 shrink-0 hidden sm:inline-block" />
                    <span>✓ {genericAlt?.composition || genericAlt?.taxonomy?.composition || 'Active Chemical Salt'}</span>
                  </span>
                </div>
                <div className="min-h-[2rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">Pack Size</span>
                  <span className="text-emerald-950 font-bold block">{genericAlt?.packaging?.packaging_detail || 'Strip of 10 tablets'}</span>
                </div>
                <div className="min-h-[2.4rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">Marketer</span>
                  <span className="text-emerald-950 font-bold block leading-tight break-words line-clamp-2">{genericAlt?.taxonomy?.marketer_name || genericAlt?.manufacturer || 'WHO-GMP Lab'}</span>
                </div>
                <div className="min-h-[1.8rem]">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">Quality Standard</span>
                  <span className="text-emerald-950 font-bold block text-[10px] sm:text-xs">🛡️ WHO &amp; FDA Approved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-2 border-t border-emerald-200 space-y-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                <span className="text-lg sm:text-3xl font-black text-emerald-600 font-outfit">₹{altPrice}</span>
                {altMrp > altPrice && <span className="text-[9.5px] sm:text-xs text-slate-400 line-through font-bold">MRP ₹{altMrp}</span>}
                {genericProductDiscountPct > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-2xs shrink-0">
                    {genericProductDiscountPct}% OFF
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[11px] text-emerald-900 font-bold mt-0.5">
                ₹{(altPrice / (genericAlt?.packaging?.package_quantity || 10)).toFixed(1)} / tablet
              </p>
              {switchSavingsAmount > 0 && (
                <p className="text-[8.5px] sm:text-[9.5px] text-emerald-800 font-black mt-1 leading-tight flex items-center gap-1 bg-emerald-100/90 p-1 rounded border border-emerald-300">
                  <span>💰 YOU SAVE ₹{switchSavingsAmount.toFixed(0)} VS BRAND</span>
                </p>
              )}
            </div>
            <Button
              onClick={onSwitchSave}
              className="w-full h-10 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center px-1 border border-emerald-300"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="truncate">Switch &amp; Save</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Feature Strip — 3 Quality Trust Icons */}
      <div className="grid grid-cols-3 gap-1 sm:gap-3 bg-white rounded-2xl border border-slate-100 p-2.5 sm:p-4">
        <div className="flex flex-col items-center space-y-1.5 p-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FlaskConical className="w-6 h-6" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-900 leading-tight text-center">100% Bio-Equivalent</span>
        </div>
        <div className="flex flex-col items-center space-y-1.5 p-1 border-x border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-900 leading-tight text-center">WHO &amp; FDA Certified</span>
        </div>
        <div className="flex flex-col items-center space-y-1.5 p-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-900 leading-tight text-center">Fresh &amp; Long Expiry</span>
        </div>
      </div>

      {/* 4. Clinical Comparison Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 sm:px-6 py-3 sm:py-4 text-white">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Check className="w-4 h-4 bg-white/20 rounded-full p-0.5 shrink-0" /> Clinical Bio-Equivalence Match · 100% Exact Salt
          </h3>
        </div>
        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          <div className="grid grid-cols-2 p-4 sm:p-5 bg-slate-50/60">
            <div className="space-y-1 pr-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Original Brand</span>
              <p className="font-black text-slate-900 uppercase text-xs sm:text-base">{product?.name}</p>
            </div>
            <div className="space-y-1 pl-3 border-l border-slate-200">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Sahi Equivalent Generic</span>
              <p className="font-black text-emerald-800 uppercase text-xs sm:text-base">{genericAlt?.product_name || genericAlt?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 p-4 sm:p-5">
            <div className="space-y-1 pr-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Salt Ingredient</span>
              <p className="font-extrabold text-slate-700 italic">{product?.composition || 'Salt Composition'}</p>
            </div>
            <div className="space-y-1 pl-3 border-l border-slate-200">
              <span className="text-[10.5px] font-black uppercase text-emerald-600 tracking-wider">Active Salt Ingredient</span>
              <p className="font-extrabold text-emerald-700 italic">✓ {genericAlt?.composition || genericAlt?.taxonomy?.composition || product?.composition || 'Salt Composition'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 p-4 sm:p-5 bg-slate-50/60">
            <div className="space-y-1 pr-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manufacturer</span>
              <p className="font-bold text-slate-700">{product?.marketerName || product?.manufacturer || 'Sun Pharmaceutical'}</p>
            </div>
            <div className="space-y-1 pl-3 border-l border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manufacturer</span>
              <p className="font-bold text-slate-900">{genericAlt?.taxonomy?.marketer_name || genericAlt?.manufacturer || 'Licensed WHO-GMP Manufacturer'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 p-4">
            <div className="space-y-0.5 pr-2">
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Quality Standard</span>
              <p className="font-bold text-slate-700 flex items-center gap-1">🛡️ WHO &amp; FDA Approved Brand</p>
            </div>
            <div className="space-y-0.5 pl-2 border-l border-slate-200">
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Quality Standard</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1">🛡️ WHO-GMP Certified Facilities</p>
            </div>
          </div>
          <div className="grid grid-cols-2 p-4 bg-emerald-50/50">
            <div className="space-y-0.5 pr-2">
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Unit Cost</span>
              <p className="font-black text-slate-900 text-sm">₹{(unitPrice / (product?.packaging?.package_quantity || 10)).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">/ unit</span></p>
            </div>
            <div className="space-y-0.5 pl-2 border-l border-emerald-200">
              <span className="text-[9.5px] font-black uppercase text-emerald-700 tracking-wider">Unit Cost &amp; Savings</span>
              <div className="flex items-baseline gap-2">
                <p className="font-black text-emerald-700 text-sm">₹{(altPrice / (genericAlt?.packaging?.package_quantity || 10)).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">/ unit</span></p>
                <span className="bg-emerald-600 text-white font-black text-[9.5px] px-2.5 py-0.5 rounded-full uppercase">Save {altSavePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
