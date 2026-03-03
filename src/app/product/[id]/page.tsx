
"use client"

import { use, useState } from 'react';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Activity,
  Loader2,
  ChevronRight,
  Info,
  Dna,
  AlertCircle,
  Wine,
  Baby,
  Car,
  Plus,
  Minus,
  BriefcaseMedical,
  FileText,
  Package,
  CheckCircle2,
  XCircle,
  Fingerprint,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'medicines', id);
  }, [db, id]);
  
  const { data: product, isLoading: productLoading } = useDoc(productRef);

  const genericQuery = useMemoFirebase(() => {
    if (!db || !product || product.isGeneric) return null;
    
    if (product.moleculeId) {
      return query(
        collection(db, 'medicines'),
        where('moleculeId', '==', product.moleculeId),
        where('isGeneric', '==', true),
        limit(1)
      );
    }
    
    return query(
      collection(db, 'medicines'),
      where('saltComposition', '==', product.saltComposition),
      where('isGeneric', '==', true),
      limit(1)
    );
  }, [db, product]);
  
  const { data: genericAlternatives } = useCollection(genericQuery);
  const genericSubstitute = genericAlternatives?.[0];

  const brandedQty = getItemQuantity(product?.id || '');
  const genericQty = getItemQuantity(genericSubstitute?.id || '');

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !productLoading) return notFound();

  const getUnitCount = (packSize: string) => {
    const match = packSize?.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  const percentageSaved = product && genericSubstitute 
    ? Math.round(((product.price - genericSubstitute.price) / product.price) * 100) 
    : 0;

  const brandedOutOfStock = (product?.availableQuantity || 0) <= 0;
  const genericOutOfStock = genericSubstitute ? (genericSubstitute.availableQuantity || 0) <= 0 : false;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-1.5 mb-2 text-[7px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <Link href="/search" className="hover:text-primary">Medicines</Link>
          <ChevronRight className="w-1.5 h-1.5" />
          <span className="text-primary truncate">{product?.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className={`rounded-[24px] border-none bg-white overflow-hidden flex flex-col p-4 shadow-sm border border-gray-100 ${brandedOutOfStock ? 'opacity-70 grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Branded SKU: {product?.sku || 'N/A'}</p>
              <div className="bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="text-[6px] font-black text-blue-600 uppercase">Branded</span>
              </div>
            </div>
            
            <div className="aspect-square w-full max-w-[100px] bg-gray-50 rounded-2xl mx-auto mb-4 p-2 relative">
              <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-contain" />
              {brandedOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                   <div className="bg-red-600 text-white font-black text-[7px] uppercase px-3 py-1 rounded-full shadow-lg">Stock Out</div>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-[11px] font-black text-gray-900 uppercase min-h-[2.5em] leading-tight">{product?.name}</h3>
              
              <div className="space-y-2">
                <div>
                  <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Composition</p>
                  <p className="text-[8px] font-bold text-gray-700 uppercase line-clamp-1">{product?.saltComposition}</p>
                </div>
                <div>
                  <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Packing</p>
                  <p className="text-[8px] font-bold text-gray-700 uppercase">{product?.packSize}</p>
                </div>
                <div>
                  <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Marketer</p>
                  <p className="text-[8px] font-bold text-gray-700 uppercase">{product?.manufacturer}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest shrink-0">Molecule ID</p>
                  <code className="text-[7px] font-black text-gray-500">{product?.moleculeId || 'N/A'}</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest shrink-0">RX Required</p>
                  {product?.prescriptionRequired ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                  ) : (
                    <XCircle className="w-2.5 h-2.5 text-gray-300" />
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-baseline gap-2">
                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">MRP</span>
                   <span className="text-[9px] font-bold text-gray-400 line-through">₹{product?.mrp || product?.price + 200}</span>
                </div>
                <div className="text-[16px] font-black text-gray-900 leading-none mb-1">₹{product?.price}</div>
                <p className="text-[8px] font-bold text-gray-400">₹{(product?.price / getUnitCount(product?.packSize || '')).toFixed(1)} / Unit</p>
                
                <div className="mt-4">
                  {brandedOutOfStock ? (
                    <Button disabled className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400">Out of Stock</Button>
                  ) : brandedQty > 0 ? (
                    <div className="flex items-center justify-between bg-primary rounded-xl h-10 px-2 shadow-lg">
                      <button onClick={() => updateQuantity(product.id, -1)} className="p-1.5 text-white"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-[11px] font-black text-white">{brandedQty}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="p-1.5 text-white"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <Button onClick={() => addToCart(product, 1)} className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary shadow-xl">Add To Cart</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {genericSubstitute ? (
            <Card className={`rounded-[24px] border-2 border-green-500 bg-white overflow-hidden flex flex-col p-4 shadow-2xl shadow-green-100 relative ${genericOutOfStock ? 'opacity-70 grayscale' : ''}`}>
              {!genericOutOfStock && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="bg-green-500 text-white font-black text-[7px] uppercase px-3 py-1 rounded-bl-xl shadow-lg">Save {percentageSaved}%</div>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[6px] font-black text-green-600 uppercase tracking-widest">Molecule Link: {genericSubstitute.moleculeId}</p>
                <div className="bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="text-[6px] font-black text-green-600 uppercase">Generic</span>
                </div>
              </div>

              <div className="aspect-square w-full max-w-[100px] bg-green-50/50 rounded-2xl mx-auto mb-4 p-2 relative">
                <img src={genericSubstitute.imageUrl} alt={genericSubstitute.name} className="w-full h-full object-contain" />
                {genericOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                     <div className="bg-red-600 text-white font-black text-[7px] uppercase px-3 py-1 rounded-full shadow-lg">Stock Out</div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-[11px] font-black text-gray-900 uppercase min-h-[2.5em] leading-tight">{genericSubstitute.name}</h3>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Composition</p>
                    <p className="text-[8px] font-bold text-gray-700 uppercase line-clamp-1">{genericSubstitute.saltComposition}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Packing</p>
                    <p className="text-[8px] font-bold text-gray-700 uppercase">{genericSubstitute.packSize}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Marketer</p>
                    <p className="text-[8px] font-bold text-gray-700 uppercase">{genericSubstitute.manufacturer}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest shrink-0">RX Required</p>
                    {genericSubstitute.prescriptionRequired ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5 text-gray-300" />
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">MRP</span>
                    <span className="text-[9px] font-bold text-gray-400 line-through">₹{genericSubstitute.mrp || genericSubstitute.price + 50}</span>
                  </div>
                  <div className="text-[16px] font-black text-green-600 leading-none mb-1">₹{genericSubstitute.price}</div>
                  <p className="text-[8px] font-bold text-gray-400">₹{(genericSubstitute.price / getUnitCount(genericSubstitute.packSize || '')).toFixed(1)} / Unit</p>
                  
                  <div className="mt-4">
                    {genericOutOfStock ? (
                      <Button disabled className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400">Out of Stock</Button>
                    ) : genericQty > 0 ? (
                      <div className="flex items-center justify-between bg-green-600 rounded-xl h-10 px-2 shadow-xl">
                        <button onClick={() => updateQuantity(genericSubstitute.id, -1)} className="p-1.5 text-white"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-[11px] font-black text-white">{genericQty}</span>
                        <button onClick={() => updateQuantity(genericSubstitute.id, 1)} className="p-1.5 text-white"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(genericSubstitute, 1)} className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-green-600 shadow-2xl">Add To Cart</Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-8 text-center">
              <Info className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">No alternative bio-equivalent available for Molecule: {product?.moleculeId}</p>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Therapeutic Uses</h3>
            <ul className="space-y-2">
              {(product?.uses || []).slice(0, 3).map((use: string, i: number) => (
                <li key={i} className="text-[9px] font-bold text-gray-600 leading-tight flex gap-2"><span className="text-primary">•</span> {use}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-500" /> Side Effects</h3>
            <div className="flex flex-wrap gap-2">
              {(product?.sideEffects || []).slice(0, 3).map((effect: string, i: number) => (
                <span key={i} className="text-[8px] font-black bg-orange-50 text-orange-700 px-3 py-1 rounded-lg border border-orange-100">{effect}</span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
