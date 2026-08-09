"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Share2, MapPin, Truck, AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  product: any;
  unitPrice: number;
  unitMrp: number;
  currentPrice: number;
  currentMrp: number;
  discountPct: number;
  selectedQty: number;
  qty: number;
  edd: string;
  zone: string;
  isServiceable: boolean | null;
  activePincode: string;
  isEditingPincode: boolean;
  timeLeft: string;
  onQtyChange: (qty: number) => void;
  onAddToCart: (delta?: number) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onShareOpen: () => void;
  onPincodeEdit: () => void;
  onPincodeChange: (val: string) => void;
  onPincodeCheck: () => void;
}

export default function PricingCard({
  product,
  unitPrice,
  unitMrp,
  currentPrice,
  currentMrp,
  discountPct,
  selectedQty,
  qty,
  edd,
  zone,
  isServiceable,
  activePincode,
  isEditingPincode,
  timeLeft,
  onQtyChange,
  onAddToCart,
  onUpdateQty,
  onShareOpen,
  onPincodeEdit,
  onPincodeChange,
  onPincodeCheck,
}: PricingCardProps) {
  return (
    <div className="lg:col-span-7 space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {(product?.is_generic === true || product?.isGeneric === true || (product?.medicineType || '').toLowerCase().includes('generic')) ? (
            <Badge className="bg-emerald-600 text-white border-none text-[9.5px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-xs flex items-center gap-1">
              ✨ 100% Branded Generic (Save 61%)
            </Badge>
          ) : (
            product?.medicineType && <Badge className="bg-violet-100 text-violet-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">{product.medicineType}</Badge>
          )}
          {product?.subCategory && <Badge className="bg-sky-100 text-sky-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">{product.subCategory}</Badge>}
          {product?.salableStatus && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">{product.salableStatus}</Badge>}
        </div>

        {/* Product name */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{product?.name}</h1>
          {product?.composition && <p className="mt-1 text-xs text-slate-400 font-medium italic">{product.composition}</p>}
          <p className="mt-2 text-sm font-medium text-slate-500">
            By <span className="text-primary font-semibold">{product?.marketerName || product?.manufacturer || '—'}</span>
            {product?.categoryName && <span className="text-slate-400"> · {product.categoryName}</span>}
          </p>
        </div>

        {/* Pack size + storage chips */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {(product?.packagingDetail || product?.packaging?.packaging_detail) && (
            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl">
              <Package className="w-3.5 h-3.5 text-primary" />
              {product.packagingDetail || product.packaging?.packaging_detail}
            </span>
          )}
          {product?.storage_instructions && (
            <span className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-sky-700 font-semibold px-3 py-1.5 rounded-xl">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M17 17l-5 5-5-5"/>
                <line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l5 5 5-5"/><path d="M7 17l5-5 5 5"/>
              </svg>
              {product.storage_instructions}
            </span>
          )}
          {product?.countryOfOrigin && (
            <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold px-3 py-1.5 rounded-xl">
              Made in {product.countryOfOrigin}
            </span>
          )}
        </div>

        <div className="border-t border-slate-50" />

        {/* Pricing */}
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Our Price</p>
            <p className="text-4xl font-black text-slate-900">₹{currentPrice}</p>
          </div>
          {currentMrp > currentPrice && (
            <div className="pb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">MRP</p>
              <p className="text-sm font-medium text-slate-400 line-through">₹{currentMrp}</p>
            </div>
          )}
          {discountPct > 0 && (
            <div className="pb-1">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                Save {discountPct}% · ₹{(currentMrp - currentPrice).toFixed(0)} off
              </span>
            </div>
          )}
        </div>

        {/* Qty selector + Add to cart */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {qty > 0 ? (
            <div className="flex items-center h-12 bg-slate-50 rounded-full border border-slate-100 p-1 shadow-inner gap-1">
              <Button variant="ghost" onClick={() => onUpdateQty(product?._id || product?.id, -1)} className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                <Minus className="w-4 h-4 text-slate-600" />
              </Button>
              <span className="min-w-[80px] text-center text-xs font-bold text-slate-800">{qty} in cart</span>
              <Button variant="ghost" onClick={() => onUpdateQty(product?._id || product?.id, 1)} className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 border border-slate-100 shadow-sm">
                <Plus className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onAddToCart(1)}
                className="h-12 px-8 rounded-full font-black text-sm bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-xl shadow-primary/25 uppercase tracking-wider"
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
            </div>
          )}
          <Button variant="outline" size="icon" onClick={onShareOpen} className="h-12 w-12 rounded-full border-slate-200 hover:bg-slate-50">
            <Share2 className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Delivery Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/[0.08] rounded-2xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Delivering to</p>
              <p className="text-sm font-black text-slate-900 tracking-wider mt-0.5">{activePincode}</p>
            </div>
          </div>
          <button onClick={onPincodeEdit} className="text-xs font-black text-primary hover:underline uppercase tracking-wide">
            {isEditingPincode ? 'Cancel' : 'Change'}
          </button>
        </div>

        {isEditingPincode && (
          <div className="flex gap-2">
            <input
              type="text"
              value={activePincode}
              onChange={e => onPincodeChange(e.target.value.replace(/\D/, '').slice(0, 6))}
              placeholder="Enter 6-digit pincode"
              className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-semibold focus:bg-white outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={onPincodeCheck} className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-black">Check</Button>
          </div>
        )}

        {isServiceable ? (
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-emerald-800">{edd ? `Express delivery by ${edd}` : 'Delivery available'}</p>
                {zone && <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">{zone} zone · Free shipping</p>}
              </div>
            </div>
            {edd && timeLeft && (
              <p className="text-[10px] text-slate-500 font-medium px-1">
                Order within <span className="text-primary font-black">{timeLeft}</span> to get it by {edd}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs font-semibold text-rose-700">Delivery not available to this pincode</p>
          </div>
        )}
      </div>
    </div>
  );
}
